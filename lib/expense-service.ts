import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Expense } from "@/types/expense"
import type { Database } from "@/types/supabase"

type DbExpense = Database["public"]["Tables"]["expenses"]["Row"]
type InsertExpense = Database["public"]["Tables"]["expenses"]["Insert"]
type UpdateExpense = Database["public"]["Tables"]["expenses"]["Update"]

// Default categories by type
const DEFAULT_CATEGORIES = {
  expense: [
    "Food",
    "Transport",
    "Entertainment",
    "Housing",
    "Utilities",
    "Healthcare",
    "Education",
    "Shopping",
    "Other",
  ],
  income: ["Salary", "Freelance", "Gifts", "Investments", "Other"],
  savings: ["Emergency Fund", "Retirement", "Investments", "Goals", "Other"],
}

// Store categories in memory with defaults
let categoriesCache: Record<string, string[]> = { ...DEFAULT_CATEGORIES }
let categoriesCacheInitialized = false

// Convert database expense to app expense
const mapDbExpenseToExpense = (dbExpense: DbExpense): Expense => {
  return {
    id: dbExpense.id,
    date: dbExpense.date,
    type: dbExpense.type,
    category: dbExpense.category,
    amount: dbExpense.amount,
    notes: dbExpense.notes,
  }
}

// Convert app expense to database expense
const mapExpenseToDbExpense = (expense: Expense, userId: string): InsertExpense => {
  return {
    id: expense.id || undefined,
    user_id: userId,
    date: expense.date,
    type: expense.type,
    category: expense.category,
    amount: expense.amount,
    notes: expense.notes,
  }
}

// Cache for expenses to reduce database queries
let expensesCache: Expense[] | null = null
const lastFetchTime = 0
const CACHE_TTL = 60000 // 1 minute

