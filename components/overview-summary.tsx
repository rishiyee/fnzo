"use client"

import { CardDescription } from "@/components/ui/card"

import { useMemo } from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MinimalTransactionTable } from "@/components/minimal-transaction-table"
import { TransactionModal } from "@/components/transaction-modal"
import { expenseService } from "@/lib/expense-service"
import { useToast } from "@/hooks/use-toast"
import { UnifiedFilter } from "@/components/unified-filter"
import { FilterProvider, useFilter } from "@/contexts/filter-context"
import type { Expense } from "@/types/expense"

interface OverviewSummaryProps {
  onExpensesUpdated?: (expenses: Expense[]) => void
  onAddTransaction?: (callback: (expense: Expense) => void) => void
}

function TransactionContent({ onExpensesUpdated }: { onExpensesUpdated?: (expenses: Expense[]) => void }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(500) // Default to 500
  const { toast } = useToast()
  const { applyFilters } = useFilter()

  // Load expenses only once when the component mounts
  useEffect(() => {
    let isMounted = true

    const fetchExpenses = async () => {
      try {
        const data = await expenseService.getExpenses()
        if (isMounted) {
          setExpenses(data)
          if (onExpensesUpdated) {
            onExpensesUpdated(data)
          }
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

    fetchExpenses()

    return () => {
      isMounted = false
    }
  }, [onExpensesUpdated, toast])

  // Use useCallback for these handlers to prevent them from being recreated on every render
  const handleTransactionAdded = useCallback(
    (expense: Expense) => {
      setExpenses((prev) => [expense, ...prev])
      if (onExpensesUpdated) {
        onExpensesUpdated((prev) => [expense, ...prev])
      }
    },
    [onExpensesUpdated],
  )

  const handleTransactionUpdated = useCallback(
    async (updatedExpense: Expense) => {
      try {
        const expense = await expenseService.updateExpense(updatedExpense)
        setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)))
        if (onExpensesUpdated) {
          onExpensesUpdated((prev) => prev.map((e) => (e.id === expense.id ? expense : e)))
        }
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
    [onExpensesUpdated, toast],
  )

  const handleTransactionDeleted = useCallback(
    async (id: string) => {
      try {
        await expenseService.deleteExpense(id)
        setExpenses((prev) => prev.filter((expense) => expense.id !== id))
        if (onExpensesUpdated) {
          onExpensesUpdated((prev) => prev.filter((expense) => expense.id !== id))
        }
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
    [onExpensesUpdated, toast],
  )

  // Apply filters to expenses
  const filteredExpenses = useMemo(() => {
    return applyFilters(expenses)
  }, [expenses, applyFilters])

  // Calculate pagination
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)
  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredExpenses.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredExpenses, currentPage, itemsPerPage])

  return (
    <>
      <div className="mb-4">
        <UnifiedFilter compact />
      </div>

      <MinimalTransactionTable
        expenses={paginatedExpenses}
        isLoading={isLoading}
        onUpdate={handleTransactionUpdated}
        onDelete={handleTransactionDeleted}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        showPagination={true}
      />

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={handleTransactionAdded}
      />
    </>
  )
}

export default function OverviewSummary({ onExpensesUpdated, onAddTransaction }: OverviewSummaryProps) {
  return (
    <FilterProvider>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your financial activities</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionContent onExpensesUpdated={onExpensesUpdated} />
        </CardContent>
      </Card>
    </FilterProvider>
  )
}
