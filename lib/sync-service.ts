import { getSupabaseBrowserClient } from "@/lib/supabase"
import { expenseService } from "@/lib/expense-service"

// Define sync status type
export type SyncStatus = {
  status: "idle" | "syncing" | "success" | "error"
  progress: number
  message: string
  lastSynced: string | null
  details?: {
    added: number
    updated: number
    deleted: number
    errors: number
    total: number
  }
}

// Define sync options
export type SyncOptions = {
  direction: "push" | "pull" | "both"
  conflictResolution: "local" | "remote" | "newest"
  onProgress?: (progress: number, message: string) => void
}

// Default sync options
const defaultSyncOptions: SyncOptions = {
  direction: "both",
  conflictResolution: "newest",
}

// Get the last sync timestamp from local storage
const getLastSyncTimestamp = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("fnzo_last_sync_timestamp")
}

// Set the last sync timestamp in local storage
const setLastSyncTimestamp = (timestamp: string): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("fnzo_last_sync_timestamp", timestamp)
}

// Get the sync status from local storage
export const getSyncStatus = (): SyncStatus => {
  if (typeof window === "undefined") {
    return {
      status: "idle",
      progress: 0,
      message: "Ready to sync",
      lastSynced: null,
    }
  }

  const storedStatus = localStorage.getItem("fnzo_sync_status")
  if (!storedStatus) {
    return {
      status: "idle",
      progress: 0,
      message: "Ready to sync",
      lastSynced: getLastSyncTimestamp(),
    }
  }

  try {
    return JSON.parse(storedStatus)
  } catch (error) {
    console.error("Error parsing sync status:", error)
    return {
      status: "idle",
      progress: 0,
      message: "Ready to sync",
      lastSynced: getLastSyncTimestamp(),
    }
  }
}

// Set the sync status in local storage
const setSyncStatus = (status: SyncStatus): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("fnzo_sync_status", JSON.stringify(status))
}

// Update the sync progress
const updateSyncProgress = (
  progress: number,
  message: string,
  status: "syncing" | "success" | "error" = "syncing",
  details?: SyncStatus["details"],
): void => {
  const syncStatus: SyncStatus = {
    status,
    progress,
    message,
    lastSynced: status === "success" ? new Date().toISOString() : getLastSyncTimestamp(),
    details,
  }

  setSyncStatus(syncStatus)

  if (status === "success") {
    setLastSyncTimestamp(syncStatus.lastSynced!)
  }
}

export const syncService = {
  // Synchronize data with external database
  async synchronizeData(options: Partial<SyncOptions> = {}): Promise<SyncStatus> {
    // Merge with default options
    const syncOptions = { ...defaultSyncOptions, ...options }

    try {
      // Verify authentication
      const isAuthenticated = await expenseService.verifyAuthentication()
      if (!isAuthenticated) {
        throw new Error("Authentication failed. Please sign in again.")
      }

      // Initialize sync status
      updateSyncProgress(0, "Starting synchronization...", "syncing")

      // Get the Supabase client
      const supabase = getSupabaseBrowserClient()

      // Get user ID
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("No active session found")
      }
      const userId = session.user.id

      // Fetch local expenses
      updateSyncProgress(10, "Fetching local data...", "syncing")
      const localExpenses = await expenseService.getExpenses()

      // Prepare for sync
      const syncDetails = {
        added: 0,
        updated: 0,
        deleted: 0,
        errors: 0,
        total: localExpenses.length,
      }

      // Simulate sync process with progress updates
      // In a real implementation, this would actually sync with an external database

      // Process each expense
      for (let i = 0; i < localExpenses.length; i++) {
        const expense = localExpenses[i]

        try {
          // Simulate API call to external database
          await new Promise((resolve) => setTimeout(resolve, 50))

          // Update progress
          const progress = Math.round(10 + (i / localExpenses.length) * 80)
          updateSyncProgress(progress, `Syncing transaction ${i + 1} of ${localExpenses.length}...`, "syncing")

          // Simulate different outcomes based on the expense ID
          const lastDigit = Number.parseInt(expense.id.slice(-1), 16) % 4

          if (lastDigit === 0) {
            // Simulate adding a new record
            syncDetails.added++
          } else if (lastDigit === 1) {
            // Simulate updating an existing record
            syncDetails.updated++
          } else if (lastDigit === 2) {
            // Simulate no change needed
            // Do nothing
          } else {
            // Simulate an error for demonstration purposes
            // In a real implementation, we would handle this properly
            if (Math.random() < 0.1) {
              throw new Error(`Simulated sync error for expense ${expense.id}`)
            }
          }
        } catch (error) {
          console.error(`Error syncing expense ${expense.id}:`, error)
          syncDetails.errors++
        }
      }

      // Finalize sync
      updateSyncProgress(100, "Synchronization completed successfully", "success", syncDetails)

      return getSyncStatus()
    } catch (error: any) {
      console.error("Sync error:", error)

      updateSyncProgress(0, `Synchronization failed: ${error.message || "Unknown error"}`, "error")

      return getSyncStatus()
    }
  },

  // Get the current sync status
  getStatus(): SyncStatus {
    return getSyncStatus()
  },

  // Reset the sync status
  resetStatus(): void {
    setSyncStatus({
      status: "idle",
      progress: 0,
      message: "Ready to sync",
      lastSynced: getLastSyncTimestamp(),
    })
  },
}
