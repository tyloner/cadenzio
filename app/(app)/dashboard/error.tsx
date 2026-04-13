"use client"

import { useEffect } from "react"
import { Music2 } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-4">
      <Music2 size={40} className="text-border" />
      <p className="text-sm font-semibold text-ink">Could not load your feed</p>
      <p className="text-xs text-muted">Check your connection and try again.</p>
      <button
        onClick={reset}
        className="mt-2 px-5 py-2.5 bg-wave text-white text-sm font-semibold rounded-xl hover:bg-wave/80 transition-colors"
      >
        Retry
      </button>
    </div>
  )
}
