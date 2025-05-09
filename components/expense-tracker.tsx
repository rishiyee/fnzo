"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Badge } from "@/components/ui/badge"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseTableSkeleton } from "@/components/skeleton/expense-table-skeleton"
import type { Expense } from "@/types/expense"

interface ExpenseTrackerProps {
  expenses?: Expense[]
  isLoading?: boolean
  onUpdate?: (expense: Expense) => void
  onDelete?: (id: string) => void
  onAddTransaction?: ((callback: (expense: Expense) => void) => void) | null
  limit?: number
}

export function ExpenseTracker({
  expenses = [],
  isLoading = false,
  onUpdate,
  onDelete,
  onAddTransaction,
  limit,
}: ExpenseTrackerProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)

  // Register the callback for adding transactions
  useEffect(() => {
    if (onAddTransaction) {
      onAddTransaction((expense: Expense) => {
        // This callback will be called when a transaction is added
        console.log("Transaction added:", expense)
      })
    }
  }, [onAddTransaction])

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setExpenseToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (expenseToDelete && onDelete) {
      onDelete(expenseToDelete)
      setDeleteConfirmOpen(false)
      setExpenseToDelete(null)
    }
  }

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

  // Limit the number of expenses to display
  const displayedExpenses = limit ? expenses.slice(0, limit) : expenses

  if (isLoading) {
    return <ExpenseTableSkeleton />
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center py-12 w-full">
        <h3 className="text-lg font-medium">No transactions found</h3>
        <p className="text-muted-foreground mt-1">Add a transaction to get started</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="divide-y w-full">
        {displayedExpenses.map((expense) => (
          <div key={expense.id} className="flex items-center justify-between py-4 px-6 w-full">
            <div className="flex items-start gap-3 w-full">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  expense.type === "expense"
                    ? "bg-red-100 text-red-600"
                    : expense.type === "income"
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600"
                }`}
              >
                {expense.type === "expense" ? "-" : "+"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between w-full">
                  <h4 className="font-medium truncate">{expense.category}</h4>
                  <span className="font-bold">{formatCurrency(expense.amount)}</span>
                </div>
                <div className="flex items-center justify-between mt-1 w-full">
                  <div className="flex items-center gap-2">
                    <Badge variant={getTypeColor(expense.type)}>
                      {expense.type.charAt(0).toUpperCase() + expense.type.slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(expense.date), "dd MMM yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {onUpdate && (
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(expense)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(expense.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
                {expense.notes && <p className="text-sm text-muted-foreground mt-1 truncate">{expense.notes}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      {onUpdate && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
            </DialogHeader>
            {editingExpense && (
              <ExpenseForm
                initialData={editingExpense}
                onSubmit={async (data) => {
                  onUpdate({ ...editingExpense, ...data })
                  setIsEditDialogOpen(false)
                }}
                onCancel={() => setIsEditDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {onDelete && (
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
      )}
    </div>
  )
}
