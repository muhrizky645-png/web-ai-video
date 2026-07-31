export type GeneratedVideo = {
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

export type GeneratedImage = {
  id: string
  prompt: string
  imageUrl: string | null
  aspectRatio?: string
  style?: string
  createdAt: string
  favorite?: boolean
}

export type CharacterItem = {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  imageUrls?: string[]
  voiceUrl?: string | null
  createdAt: string
}

export type Project = {
  id: string
  name: string
  createdAt: string
}

export type Tab = "images" | "videos" | "characters" | "buy" | "profile"

export type PhotoItem = { file: File; url: string }

export const RESOLUTIONS = ["480p", "720p", "1080p"]
export const ASPECT_RATIOS = ["16:9", "9:16", "1:1"]
export const DURATIONS = [4, 5, 8, 10]
export const MAX_PROMPT = 500
export const MAX_CHAR_PHOTOS = 4

export const STYLE_PRESETS = [
  { id: "cinematic", label: "Sinematik", suffix: "gaya sinematik, pencahayaan dramatis, depth of field" },
  { id: "realistic", label: "Realistis", suffix: "realistis, detail tinggi, fotorealistik, 4k" },
  { id: "anime", label: "Anime", suffix: "gaya anime, warna cerah, ilustrasi" },
  { id: "3d", label: "3D / Pixar", suffix: "animasi 3D, gaya render Pixar" },
  { id: "product", label: "Iklan Produk", suffix: "video iklan produk, studio lighting, bersih, komersial" },
  { id: "vintage", label: "Vintage", suffix: "gaya retro vintage, grain film, warna hangat" },
]

export const IMAGE_STYLES = [
  { id: "realistic", label: "Realistis", suffix: "foto realistis, detail tinggi, 4k" },
  { id: "cinematic", label: "Sinematik", suffix: "pencahayaan sinematik, dramatis" },
  { id: "anime", label: "Anime", suffix: "gaya anime, ilustrasi berwarna" },
  { id: "3d", label: "3D / Pixar", suffix: "render 3D, gaya Pixar" },
  { id: "product", label: "Produk", suffix: "foto produk studio, latar bersih, komersial" },
  { id: "art", label: "Lukisan", suffix: "lukisan digital artistik, detail halus" },
]

export const PLATFORM_PRESETS = [
  { id: "tiktok", label: "TikTok / Reels", ratio: "9:16" },
  { id: "youtube", label: "YouTube", ratio: "16:9" },
  { id: "square", label: "Post (1:1)", ratio: "1:1" },
]

export const CREDIT_PACKAGES = [
  { id: "small", credits: 10, price: "Rp 15.000", label: "Hemat", highlight: false },
  { id: "medium", credits: 50, price: "Rp 65.000", label: "Populer", highlight: true },
  { id: "large", credits: 100, price: "Rp 120.000", label: "Terbaik", highlight: false },
]

export function findMentioned(text: string, characters: CharacterItem[]): CharacterItem[] {
  if (!text) return []
  return characters.filter((c) => text.includes(`@${c.name}`))
}
