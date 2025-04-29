"use client"

import type React from "react"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useCategories } from "@/contexts/category-context"
import { AppLayout } from "@/components/layout/app-layout"
import { expenseService } from "@/lib/expense-service"
import { ExpenseTable } from "@/components/expense-table"
import { ExpenseTableSkeleton } from "@/components/skeleton/expense-table-skeleton"
import { Button } from "@/components/ui/button"
// Add imports for the icons
import { Plus, Download, Upload, List } from "lucide-react"
import { TransactionModal } from "@/components/transaction-modal"
import { UnifiedFilter } from "@/components/unified-filter"
import { useFilter } from "@/contexts/filter-context"
import { useToast } from "@/hooks/use-toast"
import { CATEGORY_UPDATED_EVENT } from "@/lib/category-service"
import type { Expense } from "@/types/expense"
import { BulkTransactionModal } from "@/components/bulk-transaction-modal"

export default function TransactionsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  // Add the necessary state and functions for the buttons
  // Add these after the existing state declarations

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Expense
    direction: "ascending" | "descending"
  } | null>({ key: "date", direction: "descending" })
  const { toast } = useToast()
  const { applyFilters } = useFilter()
  const { refreshCategories } = useCategories()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [isLoading, user, router])

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

  useEffect(() => {
    if (user) {
      loadExpenses()
    }
  }, [user, loadExpenses])

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
  }, [loadExpenses])

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

  const handleTransactionAdded = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev])
  }

  const handleExport = async () => {
    if (expenses.length === 0) {
      toast({
        title: "No data to export",
        description: "Add some transactions before exporting.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create CSV content
      const csvContent = [
        ["Date", "Type", "Category", "Amount", "Notes"].join(","),
        ...expenses.map((expense) =>
          [
            new Date(expense.date).toISOString().split("T")[0],
            expense.type,
            expense.category,
            expense.amount,
            `"${expense.notes?.replace(/"/g, '""') || ""}"`,
          ].join(","),
        ),
      ].join("\n")

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: "Your transactions have been exported to CSV.",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: "An error occurred while exporting data.",
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
      const reader = new FileReader()
      reader.onload = async (e) => {
        const csvText = e.target?.result as string
        const lines = csvText.split("\n")
        const headers = lines[0].split(",")

        const dateIndex = headers.findIndex((h) => h.toLowerCase().includes("date"))
        const typeIndex = headers.findIndex((h) => h.toLowerCase().includes("type"))
        const categoryIndex = headers.findIndex((h) => h.toLowerCase().includes("category"))
        const amountIndex = headers.findIndex((h) => h.toLowerCase().includes("amount"))
        const notesIndex = headers.findIndex((h) => h.toLowerCase().includes("notes"))

        if (dateIndex === -1 || typeIndex === -1 || categoryIndex === -1 || amountIndex === -1) {
          toast({
            title: "Invalid CSV format",
            description: "The CSV file must include Date, Type, Category, and Amount columns.",
            variant: "destructive",
          })
          return
        }

        const newExpenses: Omit<Expense, "id" | "user_id" | "created_at" | "updated_at">[] = []

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue

          const values = lines[i].split(",")

          // Handle quoted fields (especially for notes which might contain commas)
          const processedValues: string[] = []
          let tempValue = ""
          let inQuotes = false

          for (const value of values) {
            if (inQuotes) {
              tempValue += "," + value
              if (value.endsWith('"') && !value.endsWith('""')) {
                inQuotes = false
                processedValues.push(tempValue.slice(1, -1).replace(/""/g, '"'))
                tempValue = ""
              }
            } else if (value.startsWith('"') && !value.endsWith('"')) {
              inQuotes = true
              tempValue = value
            } else {
              processedValues.push(value.replace(/^"(.+)"$/, "$1").replace(/""/g, '"'))
            }
          }

          const expense: Omit<Expense, "id" | "user_id" | "created_at" | "updated_at"> = {
            date: new Date(processedValues[dateIndex]),
            type: processedValues[typeIndex] as "expense" | "income" | "savings",
            category: processedValues[categoryIndex],
            amount: Number.parseFloat(processedValues[amountIndex]),
            notes: notesIndex !== -1 ? processedValues[notesIndex] : undefined,
          }

          newExpenses.push(expense)
        }

        if (newExpenses.length === 0) {
          toast({
            title: "No valid transactions found",
            description: "The CSV file doesn't contain any valid transactions.",
            variant: "destructive",
          })
          return
        }

        // Add the expenses to the database
        const addedExpenses = await Promise.all(newExpenses.map((expense) => expenseService.addExpense(expense)))

        // Update the UI
        setExpenses((prev) => [...addedExpenses, ...prev])

        toast({
          title: "Import successful",
          description: `${addedExpenses.length} transactions have been imported.`,
        })
      }

      reader.readAsText(file)

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

  const handleTransactionsAdded = (newExpenses: Expense[]) => {
    setExpenses((prev) => [...newExpenses, ...prev])
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

  if (isLoading) {
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
        {/* Add the following code after the page title section and before the UnifiedFilter */}

        <div className="flex justify-between items-center mb-6 w-full">
          <div>
            <h1 className="text-2xl font-bold">Recent Transactions</h1>
            <p className="text-muted-foreground">View and manage your recent financial activities</p>
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
            <Button onClick={handleExport} className="hidden md:flex" size="sm" variant="outline">
              <Download className="mr-1 h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleExport} className="md:hidden" size="icon" variant="outline">
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
    </AppLayout>
  )
}
