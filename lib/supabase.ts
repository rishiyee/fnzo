import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a single supabase client for the browser
let browserClient: ReturnType<typeof createClient> | null = null

// Update the getSupabaseBrowserClient function to handle initialization errors better
export const getSupabaseBrowserClient = () => {
  if (browserClient) return browserClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing")
    throw new Error("Supabase configuration is incomplete")
  }

  console.log("Initializing Supabase client with:", {
    url: supabaseUrl,
    keyLength: supabaseAnonKey.length, // Log key length for debugging without exposing the key
  })

  try {
    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "fnzo-supabase-auth",
        flowType: "pkce",
        debug: false, // Disable debug mode to reduce console noise
      },
      global: {
        // Add fetch options with retry and timeout
        fetch: (url, options) => {
          return fetch(url, {
            ...options,
            // Add a longer timeout for auth requests
            signal: options?.signal || (url.includes("/auth/") ? AbortSignal.timeout(10000) : undefined),
          })
        },
      },
    })

    // Add a listener for auth state changes to help with debugging
    const {
      data: { subscription },
    } = browserClient.auth.onAuthStateChange((event, session) => {
      // Only log important auth events to reduce noise
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        console.log(`Supabase auth event: ${event}`, {
          hasSession: !!session,
          userId: session?.user?.id || "none",
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : "none",
        })
      }
    })

    return browserClient
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    throw new Error("Failed to initialize Supabase client")
  }
}

// For server components
export const createServerClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Server Supabase URL or Service Key is missing")
    throw new Error("Server Supabase configuration is incomplete")
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Verify Supabase connection
export const verifySupabaseConnection = async () => {
  try {
    const supabase = getSupabaseBrowserClient()

    // Try a simple query to test the connection
    const { data, error } = await supabase.from("expenses").select("count").limit(1)

    if (error) {
      console.error("Supabase connection test failed:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Supabase connection test exception:", error)
    return { success: false, error: error.message }
  }
}
