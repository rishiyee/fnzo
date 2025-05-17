"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { Edit, Trash2, ChevronRight, ChevronLeft, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExpenseForm } from "@/components/expense-form"
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
import { HiddenValue } from "@/components/hidden-value"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Expense } from "@/types/expense"

// Define sort types
type SortColumn = "date" | "type" | "category" | "notes" | "amount"
type SortDirection = "asc" | "desc"

interface MinimalTransactionTableProps {
  expenses: Expense[]
  onUpdate: (expense: Expense) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isLoading?: boolean
  limit?: number
  showViewAll?: boolean
  onViewAll?: () => void
  className?: string
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  itemsPerPage?: number
  onItemsPerPageChange?: (itemsPerPage: number) => void
  showPagination?: boolean
}

export function MinimalTransactionTable({
  expenses,
  onUpdate,
  onDelete,
  isLoading = false,
  limit,
  showViewAll = false,
  onViewAll,
  className = "",
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  showPagination = false,
}: MinimalTransactionTableProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setExpenseToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (expenseToDelete) {
      await onDelete(expenseToDelete)
      setDeleteConfirmOpen(false)
      setExpenseToDelete(null)
    }
  }

  // Handle column header click for sorting
  const handleSortClick = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new column and default direction
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Get sort icon based on current sort state
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/70" />
    }

    return sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
  }

  // Sort the expenses
  const sortedExpenses = useMemo(() => {
    const sorted = [...expenses]

    sorted.sort((a, b) => {
      let comparison = 0

      switch (sortColumn) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case "type":
          comparison = a.type.localeCompare(b.type)
          break
        case "category":
          comparison = a.category.localeCompare(b.category)
          break
        case "notes":
          comparison = (a.notes || "").localeCompare(b.notes || "")
          break
        case "amount":
          comparison = a.amount - b.amount
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return sorted
  }, [expenses, sortColumn, sortDirection])

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Only limit if the limit prop is provided and pagination is not enabled
  const displayedExpenses = limit && !showPagination ? sortedExpenses.slice(0, limit) : sortedExpenses

  if (isLoading) {
    return (
      <div className={`w-full space-y-3 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted/30 rounded-md animate-pulse w-full"></div>
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className={`text-center py-6 w-full ${className}`}>
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    )
  }

  // Pagination controls
  const PaginationControls = () => {
    if (!showPagination) return null

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Items per page</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange && onItemsPerPageChange(Number.parseInt(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={itemsPerPage.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="500">500</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            disabled={currentPage >= (totalPages || 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Create sortable header
  const SortableHeader = ({ column, children }: { column: SortColumn; children: React.ReactNode }) => (
    <TableHead
      className={`cursor-pointer hover:bg-muted/50 ${column === "amount" ? "text-right" : ""}`}
      onClick={() => handleSortClick(column)}
    >
      <div className="flex items-center">
        <span>{children}</span>
        {getSortIcon(column)}
      </div>
    </TableHead>
  )

  return (
    <div className={className}>
      <div className="w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader column="date">Date</SortableHeader>
              <SortableHeader column="type">Type</SortableHeader>
              <SortableHeader column="category">Category</SortableHeader>
              <SortableHeader column="notes">Notes</SortableHeader>
              <SortableHeader column="amount">Amount</SortableHeader>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{format(new Date(expense.date), "dd MMM")}</TableCell>
                <TableCell>
                  <Badge variant={getTypeColor(expense.type)} className="capitalize">
                    {expense.type}
                  </Badge>
                </TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {expense.notes || <span className="text-muted-foreground text-xs italic">No notes</span>}
                </TableCell>
                <TableCell className="text-right font-medium">
                  <HiddenValue value={formatCurrency(expense.amount)} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(expense)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(expense.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showViewAll && onViewAll && !showPagination && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" size="sm" onClick={onViewAll} className="w-full max-w-xs">
            View All Transactions
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {showPagination && <PaginationControls />}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              initialData={editingExpense}
              onSubmit={async (data) => {
                await onUpdate({ ...editingExpense, ...data })
                setIsEditDialogOpen(false)
              }}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
