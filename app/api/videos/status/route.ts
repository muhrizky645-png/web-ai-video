import { NextResponse } from "next/server"
import { getSupabaseWithToken, getBearerToken } from "@/lib/supabaseClient"
import { getPrediction, extractVideoUrl } from "@/lib/replicate"

export const dynamic = "force-dynamic"

type VideoRow = {
  id: string
  prompt: string
  video_url: string | null
  resolution: string | null
  aspect_ratio: string | null
  duration: number | null
  created_at: string
  status: string | null
  prediction_id?: string | null
}

function mapVideo(v: VideoRow) {
  return {
    id: v.id,
    prompt: v.prompt,
    videoUrl: v.video_url,
    resolution: v.resolution,
    aspectRatio: v.aspect_ratio,
    duration: v.duration,
    createdAt: v.created_at,
    status: v.status,
  }
}

export async function GET(req: Request) {
  try {
    const token = getBearerToken(req)
    if (!token) return NextResponse.json({ error: "Belum login." }, { status: 401 })

    const supabase = getSupabaseWithToken(token)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    const user = userData?.user
    if (userErr || !user) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID video wajib diisi." }, { status: 400 })

    const { data: video, error: vErr } = await supabase
      .from("videos")
      .select("id, prompt, video_url, resolution, aspect_ratio, duration, created_at, status, prediction_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (vErr || !video) return NextResponse.json({ error: "Video tidak ditemukan." }, { status: 404 })

    // Sudah selesai / gagal / tanpa prediksi -> kembalikan apa adanya.
    if (video.status === "done" || video.status === "failed" || !video.prediction_id) {
      return NextResponse.json(mapVideo(video))
    }

    // Cek status prediksi di Replicate.
    let prediction
    try {
      prediction = await getPrediction(video.prediction_id)
    } catch {
      return NextResponse.json(mapVideo(video))
    }

    if (prediction.status === "succeeded") {
      const url = extractVideoUrl(prediction.output)
      if (url) {
        const { data: updated } = await supabase
          .from("videos")
          .update({ video_url: url, status: "done" })
          .eq("id", id)
          .eq("user_id", user.id)
          .select("id, prompt, video_url, resolution, aspect_ratio, duration, created_at, status")
          .single()
        return NextResponse.json(mapVideo((updated as VideoRow) ?? { ...video, video_url: url, status: "done" }))
      }
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      await supabase.from("videos").update({ status: "failed" }).eq("id", id).eq("user_id", user.id)
      // Kembalikan 1 kredit karena gagal.
      const { data: creditRow } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", user.id)
        .single()
      if (creditRow) {
        await supabase
          .from("credits")
          .update({ balance: creditRow.balance + 1, updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
      }
      return NextResponse.json({ ...mapVideo(video), status: "failed" })
    }

    // Masih diproses.
    return NextResponse.json(mapVideo(video))
  } catch {
    return NextResponse.json({ error: "Gagal memeriksa status." }, { status: 500 })
  }
}
