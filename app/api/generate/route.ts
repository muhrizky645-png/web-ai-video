import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabaseClient"

export const dynamic = "force-dynamic"

// Video dummy publik, dipakai sementara sebelum API Seedance asli disambungkan.
const DUMMY_VIDEO_URLS = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
]

export async function POST(req: Request) {
  try {
    const supabase = getSupabase()

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
      .eq("id", "default")
      .single()

    if (fetchError || !creditRow) {
      return NextResponse.json({ error: "Gagal mengambil data kredit." }, { status: 500 })
    }

    if (creditRow.balance <= 0) {
      return NextResponse.json(
        { error: "Kredit habis. Tidak bisa generate video." },
        { status: 402 }
      )
    }

    // Simulasi waktu proses generate video (mock, belum memanggil Seedance API).
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const { data: updatedRow, error: updateError } = await supabase
      .from("credits")
      .update({ balance: creditRow.balance - 1, updated_at: new Date().toISOString() })
      .eq("id", "default")
      .select("balance")
      .single()

    if (updateError || !updatedRow) {
      return NextResponse.json({ error: "Gagal memperbarui kredit." }, { status: 500 })
    }

    const videoUrl = DUMMY_VIDEO_URLS[Math.floor(Math.random() * DUMMY_VIDEO_URLS.length)]

    // Simpan hasil ke histori (tabel videos) supaya galeri tetap ada saat halaman di-refresh.
    const { data: videoRow, error: insertError } = await supabase
      .from("videos")
      .insert({
        prompt,
        video_url: videoUrl,
        resolution,
        aspect_ratio: aspectRatio,
        duration,
      })
      .select("id, prompt, video_url, resolution, aspect_ratio, duration, created_at")
      .single()

    if (insertError || !videoRow) {
      // Kalau gagal menyimpan histori, video tetap dikembalikan agar UX tidak terganggu.
      return NextResponse.json({
        id: crypto.randomUUID(),
        prompt,
        videoUrl,
        resolution,
        aspectRatio,
        duration,
        createdAt: new Date().toISOString(),
        remainingCredits: updatedRow.balance,
      })
    }

    return NextResponse.json({
      id: videoRow.id,
      prompt: videoRow.prompt,
      videoUrl: videoRow.video_url,
      resolution: videoRow.resolution,
      aspectRatio: videoRow.aspect_ratio,
      duration: videoRow.duration,
      createdAt: videoRow.created_at,
      remainingCredits: updatedRow.balance,
    })
  } catch (err) {
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 500 })
  }
}
