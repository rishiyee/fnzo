import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { FilterProvider } from "@/contexts/filter-context"
import { CategoryProvider } from "@/contexts/category-context"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { VisibilityProvider } from "@/contexts/visibility-context"
import type { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Fnzo - Personal Finance Tracker",
  description: "Track your expenses, income, and savings with Fnzo",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <FilterProvider>
              <CategoryProvider>
                <SidebarProvider>
                  <VisibilityProvider>{children}</VisibilityProvider>
                </SidebarProvider>
              </CategoryProvider>
            </FilterProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
