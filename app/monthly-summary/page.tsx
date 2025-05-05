"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AppLayout } from "@/components/layout/app-layout"
import { MonthSelector } from "@/components/month-selector"
import { MonthlyMetrics } from "@/components/monthly-metrics"
import { CategoryBreakdown } from "@/components/category-breakdown"
import { MonthlyComparison } from "@/components/monthly-comparison"
import { TopTransactions } from "@/components/top-transactions"
import { expenseService } from "@/lib/expense-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import type { Expense } from "@/types/expense"
import { startOfMonth, isSameMonth, subMonths } from "date-fns"

export default function MonthlySummaryPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()))

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [isLoading, user, router])

  // Load expenses
  useEffect(() => {
    const loadExpenses = async () => {
      if (!user) return

      setIsLoadingExpenses(true)
      setError(null)

      try {
        // Verify authentication first
        const isAuthenticated = await expenseService.verifyAuthentication()
        if (!isAuthenticated) {
          setError("Authentication failed. Please sign in again.")
          return
        }

        const data = await expenseService.getExpenses()
        setExpenses(data)
      } catch (error: any) {
        console.error("Failed to load expenses:", error)

        // Check if it's an auth error
        if (
          error.message?.includes("auth") ||
          error.message?.includes("JWT") ||
          error.message?.includes("token") ||
          error.code === "PGRST301"
        ) {
          setError("Authentication error. Please sign in again.")
        } else {
          setError(error?.message || "Failed to load expenses. Please try again.")
        }
      } finally {
        setIsLoadingExpenses(false)
      }
    }

    if (user) {
      loadExpenses()
    }
  }, [user])

  // Filter expenses for the selected month
  const monthlyExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      return isSameMonth(expenseDate, selectedMonth)
    })
  }, [expenses, selectedMonth])

  // Get previous month's expenses for comparison
  const previousMonthExpenses = useMemo(() => {
    const previousMonth = subMonths(selectedMonth, 1)
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      return isSameMonth(expenseDate, previousMonth)
    })
  }, [expenses, selectedMonth])

  const handleRefresh = async () => {
    setIsLoadingExpenses(true)
    setError(null)

    try {
      const data = await expenseService.getExpenses()
      setExpenses(data)
    } catch (error: any) {
      console.error("Failed to refresh expenses:", error)
      setError(error?.message || "Failed to refresh expenses. Please try again.")
    } finally {
      setIsLoadingExpenses(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in the useEffect
  }

  return (
    <AppLayout>
      <div className="p-6 w-full">
        <div className="mb-6 w-full">
          <h1 className="text-2xl font-bold">Monthly Summary</h1>
          <p className="text-muted-foreground">Detailed financial overview for the selected month</p>
        </div>

        <div className="w-full">
          <MonthSelector
            selectedMonth={selectedMonth}
            onChange={setSelectedMonth}
            maxDate={new Date()} // Don't allow selecting future months
          />
        </div>

        {error ? (
          <div className="space-y-4 mb-6 w-full">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button onClick={handleRefresh} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        ) : isLoadingExpenses ? (
          <div className="space-y-6 w-full">
            <div className="h-24 bg-muted/30 rounded-lg animate-pulse w-full"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="h-80 bg-muted/30 rounded-lg animate-pulse"></div>
              <div className="h-80 bg-muted/30 rounded-lg animate-pulse"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 w-full">
            <MonthlyMetrics
              expenses={monthlyExpenses}
              selectedMonth={selectedMonth}
              previousMonthExpenses={previousMonthExpenses}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
              <CategoryBreakdown expenses={monthlyExpenses} type="expense" />
              <MonthlyComparison
                expenses={monthlyExpenses}
                selectedMonth={selectedMonth}
                previousMonthExpenses={previousMonthExpenses}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <TopTransactions expenses={monthlyExpenses} type="expense" limit={5} />
              <TopTransactions expenses={monthlyExpenses} type="income" limit={5} />
              <TopTransactions expenses={monthlyExpenses} type="savings" limit={5} />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
