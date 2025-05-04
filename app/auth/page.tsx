import type { Metadata } from "next"
import AuthPageClient from "./auth-page-client"

export const metadata: Metadata = {
  title: "Authentication - Fnzo",
  description: "Sign in to your Fnzo account",
}

export default function AuthPage() {
  return <AuthPageClient />
}
