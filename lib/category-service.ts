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

      // Try to fetch categories from database
      const { data: categoriesData, error: categoriesError } = await supabase.from("categories").select("*")

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

      // Create categories table if it doesn't exist
      const { error: createError } = await supabase.rpc("create_categories_table_if_not_exists")

      if (createError) {
        console.error("Error creating categories table:", createError)

        // Fall back to using the generated list without persisting
        return newCategories
      }

      // Insert categories into the table - map our interface to database columns (camelCase to snake_case)
      const { error: insertError } = await supabase.from("categories").insert(
        newCategories.map((cat) => ({
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
          last_used: cat.lastUsed,
        })),
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

      // Map our interface to database columns (camelCase to snake_case)
      const dbCategory = {
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
        last_used: null,
      }

      const { data, error } = await supabase.from("categories").insert(dbCategory).select().single()

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
      const { data: currentCategory, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single()

      if (fetchError) {
        console.error("Error fetching current category:", fetchError)
        throw fetchError
      }

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
        dbUpdates.last_used = updates.lastUsed
        delete dbUpdates.lastUsed
      }

      const { data, error } = await supabase.from("categories").update(dbUpdates).eq("id", id).select().single()

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
      const { data, error } = await supabase
        .from("expenses")
        .update({ category: newName })
        .eq("category", oldName)
        .eq("type", type)

      if (error) {
        console.error("Error updating expense category names:", error)
        throw error
      }

      const updatedCount = data?.length || 0
      console.log(`Updated ${updatedCount} expenses from category "${oldName}" to "${newName}"`)

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
      const { data: categoryToDelete, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single()

      if (fetchError) {
        console.error("Error fetching category to delete:", fetchError)
        throw fetchError
      }

      // If a replacement category is provided, reassign expenses first
      if (replacementCategoryId) {
        await this.reassignExpenses(id, replacementCategoryId)
      }

      const { error } = await supabase.from("categories").delete().eq("id", id)

      if (error) {
        console.error("Error deleting category:", error)
        throw error
      }

      // Invalidate cache
      categoriesCache = null

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
      const { data: categories, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .in("id", [sourceId, targetId])

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

      // Update the usage count of the target category
      if (transactionCount > 0) {
        await supabase
          .from("categories")
          .update({
            usage_count: (targetCategory.usage_count || 0) + (sourceCategory.usage_count || 0),
            last_used: new Date().toISOString(),
          })
          .eq("id", targetId)
      }

      // Then delete the source category
      const { error: deleteError } = await supabase.from("categories").delete().eq("id", sourceId)

      if (deleteError) {
        console.error("Error deleting source category after merge:", deleteError)
        throw deleteError
      }

      // Invalidate cache
      categoriesCache = null

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
      const { data: categories, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .in("id", [fromCategoryId, toCategoryId])

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
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("category", fromCategory.name)

      if (expensesError) {
        console.error("Error fetching expenses:", expensesError)
        throw expensesError
      }

      if (!expenses || expenses.length === 0) {
        // No expenses to reassign
        return 0
      }

      // Update all expenses to the target category
      const { error: updateError } = await supabase
        .from("expenses")
        .update({ category: toCategory.name })
        .eq("category", fromCategory.name)

      if (updateError) {
        console.error("Error updating expenses:", updateError)
        throw updateError
      }

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
      const { data, error } = await supabase
        .from("expenses")
        .select("amount")
        .eq("category", categoryName)
        .eq("type", type)

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

      // Calculate spending and usage for each category
      const result = categories.map((category) => {
        const categoryExpenses = expenses.filter((e) => e.category === category.name && e.type === category.type)
        const spending = categoryExpenses.reduce((total, expense) => total + expense.amount, 0)
        const usageCount = categoryExpenses.length

        console.log(`Category "${category.name}" (${category.type}): ${usageCount} transactions, ₹${spending} spending`)

        // Find the most recent transaction date
        let lastUsed = category.lastUsed
        if (categoryExpenses.length > 0) {
          const dates = categoryExpenses.map((e) => new Date(e.date))
          const mostRecent = new Date(Math.max(...dates.map((d) => d.getTime())))
          lastUsed = mostRecent.toISOString()
          console.log(`Category "${category.name}" last used on: ${new Date(lastUsed).toLocaleDateString()}`)
        }

        // Update usage statistics in the database if they've changed
        if ((usageCount !== category.usageCount || lastUsed !== category.lastUsed) && usageCount > 0) {
          this.updateCategoryUsage(category.id, usageCount, lastUsed)
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

      const updates: any = { usage_count: usageCount }
      if (lastUsed) {
        updates.last_used = lastUsed
      }

      await supabase.from("categories").update(updates).eq("id", categoryId)

      // We don't invalidate the cache here to avoid too many refreshes
    } catch (error) {
      console.error("Error updating category usage:", error)
      // Don't throw the error as this is a background update
    }
  },

  async getRecentlyUsedCategories(limit = 5): Promise<(Category & { spending: number })[]> {
    try {
      console.log(`Fetching up to ${limit} recently used categories...`)

      // Get all categories with spending data
      const allCategories = await this.getAllCategoriesWithSpending()
      console.log(`Total categories fetched: ${allCategories.length}`)

      // Get all expenses for the current month to ensure we have the most recent data
      const currentDate = new Date()
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const supabase = getSupabaseBrowserClient()
      const { data: recentExpenses, error } = await supabase
        .from("expenses")
        .select("*")
        .gte("date", firstDayOfMonth.toISOString())
        .lte("date", lastDayOfMonth.toISOString())
        .order("date", { ascending: false })

      if (error) {
        console.error("Error fetching recent expenses:", error)
        throw error
      }

      console.log(`Recent expenses fetched: ${recentExpenses?.length || 0}`)

      // Extract unique categories from recent expenses
      const recentCategoryNames = new Set<string>()
      recentExpenses?.forEach((expense) => {
        recentCategoryNames.add(expense.category)
      })

      console.log(`Unique category names from recent expenses: ${recentCategoryNames.size}`)
      console.log(`Category names: ${Array.from(recentCategoryNames).join(", ")}`)

      // Filter categories to only include those that appear in recent expenses
      let recentCategories = allCategories.filter(
        (cat) => recentCategoryNames.has(cat.name) || (cat.usageCount && cat.usageCount > 0),
      )

      console.log(`Categories after filtering for recent usage: ${recentCategories.length}`)

      // Sort by most recently used and then by usage count
      recentCategories = recentCategories.sort((a, b) => {
        // First sort by last used date (most recent first)
        if (a.lastUsed && b.lastUsed) {
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
        } else if (a.lastUsed) {
          return -1
        } else if (b.lastUsed) {
          return 1
        }

        // Then by usage count (highest first)
        return (b.usageCount || 0) - (a.usageCount || 0)
      })

      // Apply the limit
      const result = recentCategories.slice(0, limit)
      console.log(`Returning ${result.length} recent categories`)

      return result
    } catch (error) {
      console.error("Error getting recently used categories:", error)
      return []
    }
  },

  // Add a new function to specifically update a category's budget limit
  async updateCategoryLimit(categoryId: string, budget?: number): Promise<Category> {
    try {
      const supabase = getSupabaseBrowserClient()

      // Get the current category
      const { data: currentCategory, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .eq("id", categoryId)
        .single()

      if (fetchError) {
        console.error("Error fetching current category:", fetchError)
        throw fetchError
      }

      // Update only the budget field
      const { data, error } = await supabase
        .from("categories")
        .update({ budget })
        .eq("id", categoryId)
        .select()
        .single()

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
