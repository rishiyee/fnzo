"use client"

import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, FileIcon, BarChart3, Settings, Menu, X, ChevronDown, Plus, Eye, EyeOff } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { TransactionModal } from "@/components/transaction-modal"
import { useVisibility } from "@/contexts/visibility-context"
import type { Expense } from "@/types/expense"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { isVisible, toggleVisibility } = useVisibility()

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Check if a link is active
  const isActive = useCallback(
    (path: string) => {
      if (path === "/") {
        return pathname === path
      }
      return pathname?.startsWith(path)
    },
    [pathname],
  )

  // Navigation items - Removed Category Limits
  const navItems = [
    { href: "/", icon: <LayoutDashboard className="h-4 w-4 mr-2" />, label: "Dashboard" },
    { href: "/templates", icon: <FileIcon className="h-4 w-4 mr-2" />, label: "Templates" },
    { href: "/monthly-summary", icon: <BarChart3 className="h-4 w-4 mr-2" />, label: "Monthly Summary" },
  ]

  const handleNavigation = useCallback(
    (path: string) => {
      router.push(path)
      setIsMobileMenuOpen(false)
    },
    [router],
  )

  // Use useCallback for these handlers to prevent unnecessary re-renders
  const handleTransactionAdded = useCallback((expense: Expense) => {
    // This is just a placeholder. In a real app, you'd want to update your state or refetch data
    console.log("Transaction added:", expense)
    // We're not updating any state here, so this shouldn't cause re-renders
  }, [])

  return (
    <>
      {/* Fixed Header - Now 100% width */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-200 w-full",
          scrolled ? "bg-background/95 backdrop-blur-sm shadow-sm" : "bg-background",
        )}
      >
        {/* Desktop Header - Removed max-width constraint */}
        <div className="hidden md:flex items-center justify-between px-6 py-3 w-full">
          <div className="flex items-center space-x-1">
            <h1 className="text-xl font-bold mr-6 cursor-pointer flex items-center" onClick={() => router.push("/")}>
              <span className="bg-primary text-primary-foreground px-2 py-1 rounded mr-2">F</span>
              <span>Fnzo</span>
            </h1>
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

          <div className="flex items-center space-x-2">
            {user && (
              <Button size="sm" className="flex items-center gap-1" onClick={() => setIsTransactionModalOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Transaction</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVisibility}
              title={isVisible ? "Hide Values" : "Show Values"}
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <ThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="hidden sm:inline max-w-[100px] truncate">{user.email?.split("@")[0]}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push("/settings/profile")}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings/categories")}>Categories</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings/preferences")}>Preferences</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => router.push("/auth")}>
                Sign in
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Header - Full width */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 w-full">
          <h1 className="text-xl font-bold cursor-pointer flex items-center" onClick={() => router.push("/")}>
            <span className="bg-primary text-primary-foreground px-2 py-1 rounded mr-2">F</span>
            <span>Fnzo</span>
          </h1>
          <div className="flex items-center">
            {user && (
              <Button variant="ghost" size="icon" onClick={() => setIsTransactionModalOpen(true)} className="mr-1">
                <Plus className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVisibility}
              title={isVisible ? "Hide Values" : "Show Values"}
              className="mr-1"
            >
              {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from being hidden under the fixed header */}
      <div className="h-14 md:h-12"></div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-64 bg-background border-l p-4 z-50 md:hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold">Menu</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {user && (
              <div className="mb-4 p-3 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="truncate">
                    <p className="font-medium truncate">{user.email?.split("@")[0]}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    signOut()
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Sign out
                </Button>
              </div>
            )}

            <nav className="flex flex-col space-y-1">
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

              <Button
                variant={isActive("/settings") ? "secondary" : "ghost"}
                className={cn("justify-start", isActive("/settings") && "bg-primary/10 text-primary")}
                onClick={() => handleNavigation("/settings/profile")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>

              {!user && (
                <Button
                  className="mt-4 w-full"
                  onClick={() => {
                    router.push("/auth")
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Sign in
                </Button>
              )}
            </nav>
          </div>
        </>
      )}

      {/* Transaction Modal */}
      {user && (
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          onTransactionAdded={handleTransactionAdded}
        />
      )}
    </>
  )
}
