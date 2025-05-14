"use client"

import { useEffect, useState } from "react"
import { BalanceTrendChart } from "@/components/balance-trend-chart"
import { expenseService } from "@/lib/expense-service"
import { useToast } from "@/hooks/use-toast"
import type { Expense } from "@/types/expense"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function ChartTestPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        setIsLoading(true)
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
  }, [toast])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button onClick={() => router.back()}>Back</Button>
      </div>
      <h1 className="text-2xl font-bold mb-6">Chart Test Page</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded-md bg-card">
          <h2 className="text-lg font-semibold mb-2">Data Status</h2>
          <p>Expenses loaded: {expenses.length}</p>
          <p>Loading state: {isLoading ? "Loading..." : "Complete"}</p>
        </div>
        <BalanceTrendChart expenses={expenses} isLoading={isLoading} />
      </div>
    </div>
  )
}
