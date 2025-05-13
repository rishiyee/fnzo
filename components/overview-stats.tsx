"use client"

import { useState, useEffect, useCallback } from "react"
import { ExpenseSummary } from "@/components/expense-summary"
import OverviewSummary from "@/components/overview-summary"
import { expenseService } from "@/lib/expense-service"
import { useToast } from "@/hooks/use-toast"
import type { Expense } from "@/types/expense"
import { BalanceVisualization } from "@/components/balance-visualization"

export function OverviewStats() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const loadExpenses = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await expenseService.getExpenses()
      setExpenses(data)
    } catch (error) {
      console.error("Failed to load expenses:", error)
      toast({
        title: "Error",
        description: "Failed to load expenses. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const data = await expenseService.getExpenses()
        if (isMounted) {
          setExpenses(data)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Failed to load expenses:", error)
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load expenses. Please try again.",
            variant: "destructive",
          })
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [toast])

  const handleExpensesUpdated = useCallback((updatedExpenses: Expense[]) => {
    setExpenses(updatedExpenses)
  }, [])

  return (
    <div className="space-y-6">
      <ExpenseSummary expenses={expenses} />

      {/* Add the new Balance Visualization component */}
      <BalanceVisualization expenses={expenses} />

      <OverviewSummary onExpensesUpdated={handleExpensesUpdated} />
    </div>
  )
}
