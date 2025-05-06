"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  PieChart,
  TrendingUp,
  Settings,
  CircleDollarSign,
  Tags,
  FileIcon,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/contexts/sidebar-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useSidebar()
  const isCollapsed = true // Force collapsed view

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
            "w-full flex items-center justify-center transition-all duration-200",
            "h-10 w-10 p-0", // Always use collapsed styling
            active && "bg-primary/10 text-primary",
          )}
        >
          {icon}
        </Button>
      </Link>
    )

    // Always show tooltip since we're always in collapsed mode
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

  // Mobile sidebar (still uses fixed positioning as it's an overlay)
  if (isMobileSidebarOpen) {
    return (
      <>
        {/* Mobile overlay */}
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />

        {/* Mobile sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 w-[70px] flex flex-col border-r bg-background md:hidden">
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)} aria-label="Close sidebar">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-auto py-4">
            <nav className="grid gap-1 px-2 place-items-center">
              <NavItem
                href="/"
                icon={<LayoutDashboard className="h-5 w-5" />}
                label="Dashboard"
                active={isActive("/")}
              />
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
            </nav>
          </div>
        </aside>
      </>
    )
  }

  // Mobile toggle button (still fixed as it needs to be accessible when scrolling)
  const mobileToggle = (
    <Button
      variant="outline"
      size="icon"
      className="fixed left-4 top-4 z-40 md:hidden"
      onClick={() => setMobileSidebarOpen(true)}
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle Menu</span>
    </Button>
  )

  // Desktop sidebar (no longer fixed)
  return (
    <>
      {/* Mobile toggle button */}
      {mobileToggle}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex w-[70px] shrink-0 flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          className,
        )}
      >
        

        <div className="flex-1 overflow-auto py-4">
          <nav className="grid gap-1 px-2 place-items-center">
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


            <NavItem
              href="/monthly-summary"
              icon={<BarChart3 className="h-5 w-5" />}
              label="Monthly Summary"
              active={isActive("/monthly-summary")}
            />
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
          </nav>
        </div>
      </aside>
    </>
  )
}
