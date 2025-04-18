"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { Expense } from "@/types/expense"
import { format, subMonths } from "date-fns"
import { useTheme } from "next-themes"

interface MonthlyComparisonProps {
  expenses: Expense[]
  selectedMonth: Date
  previousMonthExpenses: Expense[]
}

export function MonthlyComparison({ expenses, selectedMonth, previousMonthExpenses }: MonthlyComparisonProps) {
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"

  const comparisonData = useMemo(() => {
    // Calculate totals for current month
    const currentIncome = expenses.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0)
    const currentExpense = expenses.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0)
    const currentSavings = expenses.filter((e) => e.type === "savings").reduce((sum, e) => sum + e.amount, 0)

    // Calculate totals for previous month
    const prevIncome = previousMonthExpenses.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0)
    const prevExpense = previousMonthExpenses.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0)
    const prevSavings = previousMonthExpenses.filter((e) => e.type === "savings").reduce((sum, e) => sum + e.amount, 0)

    // Format month names
    const currentMonthName = format(selectedMonth, "MMM")
    const prevMonthName = format(subMonths(selectedMonth, 1), "MMM")

    return [
      {
        name: "Income",
        [currentMonthName]: currentIncome,
        [prevMonthName]: prevIncome,
      },
      {
        name: "Expenses",
        [currentMonthName]: currentExpense,
        [prevMonthName]: prevExpense,
      },
      {
        name: "Savings",
        [currentMonthName]: currentSavings,
        [prevMonthName]: prevSavings,
      },
    ]
  }, [expenses, previousMonthExpenses, selectedMonth])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const currentMonthName = format(selectedMonth, "MMM")
  const prevMonthName = format(subMonths(selectedMonth, 1), "MMM")

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Monthly Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDarkTheme ? "rgba(102, 102, 102, 0.15)" : "rgba(204, 204, 204, 0.3)"}
                strokeWidth={0.8}
                vertical={true}
                horizontal={true}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: isDarkTheme ? "rgba(204, 204, 204, 0.8)" : "rgba(51, 51, 51, 0.8)" }}
                tickLine={{ stroke: isDarkTheme ? "rgba(102, 102, 102, 0.3)" : "rgba(204, 204, 204, 0.5)" }}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value) => `₹${value / 1000}k`}
                tick={{ fill: isDarkTheme ? "rgba(204, 204, 204, 0.8)" : "rgba(51, 51, 51, 0.8)" }}
                tickLine={{ stroke: isDarkTheme ? "rgba(102, 102, 102, 0.3)" : "rgba(204, 204, 204, 0.5)" }}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey={currentMonthName} fill="#3b82f6" name={`${currentMonthName} (Current)`} />
              <Bar dataKey={prevMonthName} fill="#8b5cf6" name={`${prevMonthName} (Previous)`} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
