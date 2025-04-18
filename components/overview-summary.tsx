"use client"

import { useState, useEffect } from "react"
import { ExpenseSummary } from "./expense-summary"
import { ExpenseSummarySkeleton } from "./skeleton/expense-summary-skeleton"
import { UnifiedFilter } from "./unified-filter"
import type { Expense } from "@/types/expense"
import { expenseService } from "@/lib/expense-service"
import { useFilter } from "@/contexts/filter-context"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface OverviewSummaryProps {
  onExpensesUpdated?: (expenses: Expense[]) => void
  onAddTransaction?: (callback: (expense: Expense) => void) => void
}

export default function OverviewSummary({ onExpensesUpdated, onAddTransaction }: OverviewSummaryProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { applyFilters } = useFilter()

  // Load expenses from Supabase
  const loadExpenses = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Verify authentication first
      const isAuthenticated = await expenseService.verifyAuthentication()
      if (!isAuthenticated) {
        setError("Authentication failed. Please sign in again.")
        return
      }

      console.log("Loading expenses...")
      const data = await expenseService.getExpenses()
      console.log("Expenses loaded:", data.length)
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

      toast({
        title: "Error",
        description: error?.message || "Failed to load expenses. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Effect to notify parent when expenses change
  useEffect(() => {
    if (onExpensesUpdated && !isLoading && expenses.length > 0) {
      onExpensesUpdated(expenses)
    }
  }, [expenses, isLoading, onExpensesUpdated])

  useEffect(() => {
    loadExpenses()
  }, [])

  // Get filtered expenses
  const filteredExpenses = applyFilters(expenses)

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={loadExpenses} className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <UnifiedFilter compact={true} />
      </div>

      {isLoading ? <ExpenseSummarySkeleton /> : <ExpenseSummary expenses={filteredExpenses} />}

      {/* Recent Transactions Card with Link */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl">Recent Transactions</CardTitle>
            <CardDescription>View and manage your recent financial activities</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/transactions" className="flex items-center gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="h-20 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No transactions found for the current filters.</div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                You have {filteredExpenses.length} {filteredExpenses.length === 1 ? "transaction" : "transactions"} that
                match your filters.
              </div>
              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/transactions">Go to Transactions</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
