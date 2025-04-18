"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Icons } from "@/components/icons"

// Form validation schemas
const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
})

const signUpSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

type AuthFormProps = {
  mode: "signin" | "signup"
}

export function AuthForm({ mode }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Initialize form with the appropriate schema
  const form = useForm<z.infer<typeof signInSchema | typeof signUpSchema>>({
    resolver: zodResolver(mode === "signin" ? signInSchema : signUpSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof signInSchema | typeof signUpSchema>) => {
    setIsLoading(true)

    try {
      if (mode === "signin") {
        const { error } = await signIn(values.email, values.password)
        if (error) {
          handleAuthError(error)
          return
        }

        // Add a small delay to ensure the session is properly set
        await new Promise((resolve) => setTimeout(resolve, 500))

        toast({
          title: "Success",
          description: "You have been signed in successfully",
        })

        // Navigate to home page
        router.push("/")
      } else {
        const { error } = await signUp(values.email, values.password)
        if (error) {
          handleAuthError(error)
          return
        }
        toast({
          title: "Account created",
          description: "Please check your email for the confirmation link",
        })
      }
    } catch (error) {
      console.error(`${mode} error:`, error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle authentication errors
  const handleAuthError = (error: any) => {
    if (error.status === 429) {
      toast({
        title: "Too many attempts",
        description: "Please try again later.",
        variant: "destructive",
      })
    } else if (error.message?.includes("credentials")) {
      toast({
        title: "Invalid credentials",
        description: "Please check your email and password.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Authentication error",
        description: error.message || "An error occurred during authentication.",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  autoComplete={mode === "signin" ? "email" : "new-email"}
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                {mode === "signin" && (
                  <Button variant="link" className="px-0 font-normal h-auto" type="button" disabled={isLoading}>
                    Forgot password?
                  </Button>
                )}
              </div>
              <FormControl>
                <Input
                  type="password"
                  placeholder={mode === "signin" ? "••••••" : "Create a password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "signin" ? "Sign In" : "Create Account"}
        </Button>
      </form>
    </Form>
  )
}
