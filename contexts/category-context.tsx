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
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await categoryService.getAllCategoriesWithSpending()
      setCategories(data)
    } catch (error: any) {
      console.error("Failed to load categories:", error)
      setError(error?.message || "Failed to load categories. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [user])

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
