"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * When Stripe redirects back to /settings?upgraded=1, the webhook may not
 * have fired yet so the page could still show "Free". This component
 * polls the server every 2s (max 5 attempts) and refreshes once the tier
 * flips to PRO, ensuring the settings page reflects the new plan promptly.
 */
export function UpgradeSuccessPoller({ currentTier }: { currentTier: string }) {
  const router = useRouter()

  useEffect(() => {
    if (currentTier === "PRO") return // already updated, no need to poll

    let attempts = 0
    const id = setInterval(async () => {
      attempts++
      try {
        const res = await fetch("/api/profile", { method: "GET" })
        if (res.ok) {
          const data = await res.json()
          if (data.tier === "PRO") {
            clearInterval(id)
            router.refresh()
          }
        }
      } catch { /* ignore */ }
      if (attempts >= 5) clearInterval(id)
    }, 2000)

    return () => clearInterval(id)
  }, [currentTier, router])

  return null
}
