"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { OverviewStats } from "@/components/overview-stats"
import { ExpenseTracker } from "@/components/expense-tracker"
import { expenseService } from "@/lib/expense-service"
import { useToast } from "@/hooks/use-toast"
import type { Expense } from "@/types/expense"
import {
  LimitedWidthTabs,
  LimitedWidthTabsList,
  LimitedWidthTabsTrigger,
  LimitedWidthTabsContent,
} from "@/components/ui/limited-width-tabs"
import { useTabParams } from "@/hooks/use-tab-params"

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { currentTab, setTab } = useTabParams()
  const [isClient, setIsClient] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [user, isLoading, router])

  // Load expenses when the component mounts
  useEffect(() => {
    const loadExpenses = async () => {
      if (!user) return

      setIsLoadingExpenses(true)
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
        setIsLoadingExpenses(false)
      }
    }

    if (user) {
      loadExpenses()
    }
  }, [user, toast])

  // Handle expense updates
  const updateExpense = async (updatedExpense: Expense) => {
    try {
      const expense = await expenseService.updateExpense(updatedExpense)
      setExpenses((prev) => prev.map((item) => (item.id === expense.id ? expense : item)))

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

  // Handle expense deletion
  const deleteExpense = async (id: string) => {
    try {
      await expenseService.deleteExpense(id)
      setExpenses((prev) => prev.filter((expense) => expense.id !== id))

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

  // Handle transaction added
  const handleTransactionAdded = useCallback((expense: Expense) => {
    setExpenses((prev) => [expense, ...prev])
  }, [])

  if (isLoading || !user) {
    return null
  }

  if (!isClient) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <LimitedWidthTabs value={currentTab} onValueChange={setTab} className="w-full">
        <LimitedWidthTabsList className="w-full mb-6 grid grid-cols-2 max-w-md">
          <LimitedWidthTabsTrigger value="overview" maxWidth="none">
            Overview
          </LimitedWidthTabsTrigger>
          <LimitedWidthTabsTrigger value="transactions" maxWidth="none">
            Transactions
          </LimitedWidthTabsTrigger>
        </LimitedWidthTabsList>
        <LimitedWidthTabsContent value="overview">
          <OverviewStats />
          {/* Removed the OverviewSummary component that contained the Recent Transactions */}
        </LimitedWidthTabsContent>
        <LimitedWidthTabsContent value="transactions">
          <ExpenseTracker
            expenses={expenses}
            isLoading={isLoadingExpenses}
            onUpdate={updateExpense}
            onDelete={deleteExpense}
          />
        </LimitedWidthTabsContent>
      </LimitedWidthTabs>
    </div>
  )
}
