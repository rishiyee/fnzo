"use client"

import type React from "react"

import { memo, useCallback } from "react"
import { Link } from "@/components/ui/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronDown, LayoutDashboard, Tags, BarChart3, Settings, Wallet } from "lucide-react"
import { UserProfile } from "@/components/sidebar/user-profile"
import { useAuth } from "@/contexts/auth-context"
import { useSidebar } from "@/contexts/sidebar-context"

interface NavItemProps {
  title: string
  href: string
  icon?: React.ReactNode
  isActive?: boolean
  isChild?: boolean
}

// Then update the NavItem component
const NavItem = memo(({ title, href, icon, isActive, isChild }: NavItemProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center py-2 px-3 text-sm font-medium rounded-md",
        isChild ? "pl-10" : "pl-3",
        "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
      )}
      activeClassName="bg-zinc-800 text-white"
      exact={true}
    >
      {icon && <span className="mr-3">{icon}</span>}
      {title}
    </Link>
  )
})
NavItem.displayName = "NavItem"

interface NavGroupProps {
  title: string
  icon: React.ReactNode
  children: {
    title: string
    href: string
  }[]
}

// Memoize NavGroup to prevent re-renders when props don't change
const NavGroup = memo(({ title, icon, children }: NavGroupProps) => {
  const pathname = usePathname()
  const { expandedSections, toggleSection } = useSidebar()

  const isOpen = expandedSections[title] || false
  const hasActiveChild = children.some((child) => pathname === child.href)

  const handleToggle = useCallback(() => {
    toggleSection(title)
  }, [toggleSection, title])

  return (
    <div className="mb-1">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-between px-3 py-2 text-sm font-medium",
          hasActiveChild ? "text-white" : "text-zinc-400 hover:text-white",
        )}
        onClick={handleToggle}
      >
        <span className="flex items-center">
          <span className="mr-3">{icon}</span>
          {title}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "transform rotate-180" : "")} />
      </Button>
      {isOpen && (
        <div className="mt-1 space-y-1">
          {children.map((child) => (
            <NavItem
              key={child.href}
              title={child.title}
              href={child.href}
              isActive={pathname === child.href}
              isChild
            />
          ))}
        </div>
      )}
    </div>
  )
})
NavGroup.displayName = "NavGroup"

// Main sidebar component, memoized to prevent re-renders
const Sidebar = memo(function Sidebar() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <div className="p-4 flex items-center">
        <Wallet className="h-6 w-6 text-yellow-400 mr-2" />
        <span className="text-xl font-bold">Fnzo.</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        <NavGroup
          title="Dashboard"
          icon={<LayoutDashboard className="h-5 w-5" />}
          children={[
            { title: "Overview", href: "/" },
            { title: "Recent Transactions", href: "/transactions" },
            { title: "Monthly Summary", href: "/monthly-summary" },
            { title: "Goal Progress", href: "/goals" },
          ]}
        />

        <NavGroup
          title="Categories"
          icon={<Tags className="h-5 w-5" />}
          children={[
            { title: "Manage Category", href: "/categories" },
            { title: "Category Limits", href: "/category-limits" },
          ]}
        />

        <NavGroup
          title="Reports & Analysis"
          icon={<BarChart3 className="h-5 w-5" />}
          children={[
            { title: "Reports", href: "/reports" },
            { title: "Spending Trends", href: "/spending-trends" },
          ]}
        />

        <NavGroup
          title="Settings"
          icon={<Settings className="h-5 w-5" />}
          children={[
            { title: "Profile", href: "/settings/profile" },
            { title: "Preferences", href: "/settings/preferences" },
            { title: "Backup & Sync", href: "/settings/backup" },
          ]}
        />
      </nav>

      {user && (
        <div className="border-t border-zinc-800 p-4">
          <UserProfile />
        </div>
      )}
    </div>
  )
})

export { Sidebar }
