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

export function DebugPanel() {
  const [open, setOpen] = useState(false)
  const [envVars, setEnvVars] = useState<Record<string, string>>({})
  const [apiTest, setApiTest] = useState<{ success: boolean; message: string } | null>(null)
  const { session } = useAuth()

  const checkEnvironmentVariables = () => {
    setEnvVars({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set (hidden)" : "Not set",
    })
  }

  const testSupabaseConnection = async () => {
    try {
      const supabase = getSupabaseBrowserClient()

      // Try a simple query to test the connection
      const { data, error } = await supabase.from("expenses").select("count").limit(1)

      if (error) {
        setApiTest({ success: false, message: `Error: ${error.message}` })
      } else {
        setApiTest({ success: true, message: "Connection successful!" })
      }
    } catch (error: any) {
      setApiTest({ success: false, message: `Exception: ${error.message}` })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Debug API
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>API Debug Panel</DialogTitle>
          <DialogDescription>Diagnose API connection issues</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Environment Variables:</h3>
            <Button size="sm" onClick={checkEnvironmentVariables}>
              Check Environment Variables
            </Button>
            {Object.keys(envVars).length > 0 && (
              <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">{JSON.stringify(envVars, null, 2)}</pre>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">API Connection Test:</h3>
            <Button size="sm" onClick={testSupabaseConnection}>
              Test Supabase Connection
            </Button>
            {apiTest && (
              <div
                className={`p-4 rounded-md ${apiTest.success ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"}`}
              >
                {apiTest.message}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Current Session:</h3>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
              {JSON.stringify(
                {
                  hasSession: !!session,
                  hasAccessToken: !!session?.access_token,
                  userId: session?.user?.id || "Not logged in",
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
