import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { TransactionTemplate, CreateTemplateInput, UpdateTemplateInput } from "@/types/template"

// Define event names for template operations
export const TEMPLATE_CREATED_EVENT = "template-created"
export const TEMPLATE_UPDATED_EVENT = "template-updated"
export const TEMPLATE_DELETED_EVENT = "template-deleted"

// Template cache to reduce database queries
let templatesCache: TransactionTemplate[] | null = null
let lastFetchTime = 0
const CACHE_TTL = 300000 // 5 minutes (increased from 1 minute)

// Helper to dispatch template events
const dispatchTemplateEvent = (eventName: string, template: TransactionTemplate) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(eventName, { detail: template }))
  }
}

// Helper function to handle Supabase rate limiting
const handleRateLimiting = async (retryCount: number): Promise<void> => {
  // Exponential backoff with jitter
  const baseDelay = Math.pow(2, retryCount) * 1000 // 2s, 4s, 8s, 16s
  const jitter = Math.random() * 1000 // Add up to 1s of random jitter
  const delay = baseDelay + jitter

  console.log(`Rate limited. Waiting ${delay}ms before retry ${retryCount + 1}`)
  await new Promise((resolve) => setTimeout(resolve, delay))
}

// Utility to safely parse JSON responses
const safeJsonParse = (text: string) => {
  try {
    return JSON.parse(text)
  } catch (e) {
    console.error("Failed to parse JSON response:", text.substring(0, 100))
    throw new Error("Invalid response format")
  }
}

