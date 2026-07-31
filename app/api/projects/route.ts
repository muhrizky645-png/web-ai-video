import { NextResponse } from "next/server"
import { authFromRequest } from "@/lib/apiAuth"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const auth = await authFromRequest(req)
    if (!auth.ok) return auth.response
    const { supabase, user } = auth

    const { data, error } = await supabase
      .from("projects")
      .select("id, name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: "Gagal memuat proyek." }, { status: 500 })

    const projects = (data ?? []).map((p) => ({ id: p.id, name: p.name, createdAt: p.created_at }))
    return NextResponse.json({ projects })
  } catch {
    return NextResponse.json({ error: "Konfigurasi server belum lengkap." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authFromRequest(req)
    if (!auth.ok) return auth.response
    const { supabase, user } = auth

    const body = await req.json().catch(() => ({}))
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name) return NextResponse.json({ error: "Nama proyek wajib diisi." }, { status: 400 })

    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: user.id, name })
      .select("id, name, created_at")
      .single()

    if (error || !data) return NextResponse.json({ error: "Gagal membuat proyek." }, { status: 500 })
    return NextResponse.json({ id: data.id, name: data.name, createdAt: data.created_at })
  } catch {
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 500 })
  }
}
