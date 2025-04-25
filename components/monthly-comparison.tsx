"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { Expense } from "@/types/expense"
import { format, subMonths } from "date-fns"
import { useTheme } from "next-themes"
import { ArrowUpIcon, ArrowDownIcon } from "@radix-ui/react-icons"

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

    // Calculate net profit for current month
    const currentNetProfit = currentIncome - currentExpense - currentSavings

    // Calculate net profit for previous month
    const previousNetProfit = prevIncome - prevExpense - prevSavings

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
      {
        name: "Net Profit",
        [currentMonthName]: currentNetProfit,
        [prevMonthName]: previousNetProfit,
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

  // Calculate the percentage change
  const currentIncome = expenses.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0)
  const currentExpense = expenses.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0)
  const currentSavings = expenses.filter((e) => e.type === "savings").reduce((sum, e) => sum + e.amount, 0)

  // Calculate totals for previous month
  const previousIncome = previousMonthExpenses.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0)
  const previousExpenses = previousMonthExpenses
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0)
  const previousSavings = previousMonthExpenses
    .filter((e) => e.type === "savings")
    .reduce((sum, e) => sum + e.amount, 0)

  const currentNetProfit = currentIncome - currentExpense - currentSavings
  const previousNetProfit = previousIncome - previousExpenses - previousSavings

  const netProfitChange =
    previousNetProfit === 0
      ? currentNetProfit > 0
        ? 100
        : 0
      : ((currentNetProfit - previousNetProfit) / Math.abs(previousNetProfit)) * 100

  return (
    <Card className="col-span-1 md:col-span-2 w-full">
      <CardHeader>
        <CardTitle>Monthly Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
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
        <div className="overflow-x-auto w-full mt-4">
          <table className="w-full">
            <thead>
              <tr>
                <th className="py-2 text-left">Metric</th>
                <th className="py-2 text-right">{currentMonthName}</th>
                <th className="py-2 text-right">{prevMonthName}</th>
                <th className="py-2 text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {/* Net Profit Row */}
              <tr>
                <td className="py-2">Net Profit</td>
                <td className={`py-2 text-right ${currentNetProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(currentNetProfit)}
                </td>
                <td className={`py-2 text-right ${previousNetProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(previousNetProfit)}
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end">
                    {netProfitChange === 0 ? (
                      <span>No change</span>
                    ) : (
                      <>
                        <span className={netProfitChange > 0 ? "text-green-600" : "text-red-600"}>
                          {netProfitChange > 0 ? "+" : ""}
                          {netProfitChange.toFixed(1)}%
                        </span>
                        {netProfitChange > 0 ? (
                          <ArrowUpIcon className="ml-1 h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownIcon className="ml-1 h-4 w-4 text-red-600" />
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
