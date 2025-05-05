"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AppLayout } from "@/components/layout/app-layout"

export default function SpendingTrendsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [isLoading, user, router])

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
        <h1 className="text-2xl font-bold mb-6">Spending Trends</h1>
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-lg text-muted-foreground">Spending trends analysis feature is coming soon!</p>
        </div>
      </div>
    </AppLayout>
  )
}
