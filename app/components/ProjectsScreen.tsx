"use client"

import { useEffect, useState, type FormEvent } from "react"
import type { Session } from "@supabase/supabase-js"
import type { Project } from "@/lib/app"
import { IconArrowRight, IconFilm, IconFolder, IconLogout, IconPlus, IconTrash, IconZap } from "./icons"

export default function ProjectsScreen({
  session,
  credits,
  authFetch,
  onOpenProject,
  onLogout,
}: {
  session: Session
  credits: number | null
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
  onOpenProject: (project: Project) => void
  onLogout: () => void
}) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  useEffect(() => {
    let active = true
    setLoading(true)
    authFetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        if (active && Array.isArray(d.projects)) setProjects(d.projects)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [authFetch])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!newName.trim()) {
      setError("Nama proyek wajib diisi.")
      return
    }
    setCreating(true)
    try {
      const res = await authFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal membuat proyek.")
      const project: Project = { id: data.id, name: data.name, createdAt: data.createdAt }
      setProjects((prev) => [project, ...prev])
      setNewName("")
      onOpenProject(project)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id)
    try {
      const res = await authFetch(`/api/projects/${id}`, { method: "DELETE" })
      if (res.ok) setProjects((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setBusyId(null)
    }
  }

  async function handleRename(id: string) {
    const name = editName.trim()
    if (!name) {
      setEditingId(null)
      return
    }
    setBusyId(id)
    try {
      const res = await authFetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))
    } finally {
      setBusyId(null)
      setEditingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-30 border-b border-neutral-800/70 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
              <IconFilm className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold">AI Video Generator</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium">
              <IconZap className="h-3.5 w-3.5 text-amber-400" /> {credits === null ? "..." : credits} kredit
            </span>
            <button onClick={onLogout} className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white">
              <IconLogout className="h-4 w-4" /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Proyek Kamu</h1>
          <p className="text-sm text-neutral-400 mt-1">Buat proyek dulu, lalu di dalamnya ada menu Gambar, Video, dan Karakter.</p>
        </div>

        <form onSubmit={handleCreate} className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <label className="block text-sm font-medium mb-1.5 text-neutral-300">Buat proyek baru</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Contoh: Drama Pendek Episode 1"
              className="flex-1 rounded-lg bg-neutral-950 border border-neutral-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              <IconPlus className="h-4 w-4" /> {creating ? "Membuat..." : "Buat Proyek"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </form>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-neutral-800 bg-neutral-900" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/40 py-16 text-center">
            <IconFolder className="h-10 w-10 text-neutral-600" />
            <p className="text-sm text-neutral-500 mt-3">Belum ada proyek. Buat proyek pertamamu di atas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="group rounded-2xl border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-700 transition">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                    <IconFolder className="h-5 w-5" />
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={busyId === p.id}
                    className="text-neutral-600 hover:text-red-400 disabled:opacity-50"
                    aria-label="Hapus proyek"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
                {editingId === p.id ? (
                  <div className="mt-4 flex gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(p.id)
                        if (e.key === "Escape") setEditingId(null)
                      }}
                      className="flex-1 rounded-lg bg-neutral-950 border border-neutral-700 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={() => handleRename(p.id)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold hover:bg-indigo-500">Simpan</button>
                  </div>
                ) : (
                  <h3 className="mt-4 text-base font-semibold truncate">{p.name}</h3>
                )}
                <p className="mt-1 text-xs text-neutral-500">
                  Dibuat {new Date(p.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => onOpenProject(p)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 transition"
                  >
                    Buka <IconArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(p.id)
                      setEditName(p.name)
                    }}
                    className="text-xs font-medium text-neutral-400 hover:text-white"
                  >
                    Ganti nama
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
