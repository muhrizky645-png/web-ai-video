import { NextResponse } from "next/server"
import { authFromRequest } from "@/lib/apiAuth"

export const dynamic = "force-dynamic"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authFromRequest(req)
    if (!auth.ok) return auth.response
    const { supabase, user } = auth

    const { id } = await params
    const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", user.id)
    if (error) return NextResponse.json({ error: "Gagal menghapus proyek." }, { status: 500 })
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
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name) return NextResponse.json({ error: "Nama proyek wajib diisi." }, { status: 400 })

    const { error } = await supabase.from("projects").update({ name }).eq("id", id).eq("user_id", user.id)
    if (error) return NextResponse.json({ error: "Gagal memperbarui proyek." }, { status: 500 })
    return NextResponse.json({ ok: true, name })
  } catch {
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 500 })
  }
}
