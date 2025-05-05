"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { AuthForm } from "@/components/auth/auth-form"
import { Wallet } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

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
      <header className="flex h-16 items-center justify-between px-4 md:px-6 border-b">
        <Link href="/" className="flex items-center space-x-2">
          <Wallet className="h-6 w-6" />
          <span className="text-xl font-bold">Fnzo</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8 bg-muted/40">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {mode === "signup" ? "Create an account" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {mode === "signup"
                ? "Enter your information to create an account"
                : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AuthForm mode={mode as "signin" | "signup"} />
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t pt-4">
            <div className="text-center text-sm">
              {mode === "signin" ? (
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <Link href="/auth?mode=signup" className="font-medium text-primary hover:underline">
                    Sign up
                  </Link>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/auth?mode=signin" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted transition-colors"
              >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                    fill="#34A853"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted transition-colors"
              >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M13.5 1C15.4 1 17.1 1.8 18.4 3.1C19.7 4.4 20.5 6.1 20.5 8C20.5 10.7 19.1 13.1 16.9 14.3C17 14.5 17.1 14.7 17.2 14.9C17.5 15.4 17.8 16 18.1 16.6C18.4 17.2 18.7 17.8 18.9 18.3C19.1 18.8 19.3 19.4 19.4 19.9C19.5 20.4 19.6 20.9 19.6 21.3C19.6 21.5 19.6 21.7 19.6 21.9C19.6 22.1 19.5 22.3 19.5 22.5C19.4 22.7 19.3 22.9 19.2 23.1C19.1 23.3 18.9 23.4 18.7 23.6C18.5 23.7 18.3 23.8 18.1 23.9C17.9 24 17.6 24 17.4 24C17 24 16.6 23.9 16.3 23.8C16 23.7 15.7 23.6 15.4 23.4C15.1 23.3 14.9 23.1 14.6 23C14.4 22.9 14.2 22.7 14 22.6C13.8 22.5 13.6 22.4 13.5 22.3C12.8 22.8 12.1 23.3 11.4 23.6C10.7 23.9 9.9 24 9.1 24C6.7 24 4.6 23.1 3.1 21.5C1.6 19.9 0.5 17.7 0.5 15C0.5 12.5 1.4 10.4 3 8.8C4.6 7.2 6.8 6.2 9.3 6.2C9.5 6.2 9.7 6.2 9.9 6.2C10.1 6.2 10.3 6.2 10.5 6.3C10.7 6.3 10.9 6.3 11.1 6.4C11.3 6.4 11.4 6.5 11.6 6.5C11.8 6.5 11.9 6.6 12.1 6.6C11.6 5.9 11.2 5.1 11 4.2C10.8 3.3 10.7 2.4 10.7 1.5C10.7 1.2 10.7 0.9 10.7 0.7C10.7 0.5 10.8 0.3 10.8 0.1C10.8 0.1 10.8 0 10.8 0C10.9 0 10.9 0 11 0C11 0 11.1 0 11.1 0.1C11.2 0.1 11.3 0.2 11.4 0.3C11.5 0.4 11.6 0.5 11.7 0.7C11.8 0.9 11.9 1.1 12 1.3C12.1 1.5 12.2 1.8 12.3 2.1C12.4 2.4 12.5 2.6 12.5 2.9C12.6 3.2 12.7 3.5 12.7 3.8C12.9 3.3 13.2 2.8 13.5 2.4C13.8 2 14.2 1.7 14.6 1.4C15 1.1 15.4 0.9 15.9 0.7C16.4 0.5 16.9 0.5 17.4 0.5C17.7 0.5 18.1 0.5 18.4 0.6C18.7 0.7 19 0.8 19.3 0.9C19.6 1 19.8 1.2 20.1 1.4C20.3 1.6 20.5 1.8 20.7 2C20.9 2.2 21 2.5 21.1 2.7C21.2 3 21.3 3.2 21.4 3.5C21.5 3.8 21.5 4.1 21.5 4.3C21.5 4.6 21.5 4.9 21.5 5.2C21.5 5.5 21.4 5.7 21.3 6C21.2 6.3 21.1 6.5 21 6.8C20.9 7.1 20.7 7.3 20.5 7.5C20.3 7.7 20.1 7.9 19.9 8.1C19.7 8.3 19.4 8.4 19.2 8.5C19 8.6 18.7 8.7 18.4 8.8C18.1 8.9 17.9 8.9 17.6 8.9C17.3 8.9 17 8.9 16.8 8.8C16.5 8.7 16.3 8.7 16 8.6C15.7 8.5 15.5 8.4 15.3 8.2C15.1 8.1 14.9 7.9 14.7 7.7C14.5 7.5 14.3 7.3 14.2 7.1C14.1 6.9 13.9 6.6 13.8 6.4C13.7 6.2 13.6 5.9 13.6 5.7C13.5 5.5 13.5 5.2 13.5 5C13.5 4.8 13.5 4.5 13.5 4.3C13.5 4.1 13.6 3.9 13.6 3.7C13.6 3.5 13.7 3.3 13.8 3.1C13.9 2.9 13.9 2.7 14 2.6C14.1 2.4 14.2 2.3 14.3 2.1C14.4 2 14.5 1.9 14.6 1.8C14.7 1.7 14.8 1.6 15 1.5C15.1 1.4 15.3 1.4 15.4 1.3C15.5 1.2 15.7 1.2 15.9 1.2C16 1.2 16.2 1.1 16.4 1.1C16.6 1.1 16.7 1.1 16.9 1.1C17.1 1.1 17.2 1.1 17.4 1.2C17.6 1.2 17.7 1.3 17.9 1.3C18.1 1.4 18.2 1.4 18.3 1.5C18.5 1.6 18.6 1.7 18.7 1.8C18.8 1.9 18.9 2 19 2.1C19.1 2.2 19.2 2.4 19.2 2.5C19.3 2.6 19.3 2.8 19.4 2.9C19.4 3 19.5 3.2 19.5 3.3C19.5 3.4 19.5 3.6 19.5 3.7C19.5 3.8 19.5 4 19.5 4.1C19.5 4.2 19.4 4.4 19.4 4.5C19.4 4.6 19.3 4.8 19.3 4.9C19.2 5 19.2 5.1 19.1 5.2C19 5.3 19 5.4 18.9 5.5C18.8 5.6 18.7 5.7 18.6 5.8C18.5 5.9 18.4 5.9 18.3 6C18.2 6.1 18.1 6.1 18 6.1C17.9 6.1 17.7 6.2 17.6 6.2C17.5 6.2 17.3 6.2 17.2 6.2C17.1 6.2 16.9 6.2 16.8 6.1C16.7 6.1 16.5 6.1 16.4 6C16.3 6 16.1 5.9 16 5.9C15.9 5.8 15.8 5.8 15.7 5.7C15.6 5.6 15.5 5.5 15.4 5.4C15.3 5.3 15.2 5.2 15.2 5.1C15.1 5 15.1 4.9 15 4.8C15 4.7 14.9 4.5 14.9 4.4C14.9 4.3 14.9 4.1 14.9 4C14.9 3.9 14.9 3.7 14.9 3.6C14.9 3.5 15 3.3 15 3.2C15 3.1 15.1 3 15.1 2.9C15.2 2.8 15.2 2.7 15.3 2.6C15.4 2.5 15.4 2.4 15.5 2.3C15.6 2.2 15.7 2.2 15.8 2.1C15.9 2 16 2 16.1 2C16.2 1.9 16.3 1.9 16.4 1.9C16.5 1.9 16.7 1.9 16.8 1.9C16.9 1.9 17 1.9 17.1 1.9C17.2 1.9 17.3 2 17.4 2C17.5 2 17.6 2.1 17.7 2.1C17.8 2.2 17.9 2.2 17.9 2.3C18 2.4 18.1 2.4 18.1 2.5C18.2 2.6 18.2 2.7 18.3 2.8C18.3 2.9 18.3 3 18.4 3.1C18.4 3.2 18.4 3.3 18.4 3.4C18.4 3.5 18.4 3.6 18.4 3.7C18.4 3.8 18.4 3.9 18.3 4C18.3 4.1 18.3 4.2 18.2 4.3C18.2 4.4 18.1 4.5 18.1 4.5C18 4.6 18 4.7 17.9 4.7C17.8 4.8 17.8 4.8 17.7 4.9C17.6 4.9 17.5 5 17.5 5C17.4 5 17.3 5.1 17.2 5.1C17.1 5.1 17 5.1 16.9 5.1C16.8 5.1 16.7 5.1 16.6 5.1C16.5 5.1 16.4 5.1 16.3 5C16.2 5 16.1 5 16 4.9C15.9 4.9 15.9 4.8 15.8 4.8C15.7 4.7 15.7 4.7 15.6 4.6C15.6 4.5 15.5 4.5 15.5 4.4C15.5 4.3 15.4 4.3 15.4 4.2C15.4 4.1 15.4 4 15.4 3.9C15.4 3.8 15.4 3.7 15.4 3.6C15.4 3.5 15.4 3.4 15.5 3.3C15.5 3.2 15.5 3.1 15.6 3.1C15.6 3 15.7 2.9 15.7 2.9C15.8 2.8 15.8 2.8 15.9 2.7C15.9 2.7 16 2.6 16.1 2.6C16.1 2.6 16.2 2.5 16.3 2.5C16.4 2.5 16.4 2.5 16.5 2.5C16.6 2.5 16.7 2.5 16.7 2.5C16.8 2.5 16.9 2.5 16.9 2.5C17 2.5 17.1 2.6 17.1 2.6C17.2 2.6 17.2 2.7 17.3 2.7C17.3 2.7 17.4 2.8 17.4 2.8C17.4 2.9 17.5 2.9 17.5 3C17.5 3 17.5 3.1 17.5 3.1C17.5 3.2 17.5 3.2 17.5 3.3C17.5 3.3 17.5 3.4 17.5 3.4C17.5 3.5 17.4 3.5 17.4 3.6C17.4 3.6 17.3 3.7 17.3 3.7C17.3 3.7 17.2 3.8 17.2 3.8C17.1 3.8 17.1 3.8 17 3.9C17 3.9 16.9 3.9 16.9 3.9C16.8 3.9 16.8 3.9 16.7 3.9C16.7 3.9 16.6 3.9 16.6 3.9C16.5 3.9 16.5 3.9 16.4 3.9C16.4 3.9 16.3 3.8 16.3 3.8C16.2 3.8 16.2 3.8 16.2 3.7C16.1 3.7 16.1 3.7 16.1 3.6C16.1 3.6 16 3.6 16 3.5C16 3.5 16 3.4 16 3.4C16 3.4 16 3.3 16 3.3C16 3.3 16 3.2 16 3.2C16 3.2 16 3.1 16 3.1C16 3.1 16.1 3 16.1 3C16.1 3 16.1 3 16.2 2.9C16.2 2.9 16.2 2.9 16.3 2.9C16.3 2.9 16.3 2.8 16.4 2.8C16.4 2.8 16.5 2.8 16.5 2.8C16.5 2.8 16.6 2.8 16.6 2.8C16.6 2.8 16.7 2.8 16.7 2.8C16.7 2.8 16.8 2.8 16.8 2.8C16.8 2.8 16.9 2.9 16.9 2.9C16.9 2.9 16.9 2.9 17 2.9C17 3 17 3 17 3C17 3 17 3.1 17 3.1C17 3.1 17 3.1 17 3.2C17 3.2 17 3.2 17 3.3C17 3.3 16.9 3.3 16.9 3.3C16.9 3.3 16.9 3.4 16.8 3.4C16.8 3.4 16.8 3.4 16.7 3.4C16.7 3.4 16.7 3.4 16.6 3.4C16.6 3.4 16.6 3.4 16.5 3.4C16.5 3.4 16.5 3.4 16.4 3.4C16.4 3.4 16.4 3.3 16.4 3.3C16.3 3.3 16.3 3.3 16.3 3.3C16.3 3.2 16.3 3.2 16.3 3.2C16.3 3.2 16.3 3.1 16.3 3.1C16.3 3.1 16.3 3.1 16.3 3.1C16.3 3 16.3 3 16.3 3C16.3 3 16.4 3 16.4 3C16.4 3 16.4 2.9 16.5 2.9C16.5 2.9 16.5 2.9 16.5 2.9C16.6 2.9 16.6 2.9 16.6 2.9C16.6 2.9 16.6 2.9 16.7 2.9C16.7 2.9 16.7 3 16.7 3C16.7 3 16.7 3 16.7 3C16.7 3 16.7 3.1 16.7 3.1C16.7 3.1 16.7 3.1 16.7 3.1C16.7 3.1 16.6 3.2 16.6 3.2C16.6 3.2 16.6 3.2 16.6 3.2C16.5 3.2 16.5 3.2 16.5 3.2C16.5 3.2 16.5 3.2 16.4 3.2C16.4 3.2 16.4 3.1 16.4 3.1C16.4 3.1 16.4 3.1 16.4 3.1C16.4 3.1 16.4 3 16.4 3C16.4 3 16.4 3 16.5 3C16.5 3 16.5 3 16.5 3C16.5 3 16.5 3 16.6 3C16.6 3 16.6 3 16.6 3C16.6 3 16.6 3 16.6 3.1C16.6 3.1 16.6 3.1 16.6 3.1C16.6 3.1 16.6 3.1 16.5 3.1C16.5 3.1 16.5 3.1 16.5 3.1C16.5 3.1 16.5 3.1 16.5 3.1C16.5 3.1 16.5 3.1 16.5 3.1C16.5 3.1 16.5 3.1 16.5 3.1Z"
                    fill="#1877F2"
                  />
                </svg>
                Facebook
              </button>
            </div>
          </CardFooter>
        </Card>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        <p>
          By continuing, you agree to our{" "}
          <Link href="#" className="font-medium text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </footer>
    </div>
  )
}
