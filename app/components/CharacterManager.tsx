"use client"

import { useState, type FormEvent } from "react"
import type { Session } from "@supabase/supabase-js"
import { getSupabaseBrowser } from "@/lib/supabaseClient"
import { MAX_CHAR_PHOTOS, type CharacterItem, type PhotoItem } from "@/lib/app"
import { IconClose, IconImage, IconMic, IconPlus, IconTrash, IconUsers } from "./icons"

export default function CharacterManager({
  session,
  authFetch,
  characters,
  onChanged,
}: {
  session: Session
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
  characters: CharacterItem[]
  onChanged: () => void
}) {
  const supabase = getSupabaseBrowser()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [voice, setVoice] = useState<File | null>(null)
  const [voicePreview, setVoicePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return
    setPhotos((prev) => {
      const room = MAX_CHAR_PHOTOS - prev.length
      if (room <= 0) return prev
      const additions = Array.from(list)
        .slice(0, room)
        .map((file) => ({ file, url: URL.createObjectURL(file) }))
      return [...prev, ...additions]
    })
  }
  function removeFileAt(index: number) {
    setPhotos((prev) => {
      const target = prev[index]
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((_, i) => i !== index)
    })
  }
  function clearFiles() {
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url))
      return []
    })
  }

  function handleVoice(f: File | null) {
    setVoice(f)
    setVoicePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return f ? URL.createObjectURL(f) : null
    })
  }

  function resetForm() {
    setName("")
    setDescription("")
    clearFiles()
    handleVoice(null)
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError("Nama karakter wajib diisi.")
      return
    }
    setSaving(true)
    try {
      const imageUrls: string[] = []
      for (const p of photos) {
        const f = p.file
        const safe = f.name.replace(/[^a-zA-Z0-9.]/g, "_")
        const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`
        const { error: upErr } = await supabase.storage.from("character-images").upload(path, f)
        if (upErr) throw new Error("Gagal mengunggah foto: " + upErr.message)
        imageUrls.push(supabase.storage.from("character-images").getPublicUrl(path).data.publicUrl)
      }

      let voiceUrl: string | null = null
      if (voice) {
        const safe = voice.name.replace(/[^a-zA-Z0-9.]/g, "_")
        const path = `${session.user.id}/${Date.now()}-${safe}`
        const { error: vErr } = await supabase.storage.from("character-voices").upload(path, voice)
        if (vErr) throw new Error("Gagal mengunggah suara: " + vErr.message)
        voiceUrl = supabase.storage.from("character-voices").getPublicUrl(path).data.publicUrl
      }

      const res = await authFetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          imageUrl: imageUrls[0] ?? null,
          imageUrls,
          voiceUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan karakter.")
      resetForm()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await authFetch(`/api/characters/${id}`, { method: "DELETE" })
      if (res.ok) onChanged()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Karakter</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Buat karakter dengan foto &amp; suara agar tampil konsisten di setiap video. Sebut mereka di prompt pakai <b className="text-neutral-300">@nama</b>. Karakter bisa dipakai di semua proyek.
        </p>
      </div>

      <form onSubmit={handleAdd} className="space-y-4 bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
        <h3 className="text-sm font-semibold">Tambah Karakter</h3>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Nama karakter</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Dinda (pakai nama singkat agar mudah di-@)"
            className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Deskripsi (opsional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Ciri khas: wanita muda, rambut hitam sebahu, jaket denim, ramah dan ekspresif..."
            className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Foto referensi (bisa beberapa, maks {MAX_CHAR_PHOTOS})</label>
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={p.url} className="relative h-20 w-20">
                <img src={p.url} alt={`Foto ${i + 1}`} className="h-20 w-20 rounded-lg object-cover border border-neutral-700" />
                <button
                  type="button"
                  onClick={() => removeFileAt(i)}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500"
                  aria-label="Hapus foto"
                >
                  <IconClose className="h-3 w-3" />
                </button>
              </div>
            ))}
            {photos.length < MAX_CHAR_PHOTOS && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-700 bg-neutral-950 text-neutral-400 hover:border-indigo-500 hover:text-indigo-400 transition">
                <IconPlus className="h-5 w-5" />
                <span className="text-[10px]">Tambah</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = ""
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {photos.length > 0 && (
            <button type="button" onClick={clearFiles} className="mt-2 flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300">
              <IconTrash className="h-4 w-4" /> Hapus semua foto
            </button>
          )}
          <p className="text-[11px] text-neutral-500 mt-1.5">Klik <b className="text-neutral-300">+ Tambah</b> untuk menambah foto satu per satu. Beberapa foto dari sudut berbeda (depan, samping) membuat karakter lebih mudah dikunci nanti.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Sampel suara (opsional)</label>
          {voicePreview ? (
            <div className="space-y-2">
              <audio src={voicePreview} controls className="w-full h-10" />
              <button type="button" onClick={() => handleVoice(null)} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300">
                <IconTrash className="h-4 w-4" /> Hapus suara
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-400 hover:border-neutral-600">
              <IconMic className="h-5 w-5" />
              <span>Pilih file suara (mp3/wav)</span>
              <input type="file" accept="audio/*" onChange={(e) => handleVoice(e.target.files?.[0] ?? null)} className="hidden" />
            </label>
          )}
          <p className="text-[11px] text-neutral-500 mt-1.5">Rekaman suara jelas ~5–15 detik akan dipakai untuk menyamakan suara karakter saat API asli tersambung.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-300">{error}</div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50 transition"
        >
          {saving && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
          {saving ? "Menyimpan..." : "Simpan Karakter"}
        </button>
      </form>

      <div>
        <h3 className="text-sm font-semibold mb-3">Karakter Kamu {characters.length > 0 && `(${characters.length})`}</h3>
        {characters.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 py-10 text-center">
            <IconUsers className="h-8 w-8 text-neutral-600" />
            <p className="text-sm text-neutral-500 mt-3">Belum ada karakter. Tambahkan karakter pertamamu di atas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {characters.map((c) => {
              const photoCount = c.imageUrls && c.imageUrls.length > 0 ? c.imageUrls.length : c.imageUrl ? 1 : 0
              return (
                <div key={c.id} className="flex gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.name} className="h-16 w-16 rounded-lg object-cover border border-neutral-700 shrink-0" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neutral-800 text-neutral-500 shrink-0"><IconUsers className="h-6 w-6" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">@{c.name}</p>
                    {c.description && <p className="text-xs text-neutral-400 line-clamp-2 mt-0.5">{c.description}</p>}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {photoCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-neutral-800 rounded px-1.5 py-0.5 text-neutral-300">
                          <IconImage className="h-3 w-3" /> {photoCount} foto
                        </span>
                      )}
                      {c.voiceUrl && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 rounded px-1.5 py-0.5">
                          <IconMic className="h-3 w-3" /> Suara
                        </span>
                      )}
                    </div>
                    {c.voiceUrl && <audio src={c.voiceUrl} controls className="w-full h-8 mt-2" />}
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      <IconTrash className="h-3.5 w-3.5" /> {deletingId === c.id ? "Menghapus..." : "Hapus"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
