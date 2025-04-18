"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Category } from "@/lib/category-service"

interface CategoryCardProps {
  category: Category & { spending: number }
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!category.budget || category.budget <= 0) return 0
    const percentage = (category.spending / category.budget) * 100
    return Math.min(percentage, 100) // Cap at 100%
  }

  // Determine if over budget
  const isOverBudget = category.budget && category.spending > category.budget

  // Get type badge variant
  const getTypeVariant = () => {
    switch (category.type) {
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

  // Get progress color based on percentage
  const getProgressColor = () => {
    const progress = calculateProgress()
    if (progress >= 90) return "bg-red-500"
    if (progress >= 75) return "bg-amber-500"
    return "bg-primary"
  }

  return (
    <Card
      className="h-full transition-all duration-200 hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ borderLeft: `4px solid ${category.color || "#ccc"}` }}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{category.name}</h3>
            <Badge variant={getTypeVariant()} className="mt-1">
              {category.type.charAt(0).toUpperCase() + category.type.slice(1)}
            </Badge>
          </div>
          {category.isDefault && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs">
                    Default
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a default system category</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {category.description && <p className="text-sm text-muted-foreground mt-1">{category.description}</p>}
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Spending</span>
              {category.budget ? (
                <span className="text-sm font-medium">Budget</span>
              ) : (
                <span className="text-xs text-muted-foreground">No budget set</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">{formatCurrency(category.spending)}</span>
              {category.budget ? (
                <span className={`text-sm ${isOverBudget ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                  {formatCurrency(category.budget)}
                </span>
              ) : (
                <span>—</span>
              )}
            </div>
          </div>

          {category.budget ? (
            <div className="space-y-1">
              <Progress value={calculateProgress()} className={getProgressColor()} />
              <div className="flex justify-between items-center text-xs">
                <span
                  className={`${isOverBudget ? "text-red-500 font-medium flex items-center gap-1" : "text-muted-foreground"}`}
                >
                  {isOverBudget && <AlertCircle className="h-3 w-3" />}
                  {isOverBudget ? "Over budget" : `${calculateProgress().toFixed(0)}% used`}
                </span>
                {isOverBudget && (
                  <span className="text-red-500 font-medium">
                    +{formatCurrency(category.spending - category.budget)}
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className={`flex gap-2 w-full transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation() // Prevent triggering parent click in merge mode
              onEdit(category)
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation() // Prevent triggering parent click in merge mode
              onDelete(category)
            }}
            disabled={category.isDefault}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
