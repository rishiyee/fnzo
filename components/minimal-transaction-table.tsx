"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Edit, Trash2, ChevronRight } from "lucide-react"
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
import { Card, CardContent } from "@/components/ui/card"
import type { Expense } from "@/types/expense"

interface MinimalTransactionTableProps {
  expenses: Expense[]
  onUpdate: (expense: Expense) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isLoading?: boolean
  limit?: number
  showViewAll?: boolean
  onViewAll?: () => void
}

export function MinimalTransactionTable({
  expenses,
  onUpdate,
  onDelete,
  isLoading = false,
  limit,
  showViewAll = false,
  onViewAll,
}: MinimalTransactionTableProps) {
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

  const limitedExpenses = limit ? expenses.slice(0, limit) : expenses

  if (isLoading) {
    return (
      <div className="w-full space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted/30 rounded-md animate-pulse w-full"></div>
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-6 w-full">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    )
  }

  // Desktop view - Table
  const DesktopTable = () => (
    <div className="hidden md:block w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {limitedExpenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">{format(new Date(expense.date), "dd MMM")}</TableCell>
              <TableCell>
                <Badge variant={getTypeColor(expense.type)} className="capitalize">
                  {expense.type}
                </Badge>
              </TableCell>
              <TableCell>{expense.category}</TableCell>
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
      {showViewAll && onViewAll && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" size="sm" onClick={onViewAll} className="w-full max-w-xs">
            View All Transactions
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )

  // Mobile view - Cards
  const MobileCards = () => (
    <div className="md:hidden space-y-3">
      {limitedExpenses.map((expense) => (
        <Card key={expense.id} className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Badge variant={getTypeColor(expense.type)} className="capitalize">
                    {expense.type}
                  </Badge>
                  <span className="text-sm font-medium">{expense.category}</span>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {format(new Date(expense.date), "dd MMM yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  <HiddenValue value={formatCurrency(expense.amount)} />
                </span>
                <div className="flex">
                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(expense)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(expense.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {showViewAll && onViewAll && (
        <Button variant="outline" size="sm" onClick={onViewAll} className="w-full mt-2">
          View All Transactions
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  )

  return (
    <>
      <DesktopTable />
      <MobileCards />

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
    </>
  )
}
