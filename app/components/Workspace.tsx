"use client"

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"
import type { CharacterItem, GeneratedVideo, Project, Tab } from "@/lib/app"
import {
  IconArrowLeft, IconCard, IconClose, IconFilm, IconFolder, IconImage, IconMenu, IconUser, IconUsers, IconZap,
  type IconProps,
} from "./icons"
import GenerateImageView from "./GenerateImageView"
import GenerateVideoView from "./GenerateVideoView"
import CharacterManager from "./CharacterManager"
import BuyCredits from "./BuyCredits"
import Profile from "./Profile"

export default function Workspace({
  session,
  project,
  onBackToProjects,
  onLogout,
}: {
  session: Session
  project: Project
  onBackToProjects: () => void
  onLogout: () => void
}) {
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {})
      if (session.access_token) headers.set("Authorization", `Bearer ${session.access_token}`)
      return fetch(url, { ...options, headers })
    },
    [session]
  )

  const [tab, setTab] = useState<Tab>("images")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [characters, setCharacters] = useState<CharacterItem[]>([])

  // Video state
  const [prompt, setPrompt] = useState("")
  const [resolution, setResolution] = useState("720p")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [duration, setDuration] = useState(5)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [videos, setVideos] = useState<GeneratedVideo[]>([])
  const [isLoadingVideos, setIsLoadingVideos] = useState(true)

  // Buy credits state
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [buyMessage, setBuyMessage] = useState<string | null>(null)

  const loadCredits = useCallback(() => {
    authFetch("/api/credits")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.balance === "number") setCredits(d.balance)
      })
      .catch(() => {})
  }, [authFetch])

  const loadCharacters = useCallback(() => {
    authFetch("/api/characters")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.characters)) setCharacters(d.characters)
      })
      .catch(() => {})
  }, [authFetch])

  useEffect(() => {
    loadCredits()
    loadCharacters()
  }, [loadCredits, loadCharacters])

  useEffect(() => {
    let active = true
    setIsLoadingVideos(true)
    authFetch(`/api/videos?projectId=${project.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (active && Array.isArray(d.videos)) setVideos(d.videos)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoadingVideos(false)
      })
    return () => {
      active = false
    }
  }, [authFetch, project.id])

  const isOutOfCredits = credits !== null && credits <= 0

  function handleImageChange(f: File | null) {
    setImageFile(f)
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return f ? URL.createObjectURL(f) : null
    })
  }

  async function handleGenerateVideo(e: FormEvent) {
    e.preventDefault()
    setVideoError(null)
    if (!prompt.trim()) {
      setVideoError("Prompt wajib diisi.")
      return
    }
    setIsGenerating(true)
    try {
      const fd = new FormData()
      fd.append("prompt", prompt.trim())
      fd.append("resolution", resolution)
      fd.append("aspectRatio", aspectRatio)
      fd.append("duration", String(duration))
      fd.append("projectId", project.id)
      if (imageFile) fd.append("image", imageFile)
      const res = await authFetch("/api/generate", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal membuat video.")
      const video: GeneratedVideo = {
        id: data.id,
        prompt: data.prompt,
        videoUrl: data.videoUrl,
        resolution: data.resolution,
        aspectRatio: data.aspectRatio,
        duration: data.duration,
        createdAt: data.createdAt,
        status: data.status,
        characterId: data.characterId ?? null,
        favorite: false,
      }
      setVideos((prev) => [video, ...prev])
      if (typeof data.remainingCredits === "number") setCredits(data.remainingCredits)
      setPrompt("")
      handleImageChange(null)
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDeleteVideo(id: string) {
    const res = await authFetch(`/api/videos/${id}`, { method: "DELETE" })
    if (res.ok) setVideos((prev) => prev.filter((v) => v.id !== id))
  }

  async function handleToggleVideoFavorite(id: string, favorite: boolean) {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, favorite } : v)))
    try {
      await authFetch(`/api/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite }),
      })
    } catch {
      setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, favorite: !favorite } : v)))
    }
  }

  async function handleBuy(id: string) {
    setBuyingId(id)
    setBuyMessage(null)
    try {
      const res = await authFetch("/api/credits/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: id }),
      })
      const data = await res.json()
      if (res.ok) {
        if (typeof data.balance === "number") setCredits(data.balance)
        setBuyMessage(`Berhasil menambah ${data.added ?? ""} kredit!`)
      }
    } finally {
      setBuyingId(null)
    }
  }

  const nav: { id: Tab; label: string; icon: (p: IconProps) => ReactNode }[] = [
    { id: "images", label: "Gambar", icon: IconImage },
    { id: "videos", label: "Video", icon: IconFilm },
    { id: "characters", label: "Karakter", icon: IconUsers },
    { id: "buy", label: "Beli Kredit", icon: IconCard },
    { id: "profile", label: "Profil", icon: IconUser },
  ]

  function go(next: Tab) {
    setTab(next)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-neutral-800 bg-neutral-900 transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-neutral-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
              <IconFolder className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-sm font-semibold truncate">{project.name}</p>
              <p className="text-[11px] text-neutral-500">Proyek</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-neutral-400 hover:text-white">
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 py-3">
          <button
            onClick={onBackToProjects}
            className="mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 hover:bg-white/5 hover:text-white"
          >
            <IconArrowLeft className="h-4 w-4" /> Semua Proyek
          </button>
          <nav className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-indigo-600 text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" /> {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-neutral-800 p-3">
          <div className="flex items-center justify-between rounded-lg bg-neutral-950 px-3 py-2.5">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
              <IconZap className="h-4 w-4 text-amber-400" /> {credits === null ? "..." : credits} kredit
            </span>
            <button onClick={() => go("buy")} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              + Tambah
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-neutral-800 bg-neutral-950/80 px-5 backdrop-blur lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-neutral-300 hover:text-white">
            <IconMenu className="h-6 w-6" />
          </button>
          <span className="text-sm font-semibold truncate">{project.name}</span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium">
            <IconZap className="h-4 w-4 text-amber-400" /> {credits === null ? "..." : credits}
          </span>
        </header>

        <main className="mx-auto max-w-3xl px-5 py-8">
          {tab === "images" && (
            <GenerateImageView
              projectId={project.id}
              authFetch={authFetch}
              isOutOfCredits={isOutOfCredits}
              onCreditsChanged={setCredits}
            />
          )}
          {tab === "videos" && (
            <GenerateVideoView
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
              error={videoError}
              onSubmit={handleGenerateVideo}
              onGoCharacters={() => go("characters")}
              videos={videos}
              isLoadingVideos={isLoadingVideos}
              onDeleteVideo={handleDeleteVideo}
              onToggleFavorite={handleToggleVideoFavorite}
            />
          )}
          {tab === "characters" && (
            <CharacterManager
              session={session}
              authFetch={authFetch}
              characters={characters}
              onChanged={loadCharacters}
            />
          )}
          {tab === "buy" && (
            <BuyCredits credits={credits} buyingId={buyingId} buyMessage={buyMessage} onBuy={handleBuy} />
          )}
          {tab === "profile" && <Profile session={session} credits={credits} onLogout={onLogout} />}
        </main>
      </div>
    </div>
  )
}
