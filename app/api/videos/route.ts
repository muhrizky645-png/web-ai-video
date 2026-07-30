import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabaseClient"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from("videos")
      .select("id, prompt, video_url, resolution, aspect_ratio, duration, created_at")
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
    }))

    return NextResponse.json({ videos })
  } catch (err) {
    return NextResponse.json({ error: "Konfigurasi server belum lengkap." }, { status: 500 })
  }
}
