"use client"

import { CREDIT_PACKAGES } from "@/lib/app"
import { IconCheck } from "./icons"

export default function BuyCredits({
  credits,
  buyingId,
  buyMessage,
  onBuy,
}: {
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
          Saldo saat ini: <span className="font-semibold text-white">{credits === null ? "..." : credits} kredit</span>. 1 kredit = 1 kali generate video atau gambar.
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
        {CREDIT_PACKAGES.map((pkg) => (
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
