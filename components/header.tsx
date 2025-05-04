"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useSidebar } from "@/contexts/sidebar-context"
import { useVisibility } from "@/contexts/visibility-context"
import { Menu, X, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

export function Header() {
  const { user } = useAuth()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const { isVisible, toggleVisibility } = useVisibility()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isAuthPage = pathname === "/auth"

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  if (isAuthPage) {
    return (
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">Fnzo</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="md:hidden mr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleSidebar()}
            className="md:hidden"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        <div className="hidden md:flex md:items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden md:flex"
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </Button>
        </div>

        <div className="flex-1 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-2 md:hidden">
              <span className="font-bold text-xl">Fnzo</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleVisibility}
                aria-label={isVisible ? "Hide Values" : "Show Values"}
              >
                {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
