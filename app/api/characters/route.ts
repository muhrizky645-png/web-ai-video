import { NextResponse } from "next/server"
import { getSupabaseWithToken, getBearerToken } from "@/lib/supabaseClient"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const token = getBearerToken(req)
    if (!token) return NextResponse.json({ error: "Belum login." }, { status: 401 })

    const supabase = getSupabaseWithToken(token)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    const user = userData?.user
    if (userErr || !user) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("characters")
      .select("id, name, description, image_url, image_urls, voice_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Gagal memuat karakter." }, { status: 500 })
    }

    const characters = (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      imageUrl: c.image_url,
      imageUrls: Array.isArray(c.image_urls) ? c.image_urls : [],
      voiceUrl: c.voice_url ?? null,
      createdAt: c.created_at,
    }))

    return NextResponse.json({ characters })
  } catch (err) {
    return NextResponse.json({ error: "Konfigurasi server belum lengkap." }, { status: 500 })
  }
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

    const body = await req.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const description = typeof body.description === "string" ? body.description.trim() : ""
    const imageUrls = Array.isArray(body.imageUrls)
      ? body.imageUrls.filter((u: unknown): u is string => typeof u === "string" && u.length > 0)
      : []
    const imageUrl =
      typeof body.imageUrl === "string" && body.imageUrl ? body.imageUrl : imageUrls[0] ?? null
    const voiceUrl = typeof body.voiceUrl === "string" && body.voiceUrl ? body.voiceUrl : null

    if (!name) {
      return NextResponse.json({ error: "Nama karakter wajib diisi." }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("characters")
      .insert({
        user_id: user.id,
        name,
        description,
        image_url: imageUrl,
        image_urls: imageUrls,
        voice_url: voiceUrl,
      })
      .select("id, name, description, image_url, image_urls, voice_url, created_at")
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Gagal menyimpan karakter." }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      description: data.description,
      imageUrl: data.image_url,
      imageUrls: Array.isArray(data.image_urls) ? data.image_urls : [],
      voiceUrl: data.voice_url ?? null,
      createdAt: data.created_at,
    })
  } catch (err) {
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 500 })
  }
}
