"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react"
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
import type { Expense } from "@/types/expense"

interface ExpenseTableProps {
  expenses: Expense[]
  onUpdate: (expense: Expense) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSort?: (key: keyof Expense) => void
  sortConfig?: {
    key: keyof Expense
    direction: "ascending" | "descending"
  } | null
  isLoading?: boolean
}

export function ExpenseTable({
  expenses,
  onUpdate,
  onDelete,
  onSort,
  sortConfig,
  isLoading = false,
}: ExpenseTableProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)

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

  const handleSort = (key: keyof Expense) => {
    if (onSort) {
      onSort(key)
    }
  }

  const getSortIcon = (key: keyof Expense) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null
    }
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
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

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-muted/30 rounded-md animate-pulse w-full"></div>
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 w-full">
        <h3 className="text-lg font-medium">No transactions found</h3>
        <p className="text-muted-foreground mt-1">Try adjusting your filters or add a new transaction</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="rounded-md border w-full overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort("date")}>
                <div className="flex items-center">Date {getSortIcon("date")}</div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                <div className="flex items-center">Type {getSortIcon("type")}</div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
                <div className="flex items-center">Category {getSortIcon("category")}</div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort("amount")}>
                <div className="flex items-center justify-end">Amount {getSortIcon("amount")}</div>
              </TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{format(new Date(expense.date), "dd MMM yyyy")}</TableCell>
                <TableCell>
                  <Badge variant={getTypeColor(expense.type)}>
                    {expense.type.charAt(0).toUpperCase() + expense.type.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                <TableCell className="max-w-[200px] truncate">{expense.notes}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEditClick(expense)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDeleteClick(expense.id)}>
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
