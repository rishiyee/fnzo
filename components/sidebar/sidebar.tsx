"use client"

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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { UserProfile } from "@/components/sidebar/user-profile"
import { useSidebar } from "@/contexts/sidebar-context"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { isOpen, setIsOpen } = useSidebar()
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Close settings dropdown when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setSettingsOpen(false)
    }
  }, [isOpen])

  // Check if a link is active
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === path
    }
    return pathname?.startsWith(path)
  }

  // Check if settings section is active
  const isSettingsActive = pathname?.startsWith("/settings")

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex h-full flex-col border-r bg-background transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" className={cn("flex items-center", !isOpen && "justify-center")}>
          {isOpen ? <h1 className="text-xl font-bold">Expense Tracker</h1> : <CircleDollarSign className="h-6 w-6" />}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsOpen(false)}
          aria-label="Close sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          <Link href="/" passHref>
            <Button
              variant={isActive("/") ? "secondary" : "ghost"}
              className={cn("justify-start", !isOpen && "justify-center")}
              size={isOpen ? "default" : "icon"}
            >
              <LayoutDashboard className={cn("h-5 w-5", isOpen && "mr-2")} />
              {isOpen && <span>Dashboard</span>}
            </Button>
          </Link>

          <Link href="/transactions" passHref>
            <Button
              variant={isActive("/transactions") ? "secondary" : "ghost"}
              className={cn("justify-start", !isOpen && "justify-center")}
              size={isOpen ? "default" : "icon"}
            >
              <Receipt className={cn("h-5 w-5", isOpen && "mr-2")} />
              {isOpen && <span>Transactions</span>}
            </Button>
          </Link>

          <Link href="/category-limits" passHref>
            <Button
              variant={isActive("/category-limits") ? "secondary" : "ghost"}
              className={cn("justify-start", !isOpen && "justify-center")}
              size={isOpen ? "default" : "icon"}
            >
              <Tags className={cn("h-5 w-5", isOpen && "mr-2")} />
              {isOpen && <span>Categories</span>}
            </Button>
          </Link>

          <Separator className="my-2" />

          <Link href="/monthly-summary" passHref>
            <Button
              variant={isActive("/monthly-summary") ? "secondary" : "ghost"}
              className={cn("justify-start", !isOpen && "justify-center")}
              size={isOpen ? "default" : "icon"}
            >
              <BarChart3 className={cn("h-5 w-5", isOpen && "mr-2")} />
              {isOpen && <span>Monthly Summary</span>}
            </Button>
          </Link>

          <Link href="/spending-trends" passHref>
            <Button
              variant={isActive("/spending-trends") ? "secondary" : "ghost"}
              className={cn("justify-start", !isOpen && "justify-center")}
              size={isOpen ? "default" : "icon"}
            >
              <TrendingUp className={cn("h-5 w-5", isOpen && "mr-2")} />
              {isOpen && <span>Spending Trends</span>}
            </Button>
          </Link>

          <Link href="/reports" passHref>
            <Button
              variant={isActive("/reports") ? "secondary" : "ghost"}
              className={cn("justify-start", !isOpen && "justify-center")}
              size={isOpen ? "default" : "icon"}
            >
              <PieChart className={cn("h-5 w-5", isOpen && "mr-2")} />
              {isOpen && <span>Reports</span>}
            </Button>
          </Link>

          <Separator className="my-2" />

          <div>
            <Button
              variant={isSettingsActive ? "secondary" : "ghost"}
              className={cn("justify-start w-full", !isOpen && "justify-center")}
              size={isOpen ? "default" : "icon"}
              onClick={() => isOpen && setSettingsOpen(!settingsOpen)}
            >
              <Settings className={cn("h-5 w-5", isOpen && "mr-2")} />
              {isOpen && (
                <>
                  <span className="flex-1 text-left">Settings</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", settingsOpen && "rotate-180")} />
                </>
              )}
            </Button>

            {isOpen && settingsOpen && (
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
          </div>
        </nav>
      </div>

      <div className="mt-auto border-t p-4">
        <UserProfile collapsed={!isOpen} />
      </div>
    </aside>
  )
}
