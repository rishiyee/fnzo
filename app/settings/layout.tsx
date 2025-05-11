import type React from "react"
import type { Metadata } from "next"
import SettingsLayout from "./page"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences.",
}

interface SettingsProps {
  children: React.ReactNode
}

export default function Settings({ children }: SettingsProps) {
  return <SettingsLayout children={children} />
}
