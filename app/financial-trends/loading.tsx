import { UnifiedFilterSkeleton } from "@/components/skeleton/unified-filter-skeleton"
import { ExpenseGraphSkeleton } from "@/components/skeleton/expense-graph-skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Financial Trends</h1>
        <p className="text-muted-foreground mt-2">Visualize your income, expenses, and savings over time</p>
      </div>

      <div className="grid gap-6">
        <UnifiedFilterSkeleton />

        <div className="rounded-lg border bg-card p-6">
          <ExpenseGraphSkeleton />
        </div>
      </div>
    </div>
  )
}
