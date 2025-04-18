"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HexColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Category } from "@/lib/category-service"
import type { ExpenseType } from "@/types/expense"

interface CategoryFormProps {
  initialData?: Category
  onSubmit: (category: Omit<Category, "id">) => void
  isSubmitting?: boolean
}

export function CategoryForm({ initialData, onSubmit, isSubmitting = false }: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [type, setType] = useState<ExpenseType>(initialData?.type || "expense")
  const [budget, setBudget] = useState<string>(initialData?.budget ? initialData.budget.toString() : "")
  const [color, setColor] = useState(initialData?.color || "#3b82f6") // Default blue
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setDescription(initialData.description || "")
      setType(initialData.type)
      setBudget(initialData.budget ? initialData.budget.toString() : "")
      setColor(initialData.color || "#3b82f6")
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Category name is required"
    }

    if (!type) {
      newErrors.type = "Category type is required"
    }

    if (budget && isNaN(Number(budget))) {
      newErrors.budget = "Budget must be a valid number"
    }

    if (budget && Number(budget) < 0) {
      newErrors.budget = "Budget cannot be negative"
    }

    setErrors(newErrors)

    // If there are errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      return
    }

    // Create category object
    const category = {
      name: name.trim(),
      description: description.trim(),
      type,
      budget: budget ? Number(budget) : undefined,
      color,
      isDefault: initialData?.isDefault || false,
    }

    // Submit form
    onSubmit(category)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Category Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Groceries"
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description for this category"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Category Type</Label>
        <Select
          value={type}
          onValueChange={(value) => setType(value as ExpenseType)}
          disabled={!!initialData} // Can't change type of existing category
        >
          <SelectTrigger id="type" className={errors.type ? "border-destructive" : ""}>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="savings">Savings</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Budget (Optional)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
          <Input
            id="budget"
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g., 5000"
            className={`pl-7 ${errors.budget ? "border-destructive" : ""}`}
          />
        </div>
        {errors.budget ? (
          <p className="text-sm text-destructive">{errors.budget}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Set a monthly budget for this category (leave empty for no budget)
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Category Color</Label>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-10 h-10 p-0 rounded-full border-2"
                style={{ backgroundColor: color }}
              >
                <span className="sr-only">Pick a color</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <HexColorPicker color={color} onChange={setColor} />
            </PopoverContent>
          </Popover>
          <Input value={color} onChange={(e) => setColor(e.target.value)} className="font-mono" maxLength={7} />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialData ? "Update Category" : "Add Category"}
        </Button>
      </div>
    </form>
  )
}
