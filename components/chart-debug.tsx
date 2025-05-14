"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { expenseService } from "@/lib/expense-service"
import type { Expense } from "@/types/expense"

export function ChartDebug() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        setIsLoading(true)
        const data = await expenseService.getExpenses()
        setExpenses(data)
        setError(null)
      } catch (err) {
        console.error("Debug error:", err)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setIsLoading(false)
      }
    }

    loadExpenses()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Chart Debug Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Status:</h3>
            <p>{isLoading ? "Loading..." : "Loaded"}</p>
          </div>
          <div>
            <h3 className="font-medium">Expenses Count:</h3>
            <p>{expenses.length}</p>
          </div>
          {error && (
            <div>
              <h3 className="font-medium text-red-500">Error:</h3>
              <p className="text-red-500">{error}</p>
            </div>
          )}
          <div>
            <h3 className="font-medium">Sample Data:</h3>
            <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(expenses.slice(0, 2), null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
