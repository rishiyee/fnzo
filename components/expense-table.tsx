"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Edit, Trash2, ArrowUpDown } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { ExpenseForm } from "./expense-form"
import { useCategories } from "@/contexts/category-context"
import { CATEGORY_UPDATED_EVENT } from "@/lib/category-service"
import type { Expense } from "@/types/expense"

type ExpenseTableProps = {
  expenses: Expense[]
  onUpdate: (expense: Expense) => void
  onDelete: (id: string) => void
  onSort: (key: keyof Expense) => void
  sortConfig: {
    key: keyof Expense
    direction: "ascending" | "descending"
  } | null
  isLoading?: boolean
}

export function ExpenseTable({ expenses, onUpdate, onDelete, onSort, sortConfig, isLoading }: ExpenseTableProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [displayedExpenses, setDisplayedExpenses] = useState<Expense[]>(expenses)
  const { refreshCategories } = useCategories()

  // Update displayed expenses when the expenses prop changes
  useEffect(() => {
    setDisplayedExpenses(expenses)
  }, [expenses])

  // Listen for category updates
  useEffect(() => {
    const handleCategoryUpdate = () => {
      refreshCategories()
    }

    if (typeof window !== "undefined") {
      window.addEventListener(CATEGORY_UPDATED_EVENT, handleCategoryUpdate)

      return () => {
        window.removeEventListener(CATEGORY_UPDATED_EVENT, handleCategoryUpdate)
      }
    }
  }, [refreshCategories])

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
  }

  const handleDelete = (id: string) => {
    setDeletingExpenseId(id)
  }

  const confirmDelete = async () => {
    if (deletingExpenseId) {
      setIsDeleting(true)
      try {
        await onDelete(deletingExpenseId)
      } finally {
        setIsDeleting(false)
        setDeletingExpenseId(null)
      }
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
    // Ensure amount is a number
    const value = typeof amount === "number" ? amount : 0
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getSortIcon = (key: keyof Expense) => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? "↑" : "↓"
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {displayedExpenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions found. Add a new transaction to get started.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <div className="inline-block min-w-full align-middle px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] cursor-pointer" onClick={() => onSort("date")}>
                      Date {getSortIcon("date")}
                      <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => onSort("type")}>
                      Type {getSortIcon("type")}
                      <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => onSort("category")}>
                      Category {getSortIcon("category")}
                      <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                    </TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => onSort("amount")}>
                      Amount {getSortIcon("amount")}
                      <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                    </TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.date), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant={getTypeColor(expense.type)}>
                          {expense.type.charAt(0).toUpperCase() + expense.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{expense.notes}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
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
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog
          open={editingExpense !== null}
          onOpenChange={(open) => {
            if (!open) setEditingExpense(null)
          }}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
            </DialogHeader>
            {editingExpense && (
              <ExpenseForm
                initialData={editingExpense}
                onSubmit={(updatedExpense) => {
                  onUpdate(updatedExpense)
                  setEditingExpense(null)
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog
          open={deletingExpenseId !== null}
          onOpenChange={(open) => {
            if (!open) setDeletingExpenseId(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the transaction from your records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
