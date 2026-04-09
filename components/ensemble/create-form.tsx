"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"

export function EnsembleCreateForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/ensemble", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "Failed"); return }
    setOpen(false)
    setName("")
    router.push(`/ensemble/${data.id}`)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-semibold text-white bg-wave rounded-xl px-3 py-2"
      >
        <Plus size={16} /> New
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-2xl bg-surface rounded-t-2xl p-6 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-ink text-lg">New Ensemble</h2>
          <button onClick={() => setOpen(false)}><X size={20} className="text-muted" /></button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ensemble name…"
            maxLength={40}
            className="border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-wave"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="bg-wave text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40"
          >
            {loading ? "Creating…" : "Create Ensemble"}
          </button>
        </form>
      </div>
    </div>
  )
}
