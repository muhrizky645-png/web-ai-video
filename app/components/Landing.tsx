"use client"

import type { ReactNode } from "react"
import {
  IconArrowRight, IconDownload, IconFilm, IconImage, IconMic, IconPlay, IconSparkles, IconUsers,
  type IconProps,
} from "./icons"

export default function Landing({ onStart }: { onStart: () => void }) {
  const features: { icon: (p: IconProps) => ReactNode; title: string; desc: string }[] = [
    { icon: IconSparkles, title: "Teks jadi Video", desc: "Tulis prompt, AI ubah jadi video sinematik dalam hitungan menit." },
    { icon: IconImage, title: "Teks jadi Gambar", desc: "Ketik ide, hasilkan gambar untuk thumbnail, poster, atau referensi." },
    { icon: IconUsers, title: "Karakter Konsisten", desc: "Kunci wajah karakter agar tetap sama di setiap adegan, cukup sebut @nama." },
    { icon: IconMic, title: "Suara Karakter", desc: "Tambahkan sampel suara agar karakter terdengar konsisten." },
    { icon: IconFilm, title: "Berbagai Format", desc: "Pilih resolusi, rasio TikTok/YouTube, dan durasi sesuai kebutuhan." },
    { icon: IconDownload, title: "Galeri & Unduh", desc: "Simpan hasil ke galeri, tandai favorit, dan unduh kapan saja." },
  ]
  const steps = [
    { n: "1", title: "Buat proyek", desc: "Mulai proyek baru untuk mengelompokkan gambar, video, dan karakter." },
    { n: "2", title: "Pilih gaya & karakter", desc: "Sebut karakter pakai @nama, pilih gaya dan platform." },
    { n: "3", title: "Generate & unduh", desc: "Klik generate, tunggu sebentar, hasilnya siap diunduh." },
  ]
  const samples = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  ]

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
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

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(79,70,229,0.25),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-5 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
            <IconSparkles className="h-3.5 w-3.5" /> Video &amp; gambar AI untuk kreator &amp; bisnis
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Ubah ide jadi <span className="text-indigo-400">video &amp; gambar memukau</span> dalam hitungan menit
          </h1>
          <p className="mt-5 text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto">
            Buat video dan gambar dari teks, dengan karakter yang konsisten di setiap adegan. Cocok untuk drama pendek, konten affiliate, dan iklan produk.
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

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Semua yang kamu butuhkan</h2>
          <p className="mt-3 text-neutral-400">Fitur lengkap untuk membuat konten yang konsisten dan profesional.</p>
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

      <section className="mx-auto max-w-4xl px-5 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 to-neutral-900 p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Siap membuat karya pertamamu?</h2>
          <p className="mt-3 text-neutral-300 max-w-xl mx-auto">Daftar gratis sekarang dan dapatkan 20 kredit untuk mulai berkarya.</p>
          <button
            onClick={onStart}
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold hover:bg-indigo-500 transition"
          >
            <IconSparkles className="h-4 w-4" /> Mulai Gratis
          </button>
        </div>
      </section>

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
