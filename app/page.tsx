"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"
import { getSupabaseBrowser } from "@/lib/supabaseClient"

type GeneratedVideo = {
  id: string
  prompt: string
  videoUrl: string | null
  resolution?: string
  aspectRatio?: string
  duration?: number
  createdAt: string
  status?: string
  characterId?: string | null
}

type CharacterItem = {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  createdAt: string
}

type Tab = "generate" | "characters" | "buy" | "profile"

const RESOLUTIONS = ["480p", "720p", "1080p"]
const ASPECT_RATIOS = ["16:9", "9:16", "1:1"]
const DURATIONS = [4, 5, 8, 10]
const MAX_PROMPT = 500

const STYLE_PRESETS = [
  { id: "cinematic", label: "Sinematik", suffix: "gaya sinematik, pencahayaan dramatis, depth of field" },
  { id: "realistic", label: "Realistis", suffix: "realistis, detail tinggi, fotorealistik, 4k" },
  { id: "anime", label: "Anime", suffix: "gaya anime, warna cerah, ilustrasi" },
  { id: "3d", label: "3D / Pixar", suffix: "animasi 3D, gaya render Pixar" },
  { id: "product", label: "Iklan Produk", suffix: "video iklan produk, studio lighting, bersih, komersial" },
  { id: "vintage", label: "Vintage", suffix: "gaya retro vintage, grain film, warna hangat" },
]

const PLATFORM_PRESETS = [
  { id: "tiktok", label: "TikTok / Reels", ratio: "9:16" },
  { id: "youtube", label: "YouTube", ratio: "16:9" },
  { id: "square", label: "Post (1:1)", ratio: "1:1" },
]

const CREDIT_PACKAGES = [
  { id: "small", credits: 10, price: "Rp 15.000", label: "Hemat", highlight: false },
  { id: "medium", credits: 50, price: "Rp 65.000", label: "Populer", highlight: true },
  { id: "large", credits: 100, price: "Rp 120.000", label: "Terbaik", highlight: false },
]

/* ---------------- Icons (SVG, no emojis) ---------------- */
function Svg({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}
type IconProps = { className?: string }
const IconFilm = (p: IconProps) => (
  <Svg {...p}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18" /><path d="M3 7.5h4" /><path d="M3 12h18" /><path d="M3 16.5h4" /><path d="M17 3v18" /><path d="M17 7.5h4" /><path d="M17 16.5h4" /></Svg>
)
const IconSparkles = (p: IconProps) => (
  <Svg {...p}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /></Svg>
)
const IconUsers = (p: IconProps) => (
  <Svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Svg>
)
const IconCard = (p: IconProps) => (
  <Svg {...p}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></Svg>
)
const IconUser = (p: IconProps) => (
  <Svg {...p}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Svg>
)
const IconZap = (p: IconProps) => (
  <Svg {...p}><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></Svg>
)
const IconLogout = (p: IconProps) => (
  <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></Svg>
)
const IconDownload = (p: IconProps) => (
  <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></Svg>
)
const IconTrash = (p: IconProps) => (
  <Svg {...p}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Svg>
)
const IconMenu = (p: IconProps) => (
  <Svg {...p}><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="18" y2="18" /></Svg>
)
const IconClose = (p: IconProps) => (
  <Svg {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Svg>
)
const IconImage = (p: IconProps) => (
  <Svg {...p}><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></Svg>
)
const IconAlert = (p: IconProps) => (
  <Svg {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></Svg>
)
const IconCheck = (p: IconProps) => (
  <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>
)

const NAV: { id: Tab; label: string; icon: (p: IconProps) => ReactNode }[] = [
  { id: "generate", label: "Buat Video", icon: IconSparkles },
  { id: "characters", label: "Karakter", icon: IconUsers },
  { id: "buy", label: "Beli Kredit", icon: IconCard },
  { id: "profile", label: "Profil", icon: IconUser },
]

/* ---------------- Auth gate ---------------- */
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-400">
        <span className="h-6 w-6 rounded-full border-2 border-neutral-700 border-t-white animate-spin" />
      </div>
    )
  }

  if (!session) return <AuthScreen />
  return <AppScreen session={session} />
}

