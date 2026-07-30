import { NextResponse } from "next/server"
import { getSupabaseWithToken, getBearerToken } from "@/lib/supabaseClient"

export const dynamic = "force-dynamic"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getBearerToken(req)
    if (!token) return NextResponse.json({ error: "Belum login." }, { status: 401 })

    const supabase = getSupabaseWithToken(token)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    const user = userData?.user
    if (userErr || !user) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 })
    }

    const { id } = await params
    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: "Gagal menghapus karakter." }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 500 })
  }
}
