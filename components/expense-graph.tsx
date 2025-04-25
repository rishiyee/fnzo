"use client"

import { useState, useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth } from "date-fns"
import type { Expense } from "@/types/expense"
import { useTheme } from "next-themes"

interface ExpenseGraphProps {
  expenses: Expense[]
  className?: string
}

export function ExpenseGraph({ expenses, className }: ExpenseGraphProps) {
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"

  // State for selected series
  const [selectedSeries, setSelectedSeries] = useState({
    income: true,
    expense: true,
    savings: true,
    balance: true,
  })

  // Toggle series visibility
  const toggleSeries = (series: keyof typeof selectedSeries) => {
    setSelectedSeries((prev) => ({
      ...prev,
      [series]: !prev[series],
    }))
  }

  // Process data for the graph
  const graphData = useMemo(() => {
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
        income,
        expense: expenseAmount,
        savings,
        balance,
      }
    })
  }, [expenses])

  // Format currency for tooltip
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

  // Define colors for each series
  const seriesColors = {
    income: "#10b981", // green
    expense: "#ef4444", // red
    savings: "#3b82f6", // blue
    balance: "#8b5cf6", // purple
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>Financial Trends</CardTitle>
        <CardDescription>Track your income, expenses, savings, and balance over time</CardDescription>

        <div className="flex flex-wrap gap-4 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="income-series"
              checked={selectedSeries.income}
              onCheckedChange={() => toggleSeries("income")}
              className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
            />
            <Label htmlFor="income-series" className="cursor-pointer">
              Income
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="expense-series"
              checked={selectedSeries.expense}
              onCheckedChange={() => toggleSeries("expense")}
              className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
            />
            <Label htmlFor="expense-series" className="cursor-pointer">
              Expenses
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="savings-series"
              checked={selectedSeries.savings}
              onCheckedChange={() => toggleSeries("savings")}
              className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
            <Label htmlFor="savings-series" className="cursor-pointer">
              Savings
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="balance-series"
              checked={selectedSeries.balance}
              onCheckedChange={() => toggleSeries("balance")}
              className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
            />
            <Label htmlFor="balance-series" className="cursor-pointer">
              Balance
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {graphData.length > 0 ? (
          <div className="w-full h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData} margin={{ top: 10, right: 10, left: 5, bottom: 10 }}>
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
                <Legend wrapperStyle={{ paddingTop: 15 }} />

                {selectedSeries.income && (
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke={seriesColors.income}
                    strokeWidth={2.5}
                    dot={false} // Removed dots
                    activeDot={false} // Removed active dots
                  />
                )}

                {selectedSeries.expense && (
                  <Line
                    type="monotone"
                    dataKey="expense"
                    name="Expense"
                    stroke={seriesColors.expense}
                    strokeWidth={2.5}
                    dot={false} // Removed dots
                    activeDot={false} // Removed active dots
                  />
                )}

                {selectedSeries.savings && (
                  <Line
                    type="monotone"
                    dataKey="savings"
                    name="Savings"
                    stroke={seriesColors.savings}
                    strokeWidth={2.5}
                    dot={false} // Removed dots
                    activeDot={false} // Removed active dots
                  />
                )}

                {selectedSeries.balance && (
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Balance"
                    stroke={seriesColors.balance}
                    strokeWidth={2.5}
                    dot={false} // Removed dots
                    activeDot={false} // Removed active dots
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available for the selected filters
          </div>
        )}
      </CardContent>
    </Card>
  )
}
