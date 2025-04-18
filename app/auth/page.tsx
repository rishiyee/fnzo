"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { AuthForm } from "@/components/auth/auth-form"
import { Wallet } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") || "signin"

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/")
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect in the useEffect
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 py-4">
        <Link href="/" className="flex items-center space-x-2">
          <Wallet className="h-6 w-6" />
          <span className="text-xl font-bold">Fnzo</span>
        </Link>
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[350px] p-4 sm:p-0">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              {mode === "signup" ? "Create an account" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === "signup"
                ? "Enter your information to create an account"
                : "Enter your credentials to access your account"}
            </p>
          </div>
          <AuthForm mode={mode as "signin" | "signup"} />
          <div className="mt-4 text-center text-sm">
            {mode === "signin" ? (
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/auth?mode=signup" className="underline underline-offset-4 hover:text-primary">
                  Sign up
                </Link>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth?mode=signin" className="underline underline-offset-4 hover:text-primary">
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="py-6 text-center text-sm text-muted-foreground">
        <p>
          By continuing, you agree to our{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
