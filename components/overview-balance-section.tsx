"use client"

import { useState, useEffect } from "react"
import { BalanceTrendChart } from "@/components/balance-trend-chart"
import { expenseService } from "@/lib/expense-service"
import { useToast } from "@/hooks/use-toast"
import type { Expense } from "@/types/expense"

export function OverviewBalanceSection() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadExpenses = async () => {
      setIsLoading(true)
      try {
        const data = await expenseService.getExpenses()
        setExpenses(data)
      } catch (error) {
        console.error("Failed to load expenses:", error)
        toast({
          title: "Error",
          description: "Failed to load transactions. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadExpenses()

    // Set up event listener for expense updates
    const handleExpenseUpdated = () => {
      loadExpenses()
    }

    window.addEventListener("expense-updated", handleExpenseUpdated)
    window.addEventListener("expense-added", handleExpenseUpdated)
    window.addEventListener("expense-deleted", handleExpenseUpdated)

    return () => {
      window.removeEventListener("expense-updated", handleExpenseUpdated)
      window.removeEventListener("expense-added", handleExpenseUpdated)
      window.removeEventListener("expense-deleted", handleExpenseUpdated)
    }
  }, [toast])

  if (isLoading) {
    return <div className="w-full h-[400px] rounded-lg border bg-card animate-pulse"></div>
  }

  return <BalanceTrendChart expenses={expenses} />
}
