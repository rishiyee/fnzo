"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useCategories } from "@/contexts/category-context"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Plus, Search, RefreshCw, ArrowDownUp, GitMerge } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CategoryTable } from "@/components/category/category-table"
import { CategoryForm } from "@/components/category/category-form"
import { MergeCategoriesForm } from "@/components/category/merge-categories-form"
import { DeleteCategoryDialog } from "@/components/category/delete-category-dialog"
import { categoryService, type Category } from "@/lib/category-service"
import type { ExpenseType } from "@/types/expense"

export default function CategoriesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { categories, isLoading: categoriesLoading, error: categoriesError, refreshCategories } = useCategories()
  const router = useRouter()
  const { toast } = useToast()

  // State for dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for selected category
  const [selectedCategory, setSelectedCategory] = useState<(Category & { spending: number }) | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isMergeMode, setIsMergeMode] = useState(false)

  // State for filtering
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | ExpenseType>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth")
    }
  }, [authLoading, user, router])

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
      result = result.filter((category) => category.name.toLowerCase().includes(query))
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

  // Handle add category
  const handleAddCategory = async (category: Omit<Category, "id">) => {
    setIsSubmitting(true)

    try {
      await categoryService.addCategory(category)
      await refreshCategories()
      setAddDialogOpen(false)
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

  // Handle edit category
  const handleEditCategory = async (category: Omit<Category, "id">) => {
    if (!selectedCategory) return

    setIsSubmitting(true)

    try {
      await categoryService.updateCategory(selectedCategory.id, category)
      await refreshCategories()
      setEditDialogOpen(false)
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

  // Handle merge categories
  const handleMergeCategories = async (sourceId: string, targetId: string) => {
    setIsSubmitting(true)

    try {
      await categoryService.mergeCategories(sourceId, targetId)
      await refreshCategories()
      setMergeDialogOpen(false)
      toast({
        title: "Success",
        description: "Categories merged successfully",
      })
    } catch (error: any) {
      console.error("Failed to merge categories:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to merge categories. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      // Exit merge mode
      setIsMergeMode(false)
      setSelectedCategories([])
    }
  }

  // Handle delete category
  const handleDeleteCategory = async (id: string, replacementId?: string) => {
    setIsSubmitting(true)

    try {
      await categoryService.deleteCategory(id, replacementId)
      await refreshCategories()
      setDeleteDialogOpen(false)
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

  // Toggle category selection for merge
  const toggleCategorySelection = (category: Category & { spending: number }) => {
    if (selectedCategories.includes(category.id)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== category.id))
    } else {
      // Only allow selecting categories of the same type
      const firstSelected =
        selectedCategories.length > 0 ? categories.find((c) => c.id === selectedCategories[0]) : null

      if (!firstSelected || firstSelected.type === category.type) {
        setSelectedCategories([...selectedCategories, category.id])
      } else {
        toast({
          title: "Cannot select",
          description: "You can only merge categories of the same type",
          variant: "destructive",
        })
      }
    }
  }

  // Start merge process
  const startMergeProcess = () => {
    if (selectedCategories.length !== 2) {
      toast({
        title: "Select two categories",
        description: "Please select exactly two categories to merge",
        variant: "destructive",
      })
      return
    }

    // Get the selected categories
    const sourceCategory = categories.find((c) => c.id === selectedCategories[0])
    const targetCategory = categories.find((c) => c.id === selectedCategories[1])

    if (!sourceCategory || !targetCategory) {
      toast({
        title: "Error",
        description: "Selected categories not found",
        variant: "destructive",
      })
      return
    }

    // Check if they are the same type
    if (sourceCategory.type !== targetCategory.type) {
      toast({
        title: "Cannot merge",
        description: "You can only merge categories of the same type",
        variant: "destructive",
      })
      return
    }

    // Set the source category and open the merge dialog
    setSelectedCategory(sourceCategory)
    setMergeDialogOpen(true)
  }

  // Cancel merge mode
  const cancelMergeMode = () => {
    setIsMergeMode(false)
    setSelectedCategories([])
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
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Manage Categories</h1>
            <p className="text-muted-foreground">Create, edit, and organize your transaction categories</p>
          </div>
          <div className="flex gap-2">
            {isMergeMode ? (
              <>
                <Button onClick={startMergeProcess} disabled={selectedCategories.length !== 2} variant="default">
                  <GitMerge className="h-4 w-4 mr-2" />
                  Merge Selected ({selectedCategories.length}/2)
                </Button>
                <Button onClick={cancelMergeMode} variant="outline">
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
                <Button onClick={() => setIsMergeMode(true)} variant="outline">
                  <GitMerge className="h-4 w-4 mr-2" />
                  Merge Mode
                </Button>
              </>
            )}
          </div>
        </div>

        {categoriesError ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{categoriesError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
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
                <ArrowDownUp className="h-4 w-4" />
                {sortBy === "spending" && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleSortToggle("budget")}
                className="relative"
                aria-label="Sort by budget"
              >
                <span className="sr-only">Sort by budget</span>
                <span className="text-xs font-medium">₹</span>
                {sortBy === "budget" && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />}
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

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="all">All Categories</TabsTrigger>
              <TabsTrigger value="expense">Expenses</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="savings">Savings</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isMergeMode && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Merge Mode Active</AlertTitle>
            <AlertDescription>
              Select two categories of the same type to merge them. The transactions from the first category will be
              moved to the second category.
            </AlertDescription>
          </Alert>
        )}

        {categoriesLoading ? (
          <div className="border rounded-md p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted/30 rounded-md animate-pulse"></div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No categories found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery
                ? "Try adjusting your search query"
                : activeTab !== "all"
                  ? `No ${activeTab} categories found`
                  : "Add a category to get started"}
            </p>
            <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        ) : (
          <CategoryTable
            categories={filteredCategories}
            onEdit={(category) => {
              if (!isMergeMode) {
                setSelectedCategory(category)
                setEditDialogOpen(true)
              }
            }}
            onDelete={(category) => {
              if (!isMergeMode) {
                setSelectedCategory(category)
                setDeleteDialogOpen(true)
              }
            }}
            isMergeMode={isMergeMode}
            selectedCategories={selectedCategories}
            onToggleSelect={toggleCategorySelection}
            sortConfig={{ key: sortBy, direction: sortDirection }}
            onSort={handleSortToggle}
          />
        )}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <CategoryForm onSubmit={handleAddCategory} isSubmitting={isSubmitting} />
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <CategoryForm initialData={selectedCategory} onSubmit={handleEditCategory} isSubmitting={isSubmitting} />
          )}
        </DialogContent>
      </Dialog>

      {/* Merge Categories Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Categories</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <MergeCategoriesForm
              categories={categories}
              sourceCategory={selectedCategory}
              onSubmit={handleMergeCategories}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <DeleteCategoryDialog
              category={selectedCategory}
              categories={categories}
              onDelete={handleDeleteCategory}
              isDeleting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
