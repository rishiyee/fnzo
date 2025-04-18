"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { expenseService } from "@/lib/expense-service"
import type { ExpenseType, ExpenseCategory } from "@/types/expense"

type ExpenseFilterProps = {
  onTypeChange: (type: ExpenseType | "all") => void
  onCategoryChange: (category: ExpenseCategory | "all") => void
  currentType: ExpenseType | "all"
  currentCategory: ExpenseCategory | "all"
}

export function ExpenseFilter({ onTypeChange, onCategoryChange, currentType, currentCategory }: ExpenseFilterProps) {
  const [categories, setCategories] = useState<Record<string, string[]>>({
    expense: [],
    income: [],
    savings: [],
  })

  // Load categories when component mounts
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCategories = await expenseService.getCategories()
        setCategories(allCategories)
      } catch (error) {
        console.error("Error loading categories:", error)
      }
    }

    loadCategories()
  }, [])

  // Get categories based on current type
  const getFilterCategories = () => {
    if (currentType === "all") {
      // Combine all categories when "all" is selected
      return [...new Set([...categories.expense, ...categories.income, ...categories.savings])]
    }

    return categories[currentType] || []
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Filter by Type</label>
            <Select value={currentType} onValueChange={(value) => onTypeChange(value as ExpenseType | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Filter by Category</label>
            <Select
              value={currentCategory}
              onValueChange={(value) => onCategoryChange(value as ExpenseCategory | "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {getFilterCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
