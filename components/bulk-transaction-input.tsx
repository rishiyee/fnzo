"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, Plus, Upload, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { expenseService } from "@/lib/expense-service"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Expense, ExpenseType } from "@/types/expense"

interface BulkTransactionInputProps {
  onTransactionsAdded: (expenses: Expense[]) => void
  onClose: () => void
}

interface TransactionRow {
  id: string
  date: Date
  type: ExpenseType
  category: string
  amount: string
  notes: string
  error?: string
}

export function BulkTransactionInput({ onTransactionsAdded, onClose }: BulkTransactionInputProps) {
  const [activeTab, setActiveTab] = useState("manual")
  const [rows, setRows] = useState<TransactionRow[]>([
    {
      id: crypto.randomUUID(),
      date: new Date(),
      type: "expense",
      category: "",
      amount: "",
      notes: "",
    },
  ])
  const [categories, setCategories] = useState<Record<string, string[]>>({
    expense: [],
    income: [],
    savings: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [importStats, setImportStats] = useState<{
    total: number
    imported: number
    skipped: number
    errors: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load categories when component mounts
  useState(() => {
    const loadCategories = async () => {
      try {
        const allCategories = await expenseService.getCategories()
        setCategories(allCategories)
      } catch (error) {
        console.error("Error loading categories:", error)
      }
    }

    loadCategories()
  })

  // Add a new row
  const addRow = () => {
    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        date: new Date(),
        type: "expense",
        category: "",
        amount: "",
        notes: "",
      },
    ])
  }

  // Remove a row
  const removeRow = (id: string) => {
    if (rows.length === 1) {
      // Don't remove the last row, just clear it
      setRows([
        {
          id: crypto.randomUUID(),
          date: new Date(),
          type: "expense",
          category: "",
          amount: "",
          notes: "",
        },
      ])
    } else {
      setRows(rows.filter((row) => row.id !== id))
    }
  }

  // Update a row
  const updateRow = (id: string, field: keyof TransactionRow, value: any) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value }
        }
        return row
      }),
    )
  }

  // Handle CSV file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0])
    }
  }

  // Handle CSV file upload button click
  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Clear selected CSV file
  const clearSelectedFile = () => {
    setCsvFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Validate a single row
  const validateRow = (row: TransactionRow): { isValid: boolean; error?: string } => {
    if (!row.category) {
      return { isValid: false, error: "Category is required" }
    }

    const amount = Number.parseFloat(row.amount)
    if (isNaN(amount) || amount <= 0) {
      return { isValid: false, error: "Amount must be a positive number" }
    }

    return { isValid: true }
  }

  // Validate all rows
  const validateAllRows = (): boolean => {
    let isValid = true
    const updatedRows = rows.map((row) => {
      const validation = validateRow(row)
      if (!validation.isValid) {
        isValid = false
        return { ...row, error: validation.error }
      }
      return { ...row, error: undefined }
    })

    setRows(updatedRows)
    return isValid
  }

  // Submit manual entries
  const handleManualSubmit = async () => {
    if (!validateAllRows()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in your transactions",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const addedExpenses: Expense[] = []

    try {
      for (const row of rows) {
        const expense: Expense = {
          id: "",
          date: row.date.toISOString(),
          type: row.type,
          category: row.category,
          amount: Number.parseFloat(row.amount),
          notes: row.notes,
        }

        const addedExpense = await expenseService.addExpense(expense)
        addedExpenses.push(addedExpense)
      }

      toast({
        title: "Success",
        description: `Added ${addedExpenses.length} transactions successfully`,
      })

      onTransactionsAdded(addedExpenses)
      onClose()
    } catch (error) {
      console.error("Error adding transactions:", error)
      toast({
        title: "Error",
        description: "Failed to add some transactions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Process CSV import
  const handleCsvImport = async () => {
    if (!csvFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setImportProgress(0)
    setImportStats({
      total: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
    })

    try {
      // Read file content
      const csvData = await readFileAsText(csvFile)

      // Parse CSV
      const lines = csvData.split("\n")
      const headers = lines[0].split(",")

      // Validate headers
      const requiredHeaders = ["Date", "Type", "Category", "Amount"]
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))

      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`)
      }

      const dateIndex = headers.indexOf("Date")
      const typeIndex = headers.indexOf("Type")
      const categoryIndex = headers.indexOf("Category")
      const amountIndex = headers.indexOf("Amount")
      const notesIndex = headers.indexOf("Notes")

      // Get existing categories
      const existingCategories = await expenseService.getCategories()
      const newCategories: string[] = []

      // Process rows
      const rows = lines.slice(1).filter((line) => line.trim() !== "")
      const total = rows.length
      let imported = 0
      let skipped = 0
      let errors = 0
      const addedExpenses: Expense[] = []

      setImportStats((prev) => ({ ...prev!, total }))

      for (let i = 0; i < rows.length; i++) {
        try {
          // Update progress
          const progress = Math.round(((i + 1) / rows.length) * 100)
          setImportProgress(progress)

          const row = parseCSVRow(rows[i])

          if (row.length < 4) {
            console.warn(`Skipping row ${i + 2}: insufficient columns`)
            skipped++
            continue
          }

          const type = row[typeIndex].toLowerCase()
          if (!["expense", "income", "savings"].includes(type)) {
            console.warn(`Skipping row ${i + 2}: invalid type "${row[typeIndex]}"`)
            skipped++
            continue
          }

          const category = row[categoryIndex].trim()
          if (!category) {
            console.warn(`Skipping row ${i + 2}: empty category`)
            skipped++
            continue
          }

          // Check if this is a new category
          if (!existingCategories[type].includes(category) && !newCategories.includes(category)) {
            newCategories.push(category)
            // Add to existing categories for subsequent checks
            existingCategories[type].push(category)
          }

          const amount = Number.parseFloat(row[amountIndex].replace(/[^\d.-]/g, ""))
          if (isNaN(amount) || amount <= 0) {
            console.warn(`Skipping row ${i + 2}: invalid amount "${row[amountIndex]}"`)
            skipped++
            continue
          }

          const dateStr = row[dateIndex]
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) {
            console.warn(`Skipping row ${i + 2}: invalid date "${dateStr}"`)
            skipped++
            continue
          }

          // Create expense object
          const expense: Expense = {
            id: "",
            date: date.toISOString(),
            type: type as "expense" | "income" | "savings",
            category,
            amount,
            notes: notesIndex >= 0 && row.length > notesIndex ? row[notesIndex].replace(/^"|"$/g, "") : "",
          }

          try {
            // Add expense to database
            const addedExpense = await expenseService.addExpense(expense)
            addedExpenses.push(addedExpense)
            imported++
          } catch (error) {
            console.error(`Error adding expense at row ${i + 2}:`, error)
            errors++
          }

          // Update import stats
          setImportStats({
            total,
            imported,
            skipped,
            errors,
          })

          // Small delay to prevent overwhelming the database
          await new Promise((resolve) => setTimeout(resolve, 50))
        } catch (error) {
          console.error(`Error processing row ${i + 2}:`, error)
          errors++
          setImportStats({
            total,
            imported,
            skipped,
            errors,
          })
        }
      }

      // If new categories were found, update the categories list
      if (newCategories.length > 0) {
        await expenseService.updateCategoryList(existingCategories)
      }

      toast({
        title: "Import completed",
        description: `Imported ${imported} transactions. ${skipped} were skipped. ${errors} had errors.`,
      })

      if (addedExpenses.length > 0) {
        onTransactionsAdded(addedExpenses)
      }

      // Only close if there were no errors
      if (errors === 0) {
        onClose()
      }
    } catch (error: any) {
      console.error("Import error:", error)
      toast({
        title: "Import failed",
        description: error.message || "An error occurred during import",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string)
        } else {
          reject(new Error("Failed to read file"))
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  }

  // Parse CSV row handling quoted fields
  const parseCSVRow = (row: string): string[] => {
    const result = []
    let insideQuotes = false
    let currentValue = ""

    for (let i = 0; i < row.length; i++) {
      const char = row[i]

      if (char === '"') {
        if (i + 1 < row.length && row[i + 1] === '"') {
          // Handle escaped quotes
          currentValue += '"'
          i++
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes
        }
      } else if (char === "," && !insideQuotes) {
        // End of field
        result.push(currentValue)
        currentValue = ""
      } else {
        currentValue += char
      }
    }

    // Add the last field
    result.push(currentValue)

    return result
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bulk Transaction Input</CardTitle>
        <CardDescription>Add multiple transactions at once to save time</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-4">
              {rows.map((row, index) => (
                <div key={row.id} className="space-y-4 p-4 border rounded-md relative">
                  {rows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeRow(row.id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`date-${row.id}`}>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            id={`date-${row.id}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(row.date, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={row.date}
                            onSelect={(date) => date && updateRow(row.id, "date", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`type-${row.id}`}>Type</Label>
                      <Select
                        value={row.type}
                        onValueChange={(value) => updateRow(row.id, "type", value as ExpenseType)}
                      >
                        <SelectTrigger id={`type-${row.id}`}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`category-${row.id}`}>Category</Label>
                      <Select value={row.category} onValueChange={(value) => updateRow(row.id, "category", value)}>
                        <SelectTrigger id={`category-${row.id}`} className={row.error ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories[row.type]?.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {row.error && row.error.includes("Category") && (
                        <p className="text-sm text-red-500">{row.error}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`amount-${row.id}`}>Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          id={`amount-${row.id}`}
                          type="number"
                          step="1"
                          placeholder="0"
                          value={row.amount}
                          onChange={(e) => updateRow(row.id, "amount", e.target.value)}
                          className={`pl-7 ${row.error && row.error.includes("Amount") ? "border-red-500" : ""}`}
                        />
                      </div>
                      {row.error && row.error.includes("Amount") && <p className="text-sm text-red-500">{row.error}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`notes-${row.id}`}>Notes</Label>
                      <Textarea
                        id={`notes-${row.id}`}
                        placeholder="Add any additional details..."
                        value={row.notes}
                        onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                        className="resize-none min-h-[60px]"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addRow} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Another Transaction
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-md p-6 text-center">
                <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" ref={fileInputRef} />

                {!csvFile ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop your CSV file here, or click to browse
                      </p>
                      <Button onClick={handleFileUploadClick}>Select CSV File</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Badge variant="outline" className="px-3 py-1 text-base flex items-center gap-2">
                      {csvFile.name}
                      <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={clearSelectedFile}>
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove file</span>
                      </Button>
                    </Badge>
                    <p className="text-sm text-muted-foreground">File size: {(csvFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}
              </div>

              <Alert>
                <AlertTitle>CSV Format Requirements</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">Your CSV file should have the following columns:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Date (YYYY-MM-DD format)</li>
                    <li>Type (expense, income, or savings)</li>
                    <li>Category</li>
                    <li>Amount (positive number)</li>
                    <li>Notes (optional)</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {isSubmitting && importStats && (
                <div className="space-y-4">
                  <Progress value={importProgress} className="w-full" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-medium">{importStats.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Imported</p>
                      <p className="text-lg font-medium text-green-600">{importStats.imported}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Skipped</p>
                      <p className="text-lg font-medium text-amber-600">{importStats.skipped}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Errors</p>
                      <p className="text-lg font-medium text-red-600">{importStats.errors}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={activeTab === "manual" ? handleManualSubmit : handleCsvImport}
          disabled={isSubmitting || (activeTab === "csv" && !csvFile)}
        >
          {isSubmitting ? "Processing..." : activeTab === "manual" ? "Add Transactions" : "Import CSV"}
        </Button>
      </CardFooter>
    </Card>
  )
}
