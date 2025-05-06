import { getSupabaseBrowserClient } from "@/lib/supabase"
import { expenseService } from "@/lib/expense-service"
import type { ExpenseType } from "@/types/expense"

export interface Category {
  id: string
  name: string
  description?: string
  type: ExpenseType
  budget?: number
  color?: string
  icon?: string
  isDefault?: boolean
  spending?: number
  usageCount?: number
  lastUsed?: string
}

// Default colors for categories
const DEFAULT_COLORS = [
  "#10b981", // green
  "#ef4444", // red
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
]

// Cache for categories
let categoriesCache: Category[] | null = null
let lastFetchTime = 0
const CACHE_TTL = 30000 // 30 seconds - reduced to ensure more frequent updates

// Cache for recent expenses
let recentExpensesCache: any[] | null = null
let recentCategoriesCache: (Category & { spending: number })[] | null = null
let lastRecentFetchTime = 0
const RECENT_CACHE_TTL = 60000 // 60 seconds

// Create custom event names for category updates
export const CATEGORY_UPDATED_EVENT = "category-updated"
export const CATEGORY_SYNC_EVENT = "category-sync"

// Function to dispatch category update event
export const dispatchCategoryUpdate = (category: Category, oldName?: string) => {
  if (typeof window !== "undefined") {
    const event = new CustomEvent(CATEGORY_UPDATED_EVENT, {
      detail: {
        category,
        oldName,
      },
    })
    window.dispatchEvent(event)
    console.log(`Dispatched category update event for: ${category.name}${oldName ? ` (was: ${oldName})` : ""}`)
  }
}

// Function to dispatch category sync event (for global updates)
export const dispatchCategorySync = () => {
  if (typeof window !== "undefined") {
    const event = new CustomEvent(CATEGORY_SYNC_EVENT)
    window.dispatchEvent(event)
    console.log("Dispatched category sync event")
  }
}

// Helper function to check if a table has a specific column
async function checkColumnExists(supabase: any, tableName: string, columnName: string): Promise<boolean> {
  try {
    // Use system tables to check if column exists
    const { data, error } = await supabase.rpc("check_column_exists", {
      p_table_name: tableName,
      p_column_name: columnName,
    })

    if (error) {
      console.error(`Error checking if column ${columnName} exists:`, error)
      // If the RPC function doesn't exist, assume column exists to avoid breaking changes
      return true
    }

    return data || false
  } catch (error) {
    console.error(`Exception checking if column ${columnName} exists:`, error)
    // On error, assume column exists to avoid breaking changes
    return true
  }
}

// Helper function to create the categories table with proper schema
async function createCategoriesTable(supabase: any) {
  try {
    // Create the check_column_exists function if it doesn't exist
    try {
      const { error: functionError } = await supabase.rpc("create_column_check_function")
      if (functionError) {
        console.log("Note: Column check function may already exist or failed to create:", functionError)
      }
    } catch (functionCreateError) {
      console.log("Exception creating column check function:", functionCreateError)
      // Non-critical error, continue execution
    }

    // Create categories table if it doesn't exist
    try {
      const { error: createError } = await supabase.rpc("create_categories_table_if_not_exists")
      if (createError) {
        console.error("Error creating categories table:", createError)

        // Fallback: try to create the table directly
        try {
          const { error: fallbackError } = await supabase.rpc("create_categories_table_fallback")
          if (fallbackError) {
            console.error("Error in fallback table creation:", fallbackError)
            throw new Error("Failed to create categories table")
          }
        } catch (fallbackError) {
          console.error("Exception in fallback table creation:", fallbackError)
          throw new Error("Failed to create categories table")
        }
      }
    } catch (createTableError) {
      console.error("Exception creating categories table:", createTableError)
      throw new Error("Failed to create categories table")
    }

    // Check if last_used column exists
    const hasLastUsed = await checkColumnExists(supabase, "categories", "last_used")

    // Add last_used column if it doesn't exist
    if (!hasLastUsed) {
      console.log("Adding last_used column to categories table")
      try {
        const { error: columnError } = await supabase.rpc("add_last_used_column")
        if (columnError) {
          console.error("Error adding last_used column:", columnError)
          // Non-critical error, continue execution
        }
      } catch (columnError) {
        console.error("Exception adding last_used column:", columnError)
        // Non-critical error, continue execution
      }
    }

    return true
  } catch (error) {
    console.error("Error in createCategoriesTable:", error)
    return false
  }
}

