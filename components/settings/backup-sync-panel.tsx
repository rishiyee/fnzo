"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { csvUtils } from "@/components/csv-import-export"
import { syncService, type SyncStatus } from "@/lib/sync-service"
import type { Expense } from "@/types/expense"
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  CloudIcon as CloudSync,
  RefreshCw,
  Clock,
  Info,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface BackupSyncPanelProps {
  expenses: Expense[]
  isLoading: boolean
  onRefresh: () => Promise<void>
}

export function BackupSyncPanel({ expenses, isLoading, onRefresh }: BackupSyncPanelProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("backup")

  // CSV import state
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStats, setImportStats] = useState<{
    total: number
    imported: number
    skipped: number
    newCategories: string[]
  } | null>(null)

  // CSV export state
  const [isExporting, setIsExporting] = useState(false)

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus())
  const [isSyncing, setIsSyncing] = useState(false)

  // Update sync status periodically during sync
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isSyncing) {
      interval = setInterval(() => {
        const status = syncService.getStatus()
        setSyncStatus(status)

        if (status.status !== "syncing") {
          setIsSyncing(false)
          clearInterval(interval!)
        }
      }, 200)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isSyncing])

  // Handle CSV export
  const handleExport = async () => {
    if (expenses.length === 0) {
      toast({
        title: "No data to export",
        description: "Add some transactions before exporting.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      await csvUtils.exportToCSV(expenses)

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
    } finally {
      setIsExporting(false)
    }
  }

  // Handle CSV import button click
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  // Handle file selection for import
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportProgress(0)
    setImportStats({
      total: 0,
      imported: 0,
      skipped: 0,
      newCategories: [],
    })

    try {
      // Create a custom progress handler
      const handleProgress = (progress: number, stats: any) => {
        setImportProgress(progress)
        setImportStats(stats)
      }

      // Process the CSV import
      await csvUtils.processCSVImport(file, expenses, async () => {
        await onRefresh()

        toast({
          title: "Import completed",
          description: "Your transactions have been imported successfully.",
        })
      })

      // Reset file input
      if (event.target) {
        event.target.value = ""
      }
    } catch (error: any) {
      console.error("Import error:", error)

      toast({
        title: "Import failed",
        description: error?.message || "An error occurred while importing data.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Handle database sync
  const handleSync = async () => {
    if (isSyncing) return

    setIsSyncing(true)

    try {
      // Start the sync process
      const result = await syncService.synchronizeData()

      // Update the sync status
      setSyncStatus(result)

      // Show toast based on result
      if (result.status === "success") {
        toast({
          title: "Sync completed",
          description: `Successfully synchronized your data.`,
        })

        // Refresh expenses to show any changes
        await onRefresh()
      } else if (result.status === "error") {
        toast({
          title: "Sync failed",
          description: result.message || "An error occurred during synchronization.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Sync error:", error)

      toast({
        title: "Sync failed",
        description: error?.message || "An error occurred during synchronization.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Format the last synced date
  const formatLastSynced = (dateString: string | null) => {
    if (!dateString) return "Never"

    const date = new Date(dateString)
    return `${formatDistanceToNow(date, { addSuffix: true })} (${format(date, "MMM d, yyyy h:mm a")})`
  }

  return (
    <Tabs defaultValue="backup" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
        <TabsTrigger value="sync">Synchronization</TabsTrigger>
      </TabsList>

      <TabsContent value="backup" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>CSV Export & Import</CardTitle>
            <CardDescription>Backup your data to a CSV file or restore from a previous backup</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Export Section */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Export Data</CardTitle>
                    <Download className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription>Download your transactions as a CSV file</CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will export all your {expenses.length} transactions to a CSV file that you can save as a backup
                    or import into other applications.
                  </p>

                  <Button
                    onClick={handleExport}
                    disabled={isExporting || expenses.length === 0 || isLoading}
                    className="w-full"
                  >
                    {isExporting ? (
                      <>
                        <span className="mr-2">Exporting...</span>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export to CSV
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Import Section */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Import Data</CardTitle>
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription>Restore your transactions from a CSV file</CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Import transactions from a CSV file. The file should have headers for Date, Type, Category, Amount,
                    and optionally Notes.
                  </p>

                  <Button onClick={handleImportClick} disabled={isImporting || isLoading} className="w-full">
                    {isImporting ? (
                      <>
                        <span className="mr-2">Importing...</span>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Import from CSV
                      </>
                    )}
                  </Button>

                  <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                </CardContent>
              </Card>
            </div>

            {/* Import Progress */}
            {isImporting && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Import Progress</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Progress value={importProgress} className="w-full" />

                  {importStats && (
                    <div className="grid gap-2 md:grid-cols-4">
                      <div className="bg-muted rounded-md p-3">
                        <div className="text-sm font-medium">Total</div>
                        <div className="text-2xl font-bold">{importStats.total}</div>
                      </div>

                      <div className="bg-muted rounded-md p-3">
                        <div className="text-sm font-medium">Imported</div>
                        <div className="text-2xl font-bold text-green-600">{importStats.imported}</div>
                      </div>

                      <div className="bg-muted rounded-md p-3">
                        <div className="text-sm font-medium">Skipped</div>
                        <div className="text-2xl font-bold text-amber-600">{importStats.skipped}</div>
                      </div>

                      <div className="bg-muted rounded-md p-3">
                        <div className="text-sm font-medium">New Categories</div>
                        <div className="text-2xl font-bold text-blue-600">{importStats.newCategories.length}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                <span className="flex items-center">
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Loading data...
                </span>
              ) : (
                <span>{expenses.length} transactions available</span>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="sync" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Database Synchronization</CardTitle>
            <CardDescription>Sync your data with an external database for additional backup</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Sync Status */}
            <div className="flex items-center justify-between bg-muted p-4 rounded-md">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Last Synced</div>
                  <div className="text-sm">{formatLastSynced(syncStatus.lastSynced)}</div>
                </div>
              </div>

              <Badge
                variant={
                  syncStatus.status === "success"
                    ? "default"
                    : syncStatus.status === "error"
                      ? "destructive"
                      : syncStatus.status === "syncing"
                        ? "outline"
                        : "secondary"
                }
              >
                {syncStatus.status === "success"
                  ? "Synced"
                  : syncStatus.status === "error"
                    ? "Failed"
                    : syncStatus.status === "syncing"
                      ? "Syncing"
                      : "Not Synced"}
              </Badge>
            </div>

            {/* Sync Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>About Synchronization</AlertTitle>
              <AlertDescription>
                Synchronization allows you to back up your data to an external database. This ensures your financial
                data is safely stored and can be recovered if needed.
              </AlertDescription>
            </Alert>

            {/* Sync Progress */}
            {(isSyncing || syncStatus.status === "syncing") && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Synchronizing...</span>
                  <span>{syncStatus.progress}%</span>
                </div>
                <Progress value={syncStatus.progress} className="w-full" />
                <p className="text-sm text-muted-foreground">{syncStatus.message}</p>
              </div>
            )}

            {/* Sync Results */}
            {syncStatus.status === "success" && syncStatus.details && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Last Sync Results</h3>
                <div className="grid gap-2 md:grid-cols-5">
                  <div className="bg-muted rounded-md p-3">
                    <div className="text-sm font-medium">Total</div>
                    <div className="text-2xl font-bold">{syncStatus.details.total}</div>
                  </div>

                  <div className="bg-muted rounded-md p-3">
                    <div className="text-sm font-medium">Added</div>
                    <div className="text-2xl font-bold text-green-600">{syncStatus.details.added}</div>
                  </div>

                  <div className="bg-muted rounded-md p-3">
                    <div className="text-sm font-medium">Updated</div>
                    <div className="text-2xl font-bold text-blue-600">{syncStatus.details.updated}</div>
                  </div>

                  <div className="bg-muted rounded-md p-3">
                    <div className="text-sm font-medium">Deleted</div>
                    <div className="text-2xl font-bold text-amber-600">{syncStatus.details.deleted}</div>
                  </div>

                  <div className="bg-muted rounded-md p-3">
                    <div className="text-sm font-medium">Errors</div>
                    <div className="text-2xl font-bold text-red-600">{syncStatus.details.errors}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {syncStatus.status === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sync Failed</AlertTitle>
                <AlertDescription>{syncStatus.message}</AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {syncStatus.status === "success" && (
              <Alert variant="default" className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Sync Successful</AlertTitle>
                <AlertDescription>{syncStatus.message}</AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Sync Button */}
            <Button onClick={handleSync} disabled={isSyncing || isLoading} className="w-full">
              {isSyncing ? (
                <>
                  <span className="mr-2">Synchronizing...</span>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  <CloudSync className="mr-2 h-4 w-4" />
                  Synchronize Now
                </>
              )}
            </Button>
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                <span className="flex items-center">
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Loading data...
                </span>
              ) : (
                <span>{expenses.length} transactions available for sync</span>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
