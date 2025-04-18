"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Expense } from "@/types/expense"
import { format } from "date-fns"

interface TopTransactionsProps {
  expenses: Expense[]
  type?: "expense" | "income" | "savings"
  limit?: number
}

export function TopTransactions({ expenses, type = "expense", limit = 5 }: TopTransactionsProps) {
  const topTransactions = useMemo(() => {
    // Filter by type
    const filteredExpenses = expenses.filter((expense) => expense.type === type)

    // Sort by amount (descending)
    return [...filteredExpenses].sort((a, b) => b.amount - a.amount).slice(0, limit)
  }, [expenses, type, limit])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "expense":
        return "destructive"
      case "income":
        return "success"
      case "savings":
        return "blue"
      default:
        return "secondary"
    }
  }

  const typeTitle = type.charAt(0).toUpperCase() + type.slice(1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top {typeTitle} Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {topTransactions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">No {type} transactions found for this month</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{format(new Date(transaction.date), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(transaction.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
