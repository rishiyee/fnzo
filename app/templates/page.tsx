"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AppLayout } from "@/components/layout/app-layout"
import { TemplateManager } from "@/components/templates/template-manager"

export default function TemplatesPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        console.log("No user found, redirecting to auth page")
        router.push("/auth")
      } else {
        setAuthChecked(true)
      }
    }
  }, [isLoading, user, router])

  if (isLoading || !authChecked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in the useEffect
  }

  return (
    <AppLayout>
      <div className="p-6 w-full">
        <TemplateManager />
      </div>
    </AppLayout>
  )
}
