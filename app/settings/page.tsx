"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { UserCircle, Settings, Tags, Save } from "lucide-react"

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>
        <SettingsTabs />
        <div>{children}</div>
      </div>
    </div>
  )
}

function SettingsTabs() {
  const pathname = usePathname()

  const tabs = [
    {
      href: "/settings/profile",
      label: "Profile",
      icon: <UserCircle className="h-4 w-4 mr-2" />,
    },
    {
      href: "/settings/preferences",
      label: "Preferences",
      icon: <Settings className="h-4 w-4 mr-2" />,
    },
    {
      href: "/settings/categories",
      label: "Categories",
      icon: <Tags className="h-4 w-4 mr-2" />,
    },
    {
      href: "/settings/backup",
      label: "Backup & Sync",
      icon: <Save className="h-4 w-4 mr-2" />,
    },
  ]

  return (
    <Tabs defaultValue={pathname} className="w-full">
      <TabsList className="grid grid-cols-4 w-full">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.href}
            value={tab.href}
            className={cn("flex items-center", pathname === tab.href && "bg-primary/10 text-primary")}
            asChild
          >
            <Link href={tab.href}>
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