// Format currency for display
const formatCurrency = (amount: number) => {
  // Ensure amount is a number
  const value = typeof amount === "number" ? amount : 0
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

// Add a session cache to reduce auth checks
let sessionCache: {
  session: any
  timestamp: number
} | null = null
const SESSION_CACHE_TTL = 30000 // 30 seconds

export const expenseService = {
  // Add a function to verify authentication with caching
  async verifyAuthentication(): Promise<boolean> {
    try {
      // Check if we have a valid session cache
      const now = Date.now()
      if (sessionCache && now - sessionCache.timestamp < SESSION_CACHE_TTL) {
        return true // Use cached session
      }

      const supabase = getSupabaseBrowserClient()

      // Get the current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        sessionCache = null
        return false
      }

      if (!session) {
        console.log("No active session")
        sessionCache = null
        return false
      }

      // Cache the session
      sessionCache = {
        session,
        timestamp: now,
      }

      // Check if session is expired
      const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null
      const now_date = new Date()

      if (expiresAt && expiresAt < now_date) {
        console.log("Session has expired, attempting to refresh")

        try {
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

          if (refreshError) {
            console.error("Error refreshing session:", refreshError)
            sessionCache = null
            return false
          }

          if (!refreshData.session) {
            console.log("No session after refresh")
            sessionCache = null
            return false
          }

          // Update cache with refreshed session
          sessionCache = {
            session: refreshData.session,
            timestamp: now,
          }

          return true
        } catch (refreshError) {
          console.error("Session refresh error:", refreshError)
          sessionCache = null
          return false
        }
      }

      return true
    } catch (error) {
      console.error("Authentication verification error:", error)
      sessionCache = null
      return false
    }
  },
  async getExpenses(): Promise<Expense[]> {
    try {
      const supabase = getSupabaseBrowserClient()

      // First, verify authentication
      const isAuthenticated = await this.verifyAuthentication()
      if (!isAuthenticated) {
        throw new Error("User not authenticated")
      }

      // Fetch all expenses without pagination to ensure we get everything
      const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false })

      if (error) {
        console.error("Error fetching expenses:", error)
        throw error
      }

      console.log(`Retrieved ${data?.length || 0} total expenses from database`)
      return data || []
    } catch (error) {
      console.error("Error in getExpenses:", error)
      throw error
    }
  },

  async addExpense(expense: Expense): Promise<Expense> {
    try {
      const supabase = getSupabaseBrowserClient()

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        throw new Error("Failed to get session: " + sessionError.message)
      }

      if (!session) {
        throw new Error("User not authenticated")
      }

      const userId = session.user.id
      const dbExpense = mapExpenseToDbExpense(expense, userId)

      console.log("Adding expense to Supabase:", {
        userId,
        expenseType: dbExpense.type,
        expenseCategory: dbExpense.category,
        expenseAmount: formatCurrency(dbExpense.amount),
      })

      const { data, error } = await supabase.from("expenses").insert(dbExpense).select().single()

      if (error) {
        console.error("Error adding expense:", error)

        // Handle specific Supabase errors
        if (error.code === "23505") {
          throw new Error("This transaction already exists")
        } else if (error.code === "23503") {
          throw new Error("Referenced record does not exist")
        } else if (error.code === "42P01") {
          throw new Error("Table 'expenses' does not exist. Please check your database schema.")
        } else if (error.code === "42703") {
          throw new Error("Column does not exist in the expenses table. Please check your database schema.")
        } else if (error.code === "23502") {
          throw new Error("A required field is missing")
        } else {
          throw error
        }
      }

      if (!data) {
        throw new Error("No data returned from insert operation")
      }

      console.log("Transaction added successfully:", {
        id: data.id,
        type: data.type,
        amount: formatCurrency(data.amount),
      })

      // Add category to cache if it's new
      if (!categoriesCache[data.type].includes(data.category)) {
        categoriesCache[data.type].push(data.category)
      }

      // Invalidate cache
      expensesCache = null

      // Return the complete expense with the ID from the database
      return mapDbExpenseToExpense(data)
    } catch (error) {
      console.error("Error in addExpense:", error)
      throw error
    }
  },

  async updateExpense(expense: Expense): Promise<Expense> {
    try {
      const supabase = getSupabaseBrowserClient()

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        throw new Error("Failed to get session: " + sessionError.message)
      }

      if (!session) {
        throw new Error("User not authenticated")
      }

      const { data, error } = await supabase
        .from("expenses")
        .update({
          date: expense.date,
          type: expense.type,
          category: expense.category,
          amount: expense.amount,
          notes: expense.notes,
        })
        .eq("id", expense.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating expense:", error)
        throw error
      }

      // Add category to cache if it's new
      if (!categoriesCache[data.type].includes(data.category)) {
        categoriesCache[data.type].push(data.category)
      }

      // Invalidate cache
      expensesCache = null

      return mapDbExpenseToExpense(data)
    } catch (error) {
      console.error("Error in updateExpense:", error)
      throw error
    }
  },

  async deleteExpense(id: string): Promise<void> {
    try {
      const supabase = getSupabaseBrowserClient()

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        throw new Error("Failed to get session: " + sessionError.message)
      }

      if (!session) {
        throw new Error("User not authenticated")
      }

      const { error } = await supabase.from("expenses").delete().eq("id", id)

      if (error) {
        console.error("Error deleting expense:", error)
        throw error
      }

      // Invalidate cache
      expensesCache = null
    } catch (error) {
      console.error("Error in deleteExpense:", error)
      throw error
    }
  },

  // Initialize categories from expenses
  async initializeCategories(expenses: Expense[]): Promise<void> {
    try {
      // Start with default categories
      const categories: Record<string, Set<string>> = {
        expense: new Set(DEFAULT_CATEGORIES.expense),
        income: new Set(DEFAULT_CATEGORIES.income),
        savings: new Set(DEFAULT_CATEGORIES.savings),
      }

      // Add categories from expenses
      expenses.forEach((expense) => {
        if (expense.type && expense.category) {
          categories[expense.type].add(expense.category)
        }
      })

      // Convert sets to arrays
      categoriesCache = {
        expense: Array.from(categories.expense),
        income: Array.from(categories.income),
        savings: Array.from(categories.savings),
      }

      categoriesCacheInitialized = true
    } catch (error) {
      console.error("Error initializing categories:", error)
    }
  },

  // Get categories for a specific type or all categories
  async getCategories(type?: string): Promise<Record<string, string[]>> {
    // Make sure categories are initialized
    if (!categoriesCacheInitialized) {
      const expenses = await this.getExpenses()
      await this.initializeCategories(expenses)
    }

    if (type) {
      return { [type]: categoriesCache[type] || [] }
    }

    return categoriesCache
  },

  // Update category list (used after CSV import)
  async updateCategoryList(categories: Record<string, string[]>): Promise<void> {
    categoriesCache = { ...categories }
    categoriesCacheInitialized = true
  },

  formatCurrency,
}
