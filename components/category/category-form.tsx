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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Palette } from "lucide-react"
import type { Category } from "@/lib/category-service"
import type { ExpenseType } from "@/types/expense"

// Predefined color palettes
const COLOR_PALETTES = {
  default: [
    "#10b981", // green
    "#ef4444", // red
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#f59e0b", // amber
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#f97316", // orange
    "#6366f1", // indigo
  ],
  pastel: [
    "#a5d8ff", // pastel blue
    "#ffb3c1", // pastel pink
    "#c2f0c2", // pastel green
    "#ffd8a8", // pastel orange
    "#d8bbfd", // pastel purple
    "#ffc9c9", // pastel red
    "#c5f6fa", // pastel cyan
    "#e9ecef", // pastel gray
    "#fff3bf", // pastel yellow
    "#d8f5a2", // pastel lime
  ],
  dark: [
    "#1e293b", // slate 800
    "#1e40af", // blue 800
    "#065f46", // emerald 800
    "#9f1239", // rose 800
    "#7c2d12", // orange 800
    "#4c1d95", // purple 800
    "#831843", // pink 800
    "#134e4a", // teal 800
    "#713f12", // amber 800
    "#365314", // lime 800
  ],
}

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
  const [colorPalette, setColorPalette] = useState<"default" | "pastel" | "dark">("default")

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

    if (budget && Number(budget) > 10000000) {
      newErrors.budget = "Budget cannot exceed ₹1,00,00,000"
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

  // Format currency for display
  const formatCurrency = (value: string) => {
    if (!value) return ""

    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9.]/g, "")

    // Format as Indian Rupees
    if (numericValue) {
      const number = Number.parseFloat(numericValue)
      if (!isNaN(number)) {
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(number)
      }
    }

    return ""
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Category Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Groceries"
          className={errors.name ? "border-destructive" : ""}
        />
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
        {initialData && (
          <p className="text-xs text-muted-foreground">
            Category type cannot be changed after creation to maintain data integrity.
          </p>
        )}
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
        <Label className="flex items-center">
          <Palette className="h-4 w-4 mr-2" />
          Category Color
        </Label>

        <Tabs value={colorPalette} onValueChange={(value) => setColorPalette(value as any)} className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="default">Default</TabsTrigger>
            <TabsTrigger value="pastel">Pastel</TabsTrigger>
            <TabsTrigger value="dark">Dark</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-2 mt-2">
          {COLOR_PALETTES[colorPalette].map((paletteColor) => (
            <button
              key={paletteColor}
              type="button"
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                color === paletteColor ? "border-primary scale-110" : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: paletteColor }}
              onClick={() => setColor(paletteColor)}
              aria-label={`Select color ${paletteColor}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-10 h-10 p-0 rounded-full border-2"
                style={{ backgroundColor: color }}
              >
                <span className="sr-only">Pick a custom color</span>
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
