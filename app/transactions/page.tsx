"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useCategories } from "@/contexts/category-context"
import { AppLayout } from "@/components/layout/app-layout"
import { expenseService } from "@/lib/expense-service"
import { ExpenseTable } from "@/components/expense-table"
import { ExpenseTableSkeleton } from "@/components/skeleton/expense-table-skeleton"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TransactionModal } from "@/components/transaction-modal"
import { UnifiedFilter } from "@/components/unified-filter"
import { useFilter } from "@/contexts/filter-context"
import { useToast } from "@/hooks/use-toast"
import { CATEGORY_UPDATED_EVENT } from "@/lib/category-service"
import type { Expense } from "@/types/expense"

export default function TransactionsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Expense
    direction: "ascending" | "descending"
  } | null>({ key: "date", direction: "descending" })
  const { toast } = useToast()
  const { applyFilters } = useFilter()
  const { refreshCategories } = useCategories()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [isLoading, user, router])

  const loadExpenses = useCallback(async () => {
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
  }, [user, toast])

  useEffect(() => {
    if (user) {
      loadExpenses()
    }
  }, [user, loadExpenses])

  // Listen for category updates
  useEffect(() => {
    const handleCategoryUpdate = () => {
      loadExpenses()
    }

    if (typeof window !== "undefined") {
      window.addEventListener(CATEGORY_UPDATED_EVENT, handleCategoryUpdate)

      return () => {
        window.removeEventListener(CATEGORY_UPDATED_EVENT, handleCategoryUpdate)
      }
    }
  }, [loadExpenses])

  const handleSort = (key: keyof Expense) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

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

  const handleTransactionAdded = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev])
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
        <div className="flex justify-between items-center mb-6 w-full">
          <div>
            <h1 className="text-2xl font-bold">Recent Transactions</h1>
            <p className="text-muted-foreground">View and manage your recent financial activities</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>

        <div className="mb-6 w-full">
          <UnifiedFilter />
          <div className="mt-2 text-sm text-muted-foreground">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? "transaction" : "transactions"} found
          </div>
        </div>

        {isLoadingExpenses ? (
          <ExpenseTableSkeleton />
        ) : (
          <div className="w-full overflow-x-auto">
            <ExpenseTable
              expenses={sortedFilteredExpenses}
              onUpdate={updateExpense}
              onDelete={deleteExpense}
              onSort={handleSort}
              sortConfig={sortConfig}
              isLoading={false}
            />
          </div>
        )}

        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onTransactionAdded={handleTransactionAdded}
        />
      </div>
    </AppLayout>
  )
}
