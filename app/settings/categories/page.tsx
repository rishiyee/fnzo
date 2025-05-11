"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, GitMerge, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CategoryCard } from "@/components/category/category-card"
import { CategoryTable } from "@/components/category/category-table"
import { CategoryForm } from "@/components/category/category-form"
import { DeleteCategoryDialog } from "@/components/category/delete-category-dialog"
import { MergeCategoriesForm } from "@/components/category/merge-categories-form"
import { useCategories } from "@/contexts/category-context"
import { categoryService, type Category } from "@/lib/category-service"
import { useToast } from "@/hooks/use-toast"

export default function CategoriesPage() {
  const router = useRouter()
  const { categories, isLoading, refreshCategories } = useCategories()
  const { toast } = useToast()

  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [mergeSourceCategory, setMergeSourceCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [isMergeMode, setIsMergeMode] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income" | "savings">("all")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "name",
    direction: "asc",
  })

  // Reset merge mode when navigating away
  useEffect(() => {
    return () => {
      setIsMergeMode(false)
      setSelectedCategories([])
    }
  }, [])

  // Handle adding a new category
  const handleAddCategory = async (category: Omit<Category, "id">) => {
    setIsSubmitting(true)
    try {
      await categoryService.addCategory(category)
      toast({
        title: "Success",
        description: "Category added successfully",
      })
      setIsAddDialogOpen(false)
      refreshCategories()
    } catch (error: any) {
      console.error("Error adding category:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add category",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle updating a category
  const handleUpdateCategory = async (category: Omit<Category, "id">) => {
    if (!editingCategory) return

    setIsSubmitting(true)
    try {
      await categoryService.updateCategory(editingCategory.id, category)
      toast({
        title: "Success",
        description: "Category updated successfully",
      })
      setIsEditDialogOpen(false)
      setEditingCategory(null)
      refreshCategories()
    } catch (error: any) {
      console.error("Error updating category:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle deleting a category
  const handleDeleteCategory = async (id: string, replacementId?: string) => {
    setIsSubmitting(true)
    try {
      await categoryService.deleteCategory(id, replacementId)
      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      setDeletingCategory(null)
      refreshCategories()
    } catch (error: any) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle merging categories
  const handleMergeCategories = async (sourceId: string, targetId: string) => {
    setIsSubmitting(true)
    try {
      await categoryService.mergeCategories(sourceId, targetId)
      toast({
        title: "Success",
        description: "Categories merged successfully",
      })
      setIsMergeDialogOpen(false)
      setMergeSourceCategory(null)
      setIsMergeMode(false)
      setSelectedCategories([])
      refreshCategories()
    } catch (error: any) {
      console.error("Error merging categories:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to merge categories",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle toggling category selection in merge mode
  const handleToggleSelect = useCallback((category: Category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category.id)) {
        return prev.filter((id) => id !== category.id)
      } else {
        return [...prev, category.id]
      }
    })
  }, [])

  // Handle starting merge with selected categories
  const handleStartMergeSelected = useCallback(() => {
    if (selectedCategories.length !== 1) {
      toast({
        title: "Error",
        description: "Please select exactly one category as the source for merging",
        variant: "destructive",
      })
      return
    }

    const sourceCategory = categories.find((cat) => cat.id === selectedCategories[0])
    if (sourceCategory) {
      setMergeSourceCategory(sourceCategory)
      setIsMergeDialogOpen(true)
    }
  }, [selectedCategories, categories, toast])

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }))
  }

  // Filter and sort categories
  const filteredCategories = categories
    .filter((category) => {
      // Apply type filter
      if (typeFilter !== "all" && category.type !== typeFilter) {
        return false
      }

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          category.name.toLowerCase().includes(query) ||
          (category.description && category.description.toLowerCase().includes(query))
        )
      }

      return true
    })
    .sort((a, b) => {
      const { key, direction } = sortConfig
      let aValue: any = a[key as keyof typeof a]
      let bValue: any = b[key as keyof typeof b]

      // Handle special cases
      if (key === "spending" || key === "budget" || key === "usageCount") {
        aValue = aValue || 0
        bValue = bValue || 0
      } else if (key === "lastUsed") {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      }

      if (aValue < bValue) {
        return direction === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return direction === "asc" ? 1 : -1
      }
      return 0
    })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Category Management</h1>
          <p className="text-muted-foreground">Manage your expense, income, and savings categories</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isMergeMode ? (
            <>
              <Button variant="outline" onClick={() => setIsMergeMode(false)}>
                Cancel
              </Button>
              <Button onClick={handleStartMergeSelected} disabled={selectedCategories.length !== 1}>
                <GitMerge className="h-4 w-4 mr-2" />
                Merge Selected
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}>
                {viewMode === "grid" ? "Table View" : "Grid View"}
              </Button>
              <Button variant="outline" onClick={() => setIsMergeMode(true)}>
                <GitMerge className="h-4 w-4 mr-2" />
                Merge Mode
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-auto">
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
        </TabsList>

        {["all", "expense", "income", "savings"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">No categories found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery ? "Try adjusting your search or filters" : "Add a category to get started"}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories
                  .filter((cat) => tabValue === "all" || cat.type === tabValue)
                  .map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEdit={(cat) => {
                        setEditingCategory(cat)
                        setIsEditDialogOpen(true)
                      }}
                      onDelete={(cat) => {
                        setDeletingCategory(cat)
                        setIsDeleteDialogOpen(true)
                      }}
                    />
                  ))}
              </div>
            ) : (
              <CategoryTable
                categories={filteredCategories.filter((cat) => tabValue === "all" || cat.type === tabValue)}
                onEdit={(cat) => {
                  setEditingCategory(cat)
                  setIsEditDialogOpen(true)
                }}
                onDelete={(cat) => {
                  setDeletingCategory(cat)
                  setIsDeleteDialogOpen(true)
                }}
                isMergeMode={isMergeMode}
                selectedCategories={selectedCategories}
                onToggleSelect={handleToggleSelect}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <CategoryForm onSubmit={handleAddCategory} isSubmitting={isSubmitting} />
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm initialData={editingCategory} onSubmit={handleUpdateCategory} isSubmitting={isSubmitting} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
          </AlertDialogHeader>
          {deletingCategory && (
            <DeleteCategoryDialog
              category={deletingCategory}
              categories={categories}
              onDelete={handleDeleteCategory}
              isDeleting={isSubmitting}
            />
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Merge Categories Dialog */}
      <AlertDialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Merge Categories</AlertDialogTitle>
          </AlertDialogHeader>
          {mergeSourceCategory && (
            <MergeCategoriesForm
              sourceCategory={mergeSourceCategory}
              categories={categories}
              onSubmit={handleMergeCategories}
              isSubmitting={isSubmitting}
            />
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
