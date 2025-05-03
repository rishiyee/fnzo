"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type VisibilityContextType = {
  showValues: boolean
  toggleVisibility: () => void
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined)

export function VisibilityProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage if available, default to true (show values)
  const [showValues, setShowValues] = useState(true)

  // Load preference from localStorage on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem("fnzo-show-values")
    if (savedPreference !== null) {
      setShowValues(savedPreference === "true")
    }
  }, [])

  // Save preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("fnzo-show-values", showValues.toString())
  }, [showValues])

  const toggleVisibility = () => {
    setShowValues((prev) => !prev)
  }

  return <VisibilityContext.Provider value={{ showValues, toggleVisibility }}>{children}</VisibilityContext.Provider>
}

export function useVisibility() {
  const context = useContext(VisibilityContext)
  if (context === undefined) {
    throw new Error("useVisibility must be used within a VisibilityProvider")
  }
  return context
}
