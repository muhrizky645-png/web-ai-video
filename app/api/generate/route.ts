import { NextResponse } from "next/server"
import { getSupabaseWithToken, getBearerToken } from "@/lib/supabaseClient"
import { createPrediction } from "@/lib/replicate"

export const dynamic = "force-dynamic"

// Model video Replicate (WAN 2.2 Fast — cepat & murah).
const T2V_MODEL = "wan-video/wan-2.2-t2v-fast" // teks -> video
const I2V_MODEL = "wan-video/wan-2.2-i2v-fast" // gambar -> video

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
    const imageFile = formData.get("image")

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

    // Susun input untuk model. Kalau ada gambar referensi -> pakai model image-to-video.
    const input: Record<string, unknown> = { prompt }
    let model = T2V_MODEL
    if (imageFile && imageFile instanceof File && imageFile.size > 0) {
      const buf = Buffer.from(await imageFile.arrayBuffer())
      const dataUri = `data:${imageFile.type || "image/png"};base64,${buf.toString("base64")}`
      input.image = dataUri
      model = I2V_MODEL
    }

    // Mulai prediksi (async) di Replicate.
    let prediction
    try {
      prediction = await createPrediction(model, input)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memulai generate."
      return NextResponse.json({ error: `Gagal menghubungi Replicate: ${msg}` }, { status: 502 })
    }

    // Kurangi 1 kredit sebagai reservasi (dikembalikan kalau nanti gagal).
    const { data: updatedRow, error: updateError } = await supabase
      .from("credits")
      .update({ balance: creditRow.balance - 1, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .select("balance")
      .single()

    if (updateError || !updatedRow) {
      return NextResponse.json({ error: "Gagal memperbarui kredit." }, { status: 500 })
    }

    // Simpan baris video dengan status "processing".
    const { data: videoRow, error: insertError } = await supabase
      .from("videos")
      .insert({
        prompt,
        video_url: null,
        resolution,
        aspect_ratio: aspectRatio,
        duration,
        user_id: user.id,
        status: "processing",
        prediction_id: prediction.id,
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
