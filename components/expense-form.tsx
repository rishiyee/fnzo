"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { expenseService } from "@/lib/expense-service"

import type { Expense, ExpenseType, ExpenseCategory } from "@/types/expense"

type ExpenseFormProps = {
  onSubmit: (expense: Expense) => void
  initialData?: Expense
  isSubmitting?: boolean
  isModal?: boolean
}

export function ExpenseForm({ onSubmit, initialData, isSubmitting = false, isModal = false }: ExpenseFormProps) {
  // Initialize state with initial data or defaults
  const [date, setDate] = useState<Date>(initialData ? new Date(initialData.date) : new Date())
  const [type, setType] = useState<ExpenseType>(initialData?.type || "expense")
  const [category, setCategory] = useState<string>(initialData?.category || "")
  const [amount, setAmount] = useState<string>(initialData?.amount ? initialData.amount.toString() : "")
  const [notes, setNotes] = useState<string>(initialData?.notes || "")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localSubmitting, setLocalSubmitting] = useState(false)
  const [categories, setCategories] = useState<Record<string, string[]>>({
    expense: [],
    income: [],
    savings: [],
  })

  // Load categories when component mounts or type changes
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
  }, [type])

  // Add a useEffect to listen for category updates
  useEffect(() => {
    const handleCategoryUpdate = () => {
      // Refresh categories when a category is updated
      const loadCategories = async () => {
        try {
          console.log("Refreshing categories in expense form due to category update event")
          const allCategories = await expenseService.getCategories()
          setCategories(allCategories)

          // If the current category no longer exists, reset it
          if (category && !allCategories[type]?.includes(category)) {
            console.log(`Selected category "${category}" no longer exists in type "${type}", resetting selection`)
            setCategory("")
          }
        } catch (error) {
          console.error("Error loading categories:", error)
        }
      }

      loadCategories()
    }

    if (typeof window !== "undefined") {
      window.addEventListener("category-updated", handleCategoryUpdate)
      window.addEventListener("category-sync", handleCategoryUpdate)

      return () => {
        window.removeEventListener("category-updated", handleCategoryUpdate)
        window.removeEventListener("category-sync", handleCategoryUpdate)
      }
    }
  }, [category, type])

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

  // Get categories based on expense type
  const getCategories = () => {
    return categories[type] || []
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalSubmitting(true)

    // Validate form
    const newErrors: Record<string, string> = {}

    if (!date) {
      newErrors.date = "Date is required"
    }

    if (!type) {
      newErrors.type = "Type is required"
    }

    if (!category) {
      newErrors.category = "Category is required"
    }

    if (!amount) {
      newErrors.amount = "Amount is required"
    } else {
      const amountValue = Number.parseFloat(amount)
      if (isNaN(amountValue)) {
        newErrors.amount = "Amount must be a valid number"
      } else if (amountValue <= 0) {
        newErrors.amount = "Amount must be greater than zero"
      } else if (amountValue > 10000000) {
        // 1 crore limit
        newErrors.amount = "Amount cannot exceed ₹1,00,00,000"
      }
    }

    setErrors(newErrors)

    // If there are errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      setLocalSubmitting(false)
      return
    }

    // Create expense object
    const expense: Expense = {
      id: initialData?.id || "",
      date: date.toISOString(),
      type,
      category: category as ExpenseCategory,
      amount: Number.parseFloat(amount),
      notes,
    }

    try {
      // Submit form
      onSubmit(expense)

      // Reset form if not editing and not in modal
      if (!initialData && !isModal) {
        setDate(new Date())
        setType("expense")
        setCategory("")
        setAmount("")
        setNotes("")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setLocalSubmitting(false)
    }
  }

  // Handle type change
  const handleTypeChange = (value: string) => {
    setType(value as ExpenseType)
    setCategory("")
  }

  // Determine if the form is in a submitting state
  const formIsSubmitting = isSubmitting || localSubmitting

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="date" className="text-sm font-medium">
            Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${errors.date ? "border-destructive" : ""}`}
                id="date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
            </PopoverContent>
          </Popover>
          {errors.date && <p className="text-sm text-destructive mt-1">{errors.date}</p>}
        </div>

        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="type" className="text-sm font-medium">
            Type
          </Label>
          <Select value={type} onValueChange={handleTypeChange}>
            <SelectTrigger id="type" className={errors.type ? "border-destructive" : ""}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-destructive mt-1">{errors.type}</p>}
        </div>

        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="category" className="text-sm font-medium">
            Category
          </Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className={errors.category ? "border-destructive" : ""}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {getCategories().map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
        </div>

        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="amount" className="text-sm font-medium">
            Amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
            <Input
              id="amount"
              type="number"
              step="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`pl-7 ${errors.amount ? "border-destructive" : ""}`}
            />
          </div>
          {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount}</p>}
        </div>

        <div className="flex flex-col space-y-1.5 md:col-span-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            Notes
          </Label>
          <Textarea
            id="notes"
            placeholder="Add any additional details..."
            className="resize-none min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="w-full md:w-auto min-w-[120px]" disabled={formIsSubmitting}>
          {formIsSubmitting ? "Saving..." : initialData ? "Update" : "Add Transaction"}
        </Button>
      </div>
    </form>
  )
}
