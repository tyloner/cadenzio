"use client"

import { useEffect } from "react"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <html>
      <body className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-mist font-sans">
        <p className="text-5xl mb-4">🎼</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">An unexpected error occurred. Your data is safe.</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-teal-500 text-white rounded-xl text-sm font-semibold hover:bg-teal-400 transition-colors"
        >
          Try again
        </button>
      </body>
    </html>
  )
}
