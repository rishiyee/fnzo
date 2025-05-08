import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"
import { FilterProvider } from "@/contexts/filter-context"
import { VisibilityProvider } from "@/contexts/visibility-context"
import { CategoryProvider } from "@/contexts/category-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Fnzo - Personal Finance Tracker",
  description: "Track your expenses, income, and savings with Fnzo",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <FilterProvider>
              <VisibilityProvider>
                <CategoryProvider>
                  {children}
                  <Toaster />
                </CategoryProvider>
              </VisibilityProvider>
            </FilterProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
