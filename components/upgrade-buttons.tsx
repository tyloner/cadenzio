"use client"

import { useState } from "react"
import { Zap } from "lucide-react"

interface Props {
  userId: string
}

export function UpgradeButtons({ userId: _ }: Props) {
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function startCheckout(plan: "monthly" | "annual") {
    setLoading(plan)
    setError(null)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      if (res.ok) {
        const { url } = await res.json()
        window.location.href = url
      } else {
        setError("Could not start checkout. Please try again.")
      }
    } catch {
      setError("Network error. Check your connection and try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
          {error}
        </p>
      )}

      <button
        onClick={() => startCheckout("annual")}
        disabled={!!loading}
        className="w-full flex items-center justify-center gap-2 bg-wave text-white font-semibold rounded-xl py-3.5 text-sm hover:bg-wave/80 transition-colors disabled:opacity-60"
      >
        <Zap size={16} />
        {loading === "annual" ? "Redirecting…" : "Upgrade — €5 / month (annual)"}
      </button>

      <button
        onClick={() => startCheckout("monthly")}
        disabled={!!loading}
        className="w-full border border-border text-ink font-medium rounded-xl py-3 text-sm hover:bg-mist transition-colors disabled:opacity-60"
      >
        {loading === "monthly" ? "Redirecting…" : "Monthly — €7 / month"}
      </button>
    </div>
  )
}
