"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import OverviewSummary from "@/components/overview-summary"
import { OverviewStats } from "@/components/overview-stats"
import { ExpenseGraph } from "@/components/expense-graph"
import { ExpenseGraphSkeleton } from "@/components/skeleton/expense-graph-skeleton"
import { AppLayout } from "@/components/layout/app-layout"
import { expenseService } from "@/lib/expense-service"
import { useFilter } from "@/contexts/filter-context"
import type { Expense } from "@/types/expense"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"

export default function Home() {
  const { user, isLoading, refreshSession } = useAuth()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true)
  const { toast } = useToast()
  const hasAttemptedRefresh = useRef(false)
  const addTransactionCallback = useRef<((expense: Expense) => void) | null>(null)
  const addTransactionsCallback = useRef<((expenses: Expense[]) => void) | null>(null)
  const { applyFilters } = useFilter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading) {
        if (!user) {
          console.log("No user found, redirecting to auth page")
          router.push("/auth")
        } else {
          try {
            // Only try to refresh the session once during initial load
            if (!hasAttemptedRefresh.current) {
              hasAttemptedRefresh.current = true
              try {
                await refreshSession()

                // After refresh, check if we still have a user
                if (!user) {
                  console.log("Session refresh cleared the user, redirecting to auth")
                  router.push("/auth")
                  return
                }
              } catch (refreshError) {
                console.error("Error refreshing session:", refreshError)
                // Continue with the current session if refresh fails
              }
            }

            setAuthChecked(true)

            // Load expenses for the header buttons
            try {
              setIsLoadingExpenses(true)
              const data = await expenseService.getExpenses()
              setExpenses(data)
            } catch (error: any) {
              console.error("Failed to load expenses:", error)

              // Check if it's an auth error and redirect if needed
              if (
                error.message?.includes("auth") ||
                error.message?.includes("JWT") ||
                error.message?.includes("token") ||
                error.code === "PGRST301"
              ) {
                console.log("Authentication error loading expenses, redirecting to auth")
                router.push("/auth")
                return
              }
            } finally {
              setIsLoadingExpenses(false)
            }
          } catch (error) {
            console.error("Critical auth error:", error)
            router.push("/auth")
          }
        }
      }
    }

    checkAuth()
  }, [isLoading, user, router, refreshSession])

  // Handle CSV export
  const handleExportCSV = async () => {
    try {
      // Verify authentication before proceeding
      const isAuthenticated = await expenseService.verifyAuthentication()
      if (!isAuthenticated) {
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

      toast({
        title: "Export successful",
        description: `${expenses.length} transactions exported to CSV.`,
      })
    } catch (error: any) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: error?.message || "An error occurred while exporting data.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Handle CSV import
  const handleImportCSV = async (file: File) => {
    try {
      // Read file content
      const csvData = await readFileAsText(file)

      // Process the CSV data
      await processCSVImport(csvData)

      // Refresh expenses
      const data = await expenseService.getExpenses()
      setExpenses(data)

      toast({
        title: "Import successful",
        description: "Your transactions have been imported.",
      })
    } catch (error: any) {
      console.error("Import error:", error)
      toast({
        title: "Import failed",
        description: error?.message || "An error occurred while importing data.",
        variant: "destructive",
      })
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

  // Process CSV import
  const processCSVImport = async (csvData: string) => {
    // Verify authentication before proceeding
    const isAuthenticated = await expenseService.verifyAuthentication()
    if (!isAuthenticated) {
      throw new Error("Authentication failed. Please sign in again.")
    }

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
    let imported = 0
    let skipped = 0

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

        // Small delay to prevent overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 50))
      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error)
        skipped++
      }
    }

    // If new categories were found, update the categories list
    if (newCategories.length > 0) {
      await expenseService.updateCategoryList(existingCategories)
    }

    toast({
      title: "Import completed",
      description: `Imported ${imported} transactions. ${skipped} were skipped. ${newCategories.length} new categories added.`,
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

  // Handle expense updates
  const handleExpensesUpdated = useCallback((newExpenses: Expense[]) => {
    setExpenses(newExpenses)
  }, [])

  // Register the callback for adding transactions
  const registerAddTransactionCallback = useCallback((callback: (expense: Expense) => void) => {
    addTransactionCallback.current = callback
  }, [])

  // Register the callback for adding multiple transactions
  const registerAddTransactionsCallback = useCallback((callback: (expenses: Expense[]) => void) => {
    addTransactionsCallback.current = callback
  }, [])

  // Handle transaction added
  const handleTransactionAdded = useCallback((expense: Expense) => {
    // Update the expenses state in this component
    setExpenses((prev) => [expense, ...prev])

    // Call the callback in ExpenseTracker if it exists
    if (addTransactionCallback.current) {
      addTransactionCallback.current(expense)
    }
  }, [])

  // Handle multiple transactions added
  const handleTransactionsAdded = useCallback((newExpenses: Expense[]) => {
    // Update the expenses state in this component
    setExpenses((prev) => [...newExpenses, ...prev])

    // Call the callback in ExpenseTracker if it exists
    if (addTransactionsCallback.current) {
      addTransactionsCallback.current(newExpenses)
    }
  }, [])

  // Get filtered expenses
  const filteredExpenses = applyFilters(expenses)

  if (isLoading || !authChecked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in the useEffect
  }

  return (
    <AppLayout>
      <div className="p-6 w-full">
        <div className="mb-6 w-full">
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-muted-foreground">Welcome back! Here's a summary of your finances.</p>
        </div>
        <div className="space-y-8 w-full">
          <OverviewStats />

          {isLoadingExpenses ? <ExpenseGraphSkeleton /> : <ExpenseGraph expenses={filteredExpenses} />}

          <OverviewSummary
            onExpensesUpdated={handleExpensesUpdated}
            onAddTransaction={registerAddTransactionCallback}
            onAddTransactions={registerAddTransactionsCallback}
          />
        </div>
      </div>

      <Header
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
        expenses={expenses}
        onTransactionAdded={handleTransactionAdded}
        onTransactionsAdded={handleTransactionsAdded}
      />
    </AppLayout>
  )
}
