"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export function GdprBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cadenz_gdpr")
    if (!consent) setVisible(true)
  }, [])

  function accept(analytics: boolean) {
    localStorage.setItem("cadenz_gdpr", JSON.stringify({ analytics, marketing: false, ts: Date.now() }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-slate flex-1">
          We use cookies to keep you signed in and improve your experience. Location data is only
          stored within your activity records.{" "}
          <Link href="/legal/privacy" className="text-wave underline">Privacy Policy</Link>
          {" · "}
          <Link href="/legal/terms" className="text-wave underline">Terms</Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => accept(false)}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-mist transition-colors"
          >
            Essential only
          </button>
          <button
            onClick={() => accept(true)}
            className="px-4 py-2 text-sm bg-wave text-white rounded-lg hover:bg-wave-dark transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
