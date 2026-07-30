"use client"

import { useState, type FormEvent } from "react"

type GeneratedVideo = {
  id: string
  prompt: string
  videoUrl: string
  createdAt: string
}

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [videos, setVideos] = useState<GeneratedVideo[]>([])
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!prompt.trim()) {
      setError("Prompt tidak boleh kosong.")
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append("prompt", prompt)
      if (image) formData.append("image", image)

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error("Gagal generate video")
      }

      const data = await res.json()

      setVideos((prev) => [
        {
          id: data.id,
          prompt: data.prompt,
          videoUrl: data.videoUrl,
          createdAt: data.createdAt,
        },
        ...prev,
      ])
      setPrompt("")
      setImage(null)
    } catch (err) {
      setError("Terjadi kesalahan saat generate video. Coba lagi.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold mb-1">AI Video Generator</h1>
        <p className="text-sm text-gray-400 mb-8">
          Mode uji coba &mdash; video yang dihasilkan masih dummy (belum terhubung ke Seedance API).
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-gray-900 rounded-xl p-6 border border-gray-800"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tulis deskripsi video yang ingin dibuat..."
              rows={4}
              className="w-full rounded-lg bg-black border border-gray-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Upload gambar (opsional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? "Sedang generate..." : "Generate Video"}
          </button>
        </form>

        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4">Galeri Hasil</h2>
          {videos.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada video yang dihasilkan.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="rounded-xl overflow-hidden border border-gray-800 bg-gray-900"
                >
                  <video src={video.videoUrl} controls className="w-full aspect-video bg-black" />
                  <div className="p-3">
                    <p className="text-sm text-gray-300 line-clamp-2">{video.prompt}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(video.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
