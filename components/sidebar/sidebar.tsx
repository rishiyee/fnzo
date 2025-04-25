"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  PieChart,
  TrendingUp,
  Settings,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Tags,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { UserProfile } from "@/components/sidebar/user-profile"
import { useSidebar } from "@/contexts/sidebar-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { isCollapsed, toggleCollapsed, isMobileSidebarOpen, setMobileSidebarOpen } = useSidebar()
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Close settings dropdown when sidebar collapses
  useEffect(() => {
    if (isCollapsed) {
      setSettingsOpen(false)
    }
  }, [isCollapsed])

  // Check if a link is active
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === path
    }
    return pathname?.startsWith(path)
  }

  // Check if settings section is active
  const isSettingsActive = pathname?.startsWith("/settings")

  // Render a nav item with optional tooltip when collapsed
  const NavItem = ({
    href,
    icon,
    label,
    active,
  }: { href: string; icon: React.ReactNode; label: string; active: boolean }) => {
    const content = (
      <Link href={href} passHref>
        <Button
          variant={active ? "secondary" : "ghost"}
          className={cn("justify-start w-full", isCollapsed && "justify-center px-2")}
          size={isCollapsed ? "icon" : "default"}
        >
          {icon}
          {!isCollapsed && <span className="ml-2">{label}</span>}
        </Button>
      </Link>
    )

    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return content
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex h-full flex-col border-r bg-background transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" className={cn("flex items-center", isCollapsed && "justify-center")}>
          {!isCollapsed ? (
            <h1 className="text-xl font-bold">Expense Tracker</h1>
          ) : (
            <CircleDollarSign className="h-6 w-6" />
          )}
        </Link>

        {/* Toggle button for desktop */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="hidden md:flex"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          <NavItem href="/" icon={<LayoutDashboard className="h-5 w-5" />} label="Dashboard" active={isActive("/")} />

          <NavItem
            href="/transactions"
            icon={<Receipt className="h-5 w-5" />}
            label="Transactions"
            active={isActive("/transactions")}
          />

          <NavItem
            href="/category-limits"
            icon={<Tags className="h-5 w-5" />}
            label="Categories"
            active={isActive("/category-limits")}
          />

          <Separator className="my-2" />

          <NavItem
            href="/monthly-summary"
            icon={<BarChart3 className="h-5 w-5" />}
            label="Monthly Summary"
            active={isActive("/monthly-summary")}
          />

          <NavItem
            href="/spending-trends"
            icon={<TrendingUp className="h-5 w-5" />}
            label="Spending Trends"
            active={isActive("/spending-trends")}
          />

          <NavItem
            href="/reports"
            icon={<PieChart className="h-5 w-5" />}
            label="Reports"
            active={isActive("/reports")}
          />

          <Separator className="my-2" />

          <div>
            {isCollapsed ? (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/settings/profile" passHref>
                      <Button
                        variant={isSettingsActive ? "secondary" : "ghost"}
                        className="justify-center w-full px-2"
                        size="icon"
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Settings</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <>
                <Button
                  variant={isSettingsActive ? "secondary" : "ghost"}
                  className="justify-start w-full"
                  size="default"
                  onClick={() => setSettingsOpen(!settingsOpen)}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  <span className="flex-1 text-left">Settings</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", settingsOpen && "rotate-180")} />
                </Button>

                {settingsOpen && (
                  <div className="ml-4 mt-1 grid gap-1 pl-4 border-l">
                    <Link href="/settings/profile" passHref>
                      <Button
                        variant={isActive("/settings/profile") ? "secondary" : "ghost"}
                        className="justify-start w-full"
                        size="sm"
                      >
                        Profile
                      </Button>
                    </Link>
                    <Link href="/settings/preferences" passHref>
                      <Button
                        variant={isActive("/settings/preferences") ? "secondary" : "ghost"}
                        className="justify-start w-full"
                        size="sm"
                      >
                        Preferences
                      </Button>
                    </Link>
                    <Link href="/settings/backup" passHref>
                      <Button
                        variant={isActive("/settings/backup") ? "secondary" : "ghost"}
                        className="justify-start w-full"
                        size="sm"
                      >
                        Backup & Sync
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </nav>
      </div>

      <div className="mt-auto border-t p-4">
        <UserProfile collapsed={isCollapsed} />
      </div>
    </aside>
  )
}
