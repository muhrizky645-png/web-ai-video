import { NextResponse } from "next/server"
import { getSupabaseWithToken, getBearerToken } from "@/lib/supabaseClient"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const token = getBearerToken(req)
    if (!token) return NextResponse.json({ error: "Belum login." }, { status: 401 })

    const supabase = getSupabaseWithToken(token)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    const user = userData?.user
    if (userErr || !user) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("credits")
      .select("balance")
      .eq("user_id", user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ balance: 0 })
    }

    return NextResponse.json({ balance: data.balance })
  } catch (err) {
    return NextResponse.json({ error: "Konfigurasi server belum lengkap." }, { status: 500 })
  }
}
