"use client"

import { useEffect, useState, type FormEvent } from "react"
import { ASPECT_RATIOS, IMAGE_STYLES, MAX_PROMPT, type GeneratedImage } from "@/lib/app"
import { IconAlert, IconDownload, IconImage, IconSparkles, IconStar, IconTrash } from "./icons"

export default function GenerateImageView({
  projectId,
  authFetch,
  isOutOfCredits,
  onCreditsChanged,
}: {
  projectId: string
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
  isOutOfCredits: boolean
  onCreditsChanged: (credits: number) => void
}) {
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [style, setStyle] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [isLoadingImages, setIsLoadingImages] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoadingImages(true)
    authFetch(`/api/images?projectId=${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        if (active && Array.isArray(d.images)) setImages(d.images)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoadingImages(false)
      })
    return () => {
      active = false
    }
  }, [authFetch, projectId])

  function toggleStyle(id: string) {
    setStyle((prev) => (prev === id ? "" : id))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!prompt.trim()) {
      setError("Prompt wajib diisi.")
      return
    }
    const styleObj = IMAGE_STYLES.find((s) => s.id === style)
    const finalPrompt = styleObj ? `${prompt.trim()}, ${styleObj.suffix}` : prompt.trim()
    setIsGenerating(true)
    try {
      const res = await authFetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt, aspectRatio, style, projectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal membuat gambar.")
      const img: GeneratedImage = {
        id: data.id,
        prompt: data.prompt,
        imageUrl: data.imageUrl,
        aspectRatio: data.aspectRatio,
        style: data.style,
        createdAt: data.createdAt,
        favorite: data.favorite ?? false,
      }
      setImages((prev) => [img, ...prev])
      if (typeof data.remainingCredits === "number") onCreditsChanged(data.remainingCredits)
      setPrompt("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await authFetch(`/api/images/${id}`, { method: "DELETE" })
      if (res.ok) setImages((prev) => prev.filter((i) => i.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  async function toggleFavorite(id: string, favorite: boolean) {
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, favorite } : i)))
    try {
      await authFetch(`/api/images/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite }),
      })
    } catch {
      setImages((prev) => prev.map((i) => (i.id === id ? { ...i, favorite: !favorite } : i)))
    }
  }

  const shown = showFavoritesOnly ? images.filter((i) => i.favorite) : images

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Gambar</h1>
        <p className="text-sm text-neutral-400 mt-1">Ubah teks jadi gambar dengan AI.</p>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-xs text-amber-200">
        <IconAlert className="h-4 w-4 shrink-0 mt-0.5" />
        <span><b>Mode demo</b> — gambar yang muncul masih contoh (dummy) untuk menguji tampilan &amp; fitur. API gambar asli bisa disambungkan nanti.</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-neutral-300">Prompt</label>
            <span className="text-xs text-neutral-500">{prompt.length}/{MAX_PROMPT}</span>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT))}
            placeholder="Contoh: seorang wanita muda memegang kopi di kafe pagi hari, cahaya lembut..."
            rows={4}
            className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Gaya (opsional)</label>
          <div className="flex flex-wrap gap-2">
            {IMAGE_STYLES.map((s) => {
              const active = style === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleStyle(s.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    active ? "border-indigo-500 bg-indigo-500/15 text-white" : "border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-neutral-600"
                  }`}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Rasio</label>
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.map((r) => {
              const active = aspectRatio === r
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setAspectRatio(r)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    active ? "border-indigo-500 bg-indigo-500/15 text-white" : "border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-neutral-600"
                  }`}
                >
                  {r}
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-300">{error}</div>
        )}
        {isOutOfCredits && !error && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-sm text-amber-300">
            Kredit kamu sudah habis. Buka menu Beli Kredit untuk menambah.
          </div>
        )}

        <button
          type="submit"
          disabled={isGenerating || isOutOfCredits}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition"
        >
          {isGenerating ? (
            <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          ) : (
            <IconSparkles className="h-4 w-4" />
          )}
          {isGenerating ? "Membuat..." : "Generate Gambar"}
        </button>
      </form>

      <section className="mt-12">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">Galeri Gambar</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFavoritesOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                showFavoritesOnly ? "border-amber-500 bg-amber-500/15 text-amber-300" : "border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-neutral-600"
              }`}
            >
              <IconStar className="h-3.5 w-3.5" filled={showFavoritesOnly} /> Favorit
            </button>
            {shown.length > 0 && <span className="text-xs text-neutral-500">{shown.length} gambar</span>}
          </div>
        </div>

        {isLoadingImages ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-neutral-800 bg-neutral-900">
                <div className="aspect-square bg-neutral-800 rounded-t-xl" />
                <div className="p-3"><div className="h-3 bg-neutral-800 rounded w-3/4" /></div>
              </div>
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 py-12 text-center">
            <IconImage className="h-8 w-8 text-neutral-600" />
            <p className="text-sm text-neutral-500 mt-3">Belum ada gambar. Yuk buat gambar pertamamu.</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 py-12 text-center">
            <IconStar className="h-8 w-8 text-neutral-600" />
            <p className="text-sm text-neutral-500 mt-3">Belum ada gambar favorit.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {shown.map((img) => (
              <div key={img.id} className="group rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 hover:border-neutral-700 transition">
                {img.imageUrl ? (
                  <img src={img.imageUrl} alt={img.prompt} className="w-full aspect-square object-cover bg-black" />
                ) : (
                  <div className="w-full aspect-square bg-black" />
                )}
                <div className="p-3 space-y-2">
                  <p className="text-xs text-neutral-300 line-clamp-2">{img.prompt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500">{img.aspectRatio}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleFavorite(img.id, !img.favorite)}
                        className={`inline-flex items-center text-xs ${img.favorite ? "text-amber-400" : "text-neutral-500 hover:text-amber-400"}`}
                        aria-label={img.favorite ? "Hapus dari favorit" : "Tandai favorit"}
                      >
                        <IconStar className="h-3.5 w-3.5" filled={!!img.favorite} />
                      </button>
                      {img.imageUrl && (
                        <a href={img.imageUrl} target="_blank" rel="noopener noreferrer" download className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300">
                          <IconDownload className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(img.id)}
                        disabled={deletingId === img.id}
                        className="inline-flex items-center text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
                        aria-label="Hapus gambar"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
