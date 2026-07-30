import { NextResponse } from "next/server"
import { getSupabaseWithToken, getBearerToken } from "@/lib/supabaseClient"

export const dynamic = "force-dynamic"

// Paket kredit yang tersedia (mode uji coba — pembayaran belum nyata).
const CREDIT_PACKAGES: Record<string, number> = {
  small: 10,
  medium: 50,
  large: 100,
}

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

    // Tentukan jumlah kredit dari paket yang dipilih (default 10 kredit).
    let amount = 10
    try {
      const body = await req.json()
      if (body && typeof body.packageId === "string" && CREDIT_PACKAGES[body.packageId]) {
        amount = CREDIT_PACKAGES[body.packageId]
      }
    } catch {
      // tanpa body → pakai default 10
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
        { user_id: user.id, balance: current + amount, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )
      .select("balance")
      .single()

    if (upErr || !updated) {
      return NextResponse.json({ error: "Gagal menambah kredit." }, { status: 500 })
    }

    return NextResponse.json({ balance: updated.balance, added: amount })
  } catch (err) {
    return NextResponse.json({ error: "Konfigurasi server belum lengkap." }, { status: 500 })
  }
}
