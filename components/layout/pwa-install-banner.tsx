"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const STORAGE_KEY = "pwa-install-dismissed"

export function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Already installed or previously dismissed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      sessionStorage.getItem(STORAGE_KEY)
    ) return

    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall)
  }, [])

  function dismiss() {
    setVisible(false)
    sessionStorage.setItem(STORAGE_KEY, "1")
  }

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === "accepted") setVisible(false)
    else dismiss()
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50" style={{ animation: "slideUp 0.25s ease-out" }}>
      <div className="bg-surface border border-wave/30 rounded-2xl shadow-xl px-4 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-wave flex items-center justify-center flex-shrink-0">
          <Download size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">Add to Home Screen</p>
          <p className="text-xs text-muted">Install Cadenzio for the full experience</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={install}
            className="text-xs font-semibold text-white bg-wave rounded-lg px-3 py-1.5"
          >
            Install
          </button>
          <button onClick={dismiss} className="text-muted hover:text-ink p-1 transition-colors" aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
