"use client"

import { useState } from "react"
import { ChevronRight, Map, Music, Share2, Zap } from "lucide-react"

const SLIDES = [
  {
    icon: Map,
    color: "bg-wave/10 text-wave",
    title: "Your path becomes your melody",
    body: "As you walk or run, Cadenz.io reads your GPS direction and speed. Every turn you make shifts the musical note. Every pace change alters the rhythm.",
  },
  {
    icon: Music,
    color: "bg-beat/10 text-beat",
    title: "Choose your sound",
    body: "Set a starting note, pick a musical scale, and choose a genre before you go. Blues, classical, jazz — your walk will compose in that style.",
  },
  {
    icon: Share2,
    color: "bg-purple-100 text-purple-500",
    title: "Share your composition",
    body: "Each activity saves a map of your route and your unique audio composition. Share it with followers or keep it private — it's your music.",
  },
  {
    icon: Zap,
    color: "bg-amber-100 text-amber-500",
    title: "Ready to compose?",
    body: "Hit the Record button at any time to start. Your composition will be generated when you finish. No headphones required — just walk.",
  },
]

interface Props {
  userId: string
}

export function OnboardingCarousel({ userId }: Props) {
  const [slide, setSlide] = useState(0)
  const [closing, setClosing] = useState(false)

  async function finish() {
    setClosing(true)
    await fetch("/api/profile/onboarding", { method: "POST" })
  }

  if (closing) return null

  const current = SLIDES[slide]
  const Icon = current.icon
  const isLast = slide === SLIDES.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-surface w-full max-w-sm rounded-2xl p-8 shadow-2xl">
        {/* Progress dots */}
        <div className="flex gap-1.5 mb-8">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === slide ? "w-6 bg-wave" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${current.color}`}>
          <Icon size={26} />
        </div>

        {/* Content */}
        <h2 className="text-xl font-bold text-ink mb-3">{current.title}</h2>
        <p className="text-sm text-muted leading-relaxed mb-10">{current.body}</p>

        {/* CTA */}
        <button
          onClick={() => (isLast ? finish() : setSlide((s) => s + 1))}
          className="w-full flex items-center justify-center gap-2 bg-wave text-white font-semibold rounded-xl py-3.5 hover:bg-wave-dark transition-colors"
        >
          {isLast ? "Start composing" : "Next"}
          {!isLast && <ChevronRight size={18} />}
        </button>

        {!isLast && (
          <button
            onClick={finish}
            className="w-full text-center text-xs text-muted mt-4 hover:text-ink transition-colors"
          >
            Skip tutorial
          </button>
        )}
      </div>
    </div>
  )
}
