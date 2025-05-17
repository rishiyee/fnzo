"use client"

import type React from "react"

import { useCallback } from "react"

import { useEffect } from "react"

import { useState } from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  FileIcon,
  BarChart3,
  Menu,
  X,
  Plus,
  Eye,
  EyeOff,
  Home,
  Target,
  FileText,
  Search,
  Settings,
  Bell,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { TransactionModal } from "@/components/transaction-modal"
import { useVisibility } from "@/contexts/visibility-context"
import type { Expense } from "@/types/expense"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
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

  // Navigation items
  const navItems = [
    { href: "/", icon: <Home className="h-4 w-4" />, label: "Dashboard" },
    { href: "/templates", icon: <FileIcon className="h-4 w-4" />, label: "Templates" },
    { href: "/monthly-summary", icon: <BarChart3 className="h-4 w-4" />, label: "Summary" },
    { href: "/financial-trends", icon: <FileText className="h-4 w-4" />, label: "Trends" },
    { href: "/goals", icon: <Target className="h-4 w-4" />, label: "Goals" },
  ]

  const handleNavigation = useCallback(
    (path: string) => {
      router.push(path)
      setIsMobileMenuOpen(false)
    },
    [router],
  )

  const handleTransactionAdded = useCallback((expense: Expense) => {
    console.log("Transaction added:", expense)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Searching for:", searchQuery)
    // Implement search functionality here
    setIsSearchOpen(false)
  }

  // Don't show header on auth pages
  if (pathname?.startsWith("/auth")) {
    return null
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-200 w-full",
          scrolled
            ? "bg-background/95 backdrop-blur-sm shadow-sm border-b"
            : "bg-background border-b border-transparent",
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 mr-4">
                <div className="relative w-8 h-8 flex items-center justify-center bg-gradient-to-br from-primary to-primary/70 rounded-lg text-primary-foreground font-bold text-lg">
                  F
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                </div>
                <span className="font-bold text-xl hidden sm:inline-block">Fnzo</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-colors",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.href === "/goals" && (
                      <Badge variant="outline" className="ml-1 text-xs py-0 h-4">
                        New
                      </Badge>
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-2">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative mr-2">
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-[180px] lg:w-[240px] h-9 pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </form>

              {/* Add Transaction Button */}
              {user && (
                <Button
                  size="sm"
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setIsTransactionModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span>New Transaction</span>
                </Button>
              )}

              {/* Visibility Toggle */}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={toggleVisibility}
                title={isVisible ? "Hide Values" : "Show Values"}
              >
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[300px]">
                  <div className="flex items-center justify-between px-4 py-2 border-b">
                    <span className="font-medium">Notifications</span>
                    <Badge variant="outline" className="ml-2">
                      3 new
                    </Badge>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    <div className="px-4 py-3 border-b hover:bg-accent cursor-pointer">
                      <div className="flex items-start">
                        <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full mr-2"></div>
                        <div>
                          <p className="text-sm font-medium">Monthly budget exceeded</p>
                          <p className="text-xs text-muted-foreground">You've exceeded your dining budget by 15%</p>
                          <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 border-b hover:bg-accent cursor-pointer">
                      <div className="flex items-start">
                        <div className="w-2 h-2 mt-1.5 bg-green-500 rounded-full mr-2"></div>
                        <div>
                          <p className="text-sm font-medium">Savings goal achieved</p>
                          <p className="text-xs text-muted-foreground">You've reached your vacation savings goal!</p>
                          <p className="text-xs text-muted-foreground mt-1">Yesterday</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 hover:bg-accent cursor-pointer">
                      <div className="flex items-start">
                        <div className="w-2 h-2 mt-1.5 bg-red-500 rounded-full mr-2"></div>
                        <div>
                          <p className="text-sm font-medium">Large transaction detected</p>
                          <p className="text-xs text-muted-foreground">Unusual transaction of $1,250 detected</p>
                          <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full justify-center">
                      View all notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 pl-2 pr-1">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium leading-none">{user.email?.split("@")[0]}</span>
                        <span className="text-xs text-muted-foreground leading-none mt-1">Personal Account</span>
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-xs font-medium leading-none text-muted-foreground">Signed in as</p>
                      <p className="text-xs truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/settings/categories")}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Categories</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/settings/preferences")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Preferences</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <span className="text-red-500">Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" onClick={() => router.push("/auth")}>
                  Sign in
                </Button>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center space-x-2">
              {/* Mobile Search Toggle */}
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                <Search className="h-5 w-5" />
              </Button>

              {/* Add Transaction Button (Mobile) */}
              {user && (
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsTransactionModalOpen(true)}>
                  <Plus className="h-5 w-5" />
                </Button>
              )}

              {/* Visibility Toggle (Mobile) */}
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleVisibility}>
                {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>

              {/* Theme Toggle (Mobile) */}
              <ThemeToggle />

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Search Bar (Expandable) */}
          {isSearchOpen && (
            <div className="py-2 px-1 border-t md:hidden">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="search"
                  placeholder="Search transactions, categories..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7"
                  onClick={() => setIsSearchOpen(false)}
                >
                  Cancel
                </Button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Spacer to prevent content from being hidden under the fixed header */}
      <div className={cn("h-16", isSearchOpen ? "md:h-16 h-[104px]" : "h-16")}></div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="fixed inset-y-0 right-0 w-[280px] bg-background border-l p-6 z-50 md:hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-primary to-primary/70 rounded-lg text-primary-foreground font-bold text-lg">
                F
              </div>
              <span className="font-bold text-xl">Fnzo</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Profile (Mobile) */}
          {user && (
            <div className="mb-6 p-4 border rounded-lg bg-accent/50">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.email?.split("@")[0]}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    router.push("/settings/profile")
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-500"
                  onClick={() => {
                    signOut()
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Sign out
                </Button>
              </div>
            </div>
          )}

          {/* Mobile Navigation */}
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={isActive(item.href) ? "secondary" : "ghost"}
                className={cn("justify-start h-10", isActive(item.href) && "bg-primary/10 text-primary")}
                onClick={() => handleNavigation(item.href)}
              >
                <div className="flex items-center w-full">
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.href === "/goals" && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      New
                    </Badge>
                  )}
                </div>
              </Button>
            ))}
          </nav>

          <div className="mt-6 space-y-1">
            <Button
              variant="ghost"
              className="justify-start w-full h-10"
              onClick={() => {
                router.push("/settings/profile")
                setIsMobileMenuOpen(false)
              }}
            >
              <Settings className="mr-3 h-4 w-4" />
              Settings
            </Button>
          </div>

          {/* Mobile Sign In Button */}
          {!user && (
            <Button
              className="mt-6 w-full"
              onClick={() => {
                router.push("/auth")
                setIsMobileMenuOpen(false)
              }}
            >
              Sign in
            </Button>
          )}

          {/* Footer */}
          <div className="mt-auto pt-6 border-t">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">© 2025 Fnzo</p>
              <ThemeToggle />
            </div>
          </div>
        </div>
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
