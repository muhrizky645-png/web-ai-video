import { createClient, type SupabaseClient } from "@supabase/supabase-js"

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      "Environment variable NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum diset."
    )
  }
  return { url, key }
}

let browserClient: SupabaseClient | null = null

// Client untuk dipakai di browser: menyimpan sesi login user.
export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient
  const { url, key } = getEnv()
  browserClient = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return browserClient
}

// Client sisi server per-request: memakai token user agar RLS berjalan sebagai user tsb.
export function getSupabaseWithToken(accessToken: string): SupabaseClient {
  const { url, key } = getEnv()
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Ambil token Bearer dari header Authorization sebuah request.
export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization")
  if (!header) return null
  const parts = header.split(" ")
  return parts.length === 2 ? parts[1] : null
}
