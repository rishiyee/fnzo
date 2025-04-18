"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"

type SidebarContextType = {
  expandedSections: Record<string, boolean>
  toggleSection: (section: string) => void
  isMobileSidebarOpen: boolean
  setMobileSidebarOpen: (isOpen: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Dashboard: true, // Default open section
    Categories: false,
    "Reports & Analysis": false,
    Settings: false,
  })

  // Track mobile sidebar open state
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Memoize the toggle function to prevent recreating it on each render
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      expandedSections,
      toggleSection,
      isMobileSidebarOpen,
      setMobileSidebarOpen,
    }),
    [expandedSections, toggleSection, isMobileSidebarOpen],
  )

  return <SidebarContext.Provider value={contextValue}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
