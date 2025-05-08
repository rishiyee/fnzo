"use client"

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { Session, User, AuthError } from "@supabase/supabase-js"

type AuthContextType = {
  session: Session | null
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  verifySession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Rate limiting for session refresh
  const isRefreshing = useRef(false)
  const lastRefreshTime = useRef(0)
  const refreshCooldown = useRef(0)
  const MAX_COOLDOWN = 60000 // 1 minute maximum cooldown
  const MIN_REFRESH_INTERVAL = 10000 // 10 seconds between refresh attempts

  // Initialize Supabase client
  const supabase = getSupabaseBrowserClient()

  // Initialize auth state - only runs once
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth state...")
        setIsLoading(true)

        // Get initial session
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setIsLoading(false)
          return
        }

        console.log("Initial session:", data.session ? "Found" : "Not found")

        if (data.session) {
          setSession(data.session)
          setUser(data.session.user)
        }

        // Set up auth state change listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log("Auth state changed:", event, newSession ? "Session exists" : "No session")

          if (newSession) {
            setSession(newSession)
            setUser(newSession.user)
          } else if (event === "SIGNED_OUT") {
            setSession(null)
            setUser(null)
          }

          // Force a router refresh when auth state changes
          if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
            router.refresh()
          }
        })

        setIsLoading(false)
        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [supabase, router])

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Signing in user:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        return { error }
      }

      // Check if session exists in the response
      if (!data.session) {
        console.error("Sign in error: Auth session missing", { data })
        return {
          error: {
            message: "Authentication failed. No session returned.",
            status: 400,
            name: "AuthError",
          } as AuthError,
        }
      }

      // Check if user exists in the response
      if (!data.user) {
        console.error("Sign in error: Auth user missing", { data })
        // If we have a session but no user, try to get the user
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser()
          if (userError || !userData.user) {
            return {
              error: {
                message: "Authentication failed. User data not available.",
                status: 400,
                name: "AuthError",
              } as AuthError,
            }
          }
          // Set the user from the getUser call
          setUser(userData.user)
        } catch (getUserError) {
          console.error("Error getting user after sign in:", getUserError)
          return {
            error: {
              message: "Authentication failed. Could not retrieve user data.",
              status: 400,
              name: "AuthError",
            } as AuthError,
          }
        }
      } else {
        // User exists in the response, set it
        setUser(data.user)
      }

      // Set the session
      setSession(data.session)

      console.log("Sign in successful", {
        userId: data.user?.id || "unknown",
        hasSession: !!data.session,
        expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : "unknown",
      })

      // Reset refresh cooldown on successful sign in
      refreshCooldown.current = 0
      lastRefreshTime.current = Date.now()

      return { error: null }
    } catch (error) {
      console.error("Sign in exception:", error)
      return { error: error as AuthError }
    }
  }

  // Sign up function
  const signUp = async (email: string, password: string) => {
    try {
      console.log("Signing up user:", email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        return { error }
      }

      console.log("Sign up successful")

      return { error: null }
    } catch (error) {
      console.error("Sign up exception:", error)
      return { error: error as AuthError }
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      console.log("Signing out user")

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Sign out error:", error)
        return
      }

      console.log("Sign out successful")

      // Reset state
      setSession(null)
      setUser(null)
      refreshCooldown.current = 0

      router.push("/auth")
      router.refresh()
    } catch (error) {
      console.error("Sign out exception:", error)
    }
  }

  // Refresh session function with rate limiting and better error handling
  const refreshSession = async () => {
    try {
      // Check if we're already refreshing
      if (isRefreshing.current) {
        console.log("Session refresh already in progress, skipping")
        return
      }

      // Check cooldown period
      if (refreshCooldown.current > 0) {
        const now = Date.now()
        const timeElapsed = now - lastRefreshTime.current

        if (timeElapsed < refreshCooldown.current) {
          console.log(
            `Refresh on cooldown. Please wait ${Math.ceil((refreshCooldown.current - timeElapsed) / 1000)} seconds`,
          )
          return
        }
      }

      // Check minimum interval between refreshes
      const now = Date.now()
      const timeSinceLastRefresh = now - lastRefreshTime.current

      if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
        console.log(
          `Minimum refresh interval not met. Please wait ${Math.ceil((MIN_REFRESH_INTERVAL - timeSinceLastRefresh) / 1000)} seconds`,
        )
        return
      }

      // Set refreshing flag
      isRefreshing.current = true
      lastRefreshTime.current = now

      console.log("Refreshing session")

      // First check if we have a session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Error getting session:", sessionError)

        // Increase cooldown on error (exponential backoff)
        if (sessionError.message.includes("rate limit")) {
          refreshCooldown.current = Math.min(refreshCooldown.current ? refreshCooldown.current * 2 : 5000, MAX_COOLDOWN)
          console.log(`Rate limit hit. Setting cooldown to ${refreshCooldown.current / 1000} seconds`)
        }

        isRefreshing.current = false
        return
      }

      if (!sessionData.session) {
        console.log("No session to refresh")
        // Clear the session state since there's no active session
        setSession(null)
        setUser(null)
        isRefreshing.current = false
        return
      }

      try {
        // Try to refresh the session
        const { data, error } = await supabase.auth.refreshSession()

        if (error) {
          console.error("Error refreshing session:", error)

          // Increase cooldown on error (exponential backoff)
          if (error.message.includes("rate limit")) {
            refreshCooldown.current = Math.min(
              refreshCooldown.current ? refreshCooldown.current * 2 : 5000,
              MAX_COOLDOWN,
            )
            console.log(`Rate limit hit. Setting cooldown to ${refreshCooldown.current / 1000} seconds`)
          }

          // Handle refresh token errors by clearing the session
          if (
            error.message.includes("refresh_token_not_found") ||
            error.message.includes("Invalid Refresh Token") ||
            error.code === "refresh_token_not_found"
          ) {
            console.log("Refresh token not found or invalid, signing out locally")
            await supabase.auth.signOut({ scope: "local" }) // Only sign out locally
            setSession(null)
            setUser(null)
          }

          isRefreshing.current = false
          return
        }

        console.log("Session refreshed:", data.session ? "Success" : "No session")
        if (data.session) {
          setSession(data.session)
          setUser(data.session.user)

          // Reset cooldown on successful refresh
          refreshCooldown.current = 0
        } else {
          // No session returned, clear the state
          setSession(null)
          setUser(null)
        }
      } catch (refreshError) {
        console.error("Session refresh exception:", refreshError)
        // Don't throw the error, just log it and continue
      }

      isRefreshing.current = false
    } catch (error) {
      console.error("Session refresh exception:", error)
      isRefreshing.current = false

      // Set a default cooldown on exception
      refreshCooldown.current = Math.min(refreshCooldown.current ? refreshCooldown.current * 2 : 5000, MAX_COOLDOWN)
    }
  }

  // Verify session function with rate limiting
  const verifySession = async (): Promise<boolean> => {
    try {
      // Check if we're on cooldown
      if (refreshCooldown.current > 0) {
        const now = Date.now()
        const timeElapsed = now - lastRefreshTime.current

        if (timeElapsed < refreshCooldown.current) {
          console.log(`Verification on cooldown. Using cached session state.`)
          return !!session // Use current session state
        }
      }

      // First check if we have a session in state
      if (!session) {
        // Try to get the session from Supabase
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          // Handle rate limiting
          if (sessionError.message.includes("rate limit")) {
            refreshCooldown.current = Math.min(
              refreshCooldown.current ? refreshCooldown.current * 2 : 5000,
              MAX_COOLDOWN,
            )
            console.log(`Rate limit hit. Setting cooldown to ${refreshCooldown.current / 1000} seconds`)
          }
          return false
        }

        if (!sessionData.session) {
          return false
        }

        // Update the session state
        setSession(sessionData.session)
        setUser(sessionData.session.user)
        return true
      }

      // If we have a session and we're not in a cooldown period, verify it
      // Check if the session is still valid
      const { data, error } = await supabase.auth.getUser()

      if (error) {
        console.error("Session verification failed:", error)

        // Handle rate limiting
        if (error.message.includes("rate limit")) {
          refreshCooldown.current = Math.min(refreshCooldown.current ? refreshCooldown.current * 2 : 5000, MAX_COOLDOWN)
          console.log(`Rate limit hit. Setting cooldown to ${refreshCooldown.current / 1000} seconds`)
          return !!session // Use current session state
        }

        // If we get an auth error, try to refresh the session
        if (error.message.includes("JWT") || error.message.includes("token")) {
          // Only try to refresh if we're not on cooldown
          if (refreshCooldown.current === 0) {
            try {
              await refreshSession()
              return !!session
            } catch (refreshException) {
              console.error("Session refresh exception:", refreshException)
              return false
            }
          } else {
            return !!session // Use current session state
          }
        }

        return false
      }

      if (!data.user) {
        return false
      }

      return true
    } catch (error) {
      console.error("Session verification exception:", error)
      return !!session // Use current session state on error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshSession,
        verifySession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
