import { NextResponse } from "next/server"
import { getSupabaseWithToken, getBearerToken } from "@/lib/supabaseClient"

export const dynamic = "force-dynamic"

// MODE DEMO: kembalikan video contoh (dummy) tanpa memanggil API berbayar.
// Nanti bisa disambungkan lagi ke API video asli (mis. Replicate) via lib/replicate.ts.
const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
]

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req)
    if (!token) return NextResponse.json({ error: "Kamu harus login dulu." }, { status: 401 })

    const supabase = getSupabaseWithToken(token)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    const user = userData?.user
    if (userErr || !user) {
      return NextResponse.json({ error: "Sesi tidak valid, silakan login ulang." }, { status: 401 })
    }

    const formData = await req.formData()
    const prompt = formData.get("prompt")
    const resolution = (formData.get("resolution") as string) || "720p"
    const aspectRatio = (formData.get("aspectRatio") as string) || "16:9"
    const durationRaw = formData.get("duration")
    const duration = durationRaw ? parseInt(durationRaw as string, 10) : 5

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt wajib diisi." }, { status: 400 })
    }

    const { data: creditRow, error: fetchError } = await supabase
      .from("credits")
      .select("balance")
      .eq("user_id", user.id)
      .single()

    if (fetchError || !creditRow) {
      return NextResponse.json({ error: "Gagal mengambil data kredit." }, { status: 500 })
    }
    if (creditRow.balance <= 0) {
      return NextResponse.json({ error: "Kredit habis. Tidak bisa generate video." }, { status: 402 })
    }

    // Kurangi 1 kredit.
    const { data: updatedRow, error: updateError } = await supabase
      .from("credits")
      .update({ balance: creditRow.balance - 1, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .select("balance")
      .single()

    if (updateError || !updatedRow) {
      return NextResponse.json({ error: "Gagal memperbarui kredit." }, { status: 500 })
    }

    // Pilih video contoh secara acak (mode demo).
    const videoUrl = SAMPLE_VIDEOS[Math.floor(Math.random() * SAMPLE_VIDEOS.length)]

    const { data: videoRow, error: insertError } = await supabase
      .from("videos")
      .insert({
        prompt,
        video_url: videoUrl,
        resolution,
        aspect_ratio: aspectRatio,
        duration,
        user_id: user.id,
        status: "done",
        prediction_id: null,
      })
      .select("id, prompt, video_url, resolution, aspect_ratio, duration, created_at, status")
      .single()

    if (insertError || !videoRow) {
      return NextResponse.json({ error: "Gagal menyimpan data video." }, { status: 500 })
    }

    return NextResponse.json({
      id: videoRow.id,
      prompt: videoRow.prompt,
      videoUrl: videoRow.video_url,
      resolution: videoRow.resolution,
      aspectRatio: videoRow.aspect_ratio,
      duration: videoRow.duration,
      createdAt: videoRow.created_at,
      status: videoRow.status,
      remainingCredits: updatedRow.balance,
    })
  } catch (err) {
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 500 })
  }
}
