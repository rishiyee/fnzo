"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TransactionsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.push("/?tab=transactions")
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center w-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="mt-4 text-muted-foreground">Redirecting to the unified dashboard...</p>
    </div>
  )
}
