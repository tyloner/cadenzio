"use client"

import { useEffect } from "react"

export function MarkNotificationsRead() {
  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/notifications/read", { method: "POST", signal: controller.signal }).catch(() => {})
    return () => controller.abort()
  }, [])
  return null
}
