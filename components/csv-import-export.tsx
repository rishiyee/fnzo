"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { expenseService } from "@/lib/expense-service"
import type { Expense } from "@/types/expense"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

interface CSVImportExportProps {
  expenses: Expense[]
  onImportComplete: () => void
}

export function CSVImportExport({ expenses, onImportComplete }: CSVImportExportProps) {
  const { toast } = useToast()
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStats, setImportStats] = useState<{
    total: number
    imported: number
    skipped: number
    newCategories: string[]
  } | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)

  // Export expenses to CSV
  const exportToCSV = async () => {
    try {
      if (expenses.length === 0) {
        toast({
          title: "No data to export",
          description: "Add some transactions before exporting.",
          variant: "destructive",
        })
        return
      }

      // Verify authentication before proceeding
      try {
        const isAuthenticated = await expenseService.verifyAuthentication()
        if (!isAuthenticated) {
          toast({
            title: "Authentication error",
            description: "Please sign in again to export your data.",
            variant: "destructive",
          })
          return
        }
      } catch (authError) {
        console.error("Authentication check failed:", authError)
        toast({
          title: "Authentication error",
          description: "Please sign in again to export your data.",
          variant: "destructive",
        })
        return
      }

      // Convert expenses to CSV format
      const headers = ["Date", "Type", "Category", "Amount", "Notes"]
      const rows = expenses.map((expense) => [
        new Date(expense.date).toISOString().split("T")[0], // Format date as YYYY-MM-DD
        expense.type,
        expense.category,
        expense.amount.toString(),
        `"${expense.notes.replace(/"/g, '""')}"`, // Escape quotes in notes
      ])

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `fnzo-expenses-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: `${expenses.length} transactions exported to CSV.`,
      })
    } catch (error) {
      console.error("Export error:", error)
      throw error
    }
  }

  // Process CSV import
  const processCSVImport = async (file: File) => {
    setIsImporting(true)
    setImportProgress(0)
    setImportStats({
      total: 0,
      imported: 0,
      skipped: 0,
      newCategories: [],
    })
    setShowImportDialog(true)

    try {
      // Verify authentication before proceeding
      try {
        const isAuthenticated = await expenseService.verifyAuthentication()
        if (!isAuthenticated) {
          throw new Error("Authentication failed. Please sign in again.")
        }
      } catch (authError) {
        console.error("Authentication check failed:", authError)
        throw new Error("Authentication failed. Please sign in again.")
      }

      // Read file content
      const csvData = await readFileAsText(file)

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

      setImportStats((prev) => ({ ...prev!, total }))

      for (let i = 0; i < rows.length; i++) {
        // Update progress
        setImportProgress(Math.round((i / rows.length) * 100))

        try {
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

          // Add expense to database
          await expenseService.addExpense(expense)
          imported++

          // Update import stats
          setImportStats((prev) => ({
            ...prev!,
            imported,
            skipped,
            newCategories,
          }))

          // Small delay to prevent overwhelming the database
          await new Promise((resolve) => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`Error processing row ${i + 2}:`, error)
          skipped++
          setImportStats((prev) => ({
            ...prev!,
            skipped,
          }))
        }
      }

      setImportProgress(100)

      // If new categories were found, update the categories list
      if (newCategories.length > 0) {
        await expenseService.updateCategoryList(existingCategories)
      }

      toast({
        title: "Import completed",
        description: `Imported ${imported} transactions. ${skipped} were skipped. ${newCategories.length} new categories added.`,
      })

      // Refresh the expenses list
      onImportComplete()
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An error occurred during import.",
        variant: "destructive",
      })
      throw error
    } finally {
      setIsImporting(false)
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
    <>
      {/* Import Progress Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importing CSV Data</DialogTitle>
            <DialogDescription>{isImporting ? "Processing your data..." : "Import completed"}</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Progress value={importProgress} className="w-full" />

            {importStats && (
              <div className="mt-4 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Total rows:</span> {importStats.total}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Imported:</span> {importStats.imported}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Skipped:</span> {importStats.skipped}
                </p>

                {importStats.newCategories.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">New categories added:</p>
                    <ul className="text-sm mt-1 ml-4 list-disc">
                      {importStats.newCategories.map((category, index) => (
                        <li key={index}>{category}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowImportDialog(false)} disabled={isImporting}>
              {isImporting ? "Please wait..." : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Export the functions for use in other components
export const csvUtils = {
  exportToCSV: async (expenses: Expense[]) => {
    try {
      if (expenses.length === 0) {
        throw new Error("No data to export")
      }

      // Verify authentication before proceeding
      try {
        const isAuthenticated = await expenseService.verifyAuthentication()
        if (!isAuthenticated) {
          throw new Error("Authentication failed. Please sign in again.")
        }
      } catch (authError) {
        console.error("Authentication check failed:", authError)
        throw new Error("Authentication failed. Please sign in again.")
      }

      // Convert expenses to CSV format
      const headers = ["Date", "Type", "Category", "Amount", "Notes"]
      const rows = expenses.map((expense) => [
        new Date(expense.date).toISOString().split("T")[0], // Format date as YYYY-MM-DD
        expense.type,
        expense.category,
        expense.amount.toString(),
        `"${expense.notes.replace(/"/g, '""')}"`, // Escape quotes in notes
      ])

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `fnzo-expenses-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return { success: true, count: expenses.length }
    } catch (error) {
      console.error("Export error:", error)
      throw error
    }
  },

  processCSVImport: async (
    file: File,
    expenses: Expense[],
    onImportComplete: () => void,
    onProgress?: (progress: number, stats: any) => void,
  ) => {
    let imported = 0
    let skipped = 0
    let total = 0
    let newCategories: string[] = []

    try {
      // Verify authentication before proceeding
      try {
        const isAuthenticated = await expenseService.verifyAuthentication()
        if (!isAuthenticated) {
          throw new Error("Authentication failed. Please sign in again.")
        }
      } catch (authError) {
        console.error("Authentication check failed:", authError)
        throw new Error("Authentication failed. Please sign in again.")
      }

      // Read file content
      const csvData = await readFileAsText(file)

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
      newCategories = []

      // Process rows
      const rows = lines.slice(1).filter((line) => line.trim() !== "")
      total = rows.length
      imported = 0
      skipped = 0

      if (onProgress) {
        onProgress(0, { total, imported, skipped, newCategories })
      }

      for (let i = 0; i < rows.length; i++) {
        try {
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

          // Add expense to database
          await expenseService.addExpense(expense)
          imported++

          // Update progress
          if (onProgress) {
            const progress = Math.round((i / rows.length) * 100)
            onProgress(progress, { total, imported, skipped, newCategories })
          }

          // Small delay to prevent overwhelming the database
          await new Promise((resolve) => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`Error processing row ${i + 2}:`, error)
          skipped++

          if (onProgress) {
            const progress = Math.round((i / rows.length) * 100)
            onProgress(progress, { total, imported, skipped, newCategories })
          }
        }
      }

      // If new categories were found, update the categories list
      if (newCategories.length > 0) {
        await expenseService.updateCategoryList(existingCategories)
      }

      // Final progress update
      if (onProgress) {
        onProgress(100, { total, imported, skipped, newCategories })
      }

      // Refresh the expenses list
      onImportComplete()

      return { success: true, imported, skipped, newCategories, total }
    } catch (error) {
      console.error("Import error:", error)

      // Final progress update with error
      if (onProgress) {
        onProgress(0, { total, imported, skipped, newCategories })
      }

      throw error
    }
  },
}

// Helper function to read file as text (for the utility functions)
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

// Parse CSV row handling quoted fields (for the utility functions)
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
