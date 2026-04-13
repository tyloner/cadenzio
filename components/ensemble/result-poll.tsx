"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Polls by refreshing the server component every 4 seconds until the composition appears. */
export function ResultPoll() {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 4000)
    return () => clearInterval(id)
  }, [router])
  return null
}
