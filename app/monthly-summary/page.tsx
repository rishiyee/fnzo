"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { ExpenseSummary } from "@/components/expense-summary"

export default function MonthlySummaryPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <ExpenseSummary />
      </div>
    </AppLayout>
  )
}
