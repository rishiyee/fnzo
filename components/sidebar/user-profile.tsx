"use client"

import { memo, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface UserProfileProps {
  collapsed?: boolean
}

export const UserProfile = memo(function UserProfile({ collapsed = false }: UserProfileProps) {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      })
      router.push("/auth")
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }, [signOut, toast, router])

  if (!user) return null

  // Get user initials for avatar
  const getInitials = () => {
    if (!user.email) return "U"
    return user.email.charAt(0).toUpperCase()
  }

  // If collapsed, only show the avatar with logout button
  if (collapsed) {
    return (
      <div className="flex flex-col items-center justify-center">
        <Avatar className="h-10 w-10 mb-2">
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-zinc-400 hover:text-white">
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Sign out</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">
            {user.user_metadata?.name || user.email?.split("@")[0] || "User"}
          </span>
          <span className="text-xs text-zinc-400 truncate max-w-[140px]">{user.email}</span>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-zinc-400 hover:text-white">
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Sign out</span>
      </Button>
    </div>
  )
})
