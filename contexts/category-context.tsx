"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { categoryService, type Category } from "@/lib/category-service"
import { useAuth } from "@/contexts/auth-context"

// Define the context type
interface CategoryContextType {
  categories: (Category & { spending: number })[]
  isLoading: boolean
  error: string | null
  refreshCategories: () => Promise<void>
  getCategoryName: (categoryId: string) => string | undefined
  getCategoryById: (categoryId: string) => (Category & { spending: number }) | undefined
  getCategoryByName: (name: string, type: string) => (Category & { spending: number }) | undefined
  updateCategoryMap: () => void
}

// Create the context with a default value
const CategoryContext = createContext<CategoryContextType | undefined>(undefined)

// Create a mapping from category name to category object for quick lookups
type CategoryMap = {
  byId: Record<string, Category & { spending: number }>
  byNameAndType: Record<string, Category & { spending: number }>
}

const CATEGORY_UPDATED_EVENT = "category-updated"
const CATEGORY_SYNC_EVENT = "category-sync"

// Provider component
export function CategoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [categories, setCategories] = useState<(Category & { spending: number })[]>([])
  const [categoryMap, setCategoryMap] = useState<CategoryMap>({ byId: {}, byNameAndType: {} })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to update the category map
  const updateCategoryMap = useCallback(() => {
    const byId: Record<string, Category & { spending: number }> = {}
    const byNameAndType: Record<string, Category & { spending: number }> = {}

    categories.forEach((category) => {
      byId[category.id] = category
      byNameAndType[`${category.name}:${category.type}`] = category
    })

    setCategoryMap({ byId, byNameAndType })
  }, [categories])

  // Function to refresh categories
  const refreshCategories = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Refreshing categories in context...")
      const categoriesWithSpending = await categoryService.getAllCategoriesWithSpending()
      console.log(`Retrieved ${categoriesWithSpending.length} categories with spending data`)
      setCategories(categoriesWithSpending)
    } catch (error: any) {
      console.error("Error refreshing categories:", error)
      setError(error.message || "Failed to load categories")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load categories on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshCategories()
    }
  }, [user, refreshCategories])

  // Update category map when categories change
  useEffect(() => {
    updateCategoryMap()
  }, [categories, updateCategoryMap])

  // Listen for category updates
  useEffect(() => {
    const handleCategoryUpdate = () => {
      console.log("Category update detected in context, refreshing categories...")
      refreshCategories()
    }

    if (typeof window !== "undefined") {
      window.addEventListener(CATEGORY_UPDATED_EVENT, handleCategoryUpdate)
      window.addEventListener(CATEGORY_SYNC_EVENT, handleCategoryUpdate)

      return () => {
        window.removeEventListener(CATEGORY_UPDATED_EVENT, handleCategoryUpdate)
        window.removeEventListener(CATEGORY_SYNC_EVENT, handleCategoryUpdate)
      }
    }
  }, [refreshCategories])

  // Helper function to get category name by ID
  const getCategoryName = useCallback(
    (categoryId: string): string | undefined => {
      return categoryMap.byId[categoryId]?.name
    },
    [categoryMap],
  )

  // Helper function to get category by ID
  const getCategoryById = useCallback(
    (categoryId: string) => {
      return categoryMap.byId[categoryId]
    },
    [categoryMap],
  )

  // Helper function to get category by name and type
  const getCategoryByName = useCallback(
    (name: string, type: string) => {
      return categoryMap.byNameAndType[`${name}:${type}`]
    },
    [categoryMap],
  )

  // Context value
  const value = {
    categories,
    isLoading,
    error,
    refreshCategories,
    getCategoryName,
    getCategoryById,
    getCategoryByName,
    updateCategoryMap,
  }

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>
}

// Custom hook to use the category context
export function useCategories() {
  const context = useContext(CategoryContext)
  if (context === undefined) {
    throw new Error("useCategories must be used within a CategoryProvider")
  }
  return context
}
