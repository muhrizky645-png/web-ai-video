"use client"

import { useRef, useState, type FormEvent } from "react"
import {
  ASPECT_RATIOS, DURATIONS, MAX_PROMPT, PLATFORM_PRESETS, RESOLUTIONS, STYLE_PRESETS,
  findMentioned, type CharacterItem, type GeneratedVideo,
} from "@/lib/app"
import {
  IconAlert, IconAt, IconDownload, IconFilm, IconImage, IconMic, IconSparkles, IconStar, IconTrash, IconUsers,
} from "./icons"

export default function GenerateVideoView(props: {
  prompt: string
  setPrompt: (v: string) => void
  resolution: string
  setResolution: (v: string) => void
  aspectRatio: string
  setAspectRatio: (v: string) => void
  duration: number
  setDuration: (v: number) => void
  characters: CharacterItem[]
  imagePreview: string | null
  handleImageChange: (f: File | null) => void
  isGenerating: boolean
  isOutOfCredits: boolean
  error: string | null
  onSubmit: (e: FormEvent) => void
  onGoCharacters: () => void
  videos: GeneratedVideo[]
  isLoadingVideos: boolean
  onDeleteVideo: (id: string) => Promise<void>
  onToggleFavorite: (id: string, favorite: boolean) => void
}) {
  const {
    prompt, setPrompt, resolution, setResolution, aspectRatio, setAspectRatio,
    duration, setDuration, characters, imagePreview, handleImageChange,
    isGenerating, isOutOfCredits, error, onSubmit, onGoCharacters, videos,
    isLoadingVideos, onDeleteVideo, onToggleFavorite,
  } = props

  const [galleryFilter, setGalleryFilter] = useState("")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const mentioned = findMentioned(prompt, characters)

  function addStyle(suffix: string) {
    const base = prompt.trim().replace(/[,\s]+$/, "")
    const next = base ? `${base}, ${suffix}` : suffix
    setPrompt(next.slice(0, MAX_PROMPT))
  }

  function detectMention(value: string, caret: number) {
    const upto = value.slice(0, caret)
    const at = upto.lastIndexOf("@")
    if (at === -1) {
      setMentionQuery(null)
      return
    }
    const before = at === 0 ? " " : upto[at - 1]
    const query = upto.slice(at + 1)
    if ((before === " " || before === "\n") && !query.includes("\n")) {
      setMentionQuery(query)
      setMentionStart(at)
    } else {
      setMentionQuery(null)
    }
  }

  function handlePromptChange(value: string, caret: number) {
    const v = value.slice(0, MAX_PROMPT)
    setPrompt(v)
    detectMention(v, Math.min(caret, v.length))
  }

  function insertMention(c: CharacterItem) {
    const before = prompt.slice(0, mentionStart)
    const after = prompt.slice(mentionStart + 1 + (mentionQuery?.length ?? 0))
    const insert = `@${c.name} `
    const next = (before + insert + after).slice(0, MAX_PROMPT)
    setPrompt(next)
    setMentionQuery(null)
    const pos = Math.min((before + insert).length, next.length)
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (el) {
        el.focus()
        el.setSelectionRange(pos, pos)
      }
    })
  }

  function appendMention(c: CharacterItem) {
    const base = prompt.replace(/\s+$/, "")
    const next = ((base ? base + " " : "") + `@${c.name} `).slice(0, MAX_PROMPT)
    setPrompt(next)
    setMentionQuery(null)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await onDeleteVideo(id)
    } finally {
      setDeletingId(null)
    }
  }

  const mentionMatches =
    mentionQuery === null
      ? []
      : characters.filter((c) => c.name.toLowerCase().includes(mentionQuery.toLowerCase()))

  const filterChar = characters.find((c) => c.id === galleryFilter) || null
  let shown = filterChar
    ? videos.filter((v) => (v.prompt || "").includes(`@${filterChar.name}`) || v.characterId === filterChar.id)
    : videos
  if (showFavoritesOnly) shown = shown.filter((v) => v.favorite)

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Video</h1>
        <p className="text-sm text-neutral-400 mt-1">Ubah ide jadi video dengan AI.</p>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-xs text-amber-200">
        <IconAlert className="h-4 w-4 shrink-0 mt-0.5" />
        <span><b>Mode demo</b> — video yang muncul masih contoh (dummy) untuk menguji tampilan &amp; fitur. API video asli bisa disambungkan kapan saja nanti.</span>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-neutral-300">Prompt</label>
            <span className="text-xs text-neutral-500">{prompt.length}/{MAX_PROMPT}</span>
          </div>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => handlePromptChange(e.target.value, e.target.selectionStart ?? e.target.value.length)}
              onKeyUp={(e) => detectMention(e.currentTarget.value, e.currentTarget.selectionStart ?? e.currentTarget.value.length)}
              onClick={(e) => detectMention(e.currentTarget.value, e.currentTarget.selectionStart ?? e.currentTarget.value.length)}
              onBlur={() => setTimeout(() => setMentionQuery(null), 150)}
              placeholder="Contoh: @Dinda sedang memarahi anaknya @Ucil di ruang tamu, sinematik..."
              rows={4}
              className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
            {mentionQuery !== null && mentionMatches.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 max-h-52 overflow-auto rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl">
                {mentionMatches.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      insertMention(c)
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/5"
                  >
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="h-8 w-8 rounded-md object-cover border border-neutral-700" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-800 text-neutral-500"><IconUsers className="h-4 w-4" /></span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate">@{c.name}</span>
                      {c.description && <span className="block text-[11px] text-neutral-500 truncate">{c.description}</span>}
                    </span>
                    {c.voiceUrl && <IconMic className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Karakter (opsional)</label>
          {characters.length === 0 ? (
            <button
              type="button"
              onClick={onGoCharacters}
              className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300"
            >
              <IconUsers className="h-4 w-4" /> Belum ada karakter — buat karakter konsisten dulu
            </button>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {characters.map((c) => {
                  const active = mentioned.some((m) => m.id === c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => appendMention(c)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                        active ? "border-indigo-500 bg-indigo-500/15 text-white" : "border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-neutral-600"
                      }`}
                    >
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt={c.name} className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <IconUsers className="h-3.5 w-3.5" />
                      )}
                      @{c.name}
                      {c.voiceUrl && <IconMic className="h-3 w-3 text-indigo-400" />}
                    </button>
                  )
                })}
              </div>
              <p className="flex items-center gap-1 text-[11px] text-neutral-500 mt-1.5">
                <IconAt className="h-3.5 w-3.5" /> Ketik <b className="text-neutral-300">@</b> di prompt atau klik nama untuk menyebut karakter. Bisa lebih dari satu, mis. “@Dinda memarahi @Ucil”.
              </p>
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Gaya (opsional)</label>
          <div className="flex flex-wrap gap-2">
            {STYLE_PRESETS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => addStyle(s.suffix)}
                className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-300 hover:border-indigo-500 hover:text-white transition"
              >
                + {s.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1.5">Klik untuk menambahkan kata kunci gaya ke prompt.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Gambar referensi (opsional)</label>
          {imagePreview ? (
            <div className="flex items-center gap-3">
              <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover border border-neutral-700" />
              <button type="button" onClick={() => handleImageChange(null)} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300">
                <IconTrash className="h-4 w-4" /> Hapus gambar
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-400 hover:border-neutral-600">
              <IconImage className="h-5 w-5" />
              <span>Pilih gambar untuk image-to-video</span>
              <input type="file" accept="image/*" onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)} className="hidden" />
            </label>
          )}
          <p className="text-[11px] text-neutral-500 mt-1.5">Kalau kamu unggah gambar, video dibuat dari gambar itu (image-to-video).</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Platform (atur rasio otomatis)</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_PRESETS.map((pf) => {
              const active = aspectRatio === pf.ratio
              return (
                <button
                  key={pf.id}
                  type="button"
                  onClick={() => setAspectRatio(pf.ratio)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    active ? "border-indigo-500 bg-indigo-500/15 text-white" : "border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-neutral-600"
                  }`}
                >
                  {pf.label} · {pf.ratio}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Resolusi</label>
            <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {RESOLUTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Rasio</label>
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {ASPECT_RATIOS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Durasi</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {DURATIONS.map((d) => <option key={d} value={d}>{d} detik</option>)}
            </select>
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
          {isGenerating ? "Membuat..." : "Generate Video"}
        </button>
      </form>

      <section className="mt-12">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">Galeri Video</h2>
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
            {characters.length > 0 && (
              <select
                value={galleryFilter}
                onChange={(e) => setGalleryFilter(e.target.value)}
                className="rounded-lg bg-neutral-950 border border-neutral-700 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Semua karakter</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            {shown.length > 0 && <span className="text-xs text-neutral-500">{shown.length} video</span>}
          </div>
        </div>

        {isLoadingVideos ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-neutral-800 bg-neutral-900">
                <div className="aspect-video bg-neutral-800 rounded-t-xl" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-neutral-800 rounded w-3/4" />
                  <div className="h-3 bg-neutral-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 py-12 text-center">
            <IconFilm className="h-8 w-8 text-neutral-600" />
            <p className="text-sm text-neutral-500 mt-3">Belum ada video. Yuk buat video pertamamu.</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/40 py-12 text-center">
            <IconStar className="h-8 w-8 text-neutral-600" />
            <p className="text-sm text-neutral-500 mt-3">{showFavoritesOnly ? "Belum ada video favorit." : "Tidak ada video untuk karakter ini."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shown.map((video) => {
              const promptChars = findMentioned(video.prompt || "", characters)
              const badgeChars = promptChars.length > 0
                ? promptChars
                : video.characterId
                ? characters.filter((c) => c.id === video.characterId)
                : []
              return (
                <div key={video.id} className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 hover:border-neutral-700 transition">
                  {video.status === "processing" ? (
                    <div className="w-full aspect-video bg-black flex flex-col items-center justify-center gap-2">
                      <span className="h-6 w-6 rounded-full border-2 border-neutral-600 border-t-white animate-spin" />
                      <span className="text-xs text-neutral-400">Sedang membuat video...</span>
                    </div>
                  ) : video.status === "failed" ? (
                    <div className="w-full aspect-video bg-black flex flex-col items-center justify-center gap-1 px-3 text-center">
                      <IconAlert className="h-6 w-6 text-red-400" />
                      <span className="text-sm text-red-400">Gagal membuat video</span>
                      <span className="text-[11px] text-neutral-500">Kredit sudah dikembalikan. Coba lagi ya.</span>
                    </div>
                  ) : video.videoUrl ? (
                    <video src={video.videoUrl} controls className="w-full aspect-video bg-black" />
                  ) : (
                    <div className="w-full aspect-video bg-black" />
                  )}
                  <div className="p-3 space-y-2">
                    <p className="text-sm text-neutral-200 line-clamp-2">{video.prompt}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {badgeChars.map((c) => (
                        <span key={c.id} className="inline-flex items-center gap-1 text-[10px] font-medium bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 rounded px-1.5 py-0.5">
                          <IconUsers className="h-3 w-3" /> {c.name}
                        </span>
                      ))}
                      {video.resolution && <span className="text-[10px] font-medium bg-neutral-800 rounded px-1.5 py-0.5 text-neutral-300">{video.resolution}</span>}
                      {video.aspectRatio && <span className="text-[10px] font-medium bg-neutral-800 rounded px-1.5 py-0.5 text-neutral-300">{video.aspectRatio}</span>}
                      {video.duration && <span className="text-[10px] font-medium bg-neutral-800 rounded px-1.5 py-0.5 text-neutral-300">{video.duration}s</span>}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-neutral-500">
                        {new Date(video.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onToggleFavorite(video.id, !video.favorite)}
                          className={`inline-flex items-center gap-1 text-xs font-medium ${
                            video.favorite ? "text-amber-400" : "text-neutral-500 hover:text-amber-400"
                          }`}
                          aria-label={video.favorite ? "Hapus dari favorit" : "Tandai favorit"}
                        >
                          <IconStar className="h-3.5 w-3.5" filled={!!video.favorite} />
                        </button>
                        {video.videoUrl && video.status !== "processing" && video.status !== "failed" && (
                          <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" download className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300">
                            <IconDownload className="h-3.5 w-3.5" /> Unduh
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(video.id)}
                          disabled={deletingId === video.id}
                          className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-red-400 disabled:opacity-50"
                        >
                          <IconTrash className="h-3.5 w-3.5" /> {deletingId === video.id ? "..." : "Hapus"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
