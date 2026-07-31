import { NextResponse } from "next/server"
import { getSupabaseWithToken, getBearerToken } from "@/lib/supabaseClient"
import type { SupabaseClient, User } from "@supabase/supabase-js"

export type AuthOk = { ok: true; supabase: SupabaseClient; user: User }
export type AuthErr = { ok: false; response: NextResponse }

// Ambil user dari token Bearer sebuah request API. Dipakai ulang di semua route.
export async function authFromRequest(req: Request): Promise<AuthOk | AuthErr> {
  const token = getBearerToken(req)
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: "Belum login." }, { status: 401 }) }
  }
  const supabase = getSupabaseWithToken(token)
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    return { ok: false, response: NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 }) }
  }
  return { ok: true, supabase, user: data.user }
}
