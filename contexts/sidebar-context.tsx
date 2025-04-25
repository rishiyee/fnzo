"use client"

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react"

type SidebarContextType = {
  expandedSections: Record<string, boolean>
  toggleSection: (section: string) => void
  isMobileSidebarOpen: boolean
  setMobileSidebarOpen: (isOpen: boolean) => void
  isCollapsed: boolean
  toggleCollapsed: () => void
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

  // Track sidebar collapsed state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    // Initialize from localStorage if available, otherwise default to false (expanded)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarCollapsed")
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  // Persist collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed))
    }
  }, [isCollapsed])

  // Memoize the toggle function to prevent recreating it on each render
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }, [])

  // Toggle sidebar collapsed state
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      expandedSections,
      toggleSection,
      isMobileSidebarOpen,
      setMobileSidebarOpen,
      isCollapsed,
      toggleCollapsed,
    }),
    [expandedSections, toggleSection, isMobileSidebarOpen, isCollapsed, toggleCollapsed],
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
