"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AppLayout } from "@/components/layout/app-layout"
import { BackupSyncPanel } from "@/components/settings/backup-sync-panel"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { expenseService } from "@/lib/expense-service"
import type { Expense } from "@/types/expense"

export default function BackupPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [isLoading, user, router])

  // Load expenses for backup operations
  useEffect(() => {
    const loadExpenses = async () => {
      if (!user) return

      setIsLoadingExpenses(true)
      setError(null)

      try {
        // Verify authentication first
        const isAuthenticated = await expenseService.verifyAuthentication()
        if (!isAuthenticated) {
          setError("Authentication failed. Please sign in again.")
          return
        }

        const data = await expenseService.getExpenses()
        setExpenses(data)
      } catch (error: any) {
        console.error("Failed to load expenses:", error)

        // Check if it's an auth error
        if (
          error.message?.includes("auth") ||
          error.message?.includes("JWT") ||
          error.message?.includes("token") ||
          error.code === "PGRST301"
        ) {
          setError("Authentication error. Please sign in again.")
        } else {
          setError(error?.message || "Failed to load expenses. Please try again.")
        }
      } finally {
        setIsLoadingExpenses(false)
      }
    }

    if (user) {
      loadExpenses()
    }
  }, [user])

  const handleRefresh = async () => {
    setIsLoadingExpenses(true)
    setError(null)

    try {
      const data = await expenseService.getExpenses()
      setExpenses(data)
    } catch (error: any) {
      console.error("Failed to refresh expenses:", error)
      setError(error?.message || "Failed to refresh expenses. Please try again.")
    } finally {
      setIsLoadingExpenses(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in the useEffect
  }

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Backup & Sync</h1>
        <p className="text-muted-foreground mb-6">Export, import, and synchronize your financial data</p>

        {error ? (
          <div className="space-y-4 mb-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button onClick={handleRefresh} className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <BackupSyncPanel expenses={expenses} isLoading={isLoadingExpenses} onRefresh={handleRefresh} />
        )}
      </div>
    </AppLayout>
  )
}
