"use client"

import { useState, useEffect } from "react"
import { MonthlyAreaChart } from "@/components/monthly-area-chart"
import { expenseService } from "@/lib/expense-service"
import { UnifiedFilter } from "@/components/unified-filter"
import { FilterProvider } from "@/contexts/filter-context"
import { UnifiedFilterSkeleton } from "@/components/skeleton/unified-filter-skeleton"
import { ExpenseGraphSkeleton } from "@/components/skeleton/expense-graph-skeleton"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function FinancialTrendsPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth")
      return
    }

    if (user) {
      const fetchExpenses = async () => {
        try {
          setIsLoading(true)
          const data = await expenseService.getExpenses()
          setExpenses(data)
        } catch (error) {
          console.error("Error fetching expenses:", error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchExpenses()
    }
  }, [user, authLoading, router])

  if (authLoading || !user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Financial Trends</h1>
        <p className="text-muted-foreground mt-2">Visualize your income, expenses, and savings over time</p>
      </div>

      <FilterProvider>
        <div className="grid gap-6">
          {isLoading ? <UnifiedFilterSkeleton /> : <UnifiedFilter />}

          <div className="rounded-lg border bg-card p-6">
            {isLoading ? <ExpenseGraphSkeleton /> : <MonthlyAreaChart expenses={expenses} />}
          </div>
        </div>
      </FilterProvider>
    </div>
  )
}
