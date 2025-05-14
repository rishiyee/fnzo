"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { HiddenValue } from "@/components/hidden-value"
import type { Expense } from "@/types/expense"

interface BalanceTrendChartProps {
  expenses: Expense[]
}

export function BalanceTrendChart({ expenses }: BalanceTrendChartProps) {
  // Generate chart data from expenses
  const { chartData, currentBalance, isPositive } = useMemo(() => {
    // Sort expenses by date
    const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate running balance for each transaction
    let runningBalance = 0
    const data = sortedExpenses.map((expense) => {
      // Update running balance based on transaction type
      if (expense.type === "income") {
        runningBalance += expense.amount
      } else if (expense.type === "expense") {
        runningBalance -= expense.amount
      } else if (expense.type === "savings") {
        runningBalance -= expense.amount
      }

      // Format date for display
      const date = new Date(expense.date)
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })

      return {
        date: formattedDate,
        balance: runningBalance,
        amount: expense.amount,
        type: expense.type,
        category: expense.category,
        notes: expense.notes,
        rawDate: date,
      }
    })

    // Group by date if there are too many points
    let groupedData = data
    if (data.length > 30) {
      const dateGroups: Record<string, (typeof data)[0]> = {}

      data.forEach((item) => {
        const key = item.date
        if (!dateGroups[key]) {
          dateGroups[key] = { ...item }
        } else {
          // Keep the last balance for each date
          dateGroups[key] = item
        }
      })

      groupedData = Object.values(dateGroups)
    }

    return {
      chartData: groupedData,
      currentBalance: runningBalance,
      isPositive: runningBalance >= 0,
    }
  }, [expenses])

  const chartConfig = {
    balance: {
      label: "Balance",
      color: isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
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
          <ChartContainer config={chartConfig}>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={30} />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value).replace(/[^0-9.-]/g, "")}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="text-xs font-medium">{label}</div>
                            <div className="grid gap-1">
                              <div className="flex items-center gap-1 text-xs">
                                <div
                                  className="h-0.5 w-2"
                                  style={{
                                    backgroundColor: isPositive ? "var(--color-balance)" : "var(--color-balance)",
                                  }}
                                />
                                <span className="font-medium">Balance:</span>
                                <span>{formatCurrency(data.balance)}</span>
                              </div>
                              {data.type && (
                                <div className="flex items-center gap-1 text-xs">
                                  <div className="h-0.5 w-2" />
                                  <span className="font-medium">Last Transaction:</span>
                                  <span>
                                    {data.type.charAt(0).toUpperCase() + data.type.slice(1)} - {data.category} -{" "}
                                    {formatCurrency(data.amount)}
                                  </span>
                                </div>
                              )}
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
                  dataKey="balance"
                  stroke="var(--color-balance)"
                  fill="var(--color-balance)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
