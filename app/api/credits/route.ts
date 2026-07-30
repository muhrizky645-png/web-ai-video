import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET() {
  const { data, error } = await supabase
    .from("credits")
    .select("balance")
    .eq("id", "default")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Gagal mengambil data kredit." }, { status: 500 })
  }

  return NextResponse.json({ balance: data.balance })
}
