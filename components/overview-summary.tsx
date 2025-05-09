"use client"

import { useState, useEffect, useCallback } from "react"
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

  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  const handleTransactionAdded = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev])
    if (onExpensesUpdated) {
      onExpensesUpdated([expense, ...expenses])
    }
  }

  const handleTransactionUpdated = async (updatedExpense: Expense) => {
    try {
      const expense = await expenseService.updateExpense(updatedExpense)
      const updatedExpenses = expenses.map((e) => (e.id === expense.id ? expense : e))
      setExpenses(updatedExpenses)
      if (onExpensesUpdated) {
        onExpensesUpdated(updatedExpenses)
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
  }

  const handleTransactionDeleted = async (id: string) => {
    try {
      await expenseService.deleteExpense(id)
      const updatedExpenses = expenses.filter((expense) => expense.id !== id)
      setExpenses(updatedExpenses)
      if (onExpensesUpdated) {
        onExpensesUpdated(updatedExpenses)
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
  }

  const handleViewAll = () => {
    router.push("/?tab=transactions")
  }

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
