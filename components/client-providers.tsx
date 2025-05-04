"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { FilterProvider } from "@/contexts/filter-context"
import { CategoryProvider } from "@/contexts/category-context"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { VisibilityProvider } from "@/contexts/visibility-context"
import { Toaster } from "@/components/ui/toaster"

export function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <FilterProvider>
          <CategoryProvider>
            <SidebarProvider>
              <VisibilityProvider>
                {children}
                <Toaster />
              </VisibilityProvider>
            </SidebarProvider>
          </CategoryProvider>
        </FilterProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
