"use client"

import { useState } from "react"
import { Play, Lock } from "lucide-react"
import { FREE_LIMITS } from "@/lib/constants"

const NOTES = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4"]
const SCALES = [
  { value: "major",           label: "Major" },
  { value: "natural_minor",   label: "Minor" },
  { value: "blues",           label: "Blues" },
  { value: "pentatonic_major",label: "Pentatonic" },
  { value: "dorian",          label: "Dorian" },
  { value: "lydian",          label: "Lydian" },
]
const GENRES = [
  { value: "classical",  label: "Classical",  pro: false },
  { value: "blues",      label: "Blues",      pro: false },
  { value: "jazz",       label: "Jazz",       pro: true  },
  { value: "ambient",    label: "Ambient",    pro: true  },
  { value: "electronic", label: "Electronic", pro: true  },
]
const INSTRUMENTS = [
  { value: "piano",  label: "Piano",  emoji: "🎹", pro: false },
  { value: "synth",  label: "Synth",  emoji: "🎛️", pro: false },
  { value: "violin", label: "Violin", emoji: "🎻", pro: true  },
  { value: "drums",  label: "Drums",  emoji: "🥁", pro: true  },
]

interface Props {
  isPro: boolean
  onStart: (settings: { startingNote: string; scale: string; genre: string; title: string; instrument: string }) => void
}

export function PreRecordSettings({ isPro, onStart }: Props) {
  const [title, setTitle] = useState("")
  const [note, setNote] = useState("C4")
  const [scale, setScale] = useState("major")
  const [genre, setGenre] = useState("classical")
  const [instrument, setInstrument] = useState("piano")

  return (
    <div className="px-4 py-6 max-w-sm mx-auto">
      <h1 className="text-xl font-bold text-ink mb-1">New composition</h1>
      <p className="text-sm text-muted mb-8">Set up your walk before you start recording.</p>

      {/* Title */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-ink mb-2">Title</label>
        <input
          type="text"
          placeholder="Morning walk in the park…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-border rounded-xl px-4 py-3 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-wave/30"
        />
      </div>

      {/* Instrument */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-ink mb-2">Instrument</label>
        <div className="grid grid-cols-4 gap-2">
          {INSTRUMENTS.map((inst) => {
            const locked = inst.pro && !isPro
            return (
              <button
                key={inst.value}
                onClick={() => !locked && setInstrument(inst.value)}
                disabled={locked}
                className={`relative flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium border transition-colors ${
                  locked
                    ? "bg-mist text-muted border-border cursor-not-allowed opacity-60"
                    : instrument === inst.value
                    ? "bg-wave text-white border-wave"
                    : "bg-surface text-ink border-border hover:border-wave/50"
                }`}
              >
                {locked && <Lock size={10} className="absolute top-1.5 right-1.5 text-muted" />}
                <span className="text-xl">{inst.emoji}</span>
                {inst.label}
              </button>
            )
          })}
        </div>
        {!isPro && (
          <p className="text-xs text-muted mt-2">
            <Lock size={10} className="inline mr-1" />
            Violin &amp; Drums require{" "}
            <a href="/settings/upgrade" className="text-wave hover:underline">Pro</a>
          </p>
        )}
      </div>

      {/* Starting note */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-ink mb-2">Starting note</label>
        <div className="flex flex-wrap gap-2">
          {NOTES.map((n) => (
            <button
              key={n}
              onClick={() => setNote(n)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                note === n
                  ? "bg-wave text-white border-wave"
                  : "bg-surface text-ink border-border hover:border-wave/50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Scale */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-ink mb-2">Scale</label>
        <div className="grid grid-cols-3 gap-2">
          {SCALES.map((s) => (
            <button
              key={s.value}
              onClick={() => setScale(s.value)}
              className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                scale === s.value
                  ? "bg-wave text-white border-wave"
                  : "bg-surface text-ink border-border hover:border-wave/50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genre */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-ink mb-2">Genre</label>
        <div className="grid grid-cols-2 gap-2">
          {GENRES.map((g) => {
            const locked = g.pro && !isPro
            return (
              <button
                key={g.value}
                onClick={() => !locked && setGenre(g.value)}
                disabled={locked}
                className={`relative flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border transition-colors ${
                  locked
                    ? "bg-mist text-muted border-border cursor-not-allowed"
                    : genre === g.value
                    ? "bg-wave text-white border-wave"
                    : "bg-surface text-ink border-border hover:border-wave/50"
                }`}
              >
                {locked && <Lock size={12} className="absolute top-2 right-2 text-muted" />}
                {g.label}
              </button>
            )
          })}
        </div>
        {!isPro && (
          <p className="text-xs text-muted mt-2">
            <Lock size={10} className="inline mr-1" />
            Jazz, Ambient, Electronic require{" "}
            <a href="/settings/upgrade" className="text-wave hover:underline">Pro</a>
          </p>
        )}
      </div>

      {/* Free tier info */}
      {!isPro && (
        <div className="bg-beat/10 border border-beat/20 rounded-xl p-4 mb-6 text-sm text-beat">
          Free tier: recordings limited to {FREE_LIMITS.MAX_RECORDING_SECONDS / 60} minutes.
        </div>
      )}

      {/* Start */}
      <button
        onClick={() => onStart({ startingNote: note, scale, genre, title: title || "Untitled Walk", instrument })}
        className="w-full flex items-center justify-center gap-3 bg-beat text-white font-bold rounded-2xl py-4 text-base hover:bg-beat-dark transition-colors shadow-md"
      >
        <Play size={20} fill="white" />
        Start recording
      </button>
    </div>
  )
}
