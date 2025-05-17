"use client"

import { useState, useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth } from "date-fns"
import type { Expense } from "@/types/expense"
import { useTheme } from "next-themes"

interface MonthlyAreaChartProps {
  expenses: Expense[]
  className?: string
}

export function MonthlyAreaChart({ expenses, className }: MonthlyAreaChartProps) {
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"

  // State for selected series
  const [selectedSeries, setSelectedSeries] = useState({
    income: true,
    expense: true,
    savings: true,
  })

  // Toggle series visibility
  const toggleSeries = (series: keyof typeof selectedSeries) => {
    setSelectedSeries((prev) => ({
      ...prev,
      [series]: !prev[series],
    }))
  }

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

      return {
        month: format(month, "MMM yyyy"),
        income,
        expense: expenseAmount,
        savings,
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
    income: "rgba(16, 185, 129, 0.7)", // green with opacity
    expense: "rgba(239, 68, 68, 0.7)", // red with opacity
    savings: "rgba(59, 130, 246, 0.7)", // blue with opacity
  }

  // Define stroke colors (more solid)
  const strokeColors = {
    income: "#10b981", // solid green
    expense: "#ef4444", // solid red
    savings: "#3b82f6", // solid blue
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Monthly Financial Trends</h2>
        <p className="text-muted-foreground">Area chart showing income, expenses, and savings over time</p>
      </div>

      <div>
        {chartData.length > 0 ? (
          <div className="w-full h-[400px] mt-4">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 5, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={strokeColors.income} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={strokeColors.income} stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={strokeColors.expense} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={strokeColors.expense} stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={strokeColors.savings} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={strokeColors.savings} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
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
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke={strokeColors.income}
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                      stackId="1"
                    />
                  )}

                  {selectedSeries.expense && (
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="Expenses"
                      stroke={strokeColors.expense}
                      fillOpacity={1}
                      fill="url(#colorExpense)"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                      stackId="2"
                    />
                  )}

                  {selectedSeries.savings && (
                    <Area
                      type="monotone"
                      dataKey="savings"
                      name="Savings"
                      stroke={strokeColors.savings}
                      fillOpacity={1}
                      fill="url(#colorSavings)"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                      stackId="3"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available for the selected filters
          </div>
        )}
      </div>
    </div>
  )
}
