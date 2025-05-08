"use client"

import type React from "react"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      <main className="w-full overflow-auto">{children}</main>
    </div>
  )
}
