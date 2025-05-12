"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { MinimalTransactionTable } from "@/components/minimal-transaction-table"
import { TransactionModal } from "@/components/transaction-modal"
import { expenseService } from "@/lib/expense-service"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { Expense } from "@/types/expense"

interface OverviewSummaryProps {
  onExpensesUpdated?: (expenses: Expense[]) => void
  onAddTransaction?: (callback: (expense: Expense) => void) => void
}

export default function OverviewSummary({ onExpensesUpdated, onAddTransaction }: OverviewSummaryProps) {
  const [activeTab, setActiveTab] = useState("recent")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  // Use useCallback to prevent this function from being recreated on every render
  const loadExpenses = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await expenseService.getExpenses()
      setExpenses(data)
      if (onExpensesUpdated) {
        onExpensesUpdated(data)
      }
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
  }, [onExpensesUpdated, toast])

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

  const handleViewAll = useCallback(() => {
    router.push("/?tab=transactions")
  }, [router])

  // Use useMemo for filtered expenses to prevent recalculation on every render
  const filteredExpenses = useMemo(() => {
    if (activeTab === "recent") return expenses
    return expenses.filter((expense) => expense.type === activeTab)
  }, [expenses, activeTab])

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your recent financial activities</CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="recent" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="expense">Expenses</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="recent" className="m-0 p-6">
            <MinimalTransactionTable
              expenses={expenses}
              isLoading={isLoading}
              onUpdate={handleTransactionUpdated}
              onDelete={handleTransactionDeleted}
              limit={5}
              showViewAll={true}
              onViewAll={handleViewAll}
            />
          </TabsContent>

          <TabsContent value="expense" className="m-0 p-6">
            <MinimalTransactionTable
              expenses={expenses.filter((expense) => expense.type === "expense")}
              isLoading={isLoading}
              onUpdate={handleTransactionUpdated}
              onDelete={handleTransactionDeleted}
              limit={5}
              showViewAll={true}
              onViewAll={handleViewAll}
            />
          </TabsContent>

          <TabsContent value="income" className="m-0 p-6">
            <MinimalTransactionTable
              expenses={expenses.filter((expense) => expense.type === "income")}
              isLoading={isLoading}
              onUpdate={handleTransactionUpdated}
              onDelete={handleTransactionDeleted}
              limit={5}
              showViewAll={true}
              onViewAll={handleViewAll}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={handleTransactionAdded}
      />
    </Card>
  )
}
