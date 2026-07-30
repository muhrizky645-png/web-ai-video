"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import type { Session } from "@supabase/supabase-js"
import { getSupabaseBrowser } from "@/lib/supabaseClient"

type GeneratedVideo = {
  id: string
  prompt: string
  videoUrl: string
  resolution?: string
  aspectRatio?: string
  duration?: number
  createdAt: string
}

const RESOLUTIONS = ["480p", "720p", "1080p"]
const ASPECT_RATIOS = ["16:9", "9:16", "1:1"]
const DURATIONS = [4, 5, 8, 10]
const MAX_PROMPT = 500

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthChecked(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-gray-400">
        <span className="h-6 w-6 rounded-full border-2 border-gray-600 border-t-white animate-spin" />
      </div>
    )
  }

  if (!session) return <AuthScreen />
  return <AppScreen session={session} />
}

function AuthScreen() {
  const supabase = getSupabaseBrowser()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!data.session) {
          setInfo("Akun berhasil dibuat! Cek email kamu untuk konfirmasi, lalu masuk.")
          setMode("login")
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            AI Video Generator
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            {mode === "login" ? "Masuk untuk mulai membuat video." : "Buat akun baru untuk mulai."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-gray-900/60 backdrop-blur rounded-2xl p-6 border border-gray-800 shadow-xl"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kamu@email.com"
              className="w-full rounded-xl bg-black/60 border border-gray-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full rounded-xl bg-black/60 border border-gray-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-300">{error}</div>
          )}
          {info && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-sm text-emerald-300">{info}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-3 text-sm font-semibold hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 transition"
          >
            {loading && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
            {mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-5">
          {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login")
              setError(null)
              setInfo(null)
            }}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </p>
      </div>
    </div>
  )
}

