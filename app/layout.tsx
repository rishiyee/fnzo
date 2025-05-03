import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { FilterProvider } from "@/contexts/filter-context"
import { CategoryProvider } from "@/contexts/category-context"
import { VisibilityProvider } from "@/contexts/visibility-context"
import { Toaster } from "@/components/ui/toaster"
import { Header } from "@/components/header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Fnzo | Smart Expense Tracking",
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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <SidebarProvider>
              <FilterProvider>
                <CategoryProvider>
                  <VisibilityProvider>
                    <Header />
                    {children}
                    <Toaster />
                  </VisibilityProvider>
                </CategoryProvider>
              </FilterProvider>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
