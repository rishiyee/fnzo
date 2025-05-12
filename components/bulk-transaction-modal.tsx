"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BulkTransactionInput } from "@/components/bulk-transaction-input"
import type { Expense } from "@/types/expense"

interface BulkTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onTransactionsAdded: (expenses: Expense[]) => void
}

export function BulkTransactionModal({ isOpen, onClose, onTransactionsAdded }: BulkTransactionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl">Add Multiple Transactions</DialogTitle>
        </DialogHeader>
        <BulkTransactionInput onTransactionsAdded={onTransactionsAdded} onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}
