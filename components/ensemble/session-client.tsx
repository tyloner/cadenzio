"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { MapPin, Users, Play, CheckCircle, Clock, Loader2, Radio } from "lucide-react"
import { INSTRUMENT_CONFIG, type InstrumentName, type ScaleName } from "@/lib/music-engine/scales"

const INSTRUMENTS: InstrumentName[] = ["piano", "violin", "synth", "drums"]
const MAX_SECONDS = 120

interface Member {
  userId: string
  role: string
  user: { id: string; name: string | null; image: string | null }
}

interface LobbyState {
  session: { id: string; status: string; scales: string[]; startedAt: string | null; hostId: string }
  members: Member[]
  locations: { userId: string; user: { id: string; name: string | null; image: string | null }; lat: number; lng: number }[]
  proximityOk: boolean
  nearbyUserIds: string[]
  submittedIds: string[]
}

interface Props {
  sessionId: string
  ensembleId: string
  currentUserId: string
  hostId: string
  scales: string[]
  members: Member[]
  initialStatus: string
}

type GpsPoint = { lat: number; lng: number; timestamp: number }

export function EnsembleSessionClient({
  sessionId,
  ensembleId,
  currentUserId,
  hostId,
  scales,
  members,
  initialStatus,
}: Props) {
  const router = useRouter()
  const isHost = currentUserId === hostId

  const [status, setStatus] = useState(initialStatus)
  const [lobby, setLobby] = useState<LobbyState | null>(null)
  const [instrument, setInstrument] = useState<InstrumentName>("piano")
  const [scale, setScale] = useState<ScaleName>((scales[0] ?? "major") as ScaleName)
  const [startingNote, setStartingNote] = useState("C4")

  const [timeLeft, setTimeLeft] = useState(MAX_SECONDS)
  const [recording, setRecording] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [startError, setStartError] = useState("")

  const gpsRef = useRef<GpsPoint[]>([])
  const watchRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Refs for stale-closure-safe access inside poll/timer intervals
  const recordingRef = useRef(false)
  const submittedRef = useRef(false)
  // Stable ref to submitTrack so the countdown interval always calls the latest version
  const submitTrackRef = useRef<() => Promise<void>>(async () => {})

  // Keep refs in sync with state
  useEffect(() => { recordingRef.current = recording }, [recording])
  useEffect(() => { submittedRef.current = submitted }, [submitted])

  // Push location to server — stable ref, never changes
  const pushLocation = useCallback((lat: number, lng: number) => {
    fetch(`/api/ensemble/${ensembleId}/session/${sessionId}/location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    }).catch(() => { /* best-effort */ })
  }, [ensembleId, sessionId])

  // Poll lobby state every 3s — uses refs to avoid stale closures
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/ensemble/${ensembleId}/session/${sessionId}/lobby`)
      if (!res.ok) return
      const data: LobbyState = await res.json()
      setLobby(data)
      setStatus(data.session.status)

      // If session just became ACTIVE, start recording
      if (data.session.status === "ACTIVE" && !recordingRef.current && !submittedRef.current) {
        startRecording()
      }
      // If completed, redirect to result
      if (data.session.status === "COMPLETED") {
        router.push(`/ensemble/${ensembleId}/session/${sessionId}/result`)
      }
    } catch { /* ignore */ }
  }, [ensembleId, sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    poll()
    pollRef.current = setInterval(poll, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [poll])

  // Single geolocation watch — only mount once, use ref for recording state
  useEffect(() => {
    if (!navigator.geolocation) return
    // Clear any previous watch before setting a new one
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        pushLocation(lat, lng)
        if (recordingRef.current) {
          gpsRef.current.push({ lat, lng, timestamp: Date.now() })
        }
      },
      () => { /* ignore errors */ },
      { enableHighAccuracy: true, maximumAge: 2000 }
    )
    return () => { if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current) }
  }, [pushLocation]) // removed `recording` — now uses recordingRef instead

  function startRecording() {
    // Guard: if already recording (ref is source of truth), do nothing
    // This prevents the poll re-triggering startRecording before the useEffect fires
    if (recordingRef.current || timerRef.current) return
    // Update ref synchronously so the next poll cycle sees it immediately
    recordingRef.current = true
    setRecording(true)
    setTimeLeft(MAX_SECONDS)
    gpsRef.current = []
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Call via ref so we always get the latest submitTrack closure
          submitTrackRef.current()
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  async function triggerStart() {
    setStartError("")
    const res = await fetch(`/api/ensemble/${ensembleId}/session/${sessionId}/start`, { method: "POST" })
    const data = await res.json()
    if (!res.ok) { setStartError(data.error ?? "Failed"); return }
    // Poll will pick up ACTIVE status
  }

  submitTrackRef.current = submitTrack
  async function submitTrack() {
    if (submittedRef.current || submitting) return
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setRecording(false)
    setSubmitting(true)

    const points = gpsRef.current
    const genre = "classical"

    const res = await fetch(`/api/ensemble/${ensembleId}/session/${sessionId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gpsPoints: points, instrument, scale, startingNote, genre }),
    })

    setSubmitting(false)
    if (res.ok) {
      submittedRef.current = true
      setSubmitted(true)
      const data = await res.json()
      if (data.allSubmitted) {
        router.push(`/ensemble/${ensembleId}/session/${sessionId}/result`)
      }
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (pollRef.current) clearInterval(pollRef.current)
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`

  // ── ACTIVE / recording UI ──────────────────────────────────────────────────
  if (status === "ACTIVE") {
    return (
      <div className="px-4 py-6 flex flex-col min-h-[80vh]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <Radio size={18} className="text-red-500 animate-pulse" /> Recording
          </h1>
          <div className="text-2xl font-mono font-bold text-ink tabular-nums">{fmt(timeLeft)}</div>
        </div>

        {/* Member status */}
        <div className="flex gap-3 mb-6">
          {members.map((m) => {
            const hasSubmitted = lobby?.submittedIds.includes(m.userId)
            return (
              <div key={m.userId} className="flex flex-col items-center gap-1">
                <div className="relative">
                  {m.user.image ? (
                    <Image src={m.user.image} alt={m.user.name ?? ""} width={40} height={40} className="rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-wave/20 flex items-center justify-center text-sm font-bold text-wave">
                      {(m.user.name ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  {hasSubmitted && (
                    <CheckCircle size={14} className="text-wave fill-white absolute -bottom-0.5 -right-0.5" />
                  )}
                </div>
                <span className="text-[10px] text-muted">{m.user.name?.split(" ")[0]}</span>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-border rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-red-500 rounded-full transition-all"
            style={{ width: `${((MAX_SECONDS - timeLeft) / MAX_SECONDS) * 100}%` }}
          />
        </div>

        <div className="bg-mist rounded-xl p-4 mb-4 flex items-center gap-3">
          <MapPin size={16} className="text-wave flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-ink">Walking and recording</p>
            <p className="text-muted text-xs mt-0.5">
              {INSTRUMENT_CONFIG[instrument].emoji} {instrument} · {scale.replace(/_/g, " ")} · {startingNote}
            </p>
          </div>
        </div>

        {!submitted && !submitting && (
          <button
            onClick={submitTrack}
            className="mt-auto w-full bg-wave text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} /> Submit My Track Early
          </button>
        )}
        {submitting && (
          <div className="mt-auto flex items-center justify-center gap-2 text-muted py-4">
            <Loader2 size={18} className="animate-spin" /> Submitting…
          </div>
        )}
        {submitted && (
          <div className="mt-auto flex items-center justify-center gap-2 text-wave py-4 font-semibold">
            <CheckCircle size={18} /> Submitted — waiting for others…
          </div>
        )}
      </div>
    )
  }

  // ── LOBBY UI ──────────────────────────────────────────────────────────────
  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-ink flex items-center gap-2 mb-1">
        <Users size={18} className="text-wave" /> Lobby
      </h1>
      <p className="text-xs text-muted mb-6">Get within 50m of each other, then the host starts</p>

      {/* Instrument picker */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-ink mb-2">Your instrument</p>
        <div className="grid grid-cols-4 gap-2">
          {INSTRUMENTS.map((inst) => (
            <button
              key={inst}
              onClick={() => setInstrument(inst)}
              className={`flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-semibold transition-colors ${
                instrument === inst ? "bg-wave text-white" : "bg-mist text-ink"
              }`}
            >
              <span className="text-lg">{INSTRUMENT_CONFIG[inst].emoji}</span>
              <span className="capitalize">{inst}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scale + note */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <p className="text-xs font-semibold text-ink mb-1.5">Scale</p>
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value as ScaleName)}
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-wave bg-surface"
          >
            {(scales.length > 0 ? scales : ["major", "natural_minor"]).map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-xs font-semibold text-ink mb-1.5">Starting note</p>
          <select
            value={startingNote}
            onChange={(e) => setStartingNote(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-wave bg-surface"
          >
            {["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4"].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Proximity status */}
      <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${
        lobby?.proximityOk ? "bg-green-50 border border-green-200" : "bg-mist"
      }`}>
        <MapPin size={18} className={lobby?.proximityOk ? "text-green-600" : "text-muted"} />
        <div className="flex-1">
          <p className={`text-sm font-semibold ${lobby?.proximityOk ? "text-green-700" : "text-ink"}`}>
            {lobby?.proximityOk ? "Close enough! Ready to start" : "Waiting for proximity…"}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {lobby?.locations.length ?? 0} of {members.length} members located
          </p>
        </div>
        {!lobby?.proximityOk && <Loader2 size={16} className="text-muted animate-spin" />}
      </div>

      {/* Member list */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {members.map((m) => {
          const located = lobby?.locations.some((l) => l.userId === m.userId)
          const nearby = lobby?.nearbyUserIds.includes(m.userId)
          return (
            <div key={m.userId} className="flex flex-col items-center gap-1">
              <div className="relative">
                {m.user.image ? (
                  <Image src={m.user.image} alt={m.user.name ?? ""} width={44} height={44} className="rounded-full" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-wave/20 flex items-center justify-center text-sm font-bold text-wave">
                    {(m.user.name ?? "?")[0].toUpperCase()}
                  </div>
                )}
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  nearby ? "bg-green-500" : located ? "bg-yellow-400" : "bg-gray-300"
                }`} />
              </div>
              <span className="text-[10px] text-muted">{m.user.name?.split(" ")[0]}</span>
            </div>
          )
        })}
      </div>

      {/* Session timer hint */}
      <div className="flex items-center gap-2 text-xs text-muted mb-6">
        <Clock size={13} />
        Sessions are capped at 2 minutes
      </div>

      {/* Start button (host only) */}
      {isHost && (
        <div>
          <button
            onClick={triggerStart}
            disabled={!lobby?.proximityOk}
            className="w-full flex items-center justify-center gap-2 bg-wave text-white rounded-xl py-4 font-semibold text-sm disabled:opacity-40"
          >
            <Play size={18} /> Start Walk
          </button>
          {startError && <p className="text-xs text-red-500 text-center mt-2">{startError}</p>}
          {!lobby?.proximityOk && (
            <p className="text-xs text-muted text-center mt-2">
              At least 2 members must be within 50m to start
            </p>
          )}
        </div>
      )}
      {!isHost && (
        <div className="text-center text-sm text-muted py-4">
          Waiting for the host to start…
        </div>
      )}
    </div>
  )
}
