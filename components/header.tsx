"use client"

import type React from "react"

import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserProfile } from "@/components/auth/user-profile"
import { Wallet, Plus, Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TransactionModal } from "@/components/transaction-modal"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Expense } from "@/types/expense"

interface HeaderProps {
  onExportCSV: () => Promise<void>
  onImportCSV: (file: File) => Promise<void>
  expenses: Expense[]
  onTransactionAdded: (expense: Expense) => void // Add this callback prop
}

export function Header({ onExportCSV, onImportCSV, expenses, onTransactionAdded }: HeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useState<HTMLInputElement | null>(null)

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
      await onExportCSV()
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
      await onImportCSV(file)

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

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Wallet className="h-6 w-6" />
          <span className="text-xl font-bold">Fnzo</span>
        </Link>
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
            ref={(el) => (fileInputRef[1] = el)}
          />

          <ThemeToggle />
          <UserProfile />
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTransactionAdded={onTransactionAdded}
      />
    </header>
  )
}
