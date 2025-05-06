"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useCategories } from "@/contexts/category-context"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  Search,
  RefreshCw,
  Edit,
  CheckCircle2,
  Clock,
  CircleDollarSign,
  Plus,
  Trash2,
  Target,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { categoryService, type Category, CATEGORY_UPDATED_EVENT, CATEGORY_SYNC_EVENT } from "@/lib/category-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CategoryLimitForm } from "@/components/category/category-limit-form"
import { CategoryForm } from "@/components/category/category-form"
import { DeleteCategoryDialog } from "@/components/category/delete-category-dialog"
import type { ExpenseType } from "@/types/expense"

export default function CategoryManagementPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { categories, isLoading: categoriesLoading, error: categoriesError, refreshCategories } = useCategories()
  const router = useRouter()
  const { toast } = useToast()

  // State for dialogs
  const [editLimitDialogOpen, setEditLimitDialogOpen] = useState(false)
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false)
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false)
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for selected category
  const [selectedCategory, setSelectedCategory] = useState<(Category & { spending: number }) | null>(null)

  // State for filtering
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | ExpenseType>("expense") // Default to expense tab
  const [sortBy, setSortBy] = useState<string>("spending")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc") // Default to highest spending first

  // State for recently used categories
  const [recentCategories, setRecentCategories] = useState<(Category & { spending: number })[]>([])
  const [syncNotification, setSyncNotification] = useState<{
    visible: boolean
    category?: string
    oldName?: string
  }>({ visible: false })

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth")
    }
  }, [authLoading, user, router])

  // Load recently used categories
  const loadRecentCategories = useCallback(async () => {
    try {
      // Increase the limit to ensure we get more categories
      const recent = await categoryService.getRecentlyUsedCategories(10)
      console.log(`Loaded ${recent.length} recent categories for display`)
      setRecentCategories(recent)
    } catch (error) {
      console.error("Failed to load recent categories:", error)
      // Don't show error toast to avoid overwhelming the user
      // Just set an empty array to avoid breaking the UI
      setRecentCategories([])
    }
  }, [])

  // Load recent categories on mount
  useEffect(() => {
    if (user) {
      loadRecentCategories().catch((err) => {
        console.error("Error in loadRecentCategories effect:", err)
        // Silent failure to avoid breaking the UI
      })
    }
  }, [user, loadRecentCategories])

  // Listen for category updates
  useEffect(() => {
    const handleCategoryUpdate = (event: CustomEvent) => {
      const { category, oldName } = event.detail

      // Show notification for category updates
      if (category.name && oldName) {
        setSyncNotification({
          visible: true,
          category: category.name,
          oldName,
        })

        // Hide notification after 5 seconds
        setTimeout(() => {
          setSyncNotification({ visible: false })
        }, 5000)
      }

      // Refresh data with a slight delay to ensure DB operations complete
      setTimeout(() => {
        refreshCategories()
        loadRecentCategories()
      }, 500)
    }

    const handleCategorySync = () => {
      // Refresh data on sync events with a slight delay
      setTimeout(() => {
        refreshCategories()
        loadRecentCategories()
      }, 500)
    }

    if (typeof window !== "undefined") {
      window.addEventListener(CATEGORY_UPDATED_EVENT, handleCategoryUpdate as EventListener)
      window.addEventListener(CATEGORY_SYNC_EVENT, handleCategorySync)

      return () => {
        window.removeEventListener(CATEGORY_UPDATED_EVENT, handleCategoryUpdate as EventListener)
        window.removeEventListener(CATEGORY_SYNC_EVENT, handleCategorySync)
      }
    }
  }, [refreshCategories, loadRecentCategories])

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let result = [...categories]

    // Filter by type
    if (activeTab !== "all") {
      result = result.filter((category) => category.type === activeTab)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (category) =>
          category.name.toLowerCase().includes(query) ||
          (category.description && category.description.toLowerCase().includes(query)),
      )
    }

    // Sort categories
    result.sort((a, b) => {
      let comparison = 0

      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === "type") {
        comparison = a.type.localeCompare(b.type)
      } else if (sortBy === "spending") {
        comparison = a.spending - b.spending
      } else if (sortBy === "budget") {
        // Handle undefined budgets
        const budgetA = a.budget || 0
        const budgetB = b.budget || 0
        comparison = budgetA - budgetB
      } else if (sortBy === "usageCount") {
        comparison = (a.usageCount || 0) - (b.usageCount || 0)
      } else if (sortBy === "lastUsed") {
        const dateA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0
        const dateB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0
        comparison = dateA - dateB
      } else if (sortBy === "usage") {
        // Calculate usage percentage for sorting
        const usageA = a.budget ? (a.spending / a.budget) * 100 : 0
        const usageB = b.budget ? (b.spending / b.budget) * 100 : 0
        comparison = usageA - usageB
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return result
  }, [categories, activeTab, searchQuery, sortBy, sortDirection])

  // Handle sort toggle
  const handleSortToggle = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortDirection("asc")
    }
  }

  // Handle update category limit
  const handleUpdateCategoryLimit = async (categoryId: string, budget: number | undefined) => {
    setIsSubmitting(true)

    try {
      await categoryService.updateCategory(categoryId, { budget })
      await refreshCategories()
      setEditLimitDialogOpen(false)
      toast({
        title: "Success",
        description: "Category limit updated successfully",
      })
    } catch (error: any) {
      console.error("Failed to update category limit:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to update category limit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle update category
  const handleUpdateCategory = async (categoryId: string, categoryData: Omit<Category, "id">) => {
    setIsSubmitting(true)

    try {
      await categoryService.updateCategory(categoryId, categoryData)
      await refreshCategories()
      setEditCategoryDialogOpen(false)
      toast({
        title: "Success",
        description: "Category updated successfully",
      })
    } catch (error: any) {
      console.error("Failed to update category:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to update category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle add category
  const handleAddCategory = async (categoryData: Omit<Category, "id">) => {
    setIsSubmitting(true)

    try {
      await categoryService.addCategory(categoryData)
      await refreshCategories()
      setNewCategoryDialogOpen(false)
      toast({
        title: "Success",
        description: "Category added successfully",
      })
    } catch (error: any) {
      console.error("Failed to add category:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to add category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete category
  const handleDeleteCategory = async (categoryId: string, replacementCategoryId?: string) => {
    setIsSubmitting(true)

    try {
      await categoryService.deleteCategory(categoryId, replacementCategoryId)
      await refreshCategories()
      setDeleteCategoryDialogOpen(false)
      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
    } catch (error: any) {
      console.error("Failed to delete category:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to delete category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get type color for badges
  const getTypeColor = (type: string) => {
    switch (type) {
      case "expense":
        return "destructive"
      case "income":
        return "success"
      case "savings":
        return "blue"
      default:
        return "secondary"
    }
  }

  // Calculate progress percentage
  const calculateProgress = (spending: number, budget?: number) => {
    if (!budget || budget <= 0) return 0
    const percentage = (spending / budget) * 100
    return Math.min(percentage, 100) // Cap at 100%
  }

  // Get progress color based on percentage
  const getProgressColor = (spending: number, budget?: number) => {
    if (!budget) return "bg-primary"
    const progress = calculateProgress(spending, budget)
    if (progress >= 90) return "bg-red-500"
    if (progress >= 75) return "bg-amber-500"
    return "bg-primary"
  }

  // Check if over budget
  const isOverBudget = (spending: number, budget?: number) => {
    return budget !== undefined && spending > budget
  }

  // Format date for display
  const formatLastUsed = (lastUsed?: string) => {
    if (!lastUsed) return "Never"

    try {
      const date = new Date(lastUsed)
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date)
    } catch (e) {
      return "Invalid date"
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in the useEffect
  }

  return (
    <AppLayout>
      <div className="p-6 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 w-full">
          <div>
            <h1 className="text-2xl font-bold">Category Management</h1>
            <p className="text-muted-foreground">Create, edit, and manage categories and spending limits</p>
          </div>
          <Button onClick={() => setNewCategoryDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Sync notification */}
        {syncNotification.visible && (
          <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-900/20 w-full">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle>Category Updated</AlertTitle>
            <AlertDescription>
              Category "{syncNotification.oldName}" has been renamed to "{syncNotification.category}". All transactions
              have been updated automatically.
            </AlertDescription>
          </Alert>
        )}

        {categoriesError ? (
          <Alert variant="destructive" className="mb-6 w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{categoriesError}</AlertDescription>
          </Alert>
        ) : null}

        {/* Recently Used Categories */}
        {recentCategories.length > 0 && (
          <Card className="mb-6 w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-md flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Recently Used Categories
              </CardTitle>
              <CardDescription>Categories that appear in your recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recentCategories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="outline"
                    className="flex items-center gap-2 py-1.5 px-3 cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setSelectedCategory(category)
                      setEditCategoryDialogOpen(true)
                    }}
                  >
                    {category.color && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                        aria-hidden="true"
                      />
                    )}
                    <span>{category.name}</span>
                    <Badge variant={getTypeColor(category.type)} className="text-[10px] px-1">
                      {category.usageCount}
                    </Badge>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-6 space-y-4 w-full">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                className="pl-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSortToggle("name")}
                className="relative"
                aria-label="Sort by name"
              >
                <span className="sr-only">Sort by name</span>
                <span className="text-xs font-medium">A-Z</span>
                {sortBy === "name" && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSortToggle("spending")}
                className="relative"
                aria-label="Sort by spending"
              >
                <span className="sr-only">Sort by spending</span>
                <CircleDollarSign className="h-4 w-4" />
                {sortBy === "spending" && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSortToggle("usage")}
                className="relative"
                aria-label="Sort by usage percentage"
              >
                <span className="sr-only">Sort by usage</span>
                <span className="text-xs font-medium">%</span>
                {sortBy === "usage" && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                aria-label={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
              >
                <span className="sr-only">Toggle sort direction</span>
                {sortDirection === "asc" ? "↑" : "↓"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={refreshCategories}
                disabled={categoriesLoading}
                aria-label="Refresh categories"
              >
                <RefreshCw className={`h-4 w-4 ${categoriesLoading ? "animate-spin" : ""}`} />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="all">All Categories</TabsTrigger>
              <TabsTrigger value="expense">Expenses</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="savings">Savings</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {categoriesLoading ? (
          <div className="border rounded-md p-4 space-y-4 w-full">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted/30 rounded-md animate-pulse"></div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12 w-full">
            <h3 className="text-lg font-medium">No categories found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery
                ? "Try adjusting your search query"
                : activeTab !== "all"
                  ? `No ${activeTab} categories found`
                  : "Add a category to get started"}
            </p>
            <Button className="mt-4" onClick={() => setNewCategoryDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        ) : (
          <Card className="w-full">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSortToggle("name")}>
                        Category {sortBy === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSortToggle("spending")}>
                        Current Spending {sortBy === "spending" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSortToggle("budget")}>
                        Monthly Limit {sortBy === "budget" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSortToggle("usage")}>
                        Usage {sortBy === "usage" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSortToggle("lastUsed")}>
                        Last Used {sortBy === "lastUsed" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => {
                      const hasLimit = category.budget !== undefined && category.budget > 0
                      const overBudget = isOverBudget(category.spending, category.budget)
                      const usagePercentage = calculateProgress(category.spending, category.budget)
                      const isActive = (category.usageCount || 0) > 0

                      return (
                        <TableRow key={category.id} className={isActive ? "bg-muted/20" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {category.color && (
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                  aria-hidden="true"
                                />
                              )}
                              <span className="font-medium">{category.name}</span>
                              <Badge variant={getTypeColor(category.type)} className="ml-1">
                                {category.type.charAt(0).toUpperCase() + category.type.slice(1)}
                              </Badge>
                              {category.isDefault && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="ml-1">
                                        Default
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>This is a default category</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            {category.description && (
                              <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={overBudget ? "text-red-500 font-medium" : ""}>
                              {formatCurrency(category.spending)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {hasLimit ? (
                              <span>{formatCurrency(category.budget!)}</span>
                            ) : (
                              <span className="text-muted-foreground">No limit set</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {hasLimit ? (
                              <div className="w-full max-w-[150px]">
                                <Progress
                                  value={usagePercentage}
                                  className={getProgressColor(category.spending, category.budget)}
                                />
                                <div className="flex justify-between text-xs mt-1">
                                  <span
                                    className={
                                      overBudget
                                        ? "text-red-500 font-medium flex items-center"
                                        : "text-muted-foreground"
                                    }
                                  >
                                    {overBudget ? (
                                      <>
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Over by {formatCurrency(category.spending - category.budget!)}
                                      </>
                                    ) : (
                                      `${usagePercentage.toFixed(0)}%`
                                    )}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">{formatLastUsed(category.lastUsed)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedCategory(category)
                                        setEditCategoryDialogOpen(true)
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                      <span className="sr-only">Edit</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit Category</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedCategory(category)
                                        setEditLimitDialogOpen(true)
                                      }}
                                    >
                                      <Target className="h-4 w-4" />
                                      <span className="sr-only">Set Limit</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{hasLimit ? "Edit Limit" : "Set Limit"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedCategory(category)
                                        setDeleteCategoryDialogOpen(true)
                                      }}
                                      disabled={category.isDefault}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{category.isDefault ? "Cannot delete default category" : "Delete Category"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Category Limit Dialog */}
      <Dialog open={editLimitDialogOpen} onOpenChange={setEditLimitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCategory?.budget ? "Edit Category Limit" : "Set Category Limit"}</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <CategoryLimitForm
              category={selectedCategory}
              onSubmit={(budget) => handleUpdateCategoryLimit(selectedCategory.id, budget)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editCategoryDialogOpen} onOpenChange={setEditCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <CategoryForm
              initialData={selectedCategory}
              onSubmit={(categoryData) => handleUpdateCategory(selectedCategory.id, categoryData)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* New Category Dialog */}
      <Dialog open={newCategoryDialogOpen} onOpenChange={setNewCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <CategoryForm onSubmit={handleAddCategory} isSubmitting={isSubmitting} />
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <DeleteCategoryDialog
              category={selectedCategory}
              categories={categories.filter((c) => c.id !== selectedCategory.id && c.type === selectedCategory.type)}
              onDelete={(id, replacementId) => handleDeleteCategory(id, replacementId)}
              isDeleting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
