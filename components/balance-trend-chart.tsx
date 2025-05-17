"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { Expense } from "@/types/expense"
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth } from "date-fns"
import { useTheme } from "next-themes"

interface BalanceTrendChartProps {
  expenses: Expense[]
  isLoading?: boolean
}

export function BalanceTrendChart({ expenses, isLoading }: BalanceTrendChartProps) {
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!expenses.length) return []

    // Find date range
    const dates = expenses.map((expense) => new Date(expense.date))
    const minDate = new Date(Math.min(...dates.map((date) => date.getTime())))
    const maxDate = new Date(Math.max(...dates.map((date) => date.getTime())))

    // Create array of months in the range
    const monthsInRange = eachMonthOfInterval({
      start: startOfMonth(minDate),
      end: endOfMonth(maxDate),
    })

    // Aggregate data by month
    return monthsInRange.map((month) => {
      const monthlyExpenses = expenses.filter((expense) => isSameMonth(parseISO(expense.date), month))

      const income = monthlyExpenses
        .filter((expense) => expense.type === "income")
        .reduce((sum, expense) => sum + expense.amount, 0)

      const expenseAmount = monthlyExpenses
        .filter((expense) => expense.type === "expense")
        .reduce((sum, expense) => sum + expense.amount, 0)

      const savings = monthlyExpenses
        .filter((expense) => expense.type === "savings")
        .reduce((sum, expense) => sum + expense.amount, 0)

      const balance = income - expenseAmount - savings

      return {
        month: format(month, "MMM yyyy"),
        balance,
      }
    })
  }, [expenses])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-lg p-4">
          <p className="font-medium mb-2 text-sm">{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center gap-2 mb-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="capitalize text-sm">{entry.name}:</span>
              <span className="font-medium text-sm">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return <p>Loading chart...</p>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Balance Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDarkTheme ? "rgba(102, 102, 102, 0.15)" : "rgba(204, 204, 204, 0.3)"}
                strokeWidth={0.8}
                vertical={true}
                horizontal={true}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: isDarkTheme ? "rgba(204, 204, 204, 0.8)" : "rgba(51, 51, 51, 0.8)" }}
                tickLine={{ stroke: isDarkTheme ? "rgba(102, 102, 102, 0.3)" : "rgba(204, 204, 204, 0.5)" }}
                axisLine={false}
                dy={10}
              />
              <YAxis
                tickFormatter={(value) => `₹${value / 1000}k`}
                tick={{ fill: isDarkTheme ? "rgba(204, 204, 204, 0.8)" : "rgba(51, 51, 51, 0.8)" }}
                tickLine={{ stroke: isDarkTheme ? "rgba(102, 102, 102, 0.3)" : "rgba(204, 204, 204, 0.5)" }}
                axisLine={false}
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorBalance)"
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
