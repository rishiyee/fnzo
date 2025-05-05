"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserProfile } from "@/components/auth/user-profile"
import { Wallet, Eye, EyeOff, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVisibility } from "@/contexts/visibility-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSidebar } from "@/contexts/sidebar-context"
import { cn } from "@/lib/utils"

export function Header() {
  const { showValues, toggleVisibility } = useVisibility()
  const { isCollapsed, isMobileSidebarOpen, setMobileSidebarOpen } = useSidebar()

  return (
    <header
      className={cn(
        "sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
        isCollapsed ? "md:pl-[70px]" : "md:pl-[240px]",
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Link href="/" className="flex items-center space-x-2 md:hidden">
            <Wallet className="h-6 w-6" />
            <span className="text-xl font-bold">Fnzo</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={toggleVisibility}
                  variant="outline"
                  size="icon"
                  className={`transition-all duration-200 ${!showValues ? "bg-muted" : ""}`}
                >
                  {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <span className="sr-only">{showValues ? "Hide Values" : "Show Values"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showValues ? "Hide financial values" : "Show financial values"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ThemeToggle />
          <UserProfile className="hidden md:flex" />
        </div>
      </div>
    </header>
  )
}