function AppScreen({ session }: { session: Session }) {
  const supabase = getSupabaseBrowser()
  const email = session.user.email ?? "Akun"

  const [prompt, setPrompt] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [resolution, setResolution] = useState("720p")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [duration, setDuration] = useState(5)

  const [isGenerating, setIsGenerating] = useState(false)
  const [videos, setVideos] = useState<GeneratedVideo[]>([])
  const [isLoadingVideos, setIsLoadingVideos] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [isToppingUp, setIsToppingUp] = useState(false)

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const headers = new Headers(options.headers)
      if (token) headers.set("Authorization", `Bearer ${token}`)
      return fetch(url, { ...options, headers })
    },
    [supabase]
  )

  const fetchCredits = useCallback(async () => {
    try {
      const res = await authFetch("/api/credits")
      if (!res.ok) return
      const data = await res.json()
      setCredits(data.balance)
    } catch {
      // abaikan
    }
  }, [authFetch])

  const fetchVideos = useCallback(async () => {
    setIsLoadingVideos(true)
    try {
      const res = await authFetch("/api/videos")
      if (res.ok) {
        const data = await res.json()
        setVideos(data.videos ?? [])
      }
    } catch {
      // abaikan
    } finally {
      setIsLoadingVideos(false)
    }
  }, [authFetch])

  useEffect(() => {
    fetchCredits()
    fetchVideos()
  }, [fetchCredits, fetchVideos])

  function handleImageChange(file: File | null) {
    setImage(file)
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : null
    })
  }

  async function handleTopUp() {
    setIsToppingUp(true)
    try {
      const res = await authFetch("/api/credits/topup", { method: "POST" })
      const data = await res.json()
      if (res.ok) setCredits(data.balance)
    } catch {
      // abaikan
    } finally {
      setIsToppingUp(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) {
      setError("Prompt tidak boleh kosong.")
      return
    }
    if (credits !== null && credits <= 0) {
      setError("Kredit kamu sudah habis. Tambah kredit dulu.")
      return
    }
    setError(null)
    setIsGenerating(true)
    try {
      const formData = new FormData()
      formData.append("prompt", prompt)
      formData.append("resolution", resolution)
      formData.append("aspectRatio", aspectRatio)
      formData.append("duration", String(duration))
      if (image) formData.append("image", image)
      const res = await authFetch("/api/generate", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal generate video")
      setVideos((prev) => [
        {
          id: data.id,
          prompt: data.prompt,
          videoUrl: data.videoUrl,
          resolution: data.resolution,
          aspectRatio: data.aspectRatio,
          duration: data.duration,
          createdAt: data.createdAt,
        },
        ...prev,
      ])
      setCredits(data.remainingCredits)
      setPrompt("")
      handleImageChange(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat generate video.")
    } finally {
      setIsGenerating(false)
    }
  }

  const isOutOfCredits = credits !== null && credits <= 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              AI Video Generator
            </h1>
            <p className="text-sm text-gray-400 mt-1">Masuk sebagai {email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold bg-gray-800/80 border border-gray-700 rounded-full px-4 py-2">
              ⚡ {credits === null ? "..." : credits} kredit
            </span>
            <button
              onClick={handleTopUp}
              disabled={isToppingUp}
              className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 rounded-full px-4 py-2 disabled:opacity-50 transition"
            >
              {isToppingUp ? "..." : "+ Kredit"}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-full px-4 py-2 transition"
            >
              Keluar
            </button>
          </div>
        </header>

        <div className="mb-6 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-4 py-3 text-xs text-yellow-300">
          Mode uji coba &mdash; video yang dihasilkan masih dummy (belum terhubung ke Seedance API asli).
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 bg-gray-900/60 backdrop-blur rounded-2xl p-6 border border-gray-800 shadow-xl"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Prompt</label>
              <span className="text-xs text-gray-500">
                {prompt.length}/{MAX_PROMPT}
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT))}
              placeholder="Contoh: Seekor kucing oranye berlari di padang bunga saat matahari terbenam, sinematik, slow motion..."
              rows={4}
              className="w-full rounded-xl bg-black/60 border border-gray-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Gambar referensi (opsional)</label>
            {imagePreview ? (
              <div className="flex items-center gap-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 w-20 rounded-lg object-cover border border-gray-700"
                />
                <button
                  type="button"
                  onClick={() => handleImageChange(null)}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Hapus gambar
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Resolusi</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full rounded-lg bg-black/60 border border-gray-700 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {RESOLUTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Rasio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full rounded-lg bg-black/60 border border-gray-700 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ASPECT_RATIOS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Durasi</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-lg bg-black/60 border border-gray-700 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d} detik</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-300">
              {error}
            </div>
          )}
          {isOutOfCredits && !error && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 text-sm text-yellow-300">
              Kredit kamu sudah habis. Klik “+ Kredit” untuk menambah.
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating || isOutOfCredits}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-3 text-sm font-semibold hover:from-blue-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-50 transition"
          >
            {isGenerating && (
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            )}
            {isGenerating ? "Sedang generate..." : "Generate Video"}
          </button>
        </form>

        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Galeri Hasil</h2>
            {videos.length > 0 && (
              <span className="text-xs text-gray-500">{videos.length} video</span>
            )}
          </div>

          {isLoadingVideos ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-800 bg-gray-900/60">
                  <div className="aspect-video bg-gray-800 rounded-t-xl" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/40 py-12 text-center">
              <p className="text-sm text-gray-500">Belum ada video. Yuk buat video pertamamu! 🎬</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="rounded-xl overflow-hidden border border-gray-800 bg-gray-900/60 hover:border-gray-700 transition"
                >
                  <video src={video.videoUrl} controls className="w-full aspect-video bg-black" />
                  <div className="p-3 space-y-2">
                    <p className="text-sm text-gray-200 line-clamp-2">{video.prompt}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {video.resolution && (
                        <span className="text-[10px] font-medium bg-gray-800 rounded px-1.5 py-0.5 text-gray-300">{video.resolution}</span>
                      )}
                      {video.aspectRatio && (
                        <span className="text-[10px] font-medium bg-gray-800 rounded px-1.5 py-0.5 text-gray-300">{video.aspectRatio}</span>
                      )}
                      {video.duration && (
                        <span className="text-[10px] font-medium bg-gray-800 rounded px-1.5 py-0.5 text-gray-300">{video.duration}s</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-gray-500">
                        {new Date(video.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="text-xs font-medium text-blue-400 hover:text-blue-300"
                      >
                        Unduh
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
