import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ClientProviders } from "@/components/client-providers"
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
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
