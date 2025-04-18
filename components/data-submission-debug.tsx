"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { verifyDatabaseSchema } from "@/lib/schema-verification"

export function DataSubmissionDebug() {
  const [open, setOpen] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const { session, user, verifySession } = useAuth()

  const runTests = async () => {
    const results: any = {
      auth: {
        hasSession: !!session,
        hasUser: !!user,
        userId: user?.id || "Not logged in",
      },
      schema: await verifyDatabaseSchema(),
      connection: await testConnection(),
      insertTest: null,
    }

    // Only run the insert test if we have a valid session and schema
    if (results.auth.hasSession && results.schema.success) {
      results.insertTest = await testInsert()
    }

    setTestResults(results)
  }

  const testConnection = async () => {
    try {
      const supabase = getSupabaseBrowserClient()

      // Try a simple query to test the connection
      const { data, error } = await supabase.from("expenses").select("count").limit(1)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const testInsert = async () => {
    try {
      const supabase = getSupabaseBrowserClient()

      // Create a test expense
      const testExpense = {
        user_id: user!.id,
        date: new Date().toISOString(),
        type: "expense" as const,
        category: "Test",
        amount: 0.01,
        notes: "Test expense - will be deleted",
      }

      // Insert the test expense
      const { data: insertData, error: insertError } = await supabase
        .from("expenses")
        .insert(testExpense)
        .select()
        .single()

      if (insertError) {
        return { success: false, error: insertError.message }
      }

      // Delete the test expense
      const { error: deleteError } = await supabase.from("expenses").delete().eq("id", insertData.id)

      if (deleteError) {
        return {
          success: true,
          warning: "Test expense was created but could not be deleted: " + deleteError.message,
        }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Debug Data Submission
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Data Submission Debug</DialogTitle>
          <DialogDescription>Test data submission to Supabase</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button onClick={runTests}>Run Tests</Button>

          {testResults && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Authentication:</h3>
                <div
                  className={`p-4 rounded-md ${testResults.auth.hasSession ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"}`}
                >
                  {testResults.auth.hasSession ? "Authenticated" : "Not authenticated"}
                  <pre className="mt-2 text-xs">{JSON.stringify(testResults.auth, null, 2)}</pre>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Database Schema:</h3>
                <div
                  className={`p-4 rounded-md ${testResults.schema.success ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"}`}
                >
                  {testResults.schema.success ? "Schema is valid" : "Schema error: " + testResults.schema.error}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Connection Test:</h3>
                <div
                  className={`p-4 rounded-md ${testResults.connection.success ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"}`}
                >
                  {testResults.connection.success
                    ? "Connection successful"
                    : "Connection error: " + testResults.connection.error}
                </div>
              </div>

              {testResults.insertTest && (
                <div>
                  <h3 className="font-medium mb-2">Insert Test:</h3>
                  <div
                    className={`p-4 rounded-md ${testResults.insertTest.success ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"}`}
                  >
                    {testResults.insertTest.success
                      ? "Insert successful"
                      : "Insert error: " + testResults.insertTest.error}
                    {testResults.insertTest.warning && (
                      <p className="mt-2 text-yellow-600 dark:text-yellow-400">{testResults.insertTest.warning}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
