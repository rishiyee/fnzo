"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { Expense } from "@/types/expense"
import { useTheme } from "next-themes"

interface CategoryBreakdownProps {
  expenses: Expense[]
  type?: "expense" | "income" | "savings"
}

export function CategoryBreakdown({ expenses, type = "expense" }: CategoryBreakdownProps) {
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"

  // Generate a color palette for the pie chart
  const COLORS = [
    "#10b981", // green
    "#ef4444", // red
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#f59e0b", // amber
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#f97316", // orange
    "#6366f1", // indigo
  ]

  const categoryData = useMemo(() => {
    // Filter expenses by type
    const filteredExpenses = expenses.filter((expense) => expense.type === type)

    // Group by category and sum amounts
    const categoryMap = new Map<string, number>()

    filteredExpenses.forEach((expense) => {
      const currentAmount = categoryMap.get(expense.category) || 0
      categoryMap.set(expense.category, currentAmount + expense.amount)
    })

    // Convert to array for chart
    const result = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
    }))

    // Sort by value descending
    return result.sort((a, b) => b.value - a.value)
  }, [expenses, type])

  const totalAmount = useMemo(() => {
    return categoryData.reduce((sum, item) => sum + item.value, 0)
  }, [categoryData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.value / totalAmount) * 100).toFixed(1)

      return (
        <div className="bg-background border rounded-md shadow-lg p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">{formatCurrency(data.value)}</p>
          <p className="text-sm text-muted-foreground">{percentage}% of total</p>
        </div>
      )
    }

    return null
  }

  // Custom legend renderer
  const renderLegend = (props: any) => {
    const { payload } = props

    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-sm">
        {payload.map((entry: any, index: number) => {
          const percentage = ((entry.payload.value / totalAmount) * 100).toFixed(1)
          return (
            <li key={`item-${index}`} className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: entry.color }} />
              <span>
                {entry.value} ({percentage}%)
              </span>
            </li>
          )
        })}
      </ul>
    )
  }

  const typeTitle = type.charAt(0).toUpperCase() + type.slice(1)

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>{typeTitle} Breakdown by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {categoryData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No {type} data available for this month
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
