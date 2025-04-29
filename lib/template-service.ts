import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { TransactionTemplate, CreateTemplateInput, UpdateTemplateInput } from "@/types/template"

// Define event names for template operations
export const TEMPLATE_CREATED_EVENT = "template-created"
export const TEMPLATE_UPDATED_EVENT = "template-updated"
export const TEMPLATE_DELETED_EVENT = "template-deleted"

// Template cache to reduce database queries
let templatesCache: TransactionTemplate[] | null = null
let lastFetchTime = 0
const CACHE_TTL = 60000 // 1 minute

// Helper to dispatch template events
const dispatchTemplateEvent = (eventName: string, template: TransactionTemplate) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(eventName, { detail: template }))
  }
}

export const templateService = {
  async getTemplates(): Promise<TransactionTemplate[]> {
    try {
      // Check if we have a valid cache
      const now = Date.now()
      if (templatesCache && now - lastFetchTime < CACHE_TTL) {
        return templatesCache
      }

      const supabase = getSupabaseBrowserClient()

      // Verify authentication
      const isAuthenticated = await this.verifyAuthentication()
      if (!isAuthenticated) {
        throw new Error("User not authenticated")
      }

      // Fetch templates from database
      const { data, error } = await supabase
        .from("transaction_templates")
        .select("*")
        .order("name", { ascending: true })

      if (error) {
        console.error("Error fetching templates:", error)
        throw error
      }

      // Map database templates to app templates
      const templates: TransactionTemplate[] = data.map((template) => ({
        id: template.id,
        name: template.name,
        type: template.type,
        category: template.category,
        amount: template.amount,
        notes: template.notes || "",
        isDefault: template.is_default,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
      }))

      // Update cache
      templatesCache = templates
      lastFetchTime = now

      return templates
    } catch (error) {
      console.error("Error in getTemplates:", error)
      throw error
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
        console.error("Error creating template:", error)
        throw error
      }

      // Map database template to app template
      const template: TransactionTemplate = {
        id: data.id,
        name: data.name,
        type: data.type,
        category: data.category,
        amount: data.amount,
        notes: data.notes || "",
        isDefault: data.is_default,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      // Invalidate cache
      templatesCache = null

      // Dispatch event
      dispatchTemplateEvent(TEMPLATE_CREATED_EVENT, template)

      return template
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
        console.error("Error updating template:", error)
        throw error
      }

      // Map database template to app template
      const template: TransactionTemplate = {
        id: data.id,
        name: data.name,
        type: data.type,
        category: data.category,
        amount: data.amount,
        notes: data.notes || "",
        isDefault: data.is_default,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      // Invalidate cache
      templatesCache = null

      // Dispatch event
      dispatchTemplateEvent(TEMPLATE_UPDATED_EVENT, template)

      return template
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

      // Get template before deletion for event
      const { data: templateData } = await supabase.from("transaction_templates").select("*").eq("id", id).single()

      // Delete template from database
      const { error } = await supabase.from("transaction_templates").delete().eq("id", id)

      if (error) {
        console.error("Error deleting template:", error)
        throw error
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
          amount: templateData.amount,
          notes: templateData.notes || "",
          isDefault: templateData.is_default,
          createdAt: templateData.created_at,
          updatedAt: templateData.updated_at,
        }
        dispatchTemplateEvent(TEMPLATE_DELETED_EVENT, template)
      }
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
