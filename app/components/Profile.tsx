"use client"

import { useState, type FormEvent } from "react"
import type { Session } from "@supabase/supabase-js"
import { getSupabaseBrowser } from "@/lib/supabaseClient"
import { IconCheck, IconEye, IconEyeOff, IconLogout, IconZap } from "./icons"

export default function Profile({
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
