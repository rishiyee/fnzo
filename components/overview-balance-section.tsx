"use client"

import { useState, useEffect, useCallback } from "react"
import { BalanceTrendChart } from "@/components/balance-trend-chart"
import { expenseService } from "@/lib/expense-service"
import { useToast } from "@/hooks/use-toast"
import type { Expense } from "@/types/expense"

export function OverviewBalanceSection() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const loadExpenses = useCallback(async () => {
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
            description: "Failed to load transactions. Please try again.",
            variant: "destructive",
          })
          setIsLoading(false)
        }
      }
    }

    fetchData()

    // Set up event listener for expense updates
    const handleExpenseUpdated = () => {
      if (isMounted) {
        loadExpenses()
      }
    }

    window.addEventListener("expense-updated", handleExpenseUpdated)
    window.addEventListener("expense-added", handleExpenseUpdated)
    window.addEventListener("expense-deleted", handleExpenseUpdated)

    return () => {
      isMounted = false
      window.removeEventListener("expense-updated", handleExpenseUpdated)
      window.removeEventListener("expense-added", handleExpenseUpdated)
      window.removeEventListener("expense-deleted", handleExpenseUpdated)
    }
  }, [toast, loadExpenses])

  // Debug output to console
  useEffect(() => {
    console.log("OverviewBalanceSection - Expenses loaded:", expenses.length)
  }, [expenses])

  return <BalanceTrendChart expenses={expenses} isLoading={isLoading} />
}
