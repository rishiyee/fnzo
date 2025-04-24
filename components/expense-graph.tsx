"use client"

import { useMemo, useState } from "react"
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { Expense } from "@/types/expense"

interface ExpenseGraphProps {
  expenses: Expense[]
}

export function ExpenseGraph({ expenses }: ExpenseGraphProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")

  // Calculate date range based on selected time range
  const dateRange = useMemo(() => {
    const today = new Date()
    let startDate: Date

    switch (timeRange) {
      case "7d":
        startDate = subMonths(today, 0.25) // Approximately 7 days
        break
      case "30d":
        startDate = subMonths(today, 1)
        break
      case "90d":
        startDate = subMonths(today, 3)
        break
      case "1y":
        startDate = subMonths(today, 12)
        break
      default:
        startDate = subMonths(today, 1)
    }

    return {
      start: startOfMonth(startDate),
      end: endOfMonth(today),
    }
  }, [timeRange])

  // Generate data for the chart
  const chartData = useMemo(() => {
    // Create an array of all days in the range
    const days = eachDayOfInterval({
      start: dateRange.start,
      end: dateRange.end,
    })

    // Initialize data with zero values for each day
    const data = days.map((day) => ({
      date: day,
      expense: 0,
      income: 0,
      savings: 0,
    }))

    // Populate with actual expense data
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date)

      // Only include expenses within the date range
      if (expenseDate >= dateRange.start && expenseDate <= dateRange.end) {
        const dayIndex = data.findIndex((d) => isSameDay(d.date, expenseDate))

        if (dayIndex !== -1) {
          if (expense.type === "expense") {
            data[dayIndex].expense += expense.amount
          } else if (expense.type === "income") {
            data[dayIndex].income += expense.amount
          } else if (expense.type === "savings") {
            data[dayIndex].savings += expense.amount
          }
        }
      }
    })

    // Format dates for display
    return data.map((item) => ({
      ...item,
      name: format(item.date, "MMM dd"),
    }))
  }, [expenses, dateRange])

  // Calculate totals for the selected period
  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, item) => {
        acc.expense += item.expense
        acc.income += item.income
        acc.savings += item.savings
        return acc
      },
      { expense: 0, income: 0, savings: 0 },
    )
  }, [chartData])

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="capitalize">{entry.name}:</span>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Track your expenses, income, and savings over time</CardDescription>
          </div>
          <Tabs defaultValue="30d" value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <TabsList>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
              <TabsTrigger value="90d">90D</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-4 w-full">
          <div className="bg-muted/30 rounded-md px-4 py-2 flex-1 min-w-[120px]">
            <div className="text-sm text-muted-foreground">Expenses</div>
            <div className="text-xl font-bold text-red-500">{formatCurrency(totals.expense)}</div>
          </div>
          <div className="bg-muted/30 rounded-md px-4 py-2 flex-1 min-w-[120px]">
            <div className="text-sm text-muted-foreground">Income</div>
            <div className="text-xl font-bold text-green-500">{formatCurrency(totals.income)}</div>
          </div>
          <div className="bg-muted/30 rounded-md px-4 py-2 flex-1 min-w-[120px]">
            <div className="text-sm text-muted-foreground">Savings</div>
            <div className="text-xl font-bold text-blue-500">{formatCurrency(totals.savings)}</div>
          </div>
          <div className="bg-muted/30 rounded-md px-4 py-2 flex-1 min-w-[120px]">
            <div className="text-sm text-muted-foreground">Net</div>
            <div
              className={`text-xl font-bold ${totals.income - totals.expense > 0 ? "text-green-500" : "text-red-500"}`}
            >
              {formatCurrency(totals.income - totals.expense)}
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={10} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="expense"
                name="Expense"
                stroke="#ef4444"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#22c55e"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="savings"
                name="Savings"
                stroke="#3b82f6"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
