"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function AuthDebug() {
  const { user, session, refreshSession, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Debug Auth
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Authentication Debug</DialogTitle>
          <DialogDescription>Current authentication state information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-auto">
          <div>
            <h3 className="font-medium mb-2">Session:</h3>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">{JSON.stringify(session, null, 2)}</pre>
          </div>
          <div>
            <h3 className="font-medium mb-2">User:</h3>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">{JSON.stringify(user, null, 2)}</pre>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await refreshSession()
              }}
            >
              Refresh Session
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut()
                setOpen(false)
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
