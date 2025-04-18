"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Expense } from "@/types/expense"
import { format, subMonths } from "date-fns"

interface MonthlyMetricsProps {
  expenses: Expense[]
  selectedMonth: Date
  previousMonthExpenses: Expense[]
}

export function MonthlyMetrics({ expenses, selectedMonth, previousMonthExpenses }: MonthlyMetricsProps) {
  const metrics = useMemo(() => {
    // Current month metrics
    const income = expenses.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0)
    const expenseTotal = expenses.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0)
    const savings = expenses.filter((e) => e.type === "savings").reduce((sum, e) => sum + e.amount, 0)
    const netProfit = income - expenseTotal - savings

    // Previous month metrics
    const prevIncome = previousMonthExpenses.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0)
    const prevExpenseTotal = previousMonthExpenses
      .filter((e) => e.type === "expense")
      .reduce((sum, e) => sum + e.amount, 0)
    const prevSavings = previousMonthExpenses.filter((e) => e.type === "savings").reduce((sum, e) => sum + e.amount, 0)
    const prevNetProfit = prevIncome - prevExpenseTotal - prevSavings

    // Calculate percentage changes
    const incomeChange = prevIncome ? ((income - prevIncome) / prevIncome) * 100 : 0
    const expenseChange = prevExpenseTotal ? ((expenseTotal - prevExpenseTotal) / prevExpenseTotal) * 100 : 0
    const savingsChange = prevSavings ? ((savings - prevSavings) / prevSavings) * 100 : 0
    const netProfitChange = prevNetProfit ? ((netProfit - prevNetProfit) / prevNetProfit) * 100 : 0

    return {
      income,
      expenseTotal,
      savings,
      netProfit,
      incomeChange,
      expenseChange,
      savingsChange,
      netProfitChange,
    }
  }, [expenses, previousMonthExpenses])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const renderChangeIndicator = (change: number, positiveIsGood = true) => {
    if (Math.abs(change) < 0.1) {
      return (
        <div className="flex items-center text-muted-foreground">
          <Minus className="h-4 w-4 mr-1" />
          <span>No change</span>
        </div>
      )
    }

    const isPositive = change > 0
    const isGood = positiveIsGood ? isPositive : !isPositive
    const colorClass = isGood ? "text-green-600" : "text-red-600"
    const Icon = isPositive ? TrendingUp : TrendingDown

    return (
      <div className={`flex items-center ${colorClass}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span>{Math.abs(change).toFixed(1)}%</span>
      </div>
    )
  }

  const previousMonthName = format(subMonths(selectedMonth, 1), "MMMM")

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Income</CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.income)}</div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">vs {previousMonthName}</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>{renderChangeIndicator(metrics.incomeChange, true)}</TooltipTrigger>
                <TooltipContent>
                  <p>
                    {metrics.incomeChange > 0
                      ? `${formatCurrency(metrics.income - metrics.income / (1 + metrics.incomeChange / 100))} more than last month`
                      : `${formatCurrency(metrics.income / (1 - metrics.incomeChange / 100) - metrics.income)} less than last month`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.expenseTotal)}</div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">vs {previousMonthName}</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>{renderChangeIndicator(metrics.expenseChange, false)}</TooltipTrigger>
                <TooltipContent>
                  <p>
                    {metrics.expenseChange > 0
                      ? `${formatCurrency(metrics.expenseTotal - metrics.expenseTotal / (1 + metrics.expenseChange / 100))} more than last month`
                      : `${formatCurrency(metrics.expenseTotal / (1 - metrics.expenseChange / 100) - metrics.expenseTotal)} less than last month`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Savings</CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.savings)}</div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">vs {previousMonthName}</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>{renderChangeIndicator(metrics.savingsChange, true)}</TooltipTrigger>
                <TooltipContent>
                  <p>
                    {metrics.savingsChange > 0
                      ? `${formatCurrency(metrics.savings - metrics.savings / (1 + metrics.savingsChange / 100))} more than last month`
                      : `${formatCurrency(metrics.savings / (1 - metrics.savingsChange / 100) - metrics.savings)} less than last month`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          <div className={`h-4 w-4 rounded-full ${metrics.netProfit >= 0 ? "bg-green-500" : "bg-red-500"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${metrics.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(metrics.netProfit)}
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-muted-foreground">vs {previousMonthName}</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>{renderChangeIndicator(metrics.netProfitChange, true)}</TooltipTrigger>
                <TooltipContent>
                  <p>
                    {metrics.netProfitChange > 0
                      ? `${formatCurrency(metrics.netProfit - metrics.netProfit / (1 + metrics.netProfitChange / 100))} more than last month`
                      : `${formatCurrency(metrics.netProfit / (1 - metrics.netProfitChange / 100) - metrics.netProfit)} less than last month`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
