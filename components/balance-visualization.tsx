"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowUpIcon, ArrowDownIcon, PiggyBankIcon, TrendingUp, TrendingDown } from "lucide-react"
import { HiddenValue } from "@/components/hidden-value"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { Expense } from "@/types/expense"

interface BalanceVisualizationProps {
  expenses: Expense[]
}

export function BalanceVisualization({ expenses }: BalanceVisualizationProps) {
  const summary = useMemo(() => {
    const result = {
      totalExpenses: 0,
      totalIncome: 0,
      actualSavings: 0,
      balance: 0,
      balancePercentage: 0,
      isPositive: true,
    }

    expenses.forEach((expense) => {
      switch (expense.type) {
        case "expense":
          result.totalExpenses += expense.amount
          break
        case "income":
          result.totalIncome += expense.amount
          break
        case "savings":
          result.actualSavings += expense.amount
          break
      }
    })

    // Calculate balance as income minus expenses minus actual savings
    result.balance = result.totalIncome - result.totalExpenses - result.actualSavings

    // Calculate balance percentage relative to income
    result.balancePercentage =
      result.totalIncome > 0 ? Math.min((Math.abs(result.balance) / result.totalIncome) * 100, 100) : 0

    // Determine if balance is positive
    result.isPositive = result.balance >= 0

    return result
  }, [expenses])

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

  // Chart configuration
  const chartConfig = {
    runningBalance: {
      label: "Balance",
      color: summary.isPositive ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig

  const formatCurrency = (amount: number) => {
    // Ensure amount is a number
    const value = typeof amount === "number" ? amount : 0
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

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

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Balance Visualization</CardTitle>
        <CardDescription>Track your balance over time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Circular Balance Indicator */}
          <div className="relative flex-shrink-0">
            <div className="w-48 h-48 rounded-full border-8 flex items-center justify-center relative">
              <div
                className={`absolute inset-0 rounded-full ${
                  summary.isPositive ? "border-green-500/20" : "border-red-500/20"
                } border-8`}
              ></div>
              <div
                className={`absolute inset-0 rounded-full border-8 ${
                  summary.isPositive ? "border-green-500" : "border-red-500"
                }`}
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${
                    summary.balancePercentage === 0
                      ? "50% 0%"
                      : `${50 + 50 * Math.sin((summary.balancePercentage / 100) * Math.PI * 2)}% ${50 - 50 * Math.cos((summary.balancePercentage / 100) * Math.PI * 2)}%`
                  })`,
                }}
              ></div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Current Balance</div>
                <div className={`text-2xl font-bold ${summary.isPositive ? "text-green-500" : "text-red-500"}`}>
                  <HiddenValue value={formatCurrency(summary.balance)} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {summary.isPositive ? "Remaining" : "Overspent"}
                </div>
              </div>
            </div>
          </div>

          {/* Balance Breakdown */}
          <div className="flex-grow w-full">
            <div className="space-y-4">
              {/* Income */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-2" />
                    <span className="font-medium">Income</span>
                  </div>
                  <span className="font-medium">
                    <HiddenValue value={formatCurrency(summary.totalIncome)} />
                  </span>
                </div>
                <Progress value={100} className="h-2 bg-green-100 dark:bg-green-900/20">
                  <div className="h-full bg-green-500" style={{ width: "100%" }}></div>
                </Progress>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-muted-foreground">100%</span>
                </div>
              </div>

              {/* Expenses */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-2" />
                    <span className="font-medium">Expenses</span>
                  </div>
                  <span className="font-medium">
                    <HiddenValue value={formatCurrency(summary.totalExpenses)} />
                  </span>
                </div>
                <Progress value={100} className="h-2 bg-red-100 dark:bg-red-900/20">
                  <div
                    className="h-full bg-red-500"
                    style={{
                      width: `${summary.totalIncome > 0 ? (summary.totalExpenses / summary.totalIncome) * 100 : 0}%`,
                    }}
                  ></div>
                </Progress>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-muted-foreground">
                    {summary.totalIncome > 0
                      ? `${((summary.totalExpenses / summary.totalIncome) * 100).toFixed(1)}%`
                      : "0%"}{" "}
                    of income
                  </span>
                </div>
              </div>

              {/* Savings */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <PiggyBankIcon className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="font-medium">Savings</span>
                  </div>
                  <span className="font-medium">
                    <HiddenValue value={formatCurrency(summary.actualSavings)} />
                  </span>
                </div>
                <Progress value={100} className="h-2 bg-blue-100 dark:bg-blue-900/20">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${summary.totalIncome > 0 ? (summary.actualSavings / summary.totalIncome) * 100 : 0}%`,
                    }}
                  ></div>
                </Progress>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-muted-foreground">
                    {summary.totalIncome > 0
                      ? `${((summary.actualSavings / summary.totalIncome) * 100).toFixed(1)}%`
                      : "0%"}{" "}
                    of income
                  </span>
                </div>
              </div>

              {/* Balance */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div
                      className={`h-4 w-4 rounded-full ${summary.isPositive ? "bg-green-500" : "bg-red-500"} mr-2`}
                    ></div>
                    <span className="font-medium">Balance</span>
                  </div>
                  <span className={`font-medium ${summary.isPositive ? "text-green-500" : "text-red-500"}`}>
                    <HiddenValue value={formatCurrency(summary.balance)} />
                  </span>
                </div>
                <Progress
                  value={100}
                  className={`h-2 ${summary.isPositive ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}`}
                >
                  <div
                    className={`h-full ${summary.isPositive ? "bg-green-500" : "bg-red-500"}`}
                    style={{
                      width: `${summary.totalIncome > 0 ? (Math.abs(summary.balance) / summary.totalIncome) * 100 : 0}%`,
                    }}
                  ></div>
                </Progress>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-muted-foreground">
                    {summary.totalIncome > 0
                      ? `${((Math.abs(summary.balance) / summary.totalIncome) * 100).toFixed(1)}%`
                      : "0%"}{" "}
                    of income
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Trend Chart */}
        <div className="pt-4">
          <h3 className="text-lg font-medium mb-2">Balance Trend</h3>
          <div className="h-[200px]">
            <ChartContainer config={chartConfig}>
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                  top: 5,
                  bottom: 5,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Area
                  dataKey="runningBalance"
                  type="monotone"
                  fill={`var(--color-runningBalance)`}
                  fillOpacity={0.4}
                  stroke={`var(--color-runningBalance)`}
                />
              </AreaChart>
            </ChartContainer>
          </div>
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
