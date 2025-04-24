"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CategoriesRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/category-limits")
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="mt-4">Redirecting to Category Management...</p>
    </div>
  )
}
