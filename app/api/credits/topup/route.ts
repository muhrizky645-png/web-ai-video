import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabaseClient"

export const dynamic = "force-dynamic"

// Jumlah kredit yang ditambahkan tiap top-up (sementara, untuk uji coba).
const TOPUP_AMOUNT = 10

export async function POST() {
  try {
    const supabase = getSupabase()

    const { data: creditRow, error: fetchError } = await supabase
      .from("credits")
      .select("balance")
      .eq("id", "default")
      .single()

    if (fetchError || !creditRow) {
      return NextResponse.json({ error: "Gagal mengambil data kredit." }, { status: 500 })
    }

    const { data: updated, error: updateError } = await supabase
      .from("credits")
      .update({ balance: creditRow.balance + TOPUP_AMOUNT, updated_at: new Date().toISOString() })
      .eq("id", "default")
      .select("balance")
      .single()

    if (updateError || !updated) {
      return NextResponse.json({ error: "Gagal menambah kredit." }, { status: 500 })
    }

    return NextResponse.json({ balance: updated.balance, added: TOPUP_AMOUNT })
  } catch (err) {
    return NextResponse.json({ error: "Konfigurasi server belum lengkap." }, { status: 500 })
  }
}
