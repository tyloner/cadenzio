"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl mb-4">🎼</p>
      <h1 className="text-lg font-bold text-ink mb-2">Something went wrong</h1>
      <p className="text-sm text-muted mb-6 max-w-xs">An unexpected error occurred. Your data is safe.</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-wave text-white rounded-xl text-sm font-semibold hover:bg-wave/80 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 border border-border text-ink rounded-xl text-sm font-medium hover:bg-mist transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
