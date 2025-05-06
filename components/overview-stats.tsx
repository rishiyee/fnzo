"use client"

import { useEffect, useState } from "react"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, PiggyBank } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { expenseService } from "@/lib/expense-service"
import { Skeleton } from "@/components/ui/skeleton"
import type { Expense } from "@/types/expense"
import { HiddenValue } from "@/components/hidden-value"

export function OverviewStats() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    netProfit: 0,
    expensesPercentage: 0,
    savingsPercentage: 0,
    balancePercentage: 0,
  })

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setIsLoading(true)
        const data = await expenseService.getExpenses()
        setExpenses(data)

        // Calculate stats
        let totalIncome = 0
        let totalExpenses = 0
        let totalSavings = 0

        data.forEach((expense) => {
          if (expense.type === "income") {
            totalIncome += expense.amount
          } else if (expense.type === "expense") {
            totalExpenses += expense.amount
          } else if (expense.type === "savings") {
            totalSavings += expense.amount
          }
        })

        const netProfit = totalIncome - totalExpenses - totalSavings

        // Calculate percentages
        const expensesPercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0
        const savingsPercentage = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0
        const balancePercentage = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

        setStats({
          totalIncome,
          totalExpenses,
          totalSavings,
          netProfit,
          expensesPercentage,
          savingsPercentage,
          balancePercentage,
        })
      } catch (error) {
        console.error("Failed to fetch expenses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchExpenses()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-24" />
              </CardTitle>
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-36 mb-2" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <HiddenValue value={formatCurrency(stats.totalIncome)} />
          </div>
          <p className="text-xs text-muted-foreground">All income transactions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <HiddenValue value={formatCurrency(stats.totalExpenses)} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">All expense transactions</p>
            <p className="text-xs font-medium text-red-500">{stats.expensesPercentage.toFixed(1)}% of income</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
          <PiggyBank className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <HiddenValue value={formatCurrency(stats.totalSavings)} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">All savings transactions</p>
            <p className="text-xs font-medium text-blue-500">{stats.savingsPercentage.toFixed(1)}% of income</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          <DollarSign className={`h-4 w-4 ${stats.netProfit >= 0 ? "text-green-500" : "text-red-500"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            <HiddenValue value={formatCurrency(stats.netProfit)} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">Income - Expenses - Savings</p>
            <p className="text-xs font-medium">{stats.balancePercentage.toFixed(1)}% of income</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
