"use client"

import { useEffect, useState } from "react"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, PiggyBank } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { expenseService } from "@/lib/expense-service"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Expense } from "@/types/expense"

export function OverviewStats() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    netProfit: 0,
    expensesPercentage: 0,
    savingsPercentage: 0,
    balancePercentage: 0,
  })

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setIsLoading(true)
        const data = await expenseService.getExpenses()
        setExpenses(data)

        // Calculate stats
        let totalIncome = 0
        let totalExpenses = 0
        let totalSavings = 0

        data.forEach((expense) => {
          if (expense.type === "income") {
            totalIncome += expense.amount
          } else if (expense.type === "expense") {
            totalExpenses += expense.amount
          } else if (expense.type === "savings") {
            totalSavings += expense.amount
          }
        })

        const netProfit = totalIncome - totalExpenses - totalSavings

        // Calculate percentages
        const expensesPercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0
        const savingsPercentage = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0
        const balancePercentage = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

        setStats({
          totalIncome,
          totalExpenses,
          totalSavings,
          netProfit,
          expensesPercentage,
          savingsPercentage,
          balancePercentage,
        })
      } catch (error) {
        console.error("Failed to fetch expenses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchExpenses()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-24" />
              </CardTitle>
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-36 mb-2" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalIncome)}</div>
          <p className="text-xs text-muted-foreground">All income transactions</p>

          {/* Income allocation visualization */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium">Income Allocation</p>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="flex h-full">
                <div
                  className="bg-red-500 h-full"
                  style={{ width: `${Math.min(stats.expensesPercentage, 100)}%` }}
                ></div>
                <div
                  className="bg-blue-500 h-full"
                  style={{ width: `${Math.min(stats.savingsPercentage, 100)}%` }}
                ></div>
                <div
                  className="bg-green-500 h-full"
                  style={{ width: `${Math.max(0, Math.min(stats.balancePercentage, 100))}%` }}
                ></div>
              </div>
            </div>
            <div className="flex text-xs justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="flex items-center">
                      <span className="h-2 w-2 bg-red-500 rounded-full mr-1"></span>
                      <span>Expenses: {stats.expensesPercentage.toFixed(1)}%</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatCurrency(stats.totalExpenses)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="flex items-center">
                      <span className="h-2 w-2 bg-blue-500 rounded-full mr-1"></span>
                      <span>Savings: {stats.savingsPercentage.toFixed(1)}%</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatCurrency(stats.totalSavings)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="flex items-center">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                      <span>Balance: {stats.balancePercentage.toFixed(1)}%</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatCurrency(stats.netProfit)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">All expense transactions</p>
            <p className="text-xs font-medium text-red-500">{stats.expensesPercentage.toFixed(1)}% of income</p>
          </div>

          {/* Expenses percentage visualization */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium">Percentage of Income</span>
            </div>
            <Progress
              value={stats.expensesPercentage}
              className="h-2"
              indicatorClassName={stats.expensesPercentage > 70 ? "bg-red-500" : "bg-amber-500"}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">0%</span>
              <span className="text-xs text-muted-foreground">50%</span>
              <span className="text-xs text-muted-foreground">100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
          <PiggyBank className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalSavings)}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">All savings transactions</p>
            <p className="text-xs font-medium text-blue-500">{stats.savingsPercentage.toFixed(1)}% of income</p>
          </div>

          {/* Savings percentage visualization */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium">Percentage of Income</span>
              <span className="text-xs text-muted-foreground">Target: 30%</span>
            </div>
            <Progress
              value={stats.savingsPercentage}
              className="h-2"
              indicatorClassName={stats.savingsPercentage >= 30 ? "bg-green-500" : "bg-blue-500"}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">0%</span>
              <span className="text-xs text-muted-foreground">30%</span>
              <span className="text-xs text-muted-foreground">50%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          <DollarSign className={`h-4 w-4 ${stats.netProfit >= 0 ? "text-green-500" : "text-red-500"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(stats.netProfit)}
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">Income - Expenses - Savings</p>
            <p className="text-xs font-medium">{stats.balancePercentage.toFixed(1)}% of income</p>
          </div>

          {/* Balance visualization */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium">Remaining Income</span>
            </div>
            <Progress
              value={stats.balancePercentage}
              className="h-2"
              indicatorClassName={stats.netProfit >= 0 ? "bg-green-500" : "bg-red-500"}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">0%</span>
              <span className="text-xs text-muted-foreground">50%</span>
              <span className="text-xs text-muted-foreground">100%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
