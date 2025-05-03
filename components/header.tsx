"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserProfile } from "@/components/auth/user-profile"
import { Wallet, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVisibility } from "@/contexts/visibility-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Header() {
  const { showValues, toggleVisibility } = useVisibility()

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Wallet className="h-6 w-6" />
          <span className="text-xl font-bold">Fnzo</span>
        </Link>
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
          <UserProfile />
        </div>
      </div>
    </header>
  )
}
