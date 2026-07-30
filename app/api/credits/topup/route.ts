import { NextResponse } from "next/server"
import { getSupabaseWithToken, getBearerToken } from "@/lib/supabaseClient"

export const dynamic = "force-dynamic"

// Jumlah kredit yang ditambahkan tiap top-up (sementara, untuk uji coba).
const TOPUP_AMOUNT = 10

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req)
    if (!token) return NextResponse.json({ error: "Belum login." }, { status: 401 })

    const supabase = getSupabaseWithToken(token)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    const user = userData?.user
    if (userErr || !user) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 })
    }

    const { data: creditRow } = await supabase
      .from("credits")
      .select("balance")
      .eq("user_id", user.id)
      .single()

    const current = creditRow?.balance ?? 0

    const { data: updated, error: upErr } = await supabase
      .from("credits")
      .upsert(
        { user_id: user.id, balance: current + TOPUP_AMOUNT, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )
      .select("balance")
      .single()

    if (upErr || !updated) {
      return NextResponse.json({ error: "Gagal menambah kredit." }, { status: 500 })
    }

    return NextResponse.json({ balance: updated.balance, added: TOPUP_AMOUNT })
  } catch (err) {
    return NextResponse.json({ error: "Konfigurasi server belum lengkap." }, { status: 500 })
  }
}
