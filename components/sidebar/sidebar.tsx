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
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useSidebar()

  // Check if a link is active
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === path
    }
    return pathname?.startsWith(path)
  }

  // Check if settings section is active
  const isSettingsActive = pathname?.startsWith("/settings")

  // Render a nav item with tooltip
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
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={href} passHref>
              <Button
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "h-10 w-10 p-0 transition-all duration-200",
                  active && "bg-primary/10 text-primary font-medium",
                )}
              >
                <span className="flex items-center justify-center">{icon}</span>
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="flex items-center gap-2 bg-popover text-popover-foreground animate-in fade-in-50 data-[side=right]:slide-in-from-left-2 data-[side=left]:slide-in-from-right-2"
          >
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out w-[68px]",
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-center border-b">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/" className="flex items-center justify-center">
                <CircleDollarSign className="h-6 w-6 text-primary" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Fnzo</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
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

          <NavItem
            href="/settings/profile"
            icon={<Settings className="h-5 w-5" />}
            label="Settings"
            active={isSettingsActive}
          />
        </nav>
      </div>

      <div className="mt-auto border-t p-4 flex justify-center">
        <UserProfile collapsed={true} />
      </div>
    </aside>
  )
}
