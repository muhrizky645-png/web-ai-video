"use client"

import { useState, type FormEvent } from "react"
import { getSupabaseBrowser } from "@/lib/supabaseClient"
import { IconArrowLeft, IconEye, IconEyeOff, IconFilm } from "./icons"

export default function AuthScreen({ onBack }: { onBack?: () => void }) {
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
            {mode === "login" ? "Masuk untuk mulai berkarya." : "Buat akun baru untuk mulai."}
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
