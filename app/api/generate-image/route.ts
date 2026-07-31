import { NextResponse } from "next/server"
import { authFromRequest } from "@/lib/apiAuth"

export const dynamic = "force-dynamic"

// MODE DEMO: kembalikan gambar contoh (dummy) tanpa API berbayar.
// Nanti bisa disambungkan ke API text-to-image asli.
function dims(aspect: string): { w: number; h: number } {
  if (aspect === "9:16") return { w: 768, h: 1365 }
  if (aspect === "1:1") return { w: 1024, h: 1024 }
  return { w: 1365, h: 768 }
}

export async function POST(req: Request) {
  try {
    const auth = await authFromRequest(req)
    if (!auth.ok) return auth.response
    const { supabase, user } = auth

    const body = await req.json().catch(() => ({}))
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : ""
    const aspectRatio = typeof body.aspectRatio === "string" ? body.aspectRatio : "16:9"
    const style = typeof body.style === "string" ? body.style : ""
    const projectId = typeof body.projectId === "string" && body.projectId ? body.projectId : null
    if (!prompt) return NextResponse.json({ error: "Prompt wajib diisi." }, { status: 400 })

    const { data: creditRow, error: fetchError } = await supabase
      .from("credits").select("balance").eq("user_id", user.id).single()
    if (fetchError || !creditRow) return NextResponse.json({ error: "Gagal mengambil data kredit." }, { status: 500 })
    if (creditRow.balance <= 0) return NextResponse.json({ error: "Kredit habis. Tidak bisa generate gambar." }, { status: 402 })

    const { data: updatedRow, error: updateError } = await supabase
      .from("credits").update({ balance: creditRow.balance - 1, updated_at: new Date().toISOString() })
      .eq("user_id", user.id).select("balance").single()
    if (updateError || !updatedRow) return NextResponse.json({ error: "Gagal memperbarui kredit." }, { status: 500 })

    const { w, h } = dims(aspectRatio)
    const seed = Math.random().toString(36).slice(2, 10)
    const imageUrl = "https://picsum.photos/seed/" + seed + "/" + w + "/" + h

    const { data: row, error: insertError } = await supabase
      .from("images")
      .insert({ user_id: user.id, project_id: projectId, prompt, image_url: imageUrl, aspect_ratio: aspectRatio, style })
      .select("id, prompt, image_url, aspect_ratio, style, created_at, favorite")
      .single()
    if (insertError || !row) return NextResponse.json({ error: "Gagal menyimpan gambar." }, { status: 500 })

    return NextResponse.json({
      id: row.id,
      prompt: row.prompt,
      imageUrl: row.image_url,
      aspectRatio: row.aspect_ratio,
      style: row.style,
      createdAt: row.created_at,
      favorite: row.favorite ?? false,
      remainingCredits: updatedRow.balance,
    })
  } catch {
    return NextResponse.json({ error: "Gagal memproses permintaan." }, { status: 500 })
  }
}
