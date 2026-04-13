"use client"

import { useState, useEffect } from "react"
import { Bell, X } from "lucide-react"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function PushNudgeBanner() {
  const [supported, setSupported] = useState<boolean | null>(null) // null = not yet determined
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "denied">("idle")
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setSupported("serviceWorker" in navigator && "PushManager" in window)
  }, [])

  // Haven't checked yet (SSR / first paint) — render nothing to avoid hydration mismatch
  if (supported === null || !supported || dismissed || status === "done") return null

  async function enable() {
    setStatus("loading")
    try {
      const keyRes = await fetch("/api/push/subscribe")
      const { publicKey } = await keyRes.json()
      if (!publicKey) { setSupported(false); return }

      const reg = await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      if (permission !== "granted") { setStatus("denied"); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      })
      setStatus("done")
    } catch {
      setStatus("idle")
    }
  }

  if (status === "denied") return (
    <div className="mb-4 flex items-center gap-3 bg-mist border border-border rounded-xl px-4 py-3 text-xs text-muted">
      <Bell size={14} className="flex-shrink-0" />
      Notifications blocked — enable them in your browser settings, then revisit.
    </div>
  )

  return (
    <div className="mb-4 flex items-center gap-3 bg-wave/5 border border-wave/20 rounded-xl px-4 py-3">
      <Bell size={16} className="text-wave flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">Turn on push notifications</p>
        <p className="text-xs text-muted">Get notified the moment someone likes or comments.</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={enable}
          disabled={status === "loading"}
          className="text-xs font-semibold text-white bg-wave rounded-lg px-3 py-1.5 disabled:opacity-50"
        >
          {status === "loading" ? "…" : "Enable"}
        </button>
        <button onClick={() => setDismissed(true)} className="text-muted hover:text-ink p-1 transition-colors" aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
