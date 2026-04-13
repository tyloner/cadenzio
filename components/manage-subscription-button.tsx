"use client"

import { useState } from "react"
import { ExternalLink } from "lucide-react"

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function open() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      if (res.ok) {
        const { url } = await res.json()
        window.location.href = url
      } else {
        setError("Could not open billing portal. Try again.")
      }
    } catch {
      setError("Network error. Check your connection.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={open}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-medium text-wave border border-wave/40 rounded-xl px-3 py-2 hover:bg-wave/5 transition-colors disabled:opacity-50"
      >
        <ExternalLink size={12} />
        {loading ? "Opening…" : "Manage subscription"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
