"use client"

import { useState } from "react"
import type { Category } from "@/types/expense"
import { Pencil, Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DeleteCategoryDialog } from "./delete-category-dialog"
import { CategoryForm } from "./category-form"
import { CategoryLimitForm } from "./category-limit-form"
import {
  EnhancedCard,
  EnhancedCardHeader,
  EnhancedCardTitle,
  EnhancedCardDescription,
  EnhancedCardContent,
  EnhancedCardFooter,
} from "@/components/ui/card-system"

interface CategoryCardProps {
  category: Category
  spent?: number
  onUpdate: (category: Category) => void
  onDelete: (id: string) => void
}

export function CategoryCard({ category, spent = 0, onUpdate, onDelete }: CategoryCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingLimit, setIsEditingLimit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleUpdate = (updatedCategory: Category) => {
    onUpdate(updatedCategory)
    setIsEditing(false)
    setIsEditingLimit(false)
  }

  const handleDelete = () => {
    onDelete(category.id)
    setIsDeleting(false)
  }

  const getProgressColor = () => {
    if (!category.limit) return "bg-primary"
    const percentage = (spent / category.limit) * 100
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 75) return "bg-amber-500"
    return "bg-emerald-500"
  }

  const getSpentPercentage = () => {
    if (!category.limit || category.limit === 0) return 0
    const percentage = (spent / category.limit) * 100
    return Math.min(percentage, 100)
  }

  if (isEditing) {
    return (
      <EnhancedCard variant="bordered">
        <EnhancedCardHeader>
          <EnhancedCardTitle>Edit Category</EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent>
          <CategoryForm category={category} onSubmit={handleUpdate} onCancel={() => setIsEditing(false)} />
        </EnhancedCardContent>
      </EnhancedCard>
    )
  }

  if (isEditingLimit) {
    return (
      <EnhancedCard variant="bordered">
        <EnhancedCardHeader>
          <EnhancedCardTitle>Edit Spending Limit</EnhancedCardTitle>
        </EnhancedCardHeader>
        <EnhancedCardContent>
          <CategoryLimitForm category={category} onSubmit={handleUpdate} onCancel={() => setIsEditingLimit(false)} />
        </EnhancedCardContent>
      </EnhancedCard>
    )
  }

  const isOverBudget = category.limit && spent > category.limit
  const spentPercentage = getSpentPercentage()

  return (
    <EnhancedCard
      variant="interactive"
      isHighlighted={isOverBudget}
      className={isOverBudget ? "border-red-200 dark:border-red-900" : ""}
    >
      <EnhancedCardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <EnhancedCardTitle className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full mr-1"
                style={{ backgroundColor: category.color || "#888888" }}
              />
              {category.name}
              {category.isSystem && (
                <Badge variant="outline" className="ml-2 text-xs">
                  System
                </Badge>
              )}
            </EnhancedCardTitle>
            {category.description && <EnhancedCardDescription truncate>{category.description}</EnhancedCardDescription>}
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsDeleting(true)} disabled={category.isSystem}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      </EnhancedCardHeader>

      <EnhancedCardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <div className="text-2xl font-bold">${spent.toFixed(2)}</div>
            {category.limit ? (
              <div className="text-sm text-muted-foreground">of ${category.limit.toFixed(2)}</div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditingLimit(true)} className="text-xs h-7">
                Set Limit
              </Button>
            )}
          </div>

          {category.limit > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span>Budget Usage</span>
                <span className={isOverBudget ? "text-red-500 font-medium" : ""}>{spentPercentage.toFixed(0)}%</span>
              </div>
              <div className="relative">
                <Progress value={spentPercentage} max={100} className="h-2" indicatorClassName={getProgressColor()} />
                {isOverBudget && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="absolute -right-1 -top-1">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Over budget by ${(spent - category.limit).toFixed(2)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          )}
        </div>
      </EnhancedCardContent>

      <EnhancedCardFooter withBorder className="flex justify-between pt-4">
        <div className="text-xs text-muted-foreground">
          {category.type === "expense" ? "Expense" : "Income"} Category
        </div>
        {category.limit > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditingLimit(true)} className="h-7 text-xs">
            Edit Limit
          </Button>
        )}
      </EnhancedCardFooter>

      <DeleteCategoryDialog
        open={isDeleting}
        onOpenChange={setIsDeleting}
        onConfirm={handleDelete}
        category={category}
      />
    </EnhancedCard>
  )
}
