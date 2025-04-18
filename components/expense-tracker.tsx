"use client"

import { useState, useEffect, useCallback } from "react"
import { ExpenseTable } from "./expense-table"
import { ExpenseSummary } from "./expense-summary"
import { UnifiedFilter } from "./unified-filter"
import { CSVImportExport } from "./csv-import-export"
import { ExpenseSummarySkeleton } from "./skeleton/expense-summary-skeleton"
import { ExpenseTableSkeleton } from "./skeleton/expense-table-skeleton"
import type { Expense } from "@/types/expense"
import { expenseService } from "@/lib/expense-service"
import { useFilter } from "@/contexts/filter-context"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExpenseTrackerProps {
  onExpensesUpdated?: (expenses: Expense[]) => void
  onAddTransaction?: (callback: (expense: Expense) => void) => void
}

export default function ExpenseTracker({ onExpensesUpdated, onAddTransaction }: ExpenseTrackerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Expense
    direction: "ascending" | "descending"
  } | null>(null)
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

  // Callback for when a new transaction is added
  const handleTransactionAdded = useCallback((newExpense: Expense) => {
    console.log("New transaction added:", newExpense)

    // Add the new expense to the expenses array
    setExpenses((prevExpenses) => {
      return [newExpense, ...prevExpenses]
    })
  }, [])

  // Register the callback with the parent component
  useEffect(() => {
    if (onAddTransaction) {
      onAddTransaction(handleTransactionAdded)
    }
  }, [onAddTransaction, handleTransactionAdded])

  useEffect(() => {
    loadExpenses()
  }, [])

  const updateExpense = async (updatedExpense: Expense) => {
    try {
      const expense = await expenseService.updateExpense(updatedExpense)
      const updatedExpenses = expenses.map((item) => (item.id === expense.id ? expense : item))
      setExpenses(updatedExpenses)

      toast({
        title: "Success",
        description: "Transaction updated successfully",
      })
    } catch (error: any) {
      console.error("Failed to update transaction:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to update transaction. Please try again.",
        variant: "destructive",
      })
    }
  }

  const deleteExpense = async (id: string) => {
    try {
      await expenseService.deleteExpense(id)
      const updatedExpenses = expenses.filter((expense) => expense.id !== id)
      setExpenses(updatedExpenses)

      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      })
    } catch (error: any) {
      console.error("Failed to delete transaction:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to delete transaction. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSort = (key: keyof Expense) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Get filtered expenses
  const filteredExpenses = applyFilters(expenses)

  // Apply sorting to filtered expenses
  const sortedFilteredExpenses = [...filteredExpenses].sort((a, b) => {
    if (!sortConfig) return 0

    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? -1 : 1
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? 1 : -1
    }
    return 0
  })

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
      {isLoading ? <ExpenseSummarySkeleton /> : <ExpenseSummary expenses={filteredExpenses} />}

      <div className="space-y-4">
        <UnifiedFilter />

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? "transaction" : "transactions"} found
          </div>
        </div>
      </div>

      {isLoading ? (
        <ExpenseTableSkeleton />
      ) : (
        <ExpenseTable
          expenses={sortedFilteredExpenses}
          onUpdate={updateExpense}
          onDelete={deleteExpense}
          onSort={handleSort}
          sortConfig={sortConfig}
          isLoading={false}
        />
      )}

      {/* Hidden component to handle import dialog */}
      <div className="hidden">
        <CSVImportExport expenses={expenses} onImportComplete={loadExpenses} />
      </div>
    </div>
  )
}
