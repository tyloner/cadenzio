"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff } from "lucide-react"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function PushSubscribe() {
  const [state, setState] = useState<"idle" | "subscribed" | "denied" | "unsupported">("idle")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported"); return
    }
    if (Notification.permission === "denied") { setState("denied"); return }
    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription()
        if (sub) setState("subscribed")
      })
    }
  }, [])

  async function subscribe() {
    setLoading(true)
    try {
      const keyRes = await fetch("/api/push/subscribe")
      const { publicKey } = await keyRes.json()
      if (!publicKey) return

      const reg = await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      if (permission !== "granted") { setState("denied"); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      })
      setState("subscribed")
    } catch (e) {
      console.error("Push subscribe failed", e)
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState("idle")
    } finally {
      setLoading(false)
    }
  }

  if (state === "unsupported") return null
  if (state === "denied") return (
    <p className="text-xs text-muted flex items-center gap-1.5">
      <BellOff size={13} /> Notifications blocked in browser settings
    </p>
  )

  return (
    <button
      onClick={state === "subscribed" ? unsubscribe : subscribe}
      disabled={loading}
      className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border transition-colors disabled:opacity-50 ${
        state === "subscribed"
          ? "border-border text-muted hover:bg-mist"
          : "border-wave text-wave hover:bg-wave/5"
      }`}
    >
      {state === "subscribed" ? <BellOff size={15} /> : <Bell size={15} />}
      {loading ? "…" : state === "subscribed" ? "Turn off notifications" : "Turn on notifications"}
    </button>
  )
}
