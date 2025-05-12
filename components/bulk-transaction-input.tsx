"use client"

import { useState, useEffect, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { expenseService } from "@/lib/expense-service"
import { CategorySelector } from "@/components/category-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, Trash2 } from "lucide-react"
import type { Expense, ExpenseType } from "@/types/expense"

interface BulkTransactionInputProps {
  onTransactionsAdded: (expenses: Expense[]) => void
  onClose: () => void
}

interface TransactionRow {
  id: string
  date: string
  type: ExpenseType
  category: string
  amount: string
  notes: string
}

const defaultRow = (): TransactionRow => ({
  id: uuidv4(),
  date: format(new Date(), "yyyy-MM-dd"),
  type: "expense",
  category: "",
  amount: "",
  notes: "",
})

export function BulkTransactionInput({ onTransactionsAdded, onClose }: BulkTransactionInputProps) {
  const [rows, setRows] = useState<TransactionRow[]>([defaultRow()])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("manual")
  const [bulkText, setBulkText] = useState("")
  const [categoriesByType, setCategoriesByType] = useState<Record<string, string[]>>({})
  const { toast } = useToast()

  // Load categories once when component mounts
  useEffect(() => {
    let isMounted = true

    const loadCategories = async () => {
      try {
        // Use the correct function name: getCategories instead of getAllCategories
        const categories = await expenseService.getCategories()
        if (isMounted) {
          setCategoriesByType(categories)
        }
      } catch (error) {
        console.error("Error loading categories:", error)
      }
    }

    loadCategories()

    return () => {
      isMounted = false
    }
  }, [])

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, defaultRow()])
  }, [])

  const removeRow = useCallback((id: string) => {
    setRows((prev) => {
      if (prev.length === 1) {
        return [defaultRow()]
      }
      return prev.filter((row) => row.id !== id)
    })
  }, [])

  const updateRow = useCallback((id: string, field: keyof TransactionRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value }
        }
        return row
      }),
    )
  }, [])

  const handleTypeChange = useCallback(
    (id: string, type: ExpenseType) => {
      updateRow(id, "type", type)
    },
    [updateRow],
  )

  const handleCategoryChange = useCallback(
    (id: string, category: string) => {
      updateRow(id, "category", category)
    },
    [updateRow],
  )

  const validateRows = useCallback((): boolean => {
    let isValid = true
    let errorMessage = ""

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row.date) {
        errorMessage = `Row ${i + 1}: Date is required`
        isValid = false
        break
      }
      if (!row.type) {
        errorMessage = `Row ${i + 1}: Type is required`
        isValid = false
        break
      }
      if (!row.category) {
        errorMessage = `Row ${i + 1}: Category is required`
        isValid = false
        break
      }
      if (!row.amount || isNaN(Number.parseFloat(row.amount))) {
        errorMessage = `Row ${i + 1}: Amount must be a valid number`
        isValid = false
        break
      }
    }

    if (!isValid) {
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      })
    }

    return isValid
  }, [rows, toast])

  const handleSubmit = async () => {
    if (!validateRows()) return

    setIsSubmitting(true)
    try {
      const expenses: Expense[] = []

      for (const row of rows) {
        const expense: Expense = {
          id: row.id,
          date: row.date,
          type: row.type,
          category: row.category,
          amount: Number.parseFloat(row.amount),
          notes: row.notes,
        }

        const addedExpense = await expenseService.addExpense(expense)
        expenses.push(addedExpense)
      }

      toast({
        title: "Success",
        description: `Added ${expenses.length} transactions successfully`,
      })

      onTransactionsAdded(expenses)
      onClose()
    } catch (error: any) {
      console.error("Failed to add transactions:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to add transactions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const parseBulkText = useCallback(() => {
    try {
      // Split by new lines
      const lines = bulkText.trim().split("\n")
      const newRows: TransactionRow[] = []

      for (const line of lines) {
        if (!line.trim()) continue

        // Try to parse the line
        // Format expected: Date, Type, Category, Amount, Notes (optional)
        const parts = line.split(",").map((part) => part.trim())

        if (parts.length < 4) {
          throw new Error(`Invalid format in line: ${line}`)
        }

        const dateStr = parts[0]
        const typeStr = parts[1].toLowerCase()
        const category = parts[2]
        const amountStr = parts[3].replace(/[^0-9.-]/g, "") // Remove currency symbols
        const notes = parts.length > 4 ? parts.slice(4).join(", ") : ""

        // Validate date
        let date = dateStr
        try {
          // Try to parse various date formats
          const parsedDate = new Date(dateStr)
          if (!isNaN(parsedDate.getTime())) {
            date = format(parsedDate, "yyyy-MM-dd")
          }
        } catch (e) {
          throw new Error(`Invalid date format in line: ${line}`)
        }

        // Validate type
        let type: ExpenseType = "expense"
        if (typeStr === "income" || typeStr === "savings") {
          type = typeStr as ExpenseType
        }

        // Validate amount
        const amount = Number.parseFloat(amountStr)
        if (isNaN(amount)) {
          throw new Error(`Invalid amount in line: ${line}`)
        }

        newRows.push({
          id: uuidv4(),
          date,
          type,
          category,
          amount: amount.toString(),
          notes,
        })
      }

      if (newRows.length === 0) {
        throw new Error("No valid transactions found")
      }

      setRows(newRows)
      setActiveTab("manual")
      toast({
        title: "Success",
        description: `Parsed ${newRows.length} transactions`,
      })
    } catch (error: any) {
      toast({
        title: "Error parsing transactions",
        description: error.message || "Failed to parse the text. Please check the format.",
        variant: "destructive",
      })
    }
  }, [bulkText, toast])

  return (
    <div className="p-6 pt-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Text</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <div className="space-y-4">
            {rows.map((row, index) => (
              <div key={row.id} className="grid grid-cols-12 gap-2 items-start border p-3 rounded-md">
                <div className="col-span-12 md:col-span-2">
                  <Label htmlFor={`date-${row.id}`}>Date</Label>
                  <Input
                    id={`date-${row.id}`}
                    type="date"
                    value={row.date}
                    onChange={(e) => updateRow(row.id, "date", e.target.value)}
                  />
                </div>

                <div className="col-span-12 md:col-span-2">
                  <Label>Type</Label>
                  <div className="flex mt-2 space-x-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={row.type === "expense" ? "default" : "outline"}
                      className="flex-1 h-8"
                      onClick={() => handleTypeChange(row.id, "expense")}
                    >
                      Expense
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={row.type === "income" ? "default" : "outline"}
                      className="flex-1 h-8"
                      onClick={() => handleTypeChange(row.id, "income")}
                    >
                      Income
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={row.type === "savings" ? "default" : "outline"}
                      className="flex-1 h-8"
                      onClick={() => handleTypeChange(row.id, "savings")}
                    >
                      Savings
                    </Button>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-2">
                  <Label htmlFor={`category-${row.id}`}>Category</Label>
                  <CategorySelector
                    id={`category-${row.id}`}
                    type={row.type}
                    value={row.category}
                    onChange={(value) => handleCategoryChange(row.id, value)}
                  />
                </div>

                <div className="col-span-12 md:col-span-2">
                  <Label htmlFor={`amount-${row.id}`}>Amount</Label>
                  <Input
                    id={`amount-${row.id}`}
                    type="number"
                    value={row.amount}
                    onChange={(e) => updateRow(row.id, "amount", e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="col-span-12 md:col-span-3">
                  <Label htmlFor={`notes-${row.id}`}>Notes</Label>
                  <Input
                    id={`notes-${row.id}`}
                    value={row.notes}
                    onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                    placeholder="Optional notes"
                  />
                </div>

                <div className="col-span-12 md:col-span-1 flex items-end justify-end h-full">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove row</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={addRow}>
              <Plus className="mr-1 h-4 w-4" /> Add Row
            </Button>

            <div className="space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save All Transactions
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-text">Paste Transactions (CSV format)</Label>
            <Textarea
              id="bulk-text"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Date, Type, Category, Amount, Notes (optional)
2023-05-01, Expense, Food, 1500, Lunch
2023-05-02, Income, Salary, 50000
..."
              className="min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Format: Date, Type (Expense/Income/Savings), Category, Amount, Notes (optional)
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={parseBulkText}>
              Parse & Continue
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
