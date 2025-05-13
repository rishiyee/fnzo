"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { HiddenValue } from "@/components/hidden-value"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import type { Expense } from "@/types/expense"

interface BalanceVisualizationProps {
  expenses: Expense[]
}

export function BalanceVisualization({ expenses }: BalanceVisualizationProps) {
  // Generate chart data from expenses
  const chartData = useMemo(() => {
    // Group expenses by month
    const monthlyData: Record<string, { income: number; expenses: number; savings: number; balance: number }> = {}

    // Sort expenses by date
    const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Process each expense
    sortedExpenses.forEach((expense) => {
      const date = new Date(expense.date)
      const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`

      // Initialize month if it doesn't exist
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { income: 0, expenses: 0, savings: 0, balance: 0 }
      }

      // Add to appropriate category
      switch (expense.type) {
        case "income":
          monthlyData[monthYear].income += expense.amount
          break
        case "expense":
          monthlyData[monthYear].expenses += expense.amount
          break
        case "savings":
          monthlyData[monthYear].savings += expense.amount
          break
      }
    })

    // Calculate balance for each month
    let runningBalance = 0
    const result = Object.entries(monthlyData).map(([month, data]) => {
      const monthlyBalance = data.income - data.expenses - data.savings
      runningBalance += monthlyBalance

      return {
        month,
        income: data.income,
        expenses: data.expenses,
        savings: data.savings,
        monthlyBalance,
        runningBalance,
      }
    })

    // Limit to last 6 months if we have more data
    return result.slice(-6)
  }, [expenses])

  // Calculate current balance
  const currentBalance = useMemo(() => {
    let income = 0
    let expenseTotal = 0
    let savingsTotal = 0

    expenses.forEach((expense) => {
      switch (expense.type) {
        case "income":
          income += expense.amount
          break
        case "expense":
          expenseTotal += expense.amount
          break
        case "savings":
          savingsTotal += expense.amount
          break
      }
    })

    return income - expenseTotal - savingsTotal
  }, [expenses])

  const isPositive = currentBalance >= 0

  // Calculate balance trend percentage
  const balanceTrend = useMemo(() => {
    if (chartData.length < 2) return { percentage: 0, isUp: true }

    const currentBalance = chartData[chartData.length - 1].runningBalance
    const previousBalance = chartData[chartData.length - 2].runningBalance

    if (previousBalance === 0) return { percentage: currentBalance > 0 ? 100 : 0, isUp: currentBalance > 0 }

    const percentage = ((currentBalance - previousBalance) / Math.abs(previousBalance)) * 100
    return {
      percentage: Math.abs(percentage),
      isUp: percentage > 0,
    }
  }, [chartData])

  const formatCurrency = (amount: number) => {
    // Ensure amount is a number
    const value = typeof amount === "number" ? amount : 0
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Balance Trend</CardTitle>
        <CardDescription>
          Current Balance: <HiddenValue value={formatCurrency(currentBalance)} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickFormatter={(value) => formatCurrency(value).replace(/[^0-9.-]/g, "")}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="text-xs font-medium">{label}</div>
                          <div className="grid gap-1">
                            <div className="flex items-center gap-1 text-xs">
                              <div
                                className="h-0.5 w-2"
                                style={{
                                  backgroundColor: isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))",
                                }}
                              />
                              <span className="font-medium">Balance:</span>
                              <span>{formatCurrency(payload[0].value)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="runningBalance"
                stroke={isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))"}
                fill={isPositive ? "hsl(var(--chart-1) / 0.2)" : "hsl(var(--chart-2) / 0.2)"}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              {balanceTrend.isUp ? (
                <>
                  Trending up by {balanceTrend.percentage.toFixed(1)}%{" "}
                  {chartData.length > 0 ? `this ${chartData[chartData.length - 1].month}` : ""}
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </>
              ) : (
                <>
                  Trending down by {balanceTrend.percentage.toFixed(1)}%{" "}
                  {chartData.length > 0 ? `this ${chartData[chartData.length - 1].month}` : ""}
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </>
              )}
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {chartData.length > 0
                ? `${chartData[0].month} - ${chartData[chartData.length - 1].month}`
                : "No data available"}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
