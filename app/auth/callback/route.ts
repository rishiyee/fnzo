import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")

  // Handle error cases
  if (error) {
    console.error("Auth callback error:", error, error_description)
    return NextResponse.redirect(
      new URL(`/auth/auth-error?error=${encodeURIComponent(error_description || error)}`, request.url),
    )
  }

  if (code) {
    try {
      const supabase = createServerClient()

      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        // Redirect to the home page after successful authentication
        return NextResponse.redirect(new URL("/", request.url))
      }

      console.error("Error exchanging code for session:", error)
      return NextResponse.redirect(new URL(`/auth/auth-error?error=${encodeURIComponent(error.message)}`, request.url))
    } catch (error: any) {
      console.error("Callback route error:", error)
      return NextResponse.redirect(
        new URL(`/auth/auth-error?error=${encodeURIComponent(error.message || "Unknown error")}`, request.url),
      )
    }
  }

  // Return the user to an error page if something went wrong
  return NextResponse.redirect(new URL("/auth/auth-error", request.url))
}
