import { NextResponse } from "next/server"
import { authFromRequest } from "@/lib/apiAuth"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const auth = await authFromRequest(req)
    if (!auth.ok) return auth.response
    const { supabase, user } = auth

    const projectId = new URL(req.url).searchParams.get("projectId")
    let query = supabase
      .from("images")
      .select("id, prompt, image_url, aspect_ratio, style, created_at, favorite")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60)
    if (projectId) query = query.eq("project_id", projectId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: "Gagal memuat gambar." }, { status: 500 })

    const images = (data ?? []).map((i) => ({
      id: i.id,
      prompt: i.prompt,
      imageUrl: i.image_url,
      aspectRatio: i.aspect_ratio,
      style: i.style,
      createdAt: i.created_at,
      favorite: i.favorite ?? false,
    }))
    return NextResponse.json({ images })
  } catch {
    return NextResponse.json({ error: "Konfigurasi server belum lengkap." }, { status: 500 })
  }
}