/* ---------------- Auth screen ---------------- */
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
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white px-5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 mb-4">
            <IconFilm className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Video Generator</h1>
          <p className="text-sm text-neutral-400 mt-2">
            {mode === "login" ? "Masuk untuk mulai membuat video." : "Buat akun baru untuk mulai."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-neutral-900 rounded-2xl p-6 border border-neutral-800 shadow-xl"
        >
          <div>
            <label className="block text-sm font-medium mb-1.5 text-neutral-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kamu@email.com"
              className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-neutral-300">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50 transition"
          >
            {loading && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
            {mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-400 mt-5">
          {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login")
              setError(null)
              setInfo(null)
            }}
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </p>
      </div>
    </div>
  )
}

/* ---------------- App shell (sidebar layout) ---------------- */
function AppScreen({ session }: { session: Session }) {
  const supabase = getSupabaseBrowser()
  const email = session.user.email ?? "Akun"

  const [tab, setTab] = useState<Tab>("generate")
  const [mobileNav, setMobileNav] = useState(false)

  const [prompt, setPrompt] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [resolution, setResolution] = useState("720p")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [duration, setDuration] = useState(5)
  const [selectedCharacterId, setSelectedCharacterId] = useState("")

  const [isGenerating, setIsGenerating] = useState(false)
  const [videos, setVideos] = useState<GeneratedVideo[]>([])
  const [characters, setCharacters] = useState<CharacterItem[]>([])
  const [isLoadingVideos, setIsLoadingVideos] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState<number | null>(null)

  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [buyMessage, setBuyMessage] = useState<string | null>(null)

  const pollingRef = useRef<Set<string>>(new Set())

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

  const fetchCharacters = useCallback(async () => {
    try {
      const res = await authFetch("/api/characters")
      if (res.ok) {
        const data = await res.json()
        setCharacters(data.characters ?? [])
      }
    } catch {
      // abaikan
    }
  }, [authFetch])

  const pollStatus = useCallback(
    (id: string) => {
      if (pollingRef.current.has(id)) return
      pollingRef.current.add(id)
      let tries = 0
      const tick = async () => {
        tries++
        try {
          const res = await authFetch(`/api/videos/status?id=${id}`)
          if (res.ok) {
            const data = await res.json()
            setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)))
            if (data.status === "done" || data.status === "failed") {
              pollingRef.current.delete(id)
              if (data.status === "failed") fetchCredits()
              return
            }
          }
        } catch {
          // abaikan, coba lagi
        }
        if (tries >= 60) {
          pollingRef.current.delete(id)
          return
        }
        setTimeout(tick, 3000)
      }
      setTimeout(tick, 3000)
    },
    [authFetch, fetchCredits]
  )

  useEffect(() => {
    fetchCredits()
    fetchVideos()
    fetchCharacters()
  }, [fetchCredits, fetchVideos, fetchCharacters])

  useEffect(() => {
    videos.forEach((v) => {
      if (v.status === "processing") pollStatus(v.id)
    })
  }, [videos, pollStatus])

  function handleImageChange(file: File | null) {
    setImage(file)
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : null
    })
  }

  async function handleDeleteVideo(id: string) {
    const res = await authFetch(`/api/videos/${id}`, { method: "DELETE" })
    if (res.ok) setVideos((prev) => prev.filter((v) => v.id !== id))
  }

  async function handleBuy(packageId: string) {
    setBuyingId(packageId)
    setBuyMessage(null)
    try {
      const res = await authFetch("/api/credits/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      })
      const data = await res.json()
      if (res.ok) {
        setCredits(data.balance)
        setBuyMessage(`Berhasil menambah ${data.added} kredit! Saldo kamu sekarang ${data.balance}.`)
      } else {
        setBuyMessage(data.error || "Gagal menambah kredit.")
      }
    } catch {
      setBuyMessage("Terjadi kesalahan.")
    } finally {
      setBuyingId(null)
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
      if (selectedCharacterId) formData.append("characterId", selectedCharacterId)
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
          status: data.status ?? "done",
          characterId: data.characterId ?? null,
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
  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId) || null

  function goTab(t: Tab) {
    setTab(t)
    setMobileNav(false)
  }

  const navList = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = tab === item.id
        const ItemIcon = item.icon
        return (
          <button
            key={item.id}
            onClick={() => goTab(item.id)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <ItemIcon className={`h-5 w-5 ${active ? "text-indigo-400" : ""}`} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )

  const brand = (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
        <IconFilm className="h-5 w-5 text-white" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold">AI Video</p>
        <p className="text-[11px] text-neutral-500">Generator</p>
      </div>
    </div>
  )

  const creditPill = (
    <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
      <IconZap className="h-4 w-4 text-amber-400" />
      <span className="text-sm font-semibold">{credits === null ? "..." : credits}</span>
      <span className="text-xs text-neutral-500">kredit</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 border-r border-neutral-800 bg-neutral-900/40 backdrop-blur px-4 py-5">
        <div className="px-1">{brand}</div>
        <div className="mt-6 flex-1">{navList}</div>
        <div className="space-y-3">
          {creditPill}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
            <p className="text-xs text-neutral-500">Masuk sebagai</p>
            <p className="text-xs font-medium truncate">{email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:text-white hover:bg-white/5 transition"
          >
            <IconLogout className="h-4 w-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/90 backdrop-blur px-4 h-14">
        {brand}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5">
            <IconZap className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold">{credits === null ? "..." : credits}</span>
          </div>
          <button
            onClick={() => setMobileNav(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300"
            aria-label="Buka menu"
          >
            <IconMenu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileNav && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNav(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-neutral-900 border-r border-neutral-800 px-4 py-5 flex flex-col">
            <div className="flex items-center justify-between">
              {brand}
              <button
                onClick={() => setMobileNav(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:text-white"
                aria-label="Tutup menu"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex-1">{navList}</div>
            <div className="space-y-3">
              {creditPill}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:text-white hover:bg-white/5 transition"
              >
                <IconLogout className="h-4 w-4" /> Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="md:pl-64">
        <div className="mx-auto max-w-4xl px-5 pb-16 pt-20 md:pt-10">
          {tab === "generate" && (
            <GenerateView
              prompt={prompt}
              setPrompt={setPrompt}
              resolution={resolution}
              setResolution={setResolution}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              duration={duration}
              setDuration={setDuration}
              characters={characters}
              selectedCharacterId={selectedCharacterId}
              setSelectedCharacterId={setSelectedCharacterId}
              selectedCharacter={selectedCharacter}
              imagePreview={imagePreview}
              handleImageChange={handleImageChange}
              isGenerating={isGenerating}
              isOutOfCredits={isOutOfCredits}
              error={error}
              onSubmit={handleSubmit}
              onGoCharacters={() => goTab("characters")}
              videos={videos}
              isLoadingVideos={isLoadingVideos}
              onDeleteVideo={handleDeleteVideo}
            />
          )}

          {tab === "characters" && (
            <CharacterManager
              session={session}
              authFetch={authFetch}
              characters={characters}
              onChanged={fetchCharacters}
            />
          )}

          {tab === "buy" && (
            <BuyCredits
              packages={CREDIT_PACKAGES}
              credits={credits}
              buyingId={buyingId}
              buyMessage={buyMessage}
              onBuy={handleBuy}
            />
          )}

          {tab === "profile" && <Profile session={session} credits={credits} onLogout={handleLogout} />}
        </div>
      </main>
    </div>
  )
}

/* ---------------- Generate view ---------------- */
function GenerateView(props: {
  prompt: string
  setPrompt: (v: string) => void
  resolution: string
  setResolution: (v: string) => void
  aspectRatio: string
  setAspectRatio: (v: string) => void
  duration: number
  setDuration: (v: number) => void
  characters: CharacterItem[]
  selectedCharacterId: string
  setSelectedCharacterId: (v: string) => void
  selectedCharacter: CharacterItem | null
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
}) {
  const {
    prompt, setPrompt, resolution, setResolution, aspectRatio, setAspectRatio,
    duration, setDuration, characters, selectedCharacterId, setSelectedCharacterId,
    selectedCharacter, imagePreview, handleImageChange, isGenerating, isOutOfCredits,
    error, onSubmit, onGoCharacters, videos, isLoadingVideos, onDeleteVideo,
  } = props

  const [galleryFilter, setGalleryFilter] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function addStyle(suffix: string) {
    const base = prompt.trim().replace(/[,\s]+$/, "")
    const next = base ? `${base}, ${suffix}` : suffix
    setPrompt(next.slice(0, MAX_PROMPT))
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await onDeleteVideo(id)
    } finally {
      setDeletingId(null)
    }
  }

  const shown = galleryFilter ? videos.filter((v) => v.characterId === galleryFilter) : videos

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Buat Video</h1>
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
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT))}
            placeholder="Contoh: Seekor kucing oranye berlari di padang bunga saat matahari terbenam, sinematik, slow motion..."
            rows={4}
            className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
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
            <div className="flex items-center gap-3">
              {selectedCharacter?.imageUrl ? (
                <img src={selectedCharacter.imageUrl} alt={selectedCharacter.name} className="h-11 w-11 rounded-lg object-cover border border-neutral-700" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-500"><IconUsers className="h-5 w-5" /></div>
              )}
              <select
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                className="flex-1 rounded-lg bg-neutral-950 border border-neutral-700 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tanpa karakter</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <p className="text-[11px] text-neutral-500 mt-1.5">Pilih karakter agar wajahnya tetap konsisten (penguncian aktif penuh saat API asli tersambung).</p>
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
            Kredit kamu sudah habis. Buka menu \"Beli Kredit\" untuk menambah.
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
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="text-lg font-semibold">Galeri Hasil</h2>
          <div className="flex items-center gap-2">
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
            <IconUsers className="h-8 w-8 text-neutral-600" />
            <p className="text-sm text-neutral-500 mt-3">Tidak ada video untuk karakter ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shown.map((video) => {
              const character = video.characterId ? characters.find((c) => c.id === video.characterId) : null
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
                      {character && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 rounded px-1.5 py-0.5">
                          <IconUsers className="h-3 w-3" /> {character.name}
                        </span>
                      )}
                      {video.resolution && <span className="text-[10px] font-medium bg-neutral-800 rounded px-1.5 py-0.5 text-neutral-300">{video.resolution}</span>}
                      {video.aspectRatio && <span className="text-[10px] font-medium bg-neutral-800 rounded px-1.5 py-0.5 text-neutral-300">{video.aspectRatio}</span>}
                      {video.duration && <span className="text-[10px] font-medium bg-neutral-800 rounded px-1.5 py-0.5 text-neutral-300">{video.duration}s</span>}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-neutral-500">
                        {new Date(video.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                      <div className="flex items-center gap-3">
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

/* ---------------- Characters ---------------- */
function CharacterManager({
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
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleFile(f: File | null) {
    setFile(f)
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return f ? URL.createObjectURL(f) : null
    })
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
      let imageUrl: string | null = null
      if (file) {
        const safe = file.name.replace(/[^a-zA-Z0-9.]/g, "_")
        const path = `${session.user.id}/${Date.now()}-${safe}`
        const { error: upErr } = await supabase.storage.from("character-images").upload(path, file)
        if (upErr) throw new Error("Gagal mengunggah foto: " + upErr.message)
        imageUrl = supabase.storage.from("character-images").getPublicUrl(path).data.publicUrl
      }
      const res = await authFetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), imageUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan karakter.")
      setName("")
      setDescription("")
      handleFile(null)
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
          Buat karakter dengan foto &amp; deskripsi agar tampil konsisten di setiap video. Cocok untuk drama pendek &amp; konten affiliate.
        </p>
      </div>

      <form onSubmit={handleAdd} className="space-y-4 bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
        <h3 className="text-sm font-semibold">Tambah Karakter</h3>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Nama karakter</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Dinda, host review produk"
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
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Foto referensi (opsional)</label>
          {preview ? (
            <div className="flex items-center gap-3">
              <img src={preview} alt="Preview" className="h-20 w-20 rounded-lg object-cover border border-neutral-700" />
              <button type="button" onClick={() => handleFile(null)} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300">
                <IconTrash className="h-4 w-4" /> Hapus foto
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-400 hover:border-neutral-600">
              <IconImage className="h-5 w-5" />
              <span>Pilih foto karakter</span>
              <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} className="hidden" />
            </label>
          )}
          <p className="text-[11px] text-neutral-500 mt-1.5">Foto jelas &amp; menghadap depan membuat karakter lebih mudah dikunci nanti.</p>
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
            {characters.map((c) => (
              <div key={c.id} className="flex gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.name} className="h-16 w-16 rounded-lg object-cover border border-neutral-700 shrink-0" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neutral-800 text-neutral-500 shrink-0"><IconUsers className="h-6 w-6" /></div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{c.name}</p>
                  {c.description && <p className="text-xs text-neutral-400 line-clamp-2 mt-0.5">{c.description}</p>}
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    <IconTrash className="h-3.5 w-3.5" /> {deletingId === c.id ? "Menghapus..." : "Hapus"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------------- Buy credits ---------------- */
function BuyCredits({
  packages,
  credits,
  buyingId,
  buyMessage,
  onBuy,
}: {
  packages: typeof CREDIT_PACKAGES
  credits: number | null
  buyingId: string | null
  buyMessage: string | null
  onBuy: (id: string) => void
}) {
  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Beli Kredit</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Saldo saat ini: <span className="font-semibold text-white">{credits === null ? "..." : credits} kredit</span>. 1 kredit = 1 kali generate video.
        </p>
      </div>

      <div className="mb-6 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-xs text-amber-300">
        Mode uji coba &mdash; pembayaran belum aktif, jadi kredit langsung ditambahkan tanpa bayar. Nanti akan disambungkan ke pembayaran asli (Midtrans/Xendit).
      </div>

      {buyMessage && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
          <IconCheck className="h-4 w-4 shrink-0" /> {buyMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative rounded-2xl border p-6 flex flex-col items-center text-center ${
              pkg.highlight ? "border-indigo-500 bg-indigo-500/10" : "border-neutral-800 bg-neutral-900"
            }`}
          >
            {pkg.highlight && (
              <span className="absolute -top-3 rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide">Populer</span>
            )}
            <span className="text-xs font-medium text-neutral-400">{pkg.label}</span>
            <span className="mt-2 text-4xl font-bold">{pkg.credits}</span>
            <span className="text-xs text-neutral-400 mb-3">kredit</span>
            <span className="text-lg font-semibold mb-4">{pkg.price}</span>
            <button
              onClick={() => onBuy(pkg.id)}
              disabled={buyingId !== null}
              className={`w-full rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                pkg.highlight ? "bg-indigo-600 hover:bg-indigo-500" : "bg-neutral-800 border border-neutral-700 hover:bg-neutral-700"
              }`}
            >
              {buyingId === pkg.id ? "Memproses..." : "Beli"}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Profile ---------------- */
function Profile({
  session,
  credits,
  onLogout,
}: {
  session: Session
  credits: number | null
  onLogout: () => void
}) {
  const supabase = getSupabaseBrowser()
  const email = session.user.email ?? "Akun"
  const createdAt = session.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString("id-ID", { dateStyle: "long" })
    : "-"

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState<string | null>(null)

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(null)
    if (newPassword.length < 6) {
      setPwError("Password minimal 6 karakter.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError("Konfirmasi password tidak cocok.")
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPwSuccess("Password berhasil diubah!")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Gagal mengubah password.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
        <p className="text-sm text-neutral-400 mt-1">Kelola akun dan keamanan kamu.</p>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-semibold mb-4">Info Akun</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-400">Email</dt>
            <dd className="font-medium">{email}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-neutral-400">Saldo kredit</dt>
            <dd className="font-medium inline-flex items-center gap-1"><IconZap className="h-4 w-4 text-amber-400" /> {credits === null ? "..." : credits}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-400">Bergabung sejak</dt>
            <dd className="font-medium">{createdAt}</dd>
          </div>
        </dl>
      </div>

      <form onSubmit={handleChangePassword} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
        <h2 className="text-sm font-semibold">Ganti Password</h2>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Password baru</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Konfirmasi password baru</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi password baru"
            className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {pwError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-300">{pwError}</div>
        )}
        {pwSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-sm text-emerald-300">
            <IconCheck className="h-4 w-4 shrink-0" /> {pwSuccess}
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50 transition"
        >
          {saving ? "Menyimpan..." : "Simpan Password Baru"}
        </button>
      </form>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Keluar dari akun</h2>
          <p className="text-xs text-neutral-400 mt-1">Kamu perlu login lagi untuk masuk.</p>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600/90 hover:bg-red-600 px-5 py-2.5 text-sm font-semibold transition"
        >
          <IconLogout className="h-4 w-4" /> Keluar
        </button>
      </div>
    </section>
  )
}
