"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { expenseService } from "@/lib/expense-service"
import { motion } from "framer-motion"
import { PiggyBank, ArrowDownUp } from "lucide-react"
import type { ExpenseType, ExpenseCategory } from "@/types/expense"
import Filter from "lucide-react" // Declaring the Filter variable

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
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="border-t-4 border-t-primary shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Filter className="mr-2 h-5 w-5 text-primary" />
            Filter Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium mb-1 block flex items-center">
                <PiggyBank className="mr-1.5 h-4 w-4 text-primary/70" />
                Filter by Type
              </label>
              <Select value={currentType} onValueChange={(value) => onTypeChange(value as ExpenseType | "all")}>
                <SelectTrigger className="bg-white dark:bg-gray-950 transition-all duration-200 focus:ring-2 focus:ring-primary/30">
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

            <div className="space-y-2">
              <label className="text-sm font-medium mb-1 block flex items-center">
                <ArrowDownUp className="mr-1.5 h-4 w-4 text-primary/70" />
                Filter by Category
              </label>
              <Select
                value={currentCategory}
                onValueChange={(value) => onCategoryChange(value as ExpenseCategory | "all")}
              >
                <SelectTrigger className="bg-white dark:bg-gray-950 transition-all duration-200 focus:ring-2 focus:ring-primary/30">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
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
    </motion.div>
  )
}
