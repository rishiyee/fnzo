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
  FileIcon,
  Menu,
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
  }: {
    href: string
    icon: React.ReactNode
    label: string
    active: boolean
  }) => {
    const content = (
      <Link href={href} passHref>
        <Button
          variant={active ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start transition-all duration-200",
            isCollapsed ? "h-10 w-10 p-0" : "h-10 px-4 py-2",
            active && "bg-primary/10 text-primary",
          )}
        >
          <span className={cn("flex items-center justify-center", !isCollapsed && "mr-2")}>{icon}</span>
          {!isCollapsed && <span className="truncate">{label}</span>}
        </Button>
      </Link>
    )

    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              {label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return content
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-40 md:hidden"
        onClick={() => setMobileSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex h-full flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[70px]" : "w-[240px]",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className,
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/" className={cn("flex items-center gap-2", isCollapsed && "justify-center")}>
            <CircleDollarSign className="h-6 w-6 text-primary" />
            {!isCollapsed && <span className="text-xl font-bold">Fnzo</span>}
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

            <NavItem
              href="/templates"
              icon={<FileIcon className="h-5 w-5" />}
              label="Templates"
              active={isActive("/templates")}
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
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/settings/profile" passHref>
                        <Button
                          variant={isSettingsActive ? "secondary" : "ghost"}
                          className={cn("h-10 w-10 p-0", isSettingsActive && "bg-primary/10 text-primary")}
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
                    className={cn("w-full justify-between", isSettingsActive && "bg-primary/10 text-primary")}
                    onClick={() => setSettingsOpen(!settingsOpen)}
                  >
                    <span className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      <span>Settings</span>
                    </span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", settingsOpen && "rotate-180")} />
                  </Button>

                  {settingsOpen && (
                    <div className="mt-1 ml-4 pl-4 border-l grid gap-1">
                      <Link href="/settings/profile" passHref>
                        <Button
                          variant={isActive("/settings/profile") ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start h-9 px-2",
                            isActive("/settings/profile") && "bg-primary/10 text-primary",
                          )}
                        >
                          Profile
                        </Button>
                      </Link>
                      <Link href="/settings/preferences" passHref>
                        <Button
                          variant={isActive("/settings/preferences") ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start h-9 px-2",
                            isActive("/settings/preferences") && "bg-primary/10 text-primary",
                          )}
                        >
                          Preferences
                        </Button>
                      </Link>
                      <Link href="/settings/backup" passHref>
                        <Button
                          variant={isActive("/settings/backup") ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start h-9 px-2",
                            isActive("/settings/backup") && "bg-primary/10 text-primary",
                          )}
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
    </>
  )
}
