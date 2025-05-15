"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { OverviewStats } from "@/components/overview-stats"
import OverviewSummary from "@/components/overview-summary" // Fixed: Changed from named import to default import
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()

  // Set isClient to true once on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Redirect to auth page if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return null
  }

  if (!isClient) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <OverviewStats />
        <OverviewSummary />
      </div>
    </div>
  )
}
