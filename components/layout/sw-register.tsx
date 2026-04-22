"use client"

import { useEffect } from "react"

export function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // When a new SW installs, reload so users always run the latest version
      reg.addEventListener("updatefound", () => {
        const next = reg.installing
        if (!next) return
        next.addEventListener("statechange", () => {
          if (next.state === "installed" && navigator.serviceWorker.controller) {
            window.location.reload()
          }
        })
      })
    }).catch(() => {})
  }, [])

  return null
}
