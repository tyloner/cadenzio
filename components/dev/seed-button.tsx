"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FlaskConical } from "lucide-react"

export function SeedButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function seed() {
    setLoading(true)
    const res = await fetch("/api/dev/seed-activity", { method: "POST" })
    if (res.ok) {
      const { activityId } = await res.json()
      router.push(`/activity/${activityId}`)
    } else {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={seed}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs font-medium bg-beat/10 text-beat border border-beat/20 rounded-full px-3 py-1.5 hover:bg-beat/20 transition-colors disabled:opacity-60"
    >
      <FlaskConical size={12} />
      {loading ? "Generating…" : "Seed activity"}
    </button>
  )
}
