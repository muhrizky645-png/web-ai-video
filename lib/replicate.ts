// Helper sederhana untuk memanggil HTTP API Replicate.
// Token diambil dari env var REPLICATE_API_TOKEN (di-set di Vercel).

const REPLICATE_API = "https://api.replicate.com/v1"

function getToken(): string {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    throw new Error("Environment variable REPLICATE_API_TOKEN belum diset.")
  }
  return token
}

export type ReplicatePrediction = {
  id: string
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled"
  output?: unknown
  error?: unknown
}

// Membuat prediksi baru (async). Mengembalikan objek prediksi dengan id & status awal.
export async function createPrediction(
  model: string,
  input: Record<string, unknown>
): Promise<ReplicatePrediction> {
  const res = await fetch(`${REPLICATE_API}/models/${model}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  })
  const data = await res.json()
  if (!res.ok) {
    const msg =
      (data && (data.detail || data.title)) || "Gagal membuat prediksi di Replicate."
    throw new Error(typeof msg === "string" ? msg : "Gagal membuat prediksi di Replicate.")
  }
  return data as ReplicatePrediction
}

// Mengambil status/hasil sebuah prediksi berdasarkan id.
export async function getPrediction(id: string): Promise<ReplicatePrediction> {
  const res = await fetch(`${REPLICATE_API}/predictions/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
    cache: "no-store",
  })
  const data = await res.json()
  if (!res.ok) {
    const msg = (data && data.detail) || "Gagal mengambil status prediksi."
    throw new Error(typeof msg === "string" ? msg : "Gagal mengambil status prediksi.")
  }
  return data as ReplicatePrediction
}

// Output model video bisa berupa string URL, array URL, atau objek. Ambil URL video-nya.
export function extractVideoUrl(output: unknown): string | null {
  if (!output) return null
  if (typeof output === "string") return output
  if (Array.isArray(output)) {
    const last = output[output.length - 1]
    return typeof last === "string" ? last : null
  }
  if (typeof output === "object") {
    const obj = output as Record<string, unknown>
    for (const key of ["video", "url", "output"]) {
      if (typeof obj[key] === "string") return obj[key] as string
    }
  }
  return null
}
