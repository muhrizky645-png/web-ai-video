import { NextResponse } from "next/server"
import { authFromRequest } from "@/lib/apiAuth"

export const dynamic = "force-dynamic"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authFromRequest(req)
    if (!auth.ok) return auth.response
    const { supabase, user } = auth

    const { id } = await params
    const { error } = await supabase.from("images").delete().eq("id", id).eq("user_id", user.id)
    if (error) return NextResponse.json({ error: "Gagal menghapus gambar." }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authFromRequest(req)
    if (!auth.ok) return auth.response
    const { supabase, user } = auth

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const favorite = !!body.favorite
    const { error } = await supabase.from("images").update({ favorite }).eq("id", id).eq("user_id", user.id)
    if (error) return NextResponse.json({ error: "Gagal memperbarui gambar." }, { status: 500 })
    return NextResponse.json({ ok: true, favorite })
  } catch {
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 500 })
  }
}
