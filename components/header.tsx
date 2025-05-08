"use client"

import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Tags, FileIcon, BarChart3, Settings, Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Expense } from "@/types/expense"

interface HeaderProps {
  onExportCSV?: () => void
  onImportCSV?: (file: File) => void
  expenses?: Expense[]
  onTransactionAdded?: (expense: Expense) => void
  onTransactionsAdded?: (expenses: Expense[]) => void
}

export function Header({ onExportCSV, onImportCSV, expenses, onTransactionAdded, onTransactionsAdded }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Check if a link is active
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === path
    }
    return pathname?.startsWith(path)
  }

  // Navigation items - removed transactions, spending-trends, and reports
  const navItems = [
    { href: "/", icon: <LayoutDashboard className="h-4 w-4 mr-2" />, label: "Dashboard" },
    { href: "/category-limits", icon: <Tags className="h-4 w-4 mr-2" />, label: "Categories" },
    { href: "/templates", icon: <FileIcon className="h-4 w-4 mr-2" />, label: "Templates" },
    { href: "/monthly-summary", icon: <BarChart3 className="h-4 w-4 mr-2" />, label: "Monthly Summary" },
    { href: "/settings/profile", icon: <Settings className="h-4 w-4 mr-2" />, label: "Settings" },
  ]

  const handleNavigation = (path: string) => {
    router.push(path)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center space-x-1">
          <h1 className="text-xl font-bold mr-6">Fnzo</h1>
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={isActive(item.href) ? "secondary" : "ghost"}
              size="sm"
              className={cn("flex items-center", isActive(item.href) && "bg-primary/10 text-primary")}
              onClick={() => handleNavigation(item.href)}
            >
              {item.icon}
              <span className="hidden lg:inline">{item.label}</span>
            </Button>
          ))}
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
        <h1 className="text-xl font-bold">Fnzo</h1>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-64 bg-background border-l p-4 z-50 md:hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold">Menu</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={cn("justify-start", isActive(item.href) && "bg-primary/10 text-primary")}
                  onClick={() => handleNavigation(item.href)}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
