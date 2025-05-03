"use client"

import { useMemo } from "react"
import { ArrowDownIcon, ArrowUpIcon, PiggyBankIcon, CheckCircle, AlertCircle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Expense } from "@/types/expense"
import { HiddenValue } from "@/components/hidden-value"

type ExpenseSummaryProps = {
  expenses: Expense[]
}

export function ExpenseSummary({ expenses }: ExpenseSummaryProps) {
  const summary = useMemo(() => {
    const result = {
      totalExpenses: 0,
      totalIncome: 0,
      actualSavings: 0,
      recommendedSavings: 0,
      savingsPercentage: 0,
      expensesPercentage: 0,
      balance: 0,
      isSavingEnough: false,
      savingsProgress: 0,
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

    // Calculate recommended savings as 30% of income
    result.recommendedSavings = result.totalIncome * 0.3

    // Calculate savings percentage of income
    result.savingsPercentage = result.totalIncome > 0 ? (result.actualSavings / result.totalIncome) * 100 : 0

    // Calculate expenses percentage of income
    result.expensesPercentage = result.totalIncome > 0 ? (result.totalExpenses / result.totalIncome) * 100 : 0

    // Determine if saving enough
    result.isSavingEnough = result.actualSavings >= result.recommendedSavings

    // Calculate savings progress (capped at 100%)
    result.savingsProgress =
      result.recommendedSavings > 0
        ? Math.min(Math.round((result.actualSavings / result.recommendedSavings) * 100), 100)
        : 0

    // Calculate balance as income minus expenses minus actual savings
    result.balance = result.totalIncome - result.totalExpenses - result.actualSavings

    return result
  }, [expenses])

  const formatCurrency = (amount: number) => {
    // Ensure amount is a number
    const value = typeof amount === "number" ? amount : 0
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Income</CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <HiddenValue value={formatCurrency(summary.totalIncome)} />
          </div>
          <p className="text-xs text-muted-foreground">Total money coming in</p>

          {/* Income allocation - simplified */}
          <div className="mt-4 flex justify-between text-xs">
            <span className="text-red-500">Expenses: {summary.expensesPercentage.toFixed(1)}%</span>
            <span className="text-blue-500">Savings: {summary.savingsPercentage.toFixed(1)}%</span>
            <span className="text-green-500">
              Balance: {(100 - summary.expensesPercentage - summary.savingsPercentage).toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <HiddenValue value={formatCurrency(summary.totalExpenses)} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">Total money going out</p>
            <p className="text-xs font-medium text-red-500">{summary.expensesPercentage.toFixed(1)}% of income</p>
          </div>

          {/* Expenses percentage - simplified */}
          <div className="mt-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium">Percentage of Income</span>
              <span className="text-xs font-medium text-red-500">{summary.expensesPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={
          summary.isSavingEnough ? "border-green-500 dark:border-green-700" : "border-amber-500 dark:border-amber-700"
        }
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Savings</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center">
                  <PiggyBankIcon className="h-4 w-4 text-blue-500 mr-1" />
                  {summary.isSavingEnough ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {summary.isSavingEnough
                  ? "Great job! You're saving more than the recommended amount."
                  : "You're saving less than the recommended 30% of your income."}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Actual</span>
              <span className="text-sm font-medium">Target (30%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">
                <HiddenValue value={formatCurrency(summary.actualSavings)} />
              </span>
              <span className="text-md text-muted-foreground">
                <HiddenValue value={formatCurrency(summary.recommendedSavings)} />
              </span>
            </div>
          </div>

          {/* Savings metrics - simplified */}
          <div className="mt-2 flex justify-between items-center text-xs">
            <span className={summary.isSavingEnough ? "text-green-600" : "text-amber-500"}>
              {summary.savingsProgress}% of target
            </span>
            <span className="text-blue-600 font-medium">{summary.savingsPercentage.toFixed(1)}% of income</span>
          </div>

          <p className="text-xs text-muted-foreground pt-1">
            {summary.isSavingEnough ? "Excellent savings habits!" : "Consider increasing your savings."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balance</CardTitle>
          <div className={`h-4 w-4 rounded-full ${summary.balance >= 0 ? "bg-green-500" : "bg-red-500"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${summary.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
            <HiddenValue value={formatCurrency(summary.balance)} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">Income - Expenses - Savings</p>
            <p className="text-xs font-medium">
              {(100 - summary.expensesPercentage - summary.savingsPercentage).toFixed(1)}% of income
            </p>
          </div>

          {/* Balance percentage - simplified */}
          <div className="mt-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium">Remaining Income</span>
              <span className="text-xs font-medium">
                {(100 - summary.expensesPercentage - summary.savingsPercentage).toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