export const templateService = {
  async getTemplates(): Promise<TransactionTemplate[]> {
    try {
      // Check if we have a valid cache
      const now = Date.now()
      if (templatesCache && now - lastFetchTime < CACHE_TTL) {
        console.log("Using cached templates data")
        return templatesCache
      }

      const supabase = getSupabaseBrowserClient()

      // Verify authentication
      const isAuthenticated = await this.verifyAuthentication()
      if (!isAuthenticated) {
        throw new Error("User not authenticated")
      }

      // Implement retry logic with exponential backoff
      const maxRetries = 5 // Increased from 3
      let retryCount = 0
      let lastError = null

      while (retryCount < maxRetries) {
        try {
          // Add delay for retries (exponential backoff)
          if (retryCount > 0) {
            await handleRateLimiting(retryCount)
          }

          // Use a lower-level fetch approach to better handle rate limiting
          const { data: sessionData } = await supabase.auth.getSession()
          const token = sessionData.session?.access_token

          if (!token) {
            throw new Error("No authentication token available")
          }

          const apiUrl = `${supabase.supabaseUrl}/rest/v1/transaction_templates?order=name.asc`

          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              apikey: supabase.supabaseKey,
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            cache: "no-store",
          })

          // Handle HTTP errors explicitly
          if (!response.ok) {
            const statusText = response.statusText
            const status = response.status

            // Handle rate limiting specifically
            if (status === 429) {
              console.warn("Rate limited by Supabase API")

              // Get retry-after header if available
              const retryAfter = response.headers.get("Retry-After")
              const retryMs = retryAfter ? Number.parseInt(retryAfter) * 1000 : undefined

              if (retryMs) {
                console.log(`Waiting ${retryMs}ms as specified by Retry-After header`)
                await new Promise((resolve) => setTimeout(resolve, retryMs))
              } else {
                retryCount++
                continue // Skip to next retry with backoff
              }
            }

            throw new Error(`API request failed: ${status} ${statusText}`)
          }

          // Safely parse the JSON response
          const responseText = await response.text()
          const data = safeJsonParse(responseText)

          // Map database templates to app templates
          const templates: TransactionTemplate[] = data.map((template: any) => ({
            id: template.id,
            name: template.name,
            type: template.type,
            category: template.category,
            amount: template.amount || 0,
            notes: template.notes || "",
            isDefault: template.is_default || false,
            createdAt: template.created_at,
            updatedAt: template.updated_at,
          }))

          // Update cache
          templatesCache = templates
          lastFetchTime = now

          return templates
        } catch (error: any) {
          lastError = error
          console.warn(`Attempt ${retryCount + 1}/${maxRetries} failed:`, error.message)
          retryCount++

          // If it's not the last retry, continue to next iteration
          if (retryCount < maxRetries) {
            continue
          }

          // On last retry, throw the error
          throw error
        }
      }

      // This should never be reached due to the throw in the loop
      throw lastError
    } catch (error) {
      console.error("Error in getTemplates:", error)

      // If we have cached data, return it even if it's stale
      if (templatesCache) {
        console.log("Returning stale cache due to error")
        return templatesCache
      }

      // If no cache, return empty array instead of throwing
      return []
    }
  },

  async createTemplate(input: CreateTemplateInput): Promise<TransactionTemplate> {
    try {
      const supabase = getSupabaseBrowserClient()

      // Verify authentication
      const isAuthenticated = await this.verifyAuthentication()
      if (!isAuthenticated) {
        throw new Error("User not authenticated")
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const userId = session?.user.id

      if (!userId) {
        throw new Error("User not authenticated")
      }

      // Implement retry logic
      const maxRetries = 5
      let retryCount = 0
      let lastError = null

      while (retryCount < maxRetries) {
        try {
          // Add delay for retries
          if (retryCount > 0) {
            await handleRateLimiting(retryCount)
          }

          // Create template in database
          const { data, error } = await supabase
            .from("transaction_templates")
            .insert({
              user_id: userId,
              name: input.name,
              type: input.type,
              category: input.category,
              amount: input.amount,
              notes: input.notes,
              is_default: input.isDefault,
            })
            .select()
            .single()

          if (error) {
            throw error
          }

          // Map database template to app template
          const template: TransactionTemplate = {
            id: data.id,
            name: data.name,
            type: data.type,
            category: data.category,
            amount: data.amount || 0,
            notes: data.notes || "",
            isDefault: data.is_default || false,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          }

          // Invalidate cache
          templatesCache = null

          // Dispatch event
          dispatchTemplateEvent(TEMPLATE_CREATED_EVENT, template)

          return template
        } catch (error: any) {
          lastError = error

          // Check if it's a rate limiting error
          if (error.message && error.message.includes("Too many requests")) {
            console.warn("Rate limited during template creation")
            retryCount++
            continue
          }

          retryCount++

          if (retryCount < maxRetries) {
            console.warn(`Retry ${retryCount}/${maxRetries} for createTemplate due to:`, error)
            continue
          }

          throw error
        }
      }

      throw lastError
    } catch (error) {
      console.error("Error in createTemplate:", error)
      throw error
    }
  },

  async updateTemplate(id: string, input: UpdateTemplateInput): Promise<TransactionTemplate> {
    try {
      const supabase = getSupabaseBrowserClient()

      // Verify authentication
      const isAuthenticated = await this.verifyAuthentication()
      if (!isAuthenticated) {
        throw new Error("User not authenticated")
      }

      // Implement retry logic
      const maxRetries = 5
      let retryCount = 0
      let lastError = null

      while (retryCount < maxRetries) {
        try {
          // Add delay for retries
          if (retryCount > 0) {
            await handleRateLimiting(retryCount)
          }

          // Update template in database
          const { data, error } = await supabase
            .from("transaction_templates")
            .update({
              name: input.name,
              type: input.type,
              category: input.category,
              amount: input.amount,
              notes: input.notes,
              is_default: input.isDefault,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single()

          if (error) {
            throw error
          }

          // Map database template to app template
          const template: TransactionTemplate = {
            id: data.id,
            name: data.name,
            type: data.type,
            category: data.category,
            amount: data.amount || 0,
            notes: data.notes || "",
            isDefault: data.is_default || false,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          }

          // Invalidate cache
          templatesCache = null

          // Dispatch event
          dispatchTemplateEvent(TEMPLATE_UPDATED_EVENT, template)

          return template
        } catch (error: any) {
          lastError = error

          // Check if it's a rate limiting error
          if (error.message && error.message.includes("Too many requests")) {
            console.warn("Rate limited during template update")
            retryCount++
            continue
          }

          retryCount++

          if (retryCount < maxRetries) {
            console.warn(`Retry ${retryCount}/${maxRetries} for updateTemplate due to:`, error)
            continue
          }

          throw error
        }
      }

      throw lastError
    } catch (error) {
      console.error("Error in updateTemplate:", error)
      throw error
    }
  },

  async deleteTemplate(id: string): Promise<void> {
    try {
      const supabase = getSupabaseBrowserClient()

      // Verify authentication
      const isAuthenticated = await this.verifyAuthentication()
      if (!isAuthenticated) {
        throw new Error("User not authenticated")
      }

      // Implement retry logic
      const maxRetries = 5
      let retryCount = 0
      let lastError = null
      let templateData = null

      while (retryCount < maxRetries) {
        try {
          // Add delay for retries
          if (retryCount > 0) {
            await handleRateLimiting(retryCount)
          }

          // Get template before deletion for event
          const { data, error: fetchError } = await supabase
            .from("transaction_templates")
            .select("*")
            .eq("id", id)
            .single()

          if (fetchError) {
            throw fetchError
          }

          templateData = data

          // Delete template from database
          const { error: deleteError } = await supabase.from("transaction_templates").delete().eq("id", id)

          if (deleteError) {
            throw deleteError
          }

          // Invalidate cache
          templatesCache = null

          // Dispatch event if we had template data
          if (templateData) {
            const template: TransactionTemplate = {
              id: templateData.id,
              name: templateData.name,
              type: templateData.type,
              category: templateData.category,
              amount: templateData.amount || 0,
              notes: templateData.notes || "",
              isDefault: templateData.is_default || false,
              createdAt: templateData.created_at,
              updatedAt: templateData.updated_at,
            }
            dispatchTemplateEvent(TEMPLATE_DELETED_EVENT, template)
          }

          return
        } catch (error: any) {
          lastError = error

          // Check if it's a rate limiting error
          if (error.message && error.message.includes("Too many requests")) {
            console.warn("Rate limited during template deletion")
            retryCount++
            continue
          }

          retryCount++

          if (retryCount < maxRetries) {
            console.warn(`Retry ${retryCount}/${maxRetries} for deleteTemplate due to:`, error)
            continue
          }

          throw error
        }
      }

      throw lastError
    } catch (error) {
      console.error("Error in deleteTemplate:", error)
      throw error
    }
  },

  // Verify authentication (reusing from expense service)
  async verifyAuthentication(): Promise<boolean> {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        return false
      }

      return true
    } catch (error) {
      console.error("Authentication verification error:", error)
      return false
    }
  },
}
