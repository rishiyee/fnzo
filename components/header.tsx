"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserProfile } from "@/components/auth/user-profile"
import { Wallet } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Wallet className="h-6 w-6" />
          <span className="text-xl font-bold">Fnzo</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          <UserProfile />
        </div>
      </div>
    </header>
  )
}
