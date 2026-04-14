"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Square, Loader2, Music2, Navigation, Pause, Play, Trash2, Compass } from "lucide-react"
import { haversineDistance, computeBearing, formatDuration, formatDistance } from "@/lib/utils"
import { FREE_LIMITS } from "@/lib/constants"
import type { GpsPoint } from "@/lib/music-engine/gps-processor"
import { PreRecordSettings } from "./pre-record-settings"
import { useT } from "@/components/layout/language-provider"

type ClueRing = "hot" | "warm" | "cold" | "freezing"
const CLUE_COLORS: Record<ClueRing, string> = {
  hot:      "bg-red-100 text-red-700 border-red-300",
  warm:     "bg-orange-100 text-orange-700 border-orange-300",
  cold:     "bg-blue-100 text-blue-700 border-blue-300",
  freezing: "bg-slate-100 text-slate-600 border-slate-300",
}

const RecordMap = dynamic(() => import("./record-map"), { ssr: false })

type RecordState = "idle" | "recording" | "paused" | "processing"

interface Props {
  isPro: boolean
  userId: string
  units?: "metric" | "imperial"
  usedSeconds?: number
}

const BEARING_ALPHA = 0.25

export function RecordScreen({ isPro, userId, units = "metric", usedSeconds = 0 }: Props) {
  const router = useRouter()
  const t = useT()
  const [state, setState] = useState<RecordState>("idle")
  const [settings, setSettings] = useState<{
    startingNote: string; scale: string; genre: string; title: string; instrument: string
  } | null>(null)

  const [points, setPoints]       = useState<GpsPoint[]>([])
  const [elapsed, setElapsed]     = useState(0)
  const [distance, setDistance]   = useState(0)
  const [bearing, setBearing]     = useState(0)
  const [error, setError]         = useState<string | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  // Hidden note clue
  const [clueLabel, setClueLabel]   = useState<string | null>(null)
  const [clueRing, setClueRing]     = useState<ClueRing | null>(null)
  const [noteEmoji, setNoteEmoji]   = useState<string>("🎵")
  const [noteCaptured, setNoteCaptured] = useState(false)
  const clueThrottleRef = useRef(0)

  const watchIdRef          = useRef<number | null>(null)
  const timerRef            = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef        = useRef<number>(0)        // wall-clock when last (re)started
  const elapsedAtPauseRef   = useRef<number>(0)        // accumulated secs before last pause
  const smoothedBearingRef  = useRef<number>(0)
  const lastHeadingRef      = useRef<number | null>(null) // last known device compass heading
  const wakeLockRef         = useRef<WakeLockSentinel | null>(null)

  // Stable refs so callbacks don't go stale
  const stateRef    = useRef<RecordState>("idle")
  const pointsRef   = useRef<GpsPoint[]>([])
  const settingsRef = useRef(settings)
  const distanceRef = useRef(0)
  const elapsedRef  = useRef(0)

  useEffect(() => { stateRef.current = state },    [state])
  useEffect(() => { pointsRef.current = points },  [points])
  useEffect(() => { settingsRef.current = settings }, [settings])
  useEffect(() => { distanceRef.current = distance }, [distance])
  useEffect(() => { elapsedRef.current = elapsed },   [elapsed])

  // Fetch hidden note status on mount (just to show emoji + whether already captured)
  useEffect(() => {
    fetch("/api/hidden-note")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.available) return
        if (data.captured) { setNoteCaptured(true); return }
        setNoteEmoji(data.emoji ?? "🎵")
        setClueLabel("A hidden note is nearby — find it on your walk")
        setClueRing("cold")
      })
      .catch(() => {})
  }, [])

  // Update clue ring on GPS movement (throttled to once every 15s)
  useEffect(() => {
    if (points.length === 0) return
    if (noteCaptured) return
    const now = Date.now()
    if (now - clueThrottleRef.current < 15_000) return
    clueThrottleRef.current = now
    const last = points[points.length - 1]
    fetch("/api/hidden-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: last.lat, lng: last.lng }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.available) return
        if (data.captured) { setNoteCaptured(true); setClueLabel("Note collected!"); setClueRing("hot"); return }
        if (data.clue) { setClueLabel(data.clue.label); setClueRing(data.clue.ring) }
      })
      .catch(() => {})
  }, [points, noteCaptured])

  const remainingSeconds = isPro ? Infinity : Math.max(0, FREE_LIMITS.MAX_RECORDING_SECONDS - usedSeconds)

  // ── Wake Lock ──────────────────────────────────────────────────────────────
  const requestWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator)) return
    try {
      wakeLockRef.current = await (navigator.wakeLock as WakeLock).request("screen")
    } catch { /* denied or unsupported — silent */ }
  }, [])

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {})
    wakeLockRef.current = null
  }, [])

  // Re-acquire wake lock if the screen came back on while recording
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && stateRef.current === "recording") {
        requestWakeLock()
      }
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [requestWakeLock])

  // ── GPS watch (shared between start and resume) ────────────────────────────
  const startGpsWatch = useCallback(() => {
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const ts = pos.timestamp
        // Use device compass heading when available — more stable than computed bearing
        const deviceHeading = pos.coords.heading != null && !isNaN(pos.coords.heading)
          ? pos.coords.heading
          : null
        if (deviceHeading !== null) lastHeadingRef.current = deviceHeading

        setPoints((prev) => {
          const next = [...prev, { lat, lng, timestamp: ts, heading: deviceHeading ?? lastHeadingRef.current }]

          if (prev.length > 0) {
            const last = prev[prev.length - 1]
            setDistance((d) => d + haversineDistance(last.lat, last.lng, lat, lng))

            // Prefer device heading for compass display; fall back to computed bearing
            const rawBearing = deviceHeading != null
              ? deviceHeading
              : computeBearing(last.lat, last.lng, lat, lng)

            let delta = rawBearing - smoothedBearingRef.current
            if (delta > 180)  delta -= 360
            if (delta < -180) delta += 360
            const smoothed = (smoothedBearingRef.current + BEARING_ALPHA * delta + 360) % 360
            smoothedBearingRef.current = smoothed
            setBearing(smoothed)
          }
          return next
        })
      },
      (err) => setError(`GPS error: ${err.message}`),
      // timeout: 30s — longer than default so a brief screen-off doesn't kill the watch
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 30000 }
    )
  }, [])

  // ── Timer ──────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - elapsedAtPauseRef.current * 1000
    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setElapsed(secs)
      if (!isPro && secs >= remainingSeconds) {
        // Time's up — stop automatically (use refs to avoid stale closure)
        stopRecordingRef.current()
      }
    }, 1000)
  }, [isPro, remainingSeconds])

  // ── Start recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!navigator.geolocation) { setError("Geolocation is not supported."); return }
    if (!isPro && remainingSeconds <= 0) {
      setError("Free recording allowance used. Upgrade to Pro for unlimited recordings.")
      return
    }
    elapsedAtPauseRef.current = 0
    setState("recording")
    startTimer()
    startGpsWatch()
    requestWakeLock()
  }, [isPro, remainingSeconds, startTimer, startGpsWatch, requestWakeLock])

  // ── Pause recording ────────────────────────────────────────────────────────
  const pauseRecording = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    elapsedAtPauseRef.current = elapsedRef.current
    releaseWakeLock()
    setState("paused")
  }, [releaseWakeLock])

  // ── Resume recording ───────────────────────────────────────────────────────
  const resumeRecording = useCallback(() => {
    setState("recording")
    startTimer()
    startGpsWatch()
    requestWakeLock()
  }, [startTimer, startGpsWatch, requestWakeLock])

  // ── Stop & compose ─────────────────────────────────────────────────────────
  const stopRecording = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    releaseWakeLock()
    setState("processing")
    await saveActivity()
  }, [releaseWakeLock]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Discard recording ──────────────────────────────────────────────────────
  const discardRecording = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    releaseWakeLock()
    // Reset all state back to idle
    setPoints([])
    setElapsed(0)
    setDistance(0)
    setBearing(0)
    setError(null)
    setConfirmDiscard(false)
    elapsedAtPauseRef.current = 0
    setState("idle")
  }, [releaseWakeLock])

  // Keep a stable ref for the auto-stop timer callback
  const stopRecordingRef = useRef(stopRecording)
  useEffect(() => { stopRecordingRef.current = stopRecording }, [stopRecording])

  async function saveActivity() {
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: settingsRef.current?.title || "Andante Walk",
          gpsTrack: pointsRef.current,
          durationSec: elapsedRef.current,
          distanceM: distanceRef.current,
          startingNote: settingsRef.current?.startingNote ?? "C4",
          scale: settingsRef.current?.scale ?? "major",
          genre: settingsRef.current?.genre ?? "classical",
          instrument: settingsRef.current?.instrument ?? "piano",
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      const { activityId, newlyRevealedChallenge, capturedNoteKey } = await res.json()
      if (capturedNoteKey) { setNoteCaptured(true) }
      router.push(newlyRevealedChallenge
        ? `/activity/${activityId}?reveal=${newlyRevealedChallenge}`
        : `/activity/${activityId}`)
    } catch {
      setError("Could not save your activity. Please try again.")
      setState("recording")
      startTimer()
      startGpsWatch()
      requestWakeLock()
    }
  }

  // Cleanup on unmount
  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    releaseWakeLock()
  }, [releaseWakeLock])

  // ── Screens ────────────────────────────────────────────────────────────────
  if (state === "idle") {
    return (
      <PreRecordSettings
        isPro={isPro}
        onStart={(s) => { setSettings(s); startRecording() }}
      />
    )
  }

  if (state === "processing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center px-6">
        <Loader2 size={40} className="text-wave animate-spin" />
        <h2 className="text-lg font-semibold text-ink">{t("hud.composing")}</h2>
        <p className="text-sm text-muted">{t("hud.processing", { n: points.length, genre: settings?.genre ?? "" })}</p>
      </div>
    )
  }

  const pctUsed = !isPro ? Math.min(1, elapsed / remainingSeconds) : 0
  const minsLeft = Math.max(0, Math.round((remainingSeconds - elapsed) / 60))
  const isPaused = state === "paused"
  const canStop = points.length >= 5

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Map */}
      <div className="flex-1 relative">
        {error && (
          <div className="absolute top-3 left-3 right-3 z-10 bg-beat text-white text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        {isPaused && (
          <div className="absolute inset-0 z-10 bg-ink/40 flex items-center justify-center pointer-events-none">
            <div className="bg-surface/90 rounded-2xl px-6 py-4 flex items-center gap-3">
              <Pause size={20} className="text-wave" />
              <span className="font-semibold text-ink">Paused — silence in composition</span>
            </div>
          </div>
        )}
        <RecordMap points={points} />
      </div>

      {/* HUD */}
      <div className="bg-surface border-t border-border px-6 py-5">
        {/* Stats */}
        <div className="flex justify-around mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold font-mono text-ink">{formatDuration(elapsed)}</p>
            <p className="text-xs text-muted mt-0.5">{t("hud.duration")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-ink">{formatDistance(distance, units)}</p>
            <p className="text-xs text-muted mt-0.5">{t("hud.distance")}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Navigation
                size={20}
                className={isPaused ? "text-muted" : "text-wave"}
                style={{ transform: `rotate(${bearing}deg)`, transition: "transform 0.8s ease-out" }}
              />
              <p className="text-2xl font-bold text-ink">{Math.round(bearing)}°</p>
            </div>
            <p className="text-xs text-muted mt-0.5">{t("hud.bearing")}</p>
          </div>
        </div>

        {/* Genre badge */}
        <div className="flex justify-center mb-3">
          <span className="flex items-center gap-2 text-xs font-medium text-wave bg-wave/10 px-3 py-1.5 rounded-full">
            <Music2 size={12} />
            {settings?.genre} · {settings?.scale?.replace("_", " ")} · {settings?.startingNote}
          </span>
        </div>

        {/* Hidden note clue chip */}
        {clueLabel && clueRing && (
          <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border mb-3 ${CLUE_COLORS[clueRing]}`}>
            <span>{noteEmoji}</span>
            <span className="flex-1">{noteCaptured ? "✓ Note collected!" : clueLabel}</span>
            {!noteCaptured && <Compass size={13} className="flex-shrink-0 opacity-60" />}
          </div>
        )}

        {/* Free tier progress */}
        {!isPro && (
          <div className="mb-4">
            <div className="h-1.5 bg-border rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pctUsed * 100}%`,
                  backgroundColor: pctUsed > 0.8 ? "#F97316" : "#14B8A6"
                }}
              />
            </div>
            <p className="text-xs text-muted text-center">
              {minsLeft > 0 ? t("hud.free.left", { n: minsLeft }) : t("hud.free.done")}
            </p>
          </div>
        )}

        {/* Controls: Pause/Resume + Stop + Discard (when paused) */}
        <div className="flex gap-3">
          {/* Pause / Resume */}
          <button
            onClick={isPaused ? resumeRecording : pauseRecording}
            className="flex items-center justify-center gap-2 border border-wave text-wave font-semibold rounded-2xl py-4 px-5 hover:bg-wave/5 transition-colors"
            style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
            aria-label={isPaused ? "Resume recording" : "Pause recording"}
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>

          {/* Stop & Compose */}
          <button
            onClick={stopRecording}
            disabled={!canStop}
            className="flex-1 flex items-center justify-center gap-3 bg-wave text-white font-semibold rounded-2xl py-4 hover:bg-wave/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
          >
            <Square size={20} fill="white" />
            {t("hud.stop")}
          </button>

          {/* Discard — only visible when paused */}
          {isPaused && (
            <button
              onClick={() => setConfirmDiscard(true)}
              className="flex items-center justify-center border border-red-300 text-red-500 rounded-2xl py-4 px-5 hover:bg-red-50 transition-colors"
              style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
              aria-label="Discard recording"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        {/* Discard confirmation modal */}
        {confirmDiscard && (
          <div className="fixed inset-0 z-50 bg-ink/60 flex items-end sm:items-center justify-center p-4">
            <div className="bg-surface rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-ink text-center mb-2">Cancel recording?</h2>
              <p className="text-sm text-muted text-center mb-6">
                Your walk and all recorded GPS data will be permanently discarded. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDiscard(false)}
                  className="flex-1 border border-border text-ink font-semibold rounded-xl py-3 hover:bg-mist transition-colors"
                >
                  Keep recording
                </button>
                <button
                  onClick={discardRecording}
                  className="flex-1 bg-red-500 text-white font-semibold rounded-xl py-3 hover:bg-red-600 transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {!canStop && (
          <p className="text-xs text-muted text-center mt-2">{t("hud.wait")}</p>
        )}
      </div>
    </div>
  )
}
