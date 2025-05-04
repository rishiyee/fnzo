"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { ExpenseTracker } from "@/components/expense-tracker"

export default function TransactionsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <ExpenseTracker />
      </div>
    </AppLayout>
  )
}
