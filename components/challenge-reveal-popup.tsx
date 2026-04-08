"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { challengeDescription, challengeDescriptionJa, LEVELS } from "@/lib/levels"
import type { ChallengeId } from "@/lib/levels"
import { useT, useLang } from "@/components/layout/language-provider"

interface Props {
  challengeId: string
  activityId: string
}

export function ChallengeRevealPopup({ challengeId, activityId }: Props) {
  const router = useRouter()
  const t = useT()
  const lang = useLang()

  const id = challengeId as ChallengeId
  const level = LEVELS.find((l) => l.challengeId === id)

  function dismiss() {
    // Remove the ?reveal= param without reloading
    router.replace(`/activity/${activityId}`, { scroll: false })
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  if (!level) return null

  const desc = lang === "ja"
    ? challengeDescriptionJa(id)
    : challengeDescription(id)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="bg-surface rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl mb-3">{level.emoji}</div>
        <h2 className="text-xl font-bold text-ink mb-1">
          {t("level.reveal.title")}
        </h2>
        <p className={`text-sm font-semibold mb-3 ${level.textColor}`}>
          {level.name} {t("level.reveal.unlocked")}
        </p>
        <p className="text-sm text-muted mb-5 leading-relaxed">
          {t("level.reveal.sub")}
        </p>
        <div className="bg-mist border border-border rounded-xl px-4 py-3 mb-5 text-sm text-ink font-medium">
          {desc}
        </div>
        <button
          onClick={dismiss}
          className="w-full bg-wave text-white font-semibold rounded-xl py-3 text-sm hover:bg-wave/90 transition-colors"
          style={{ touchAction: "manipulation" }}
        >
          {t("level.reveal.cta")}
        </button>
      </div>
    </div>
  )
}
