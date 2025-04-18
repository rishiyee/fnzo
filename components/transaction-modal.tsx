"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExpenseForm } from "@/components/expense-form"
import { useToast } from "@/hooks/use-toast"
import { expenseService } from "@/lib/expense-service"
import type { Expense } from "@/types/expense"
import { useState } from "react"

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onTransactionAdded: (expense: Expense) => void // Add this callback prop
}

export function TransactionModal({ isOpen, onClose, onTransactionAdded }: TransactionModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddTransaction = async (expense: Expense) => {
    setIsSubmitting(true)
    try {
      const addedExpense = await expenseService.addExpense(expense)

      toast({
        title: "Success",
        description: "Transaction added successfully",
      })

      // Call the callback with the newly added expense
      onTransactionAdded(addedExpense)

      onClose()
    } catch (error: any) {
      console.error("Failed to add transaction:", error)

      toast({
        title: "Error",
        description: error?.message || "Failed to add transaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl">Add New Transaction</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          <ExpenseForm onSubmit={handleAddTransaction} isSubmitting={isSubmitting} isModal={true} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
