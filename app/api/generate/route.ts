import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

// Video dummy publik, dipakai sementara sebelum API Seedance asli disambungkan.
const DUMMY_VIDEO_URLS = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
]

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const prompt = formData.get("prompt")

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

    return NextResponse.json({
      id: crypto.randomUUID(),
      prompt,
      videoUrl,
      createdAt: new Date().toISOString(),
      status: "success",
      remainingCredits: updatedRow.balance,
    })
  } catch (err) {
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 500 })
  }
}
