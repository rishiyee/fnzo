"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { OverviewStats } from "@/components/overview-stats"
import { AppLayout } from "@/components/layout/app-layout"
import { expenseService } from "@/lib/expense-service"
import { useFilter } from "@/contexts/filter-context"
import type { Expense } from "@/types/expense"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UnifiedFilter } from "@/components/unified-filter"
import { ExpenseTable } from "@/components/expense-table"
import { ExpenseTableSkeleton } from "@/components/skeleton/expense-table-skeleton"
import { TransactionModal } from "@/components/transaction-modal"
import { BulkTransactionModal } from "@/components/bulk-transaction-modal"
import { Plus, Download, Upload, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import OverviewSummary from "@/components/overview-summary"
import { CATEGORY_UPDATED_EVENT } from "@/lib/category-service"

export default function Home() {
  const { user, isLoading, refreshSession } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authChecked, setAuthChecked] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true)
  const { toast } = useToast()
  const hasAttemptedRefresh = useRef(false)
  const addTransactionCallback = useRef<((expense: Expense) => void) | null>(null)
  const addTransactionsCallback = useRef<((expenses: Expense[]) => void) | null>(null)
  const { applyFilters } = useFilter()

  // Transaction page state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Expense
    direction: "ascending" | "descending"
  } | null>({ key: "date", direction: "descending" })

  // Get the active tab from URL or default to "overview"
  const tabParam = searchParams?.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam === "transactions" ? "transactions" : "overview")

  // Update URL when tab changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("tab", activeTab)
      window.history.replaceState({}, "", url.toString())
    }
  }, [activeTab])

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

  // Listen for category updates
  useEffect(() => {
    const handleCategoryUpdate = () => {
      loadExpenses()
    }

    if (typeof window !== "undefined") {
      window.addEventListener(CATEGORY_UPDATED_EVENT, handleCategoryUpdate)

      return () => {
        window.removeEventListener(CATEGORY_UPDATED_EVENT, handleCategoryUpdate)
      }
    }
  }, [])

  const loadExpenses = useCallback(async () => {
    if (!user) return

    setIsLoadingExpenses(true)
    try {
      const data = await expenseService.getExpenses()
      setExpenses(data)
    } catch (error) {
      console.error("Failed to load expenses:", error)
      toast({
        title: "Error",
        description: "Failed to load transactions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingExpenses(false)
    }
  }, [user, toast])

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
        `"${expense.notes?.replace(/"/g, '""') || ""}"`, // Escape quotes in notes
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

  // Transaction page functions
  const handleSort = (key: keyof Expense) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  const updateExpense = async (updatedExpense: Expense) => {
    try {
      const expense = await expenseService.updateExpense(updatedExpense)
      setExpenses((prev) => prev.map((item) => (item.id === expense.id ? expense : item)))

      toast({
        title: "Success",
        description: "Transaction updated successfully",
      })
    } catch (error: any) {
      console.error("Failed to update transaction:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to update transaction. Please try again.",
        variant: "destructive",
      })
    }
  }

  const deleteExpense = async (id: string) => {
    try {
      await expenseService.deleteExpense(id)
      setExpenses((prev) => prev.filter((expense) => expense.id !== id))

      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      })
    } catch (error: any) {
      console.error("Failed to delete transaction:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to delete transaction. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleImportClick = () => {
    document.getElementById("csv-file-input")?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await handleImportCSV(file)

      // Reset file input
      if (event.target) {
        event.target.value = ""
      }
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Import failed",
        description: "An error occurred while importing data.",
        variant: "destructive",
      })
    }
  }

  // Get filtered expenses
  const filteredExpenses = applyFilters(expenses)

  // Apply sorting to filtered expenses
  const sortedFilteredExpenses = [...filteredExpenses].sort((a, b) => {
    if (!sortConfig) return 0

    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? -1 : 1
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? 1 : -1
    }
    return 0
  })

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
        <div className="flex justify-between items-center mb-6 w-full">
          <div>
            <h1 className="text-2xl font-bold">Financial Dashboard</h1>
            <p className="text-muted-foreground">Manage your finances in one place</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {/* Add Transaction Button */}
            <Button onClick={() => setIsModalOpen(true)} className="hidden sm:flex" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add Transaction
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="sm:hidden" size="icon" variant="outline">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add Transaction</span>
            </Button>

            {/* Bulk Add Button */}
            <Button onClick={() => setIsBulkModalOpen(true)} className="hidden sm:flex" size="sm" variant="outline">
              <List className="mr-1 h-4 w-4" />
              Bulk Add
            </Button>
            <Button onClick={() => setIsBulkModalOpen(true)} className="sm:hidden" size="icon" variant="outline">
              <List className="h-4 w-4" />
              <span className="sr-only">Bulk Add</span>
            </Button>

            {/* Export Button */}
            <Button onClick={handleExportCSV} className="hidden md:flex" size="sm" variant="outline">
              <Download className="mr-1 h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleExportCSV} className="md:hidden" size="icon" variant="outline">
              <Download className="h-4 w-4" />
              <span className="sr-only">Export</span>
            </Button>

            {/* Import Button */}
            <Button onClick={handleImportClick} className="hidden md:flex" size="sm" variant="outline">
              <Upload className="mr-1 h-4 w-4" />
              Import
            </Button>
            <Button onClick={handleImportClick} className="md:hidden" size="icon" variant="outline">
              <Upload className="h-4 w-4" />
              <span className="sr-only">Import</span>
            </Button>
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              ref={(el) => (fileInputRef.current = el)}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewStats />
            <OverviewSummary
              onExpensesUpdated={handleExpensesUpdated}
              onAddTransaction={registerAddTransactionCallback}
            />
          </TabsContent>

          <TabsContent value="transactions">
            <div className="mb-6 w-full">
              <UnifiedFilter />
              <div className="mt-2 text-sm text-muted-foreground">
                {filteredExpenses.length} {filteredExpenses.length === 1 ? "transaction" : "transactions"} found
              </div>
            </div>

            {isLoadingExpenses ? (
              <ExpenseTableSkeleton />
            ) : (
              <div className="w-full overflow-x-auto">
                <ExpenseTable
                  expenses={sortedFilteredExpenses}
                  onUpdate={updateExpense}
                  onDelete={deleteExpense}
                  onSort={handleSort}
                  sortConfig={sortConfig}
                  isLoading={false}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onTransactionAdded={handleTransactionAdded}
        />

        <BulkTransactionModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          onTransactionsAdded={handleTransactionsAdded}
        />
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
