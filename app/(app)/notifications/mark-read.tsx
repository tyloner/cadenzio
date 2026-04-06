"use client"

import { useEffect } from "react"

export function MarkNotificationsRead() {
  useEffect(() => {
    fetch("/api/notifications/read", { method: "POST" }).catch(() => {})
  }, [])
  return null
}
