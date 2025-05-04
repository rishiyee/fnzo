import type React from "react"
;('"use client')

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Sidebar } from "@/components/sidebar/sidebar"
import { useSidebar } from "@/contexts/sidebar-context"
import { Header } from "@/components/header"

export function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { isCollapsed } = useSidebar()

  useEffect(() => {
    if (!isLoading && !user && pathname !== "/auth") {
      router.push("/auth")
    }
  }, [user, isLoading, router, pathname])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user && pathname !== "/auth") {
    return null
  }

  if (pathname === "/auth") {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1">{children}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main
          className={`flex-1 w-full p-4 md:p-6 overflow-y-auto transition-all duration-300 ${isCollapsed ? "md:ml-16" : "md:ml-64"}`}
        >
          <div className="w-full max-w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
