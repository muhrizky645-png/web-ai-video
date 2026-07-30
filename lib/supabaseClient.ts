import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

// Membuat koneksi Supabase secara lazy (saat dibutuhkan), bukan saat build,
// supaya build tidak gagal ketika env variable belum tersedia di tahap build.
export function getSupabase(): SupabaseClient {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Environment variable NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum diset."
    )
  }

  client = createClient(supabaseUrl, supabaseAnonKey)
  return client
}
