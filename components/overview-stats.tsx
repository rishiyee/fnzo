"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { expenseService } from "@/lib/expense-service"
import { ArrowUpRight, ArrowDownRight, DollarSign, PiggyBank, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

export function OverviewStats() {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalIncome: 0,
    totalSavings: 0,
    balance: 0,
    netProfit: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Get current date
  const currentDate = new Date()
  const formattedDate = format(currentDate, "MMMM d, yyyy")

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const expenses = await expenseService.getExpenses()

        // Calculate totals
        const totalExpenses = expenses.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0)
        const totalIncome = expenses.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0)
        const totalSavings = expenses.filter((e) => e.type === "savings").reduce((sum, e) => sum + e.amount, 0)

        // Calculate balance and net profit (both use the same formula)
        const balance = totalIncome - totalExpenses - totalSavings
        const netProfit = totalIncome - totalExpenses - totalSavings

        setStats({
          totalExpenses,
          totalIncome,
          totalSavings,
          balance,
          netProfit,
        })
      } catch (error) {
        console.error("Failed to fetch stats:", error)
        toast({
          title: "Error",
          description: "Failed to load financial statistics",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [toast])

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-xl font-semibold">Financial Overview</h2>
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full">
        <Card className="w-full">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Total Income</p>
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <div className="h-7 w-24 bg-muted/30 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(stats.totalIncome)}</div>
              )}
              <div className="text-xs text-green-500 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                <span>Income</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Total Expenses</p>
              <DollarSign className="h-4 w-4 text-red-500" />
            </div>
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <div className="h-7 w-24 bg-muted/30 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
              )}
              <div className="text-xs text-red-500 flex items-center">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                <span>Expenses</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Total Savings</p>
              <PiggyBank className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <div className="h-7 w-24 bg-muted/30 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(stats.totalSavings)}</div>
              )}
              <div className="text-xs text-blue-500 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                <span>Savings</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Current Balance</p>
              <DollarSign className={`h-4 w-4 ${stats.balance >= 0 ? "text-green-500" : "text-red-500"}`} />
            </div>
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <div className="h-7 w-24 bg-muted/30 rounded animate-pulse"></div>
              ) : (
                <div className={`text-2xl font-bold ${stats.balance >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatCurrency(stats.balance)}
                </div>
              )}
              <div className={`text-xs ${stats.balance >= 0 ? "text-green-500" : "text-red-500"} flex items-center`}>
                {stats.balance >= 0 ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span>Positive</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    <span>Negative</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Income - Expenses - Savings</p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Net Profit</p>
              <TrendingUp className={`h-4 w-4 ${stats.netProfit >= 0 ? "text-green-500" : "text-red-500"}`} />
            </div>
            <div className="flex items-baseline justify-between">
              {isLoading ? (
                <div className="h-7 w-24 bg-muted/30 rounded animate-pulse"></div>
              ) : (
                <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatCurrency(stats.netProfit)}
                </div>
              )}
              <div className={`text-xs ${stats.netProfit >= 0 ? "text-green-500" : "text-red-500"} flex items-center`}>
                <span>
                  {(Math.abs(stats.netProfit) / (stats.totalIncome || 1)) * 100 < 1
                    ? "<1"
                    : Math.round((Math.abs(stats.netProfit) / (stats.totalIncome || 1)) * 100)}
                  % of income
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Income - Expenses - Savings</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
