"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { OverviewStats } from "@/components/overview-stats"
import { OverviewBalanceSection } from "@/components/overview-balance-section"
import { ChartDebug } from "@/components/chart-debug"
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
import { MinimalTransactionTable } from "@/components/minimal-transaction-table"
import { TransactionModal } from "@/components/transaction-modal"
import { BulkTransactionModal } from "@/components/bulk-transaction-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { currentTab, setTab } = useTabParams()
  const [isClient, setIsClient] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const { toast } = useToast()

  // Set isClient to true once on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Redirect to auth page if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [user, isLoading, router])

  // Load expenses when the component mounts or user changes
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
  const updateExpense = useCallback(
    async (updatedExpense: Expense) => {
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
    },
    [toast],
  )

  // Handle expense deletion
  const deleteExpense = useCallback(
    async (id: string) => {
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
    },
    [toast],
  )

  // Handle transaction added
  const handleTransactionAdded = useCallback((expense: Expense) => {
    setExpenses((prev) => [expense, ...prev])
  }, [])

  // Handle multiple transactions added
  const handleTransactionsAdded = useCallback((newExpenses: Expense[]) => {
    setExpenses((prev) => [...newExpenses, ...prev])
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
        <LimitedWidthTabsContent value="overview" className="space-y-6">
          <OverviewStats />
          <OverviewBalanceSection />
          {/* Temporary debug component */}
          {process.env.NODE_ENV !== "production" && <ChartDebug />}
        </LimitedWidthTabsContent>
        <LimitedWidthTabsContent value="transactions">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">All Transactions</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(true)} size="sm">
                  Add Transaction
                </Button>
                <Button onClick={() => setIsBulkModalOpen(true)} size="sm">
                  <Plus className="mr-1 h-4 w-4" /> Add Multiple
                </Button>
              </div>
            </div>
            <div className="rounded-lg border bg-card">
              <div className="p-6">
                <MinimalTransactionTable
                  expenses={expenses}
                  onUpdate={updateExpense}
                  onDelete={deleteExpense}
                  isLoading={isLoadingExpenses}
                  showViewAll={false}
                />
              </div>
            </div>
          </div>
        </LimitedWidthTabsContent>
      </LimitedWidthTabs>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={handleTransactionAdded}
      />

      <BulkTransactionModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onTransactionsAdded={handleTransactionsAdded}
      />
    </div>
  )
}
