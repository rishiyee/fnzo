"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Trash2, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Category } from "@/lib/category-service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CategoryTableProps {
  categories: (Category & { spending: number })[]
  onEdit: (category: Category & { spending: number }) => void
  onDelete: (category: Category & { spending: number }) => void
  isMergeMode?: boolean
  selectedCategories?: string[]
  onToggleSelect?: (category: Category & { spending: number }) => void
  sortConfig?: {
    key: string
    direction: "asc" | "desc"
  }
  onSort?: (key: string) => void
}

export function CategoryTable({
  categories,
  onEdit,
  onDelete,
  isMergeMode = false,
  selectedCategories = [],
  onToggleSelect,
  sortConfig,
  onSort,
}: CategoryTableProps) {
  const [categoryToDelete, setCategoryToDelete] = useState<(Category & { spending: number }) | null>(null)

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate progress percentage
  const calculateProgress = (spending: number, budget?: number) => {
    if (!budget || budget <= 0) return 0
    const percentage = (spending / budget) * 100
    return Math.min(percentage, 100) // Cap at 100%
  }

  // Get type badge variant
  const getTypeVariant = (type: string) => {
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

  // Get progress color based on percentage
  const getProgressColor = (spending: number, budget?: number) => {
    if (!budget) return "bg-primary"
    const progress = calculateProgress(spending, budget)
    if (progress >= 90) return "bg-red-500"
    if (progress >= 75) return "bg-amber-500"
    return "bg-primary"
  }

  // Handle sort click
  const handleSortClick = (key: string) => {
    if (onSort) {
      onSort(key)
    }
  }

  // Render sort indicator
  const renderSortIndicator = (key: string) => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === "asc" ? " ↑" : " ↓"
    }
    return null
  }

  // Add a function to determine if a category is over budget
  const isOverBudget = (spending: number, budget?: number) => {
    return budget !== undefined && spending > budget
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {isMergeMode && <TableHead className="w-[50px]">Select</TableHead>}
              <TableHead className="cursor-pointer" onClick={() => handleSortClick("name")}>
                Name{renderSortIndicator("name")}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSortClick("type")}>
                Type{renderSortIndicator("type")}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSortClick("spending")}>
                Spending{renderSortIndicator("spending")}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSortClick("budget")}>
                Budget{renderSortIndicator("budget")}
              </TableHead>
              <TableHead>Usage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => {
              const isOverBudgetValue = category.budget && category.spending > category.budget
              const isSelected = selectedCategories.includes(category.id)
              const selectionOrder = selectedCategories.indexOf(category.id) + 1

              return (
                <TableRow key={category.id} className={isMergeMode && isSelected ? "bg-primary/5" : ""}>
                  {isMergeMode && (
                    <TableCell>
                      <div className="relative">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleSelect && onToggleSelect(category)}
                          disabled={category.isDefault}
                        />
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                            {selectionOrder}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color || "#ccc" }}></div>
                      <span className="font-medium">{category.name}</span>
                      {category.isDefault && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs ml-1">
                                Default
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>This is a default system category</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                        {category.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeVariant(category.type)}>
                      {category.type.charAt(0).toUpperCase() + category.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(category.spending)}</TableCell>
                  <TableCell>{category.budget ? formatCurrency(category.budget) : "—"}</TableCell>
                  <TableCell>
                    {category.budget ? (
                      <div className="w-full max-w-[100px]">
                        <Progress
                          value={calculateProgress(category.spending, category.budget)}
                          className={getProgressColor(category.spending, category.budget)}
                        />
                        <div className="flex justify-between text-xs mt-1">
                          <span
                            className={
                              isOverBudget(category.spending, category.budget)
                                ? "text-red-500 font-medium flex items-center"
                                : "text-muted-foreground"
                            }
                          >
                            {isOverBudget(category.spending, category.budget) && (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            {isOverBudget(category.spending, category.budget)
                              ? "Over"
                              : `${calculateProgress(category.spending, category.budget).toFixed(0)}%`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No budget</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!isMergeMode && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => onEdit(category)} className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCategoryToDelete(category)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            disabled={category.isDefault}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete?.spending > 0 ? (
                <>
                  <p className="mb-2">
                    This category has <strong>{formatCurrency(categoryToDelete.spending)}</strong> in transactions.
                    Deleting it will require reassigning these transactions to another category.
                  </p>
                  <div className="bg-muted p-3 rounded-md mt-2 mb-2">
                    <p className="font-medium">Category details:</p>
                    <p>
                      <strong>Name:</strong> {categoryToDelete.name}
                    </p>
                    {categoryToDelete.description && (
                      <p>
                        <strong>Description:</strong> {categoryToDelete.description}
                      </p>
                    )}
                    <p>
                      <strong>Type:</strong> {categoryToDelete.type}
                    </p>
                    <p>
                      <strong>Budget:</strong>{" "}
                      {categoryToDelete.budget ? formatCurrency(categoryToDelete.budget) : "None"}
                    </p>
                  </div>
                  <p className="text-amber-500 font-medium">
                    You will need to select a replacement category on the next screen.
                  </p>
                </>
              ) : (
                <>
                  <p className="mb-2">
                    Are you sure you want to delete <strong>{categoryToDelete?.name}</strong>? This action cannot be
                    undone.
                  </p>
                  {categoryToDelete?.description && (
                    <div className="bg-muted p-3 rounded-md mt-2 mb-2">
                      <p className="font-medium">Description:</p>
                      <p>{categoryToDelete.description}</p>
                    </div>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {categoryToDelete?.spending > 0 ? (
              <AlertDialogAction
                onClick={() => {
                  if (categoryToDelete) {
                    onDelete(categoryToDelete)
                    setCategoryToDelete(null)
                  }
                }}
                className="bg-amber-500 text-white hover:bg-amber-600"
              >
                Continue to Select Replacement
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                onClick={() => {
                  if (categoryToDelete) {
                    onDelete(categoryToDelete)
                    setCategoryToDelete(null)
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
