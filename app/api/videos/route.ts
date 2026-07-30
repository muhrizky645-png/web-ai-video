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
      .from("videos")
      .select("id, prompt, video_url, resolution, aspect_ratio, duration, created_at, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: "Gagal memuat histori video." }, { status: 500 })
    }

    const videos = (data ?? []).map((v) => ({
      id: v.id,
      prompt: v.prompt,
      videoUrl: v.video_url,
      resolution: v.resolution,
      aspectRatio: v.aspect_ratio,
      duration: v.duration,
      createdAt: v.created_at,
      status: v.status,
    }))

    return NextResponse.json({ videos })
  } catch (err) {
    return NextResponse.json({ error: "Konfigurasi server belum lengkap." }, { status: 500 })
  }
}
