import { getSupabaseBrowserClient } from "./supabase"

export const verifyDatabaseSchema = async () => {
  try {
    const supabase = getSupabaseBrowserClient()

    // Check if the expenses table exists and has the expected columns
    const { data, error } = await supabase
      .from("expenses")
      .select("id, user_id, date, type, category, amount, notes")
      .limit(1)

    if (error) {
      console.error("Schema verification error:", error)

      if (error.code === "42P01") {
        return {
          success: false,
          error: "The expenses table does not exist. Please run the database setup script.",
        }
      }

      if (error.code === "42703") {
        return {
          success: false,
          error: "The expenses table is missing required columns. Please check your database schema.",
        }
      }

      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Schema verification exception:", error)
    return { success: false, error: error.message }
  }
}