// Helper function to retry a Supabase query with exponential backoff
async function retrySupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries = 3,
): Promise<{ data: T | null; error: any }> {
  let retries = 0
  let lastError: any = null

  while (retries < maxRetries) {
    try {
      const result = await queryFn()

      // If successful or error is not rate limiting, return immediately
      if (!result.error || !result.error.message?.includes("Too Many Requests")) {
        return result
      }

      // If we got a rate limit error, retry with backoff
      lastError = result.error
      retries++

      // Exponential backoff: 2^retries * 1000ms (2s, 4s, 8s)
      const delay = Math.pow(2, retries) * 1000
      console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    } catch (error) {
      lastError = error
      retries++

      // Exponential backoff for other errors too
      const delay = Math.pow(2, retries) * 1000
      console.log(`Error in query, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // If we've exhausted retries, return the last error
  return { data: null, error: lastError }
}

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    try {
      // Check if we have a valid cache
      const now = Date.now()
      if (categoriesCache && now - lastFetchTime < CACHE_TTL) {
        return categoriesCache
      }

      const supabase = getSupabaseBrowserClient()

      // First, verify authentication
      const isAuthenticated = await expenseService.verifyAuthentication()
      if (!isAuthenticated) {
        throw new Error("User not authenticated")
      }

      // Ensure the categories table exists with proper schema
      await createCategoriesTable(supabase)

      // Try to fetch categories from database with retry logic
      const { data: categoriesData, error: categoriesError } = await retrySupabaseQuery(() =>
        supabase.from("categories").select("*"),
      )

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError)

        // If there's a table not found error, we need to create the categories table
        if (categoriesError.code === "42P01") {
          // Categories table doesn't exist yet, let's use the categories from expense service
          // and create the categories table from that
          return await this.migrateCategoriesToTable()
        }

        throw categoriesError
      }

      if (categoriesData && categoriesData.length > 0) {
        // Map database columns to our interface (snake_case to camelCase)
        const mappedCategories = categoriesData.map((cat) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          type: cat.type as ExpenseType,
          budget: cat.budget,
          color: cat.color,
          icon: cat.icon,
          isDefault: cat.is_default,
          usageCount: cat.usage_count || 0,
          lastUsed: cat.last_used,
        }))

        // Update cache
        categoriesCache = mappedCategories
        lastFetchTime = now
        return mappedCategories
      }

      // If no categories found, initialize from expense service
      return await this.migrateCategoriesToTable()
    } catch (error) {
      console.error("Error in getCategories:", error)
      throw error
    }
  },

  async migrateCategoriesToTable(): Promise<Category[]> {
    try {
      // Get categories from expense service
      const expenseCategories = await expenseService.getCategories()

      const supabase = getSupabaseBrowserClient()

      // Get user ID
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("User not authenticated")
      }

      const userId = session.user.id

      // Create categories with default values
      const newCategories: Category[] = []

      for (const type of ["expense", "income", "savings"] as ExpenseType[]) {
        expenseCategories[type].forEach((name, index) => {
          newCategories.push({
            id: crypto.randomUUID(), // Generate a proper UUID for the id
            name,
            description: `Default ${type} category`,
            type,
            color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
            isDefault: true,
            usageCount: 0,
          })
        })
      }

      // Ensure the categories table exists with proper schema
      await createCategoriesTable(supabase)

      // Check if last_used column exists
      const hasLastUsed = await checkColumnExists(supabase, "categories", "last_used")

      // Insert categories into the table - map our interface to database columns (camelCase to snake_case)
      // Omit last_used if the column doesn't exist
      const categoriesToInsert = newCategories.map((cat) => {
        const dbCategory: any = {
          id: cat.id,
          user_id: userId, // This is the UUID from the session
          name: cat.name,
          description: cat.description,
          type: cat.type,
          budget: cat.budget,
          color: cat.color,
          icon: cat.icon,
          is_default: cat.isDefault, // Use snake_case for database column
          usage_count: cat.usageCount || 0,
        }

        // Only include last_used if the column exists
        if (hasLastUsed && cat.lastUsed) {
          dbCategory.last_used = cat.lastUsed
        }

        return dbCategory
      })

      const { error: insertError } = await retrySupabaseQuery(() =>
        supabase.from("categories").insert(categoriesToInsert),
      )

      if (insertError) {
        console.error("Error inserting categories:", insertError)
        // Return the list even if we couldn't save it
        return newCategories
      }

      // Update cache
      categoriesCache = newCategories
      lastFetchTime = Date.now()

      return newCategories
    } catch (error) {
      console.error("Error migrating categories:", error)
      throw error
    }
  },

  async addCategory(category: Omit<Category, "id">): Promise<Category> {
    try {
      const supabase = getSupabaseBrowserClient()

      // Get user ID
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("User not authenticated")
      }

      const userId = session.user.id

      // Generate a proper UUID for the id
      const id = crypto.randomUUID()

      // Check if last_used column exists
      const hasLastUsed = await checkColumnExists(supabase, "categories", "last_used")

      // Map our interface to database columns (camelCase to snake_case)
      const dbCategory: any = {
        id,
        user_id: userId,
        name: category.name,
        description: category.description,
        type: category.type,
        budget: category.budget,
        color: category.color,
        icon: category.icon,
        is_default: category.isDefault === undefined ? false : category.isDefault, // Use snake_case for database column
        usage_count: 0,
      }

      // Only include last_used if the column exists
      if (hasLastUsed && category.lastUsed) {
        dbCategory.last_used = category.lastUsed
      }

      const { data, error } = await retrySupabaseQuery(() =>
        supabase.from("categories").insert(dbCategory).select().single(),
      )

      if (error) {
        console.error("Error adding category:", error)
        throw error
      }

      // Map database response back to our interface (snake_case to camelCase)
      const newCategory: Category = {
        id: data.id,
        name: data.name,
        description: data.description,
        type: data.type as ExpenseType,
        budget: data.budget,
        color: data.color,
        icon: data.icon,
        isDefault: data.is_default,
        usageCount: data.usage_count || 0,
        lastUsed: data.last_used,
      }

      // Invalidate cache
      categoriesCache = null
      recentCategoriesCache = null

      // Dispatch update event
      dispatchCategoryUpdate(newCategory)
      dispatchCategorySync()

      return newCategory
    } catch (error) {
      console.error("Error in addCategory:", error)
      throw error
    }
  },

  async updateCategory(id: string, updates: Partial<Omit<Category, "id">>): Promise<Category> {
    try {
      const supabase = getSupabaseBrowserClient()

      // First, get the current category to check if name is changing
      const { data: currentCategory, error: fetchError } = await retrySupabaseQuery(() =>
        supabase.from("categories").select("*").eq("id", id).single(),
      )

      if (fetchError) {
        console.error("Error fetching current category:", fetchError)
        throw fetchError
      }

      // Check if last_used column exists
      const hasLastUsed = await checkColumnExists(supabase, "categories", "last_used")

      // Map our interface to database columns (camelCase to snake_case)
      const dbUpdates: any = { ...updates }
      if ("isDefault" in updates) {
        dbUpdates.is_default = updates.isDefault
        delete dbUpdates.isDefault
      }
      if ("usageCount" in updates) {
        dbUpdates.usage_count = updates.usageCount
        delete dbUpdates.usageCount
      }
      if ("lastUsed" in updates) {
        // Only include last_used if the column exists
        if (hasLastUsed) {
          dbUpdates.last_used = updates.lastUsed
        }
        delete dbUpdates.lastUsed
      }

      const { data, error } = await retrySupabaseQuery(() =>
        supabase.from("categories").update(dbUpdates).eq("id", id).select().single(),
      )

      if (error) {
        console.error("Error updating category:", error)
        throw error
      }

      // Map database response back to our interface (snake_case to camelCase)
      const updatedCategory: Category = {
        id: data.id,
        name: data.name,
        description: data.description,
        type: data.type as ExpenseType,
        budget: data.budget,
        color: data.color,
        icon: data.icon,
        isDefault: data.is_default,
        usageCount: data.usage_count || 0,
        lastUsed: data.last_used,
      }

      // Invalidate cache
      categoriesCache = null
      recentCategoriesCache = null

      // If the name was updated, we need to update all expenses with this category
      const oldName = currentCategory.name
      if (updates.name && oldName !== updates.name) {
        await this.updateExpenseCategoryNames(oldName, updates.name, data.type)
      }

      // Dispatch update event with both old and new category data
      dispatchCategoryUpdate(updatedCategory, updates.name && oldName !== updates.name ? oldName : undefined)
      dispatchCategorySync()

      return updatedCategory
    } catch (error) {
      console.error("Error in updateCategory:", error)
      throw error
    }
  },

  async updateExpenseCategoryNames(oldName: string, newName: string, type: string): Promise<void> {
    try {
      const supabase = getSupabaseBrowserClient()

      // Update all expenses with the old category name to use the new name
      const { data, error } = await retrySupabaseQuery(() =>
        supabase.from("expenses").update({ category: newName }).eq("category", oldName).eq("type", type),
      )

      if (error) {
        console.error("Error updating expense category names:", error)
        throw error
      }

      const updatedCount = data?.length || 0
      console.log(`Updated ${updatedCount} expenses from category "${oldName}" to "${newName}"`)

      // Invalidate recent expenses cache
      recentExpensesCache = null
      recentCategoriesCache = null

      // Trigger a global sync event to refresh all components
      dispatchCategorySync()
    } catch (error) {
      console.error("Error in updateExpenseCategoryNames:", error)
      throw error
    }
  },

  async deleteCategory(id: string, replacementCategoryId?: string): Promise<void> {
    try {
      const supabase = getSupabaseBrowserClient()

      // Get the category before deleting it
      const { data: categoryToDelete, error: fetchError } = await retrySupabaseQuery(() =>
        supabase.from("categories").select("*").eq("id", id).single(),
      )

      if (fetchError) {
        console.error("Error fetching category to delete:", fetchError)
        throw fetchError
      }

      // If a replacement category is provided, reassign expenses first
      if (replacementCategoryId) {
        await this.reassignExpenses(id, replacementCategoryId)
      }

      const { error } = await retrySupabaseQuery(() => supabase.from("categories").delete().eq("id", id))

      if (error) {
        console.error("Error deleting category:", error)
        throw error
      }

      // Invalidate cache
      categoriesCache = null
      recentCategoriesCache = null

      // Dispatch update event for deletion (with empty name to indicate deletion)
      dispatchCategoryUpdate({
        id,
        name: "",
        type: categoryToDelete.type as ExpenseType,
        isDefault: categoryToDelete.is_default,
      })
      dispatchCategorySync()
    } catch (error) {
      console.error("Error in deleteCategory:", error)
      throw error
    }
  },

  async mergeCategories(sourceId: string, targetId: string): Promise<void> {
    try {
      const supabase = getSupabaseBrowserClient()

      // Get both categories to ensure they're of the same type
      const { data: categories, error: fetchError } = await retrySupabaseQuery(() =>
        supabase.from("categories").select("*").in("id", [sourceId, targetId]),
      )

      if (fetchError || !categories || categories.length !== 2) {
        console.error("Error fetching categories for merge:", fetchError)
        throw new Error("Failed to fetch categories for merging")
      }

      const sourceCategory = categories.find((c) => c.id === sourceId)
      const targetCategory = categories.find((c) => c.id === targetId)

      if (!sourceCategory || !targetCategory) {
        throw new Error("One or both categories not found")
      }

      if (sourceCategory.type !== targetCategory.type) {
        throw new Error("Cannot merge categories of different types")
      }

      // Begin transaction by reassigning expenses
      const transactionCount = await this.reassignExpenses(sourceId, targetId)

      // Check if last_used column exists
      const hasLastUsed = await checkColumnExists(supabase, "categories", "last_used")

      // Update the usage count of the target category
      if (transactionCount > 0) {
        const updates: any = {
          usage_count: (targetCategory.usage_count || 0) + (sourceCategory.usage_count || 0),
        }

        // Only include last_used if the column exists
        if (hasLastUsed) {
          updates.last_used = new Date().toISOString()
        }

        await retrySupabaseQuery(() => supabase.from("categories").update(updates).eq("id", targetId))
      }

      // Then delete the source category
      const { error: deleteError } = await retrySupabaseQuery(() =>
        supabase.from("categories").delete().eq("id", sourceId),
      )

      if (deleteError) {
        console.error("Error deleting source category after merge:", deleteError)
        throw deleteError
      }

      // Invalidate cache
      categoriesCache = null
      recentCategoriesCache = null

      // Dispatch update events
      dispatchCategoryUpdate({
        id: targetId,
        name: targetCategory.name,
        type: targetCategory.type as ExpenseType,
        usageCount: (targetCategory.usage_count || 0) + (sourceCategory.usage_count || 0),
      })
      dispatchCategoryUpdate({
        id: sourceId,
        name: "",
        type: sourceCategory.type as ExpenseType,
      })
      dispatchCategorySync()

      console.log(`Successfully merged category "${sourceCategory.name}" into "${targetCategory.name}"`)
    } catch (error) {
      console.error("Error in mergeCategories:", error)
      throw error
    }
  },

  async reassignExpenses(fromCategoryId: string, toCategoryId: string): Promise<number> {
    try {
      const supabase = getSupabaseBrowserClient()

      // Get both categories to ensure they're of the same type
      const { data: categories, error: fetchError } = await retrySupabaseQuery(() =>
        supabase.from("categories").select("*").in("id", [fromCategoryId, toCategoryId]),
      )

      if (fetchError || !categories || categories.length !== 2) {
        console.error("Error fetching categories for reassignment:", fetchError)
        throw new Error("Failed to fetch categories for reassignment")
      }

      const fromCategory = categories.find((c) => c.id === fromCategoryId)
      const toCategory = categories.find((c) => c.id === toCategoryId)

      if (!fromCategory || !toCategory) {
        throw new Error("One or both categories not found")
      }

      if (fromCategory.type !== toCategory.type) {
        throw new Error("Cannot reassign expenses between different category types")
      }

      // Get all expenses for the source category
      const { data: expenses, error: expensesError } = await retrySupabaseQuery(() =>
        supabase.from("expenses").select("*").eq("category", fromCategory.name),
      )

      if (expensesError) {
        console.error("Error fetching expenses:", expensesError)
        throw expensesError
      }

      if (!expenses || expenses.length === 0) {
        // No expenses to reassign
        return 0
      }

      // Update all expenses to the target category
      const { error: updateError } = await retrySupabaseQuery(() =>
        supabase.from("expenses").update({ category: toCategory.name }).eq("category", fromCategory.name),
      )

      if (updateError) {
        console.error("Error updating expenses:", updateError)
        throw updateError
      }

      // Invalidate recent expenses cache
      recentExpensesCache = null
      recentCategoriesCache = null

      console.log(`Reassigned ${expenses.length} expenses from "${fromCategory.name}" to "${toCategory.name}"`)
      return expenses.length
    } catch (error) {
      console.error("Error in reassignExpenses:", error)
      throw error
    }
  },

  async getCategorySpending(categoryName: string, type: ExpenseType): Promise<number> {
    try {
      const supabase = getSupabaseBrowserClient()

      // Get all expenses for this category and sum them
      const { data, error } = await retrySupabaseQuery(() =>
        supabase.from("expenses").select("amount").eq("category", categoryName).eq("type", type),
      )

      if (error) {
        console.error("Error fetching category spending:", error)
        throw error
      }

      if (!data || data.length === 0) {
        return 0
      }

      // Sum all expense amounts
      return data.reduce((total, expense) => total + expense.amount, 0)
    } catch (error) {
      console.error("Error in getCategorySpending:", error)
      throw error
    }
  },

  async getAllCategoriesWithSpending(): Promise<(Category & { spending: number })[]> {
    try {
      // Get all categories
      const categories = await this.getCategories()
      console.log(`Retrieved ${categories.length} categories`)

      // Get all expenses
      const expenses = await expenseService.getExpenses()
      console.log(`Retrieved ${expenses.length} expenses for spending calculation`)

      // Check if last_used column exists
      const supabase = getSupabaseBrowserClient()
      const hasLastUsed = await checkColumnExists(supabase, "categories", "last_used")

      // Calculate spending and usage for each category
      const result = categories.map((category) => {
        const categoryExpenses = expenses.filter((e) => e.category === category.name && e.type === category.type)
        const spending = categoryExpenses.reduce((total, expense) => total + expense.amount, 0)
        const usageCount = categoryExpenses.length

        console.log(`Category "${category.name}" (${category.type}): ${usageCount} transactions, ₹${spending} spending`)

        // Find the most recent transaction date
        let lastUsed = category.lastUsed
        if (categoryExpenses.length > 0 && hasLastUsed) {
          const dates = categoryExpenses.map((e) => new Date(e.date))
          const mostRecent = new Date(Math.max(...dates.map((d) => d.getTime())))
          lastUsed = mostRecent.toISOString()
          console.log(`Category "${category.name}" last used on: ${new Date(lastUsed).toLocaleDateString()}`)
        }

        // Update usage statistics in the database if they've changed
        if ((usageCount !== category.usageCount || lastUsed !== category.lastUsed) && usageCount > 0) {
          this.updateCategoryUsage(category.id, usageCount, hasLastUsed ? lastUsed : undefined)
        }

        return {
          ...category,
          spending,
          usageCount,
          lastUsed,
        }
      })

      return result
    } catch (error) {
      console.error("Error in getAllCategoriesWithSpending:", error)
      throw error
    }
  },

  async updateCategoryUsage(categoryId: string, usageCount: number, lastUsed?: string): Promise<void> {
    try {
      const supabase = getSupabaseBrowserClient()

      // Check if last_used column exists
      const hasLastUsed = await checkColumnExists(supabase, "categories", "last_used")

      const updates: any = { usage_count: usageCount }
      if (hasLastUsed && lastUsed) {
        updates.last_used = lastUsed
      }

      await retrySupabaseQuery(() => supabase.from("categories").update(updates).eq("id", categoryId))

      // We don't invalidate the cache here to avoid too many refreshes
    } catch (error) {
      console.error("Error updating category usage:", error)
      // Don't throw the error as this is a background update
    }
  },

  async getRecentlyUsedCategories(limit = 5): Promise<(Category & { spending: number })[]> {
    try {
      console.log(`Fetching up to ${limit} recently used categories...`)

      // Check if we have a valid cache
      const now = Date.now()
      if (recentCategoriesCache && now - lastRecentFetchTime < RECENT_CACHE_TTL) {
        console.log(`Using cached recent categories (${recentCategoriesCache.length} items)`)
        return recentCategoriesCache.slice(0, limit)
      }

      // Get all categories with spending data
      const allCategories = await this.getAllCategoriesWithSpending()
      console.log(`Total categories fetched: ${allCategories.length}`)

      // First try to use the categories we already have with their usage data
      // Sort by usage count as a fallback if we can't get recent expenses
      let recentCategories = [...allCategories]
        .filter((cat) => (cat.usageCount || 0) > 0)
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))

      // Check if we have cached recent expenses
      if (recentExpensesCache) {
        console.log(`Using cached recent expenses (${recentExpensesCache.length} items)`)
      } else {
        // Get all expenses for the current month to ensure we have the most recent data
        const currentDate = new Date()
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

        const supabase = getSupabaseBrowserClient()

        try {
          // Use retry logic for fetching recent expenses
          const { data: recentExpenses, error } = await retrySupabaseQuery(() =>
            supabase
              .from("expenses")
              .select("*")
              .gte("date", firstDayOfMonth.toISOString())
              .lte("date", lastDayOfMonth.toISOString())
              .order("date", { ascending: false }),
          )

          if (error) {
            console.error("Error fetching recent expenses:", error)
            // Continue with the fallback sorting we already did above
          } else {
            console.log(`Recent expenses fetched: ${recentExpenses?.length || 0}`)

            // Cache the recent expenses
            recentExpensesCache = recentExpenses || []

            // Extract unique categories from recent expenses
            const recentCategoryNames = new Set<string>()
            recentExpenses?.forEach((expense) => {
              recentCategoryNames.add(expense.category)
            })

            console.log(`Unique category names from recent expenses: ${recentCategoryNames.size}`)

            // Filter categories to only include those that appear in recent expenses
            // If we have recent expenses, prioritize those categories
            if (recentExpenses && recentExpenses.length > 0) {
              recentCategories = allCategories.filter(
                (cat) => recentCategoryNames.has(cat.name) || (cat.usageCount && cat.usageCount > 0),
              )
              console.log(`Categories after filtering for recent usage: ${recentCategories.length}`)
            }
          }
        } catch (fetchError) {
          console.error("Exception fetching recent expenses:", fetchError)
          // Continue with the fallback sorting we already did above
        }
      }

      // Check if last_used column exists
      const supabase = getSupabaseBrowserClient()
      const hasLastUsed = await checkColumnExists(supabase, "categories", "last_used")

      // Sort by most recently used and then by usage count
      recentCategories = recentCategories.sort((a, b) => {
        // First sort by last used date (most recent first) if the column exists
        if (hasLastUsed && a.lastUsed && b.lastUsed) {
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
        } else if (hasLastUsed && a.lastUsed) {
          return -1
        } else if (hasLastUsed && b.lastUsed) {
          return 1
        }

        // Then by usage count (highest first)
        return (b.usageCount || 0) - (a.usageCount || 0)
      })

      // Apply the limit
      const result = recentCategories.slice(0, limit)
      console.log(`Returning ${result.length} recent categories`)

      // Update cache
      recentCategoriesCache = recentCategories
      lastRecentFetchTime = now

      return result
    } catch (error) {
      console.error("Error getting recently used categories:", error)

      // Return empty array on error to avoid breaking the UI
      return []
    }
  },

  // Add a new function to specifically update a category's budget limit
  async updateCategoryLimit(categoryId: string, budget?: number): Promise<Category> {
    try {
      const supabase = getSupabaseBrowserClient()

      // Get the current category
      const { data: currentCategory, error: fetchError } = await retrySupabaseQuery(() =>
        supabase.from("categories").select("*").eq("id", categoryId).single(),
      )

      if (fetchError) {
        console.error("Error fetching current category:", fetchError)
        throw fetchError
      }

      // Update only the budget field
      const { data, error } = await retrySupabaseQuery(() =>
        supabase.from("categories").update({ budget }).eq("id", categoryId).select().single(),
      )

      if (error) {
        console.error("Error updating category limit:", error)
        throw error
      }

      // Map database response back to our interface
      const updatedCategory: Category = {
        id: data.id,
        name: data.name,
        description: data.description,
        type: data.type as ExpenseType,
        budget: data.budget,
        color: data.color,
        icon: data.icon,
        isDefault: data.is_default,
        usageCount: data.usage_count || 0,
        lastUsed: data.last_used,
      }

      // Invalidate cache
      categoriesCache = null
      recentCategoriesCache = null

      // Dispatch update event
      dispatchCategoryUpdate(updatedCategory)
      dispatchCategorySync()

      return updatedCategory
    } catch (error) {
      console.error("Error in updateCategoryLimit:", error)
      throw error
    }
  },
}
