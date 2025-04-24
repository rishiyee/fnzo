"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, DollarSign, Ban, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Category } from "@/lib/category-service"

interface CategoryLimitFormProps {
  category: Category & { spending: number }
  onSubmit: (budget: number | undefined) => void
  isSubmitting?: boolean
}

export function CategoryLimitForm({ category, onSubmit, isSubmitting = false }: CategoryLimitFormProps) {
  const [budget, setBudget] = useState<string>(category.budget ? category.budget.toString() : "")
  const [errors, setErrors] = useState<string | null>(null)
  const [noLimit, setNoLimit] = useState<boolean>(!category.budget)

  // Reset form when category changes
  useEffect(() => {
    setBudget(category.budget ? category.budget.toString() : "")
    setNoLimit(!category.budget)
    setErrors(null)
  }, [category])

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get type color for badges
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

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!category.budget || category.budget <= 0) return 0
    const percentage = (category.spending / category.budget) * 100
    return Math.min(percentage, 100) // Cap at 100%
  }

  // Get progress color based on percentage
  const getProgressColor = () => {
    const progress = calculateProgress()
    if (progress >= 90) return "bg-red-500"
    if (progress >= 75) return "bg-amber-500"
    return "bg-primary"
  }

  // Check if over budget
  const isOverBudget = () => {
    return category.budget !== undefined && category.spending > category.budget
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors(null)

    if (noLimit) {
      // Submit with undefined budget to remove limit
      onSubmit(undefined)
      return
    }

    // Validate budget
    if (!budget.trim()) {
      setErrors("Please enter a budget amount")
      return
    }

    const budgetValue = Number(budget)
    if (isNaN(budgetValue)) {
      setErrors("Budget must be a valid number")
      return
    }

    if (budgetValue <= 0) {
      setErrors("Budget must be greater than zero")
      return
    }

    if (budgetValue > 10000000) {
      // 1 crore limit
      setErrors("Budget cannot exceed ₹1,00,00,000")
      return
    }

    // Submit form
    onSubmit(budgetValue)
  }

  const toggleNoLimit = () => {
    setNoLimit(!noLimit)
    if (!noLimit) {
      setBudget("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errors}</AlertDescription>
        </Alert>
      )}

      <div className="bg-muted p-4 rounded-md">
        <h3 className="font-medium text-lg mb-2">Category Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Name:</div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color || "#ccc" }}></div>
            {category.name}
            {category.isDefault && (
              <Badge variant="outline" className="ml-2">
                Default
              </Badge>
            )}
          </div>

          <div className="font-medium">Type:</div>
          <div>
            <Badge variant={getTypeColor(category.type)}>
              {category.type.charAt(0).toUpperCase() + category.type.slice(1)}
            </Badge>
          </div>

          <div className="font-medium">Current Spending:</div>
          <div className={`font-medium ${isOverBudget() ? "text-red-500" : ""}`}>
            {formatCurrency(category.spending)}
          </div>

          {category.budget && (
            <>
              <div className="font-medium">Current Budget:</div>
              <div>{formatCurrency(category.budget)}</div>

              <div className="font-medium">Usage:</div>
              <div className="w-full col-span-1">
                <Progress value={calculateProgress()} className={getProgressColor()} />
                <div className="flex justify-between text-xs mt-1">
                  <span className={isOverBudget() ? "text-red-500" : ""}>{calculateProgress().toFixed(0)}%</span>
                  {isOverBudget() && (
                    <span className="text-red-500">Over by {formatCurrency(category.spending - category.budget)}</span>
                  )}
                </div>
              </div>
            </>
          )}

          {category.description && (
            <>
              <div className="font-medium">Description:</div>
              <div>{category.description}</div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="budget" className="text-base flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Monthly Budget Limit
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={toggleNoLimit} className="text-xs h-7">
            {noLimit ? <DollarSign className="h-3.5 w-3.5 mr-1" /> : <Ban className="h-3.5 w-3.5 mr-1" />}
            {noLimit ? "Set a limit" : "No limit"}
          </Button>
        </div>

        {!noLimit && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
            <Input
              id="budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g., 5000"
              className="pl-7"
              disabled={noLimit}
            />
          </div>
        )}

        {!noLimit && <p className="text-xs text-muted-foreground">Set a monthly spending limit for this category</p>}

        {noLimit && (
          <div className="bg-muted/50 p-4 rounded-md text-center">
            <p className="text-muted-foreground">No monthly spending limit set for this category</p>
            <p className="text-xs mt-1">You can track spending without setting a limit</p>
          </div>
        )}
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Button type="submit" className="min-w-[120px]" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : noLimit ? "Remove Limit" : "Save Limit"}
        </Button>
      </div>
    </form>
  )
}
