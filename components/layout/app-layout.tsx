"use client"

import type React from "react"

import { useCallback } from "react"
import { Sidebar } from "@/components/sidebar/sidebar"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/contexts/sidebar-context"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useSidebar()

  const openMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(true)
  }, [setMobileSidebarOpen])

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false)
  }, [setMobileSidebarOpen])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar */}
      <div className={cn("fixed inset-0 z-40 flex lg:hidden", isMobileSidebarOpen ? "visible" : "invisible")}>
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 bg-zinc-900/80 backdrop-blur-sm transition-opacity",
            isMobileSidebarOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={closeMobileSidebar}
        />

        {/* Sidebar */}
        <div
          className={cn(
            "relative flex w-72 max-w-xs flex-1 flex-col bg-black transition-transform",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-4">
            <Button variant="ghost" size="icon" className="text-white" onClick={closeMobileSidebar}>
              <X className="h-6 w-6" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>
          <Sidebar />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-64 flex-col">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        {/* Mobile header */}
        <div className="lg:hidden border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
          <div className="flex h-16 items-center justify-between px-4">
            <Button variant="ghost" size="icon" onClick={openMobileSidebar}>
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            <div className="flex items-center">
              <span className="text-xl font-bold">Fnzo</span>
            </div>
            <div className="w-6" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto w-full">{children}</main>
      </div>
    </div>
  )
}
