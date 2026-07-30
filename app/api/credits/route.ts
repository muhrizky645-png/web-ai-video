import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabaseClient"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from("credits")
      .select("balance")
      .eq("id", "default")
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Gagal mengambil data kredit." }, { status: 500 })
    }

    return NextResponse.json({ balance: data.balance })
  } catch (err) {
    return NextResponse.json({ error: "Konfigurasi server belum lengkap." }, { status: 500 })
  }
}
