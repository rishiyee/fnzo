"use client"

import type React from "react"

import { useEffect } from "react"
import { Sidebar } from "@/components/sidebar/sidebar"
import { useSidebar } from "@/contexts/sidebar-context"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isCollapsed, isMobileSidebarOpen, setMobileSidebarOpen } = useSidebar()

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [setMobileSidebarOpen])

  return (
    <div className="flex min-h-screen flex-col">
      <Sidebar />
      <main
        className={cn("flex-1 transition-all duration-300 ease-in-out", isCollapsed ? "md:ml-[70px]" : "md:ml-[240px]")}
      >
        {children}
      </main>
    </div>
  )
}
