"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface SidebarContextType {
  isMobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType>({
  isMobileSidebarOpen: false,
  setMobileSidebarOpen: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [])

  return (
    <SidebarContext.Provider
      value={{
        isMobileSidebarOpen,
        setMobileSidebarOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
