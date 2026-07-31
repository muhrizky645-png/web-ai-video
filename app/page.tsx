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
  favorite?: boolean
}

type CharacterItem = {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  imageUrls?: string[]
  voiceUrl?: string | null
  createdAt: string
}

type Tab = "generate" | "characters" | "buy" | "profile"

const RESOLUTIONS = ["480p", "720p", "1080p"]
const ASPECT_RATIOS = ["16:9", "9:16", "1:1"]
const DURATIONS = [4, 5, 8, 10]
const MAX_PROMPT = 500
const MAX_CHAR_PHOTOS = 4

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

function findMentioned(text: string, characters: CharacterItem[]): CharacterItem[] {
  if (!text) return []
  return characters.filter((c) => text.includes(`@${c.name}`))
}

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
const IconAt = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" /></Svg>
)
const IconMic = (p: IconProps) => (
  <Svg {...p}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></Svg>
)
const IconPlus = (p: IconProps) => (
  <Svg {...p}><path d="M5 12h14" /><path d="M12 5v14" /></Svg>
)
const IconArrowRight = (p: IconProps) => (
  <Svg {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Svg>
)
const IconArrowLeft = (p: IconProps) => (
  <Svg {...p}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></Svg>
)
const IconPlay = (p: IconProps) => (
  <Svg {...p}><polygon points="6 3 20 12 6 21 6 3" /></Svg>
)
const IconEye = (p: IconProps) => (
  <Svg {...p}><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></Svg>
)
const IconEyeOff = (p: IconProps) => (
  <Svg {...p}><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" /></Svg>
)
const IconStar = ({ className = "h-5 w-5", filled = false }: IconProps & { filled?: boolean }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
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
  const [showAuth, setShowAuth] = useState(false)

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

  if (session) return <AppScreen session={session} />
  if (showAuth) return <AuthScreen onBack={() => setShowAuth(false)} />
  return <LandingScreen onStart={() => setShowAuth(true)} />
}

/* ---------------- Landing (pengunjung belum login) ---------------- */
function LandingScreen({ onStart }: { onStart: () => void }) {
  const features: { icon: (p: IconProps) => ReactNode; title: string; desc: string }[] = [
    { icon: IconSparkles, title: "Teks jadi Video", desc: "Tulis prompt, AI ubah jadi video sinematik dalam hitungan menit." },
    { icon: IconImage, title: "Gambar jadi Video", desc: "Unggah satu foto, jadikan video bergerak yang hidup." },
    { icon: IconUsers, title: "Karakter Konsisten", desc: "Kunci wajah karakter agar tetap sama di setiap adegan, cukup sebut @nama." },
    { icon: IconMic, title: "Suara Karakter", desc: "Tambahkan sampel suara agar karakter terdengar konsisten." },
    { icon: IconFilm, title: "Berbagai Format", desc: "Pilih resolusi, rasio TikTok/YouTube, dan durasi sesuai kebutuhan." },
    { icon: IconDownload, title: "Galeri & Unduh", desc: "Simpan hasil ke galeri, tandai favorit, dan unduh kapan saja." },
  ]
  const steps = [
    { n: "1", title: "Tulis atau unggah", desc: "Ketik ide dalam prompt atau unggah gambar referensi." },
    { n: "2", title: "Pilih gaya & karakter", desc: "Sebut karakter pakai @nama, pilih gaya dan platform." },
    { n: "3", title: "Generate & unduh", desc: "Klik generate, tunggu sebentar, videomu siap diunduh." },
  ]
  const samples = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  ]

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-neutral-800/70 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
              <IconFilm className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">AI Video</p>
              <p className="text-[11px] text-neutral-500">Generator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onStart} className="hidden sm:inline-flex text-sm font-medium text-neutral-300 hover:text-white px-3 py-2">
              Masuk
            </button>
            <button
              onClick={onStart}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 transition"
            >
              Coba Gratis <IconArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(79,70,229,0.25),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-5 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
            <IconSparkles className="h-3.5 w-3.5" /> Video AI untuk kreator &amp; bisnis
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Ubah ide jadi <span className="text-indigo-400">video memukau</span> dalam hitungan menit
          </h1>
          <p className="mt-5 text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto">
            Buat video dari teks atau gambar, dengan karakter yang konsisten di setiap adegan. Cocok untuk drama pendek, konten affiliate, dan iklan produk.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold hover:bg-indigo-500 transition"
            >
              <IconSparkles className="h-4 w-4" /> Coba Gratis Sekarang
            </button>
            <a
              href="#contoh"
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-6 py-3 text-sm font-semibold hover:border-neutral-600 transition"
            >
              <IconPlay className="h-4 w-4" /> Lihat Contoh
            </a>
          </div>
          <p className="mt-4 text-xs text-neutral-500">Gratis untuk memulai · Tanpa kartu kredit · Dapat 20 kredit saat daftar</p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Semua yang kamu butuhkan</h2>
          <p className="mt-3 text-neutral-400">Fitur lengkap untuk membuat video yang konsisten dan profesional.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 hover:border-neutral-700 transition">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-neutral-400">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Contoh hasil */}
      <section id="contoh" className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Contoh hasil</h2>
          <p className="mt-3 text-neutral-400">Beberapa contoh video yang bisa kamu buat.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {samples.map((src) => (
            <div key={src} className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900">
              <video src={src} controls className="w-full aspect-video bg-black" />
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-neutral-500">Contoh di atas adalah video demo untuk menggambarkan tampilan galeri.</p>
      </section>

      {/* Cara kerja */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Cara kerjanya</h2>
          <p className="mt-3 text-neutral-400">Hanya tiga langkah mudah.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold">{s.n}</div>
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-neutral-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-5 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 to-neutral-900 p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Siap membuat video pertamamu?</h2>
          <p className="mt-3 text-neutral-300 max-w-xl mx-auto">Daftar gratis sekarang dan dapatkan 20 kredit untuk mulai membuat video.</p>
          <button
            onClick={onStart}
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold hover:bg-indigo-500 transition"
          >
            <IconSparkles className="h-4 w-4" /> Mulai Gratis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800">
        <div className="mx-auto max-w-6xl px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
              <IconFilm className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium">AI Video Generator</span>
          </div>
          <p className="text-xs text-neutral-500">© 2026 AI Video Generator. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  )
}

/* ---------------- Auth screen ---------------- */
function AuthScreen({ onBack }: { onBack?: () => void }) {
  const supabase = getSupabaseBrowser()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login")
    setError(null)
    setInfo(null)
    setConfirmPassword("")
    setShowPassword(false)
    setShowConfirm(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (mode === "signup") {
      if (password.length < 6) {
        setError("Password minimal 6 karakter.")
        return
      }
      if (password !== confirmPassword) {
        setError("Konfirmasi password tidak cocok.")
        return
      }
    }
    setLoading(true)
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!data.session) {
          setInfo("Akun berhasil dibuat! Cek email kamu untuk konfirmasi, lalu masuk.")
          setMode("login")
          setConfirmPassword("")
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
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
          >
            <IconArrowLeft className="h-4 w-4" /> Kembali ke beranda
          </button>
        )}
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500 hover:text-neutral-300"
                aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-neutral-300">Konfirmasi password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500 hover:text-neutral-300"
                  aria-label={showConfirm ? "Sembunyikan password" : "Lihat password"}
                >
                  {showConfirm ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

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
            onClick={switchMode}
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

  async function handleToggleFavorite(id: string, favorite: boolean) {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, favorite } : v)))
    const res = await authFetch(`/api/videos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite }),
    })
    if (!res.ok) {
      setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, favorite: !favorite } : v)))
    }
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
      const mentioned = findMentioned(prompt, characters)
      if (mentioned[0]) formData.append("characterId", mentioned[0].id)
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
          favorite: false,
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
              onToggleFavorite={handleToggleFavorite}
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
          <h2 className="text-lg font-semibold">Galeri Hasil</h2>
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

/* ---------------- Characters ---------------- */
type PhotoItem = { file: File; url: string }

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
          Buat karakter dengan foto &amp; suara agar tampil konsisten di setiap video. Sebut mereka di prompt pakai <b className="text-neutral-300">@nama</b>. Cocok untuk drama pendek &amp; konten affiliate.
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
        Mode uji coba — pembayaran belum aktif, jadi kredit langsung ditambahkan tanpa bayar. Nanti akan disambungkan ke pembayaran asli (Midtrans/Xendit).
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
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
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
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500 hover:text-neutral-300"
              aria-label={showNew ? "Sembunyikan password" : "Lihat password"}
            >
              {showNew ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Konfirmasi password baru</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full rounded-lg bg-neutral-950 border border-neutral-700 p-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500 hover:text-neutral-300"
              aria-label={showConfirm ? "Sembunyikan password" : "Lihat password"}
            >
              {showConfirm ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
            </button>
          </div>
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
