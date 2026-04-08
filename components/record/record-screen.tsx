"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Square, Loader2, Music2, Navigation } from "lucide-react"
import { haversineDistance, computeBearing, formatDuration, formatDistance } from "@/lib/utils"
import { FREE_LIMITS } from "@/lib/constants"
import type { GpsPoint } from "@/lib/music-engine/gps-processor"
import { PreRecordSettings } from "./pre-record-settings"
import { useT } from "@/components/layout/language-provider"

const RecordMap = dynamic(() => import("./record-map"), { ssr: false })

type RecordState = "idle" | "recording" | "processing" | "done"

interface Props {
  isPro: boolean
  userId: string
  units?: "metric" | "imperial"
  usedSeconds?: number  // combined seconds already recorded (free tier)
}

// Exponential moving average for compass smoothing
const BEARING_ALPHA = 0.25 // lower = smoother, higher = more responsive

export function RecordScreen({ isPro, userId, units = "metric", usedSeconds = 0 }: Props) {
  const router = useRouter()
  const t = useT()
  const [state, setState] = useState<RecordState>("idle")
  const [settings, setSettings] = useState<{
    startingNote: string
    scale: string
    genre: string
    title: string
    instrument: string
  } | null>(null)

  const [points, setPoints] = useState<GpsPoint[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [distance, setDistance] = useState(0)
  const [bearing, setBearing] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const watchIdRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const smoothedBearingRef = useRef<number>(0)
  const stopRecordingRef = useRef<() => Promise<void>>(() => Promise.resolve())

  // Remaining seconds for free tier (combined across all recordings)
  const remainingSeconds = isPro ? Infinity : Math.max(0, FREE_LIMITS.MAX_RECORDING_SECONDS - usedSeconds)

  const stopRecording = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setState("processing")
    await saveActivity()
  }, [points, settings, distance, elapsed])

  useEffect(() => { stopRecordingRef.current = stopRecording }, [stopRecording])

  const startRecording = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.")
      return
    }
    if (!isPro && remainingSeconds <= 0) {
      setError("You've used your free recording allowance. Upgrade to Pro for unlimited recordings.")
      return
    }
    setState("recording")
    startTimeRef.current = Date.now()

    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setElapsed(secs)
      if (!isPro && secs >= remainingSeconds) {
        stopRecordingRef.current()
      }
    }, 1000)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const ts = pos.timestamp

        setPoints((prev) => {
          const next = [...prev, { lat, lng, timestamp: ts }]

          if (prev.length > 0) {
            const last = prev[prev.length - 1]
            setDistance((d) => d + haversineDistance(last.lat, last.lng, lat, lng))

            // Compute raw bearing then apply EMA for smoothing
            const rawBearing = computeBearing(last.lat, last.lng, lat, lng)
            // Handle wrap-around at 0/360
            let delta = rawBearing - smoothedBearingRef.current
            if (delta > 180) delta -= 360
            if (delta < -180) delta += 360
            const smoothed = (smoothedBearingRef.current + BEARING_ALPHA * delta + 360) % 360
            smoothedBearingRef.current = smoothed
            setBearing(smoothed)
          }

          return next
        })
      },
      (err) => setError(`GPS error: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    )
  }, [isPro, remainingSeconds])

  async function saveActivity() {
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: settings?.title || "Untitled Walk",
          gpsTrack: points,
          durationSec: elapsed,
          distanceM: distance,
          startingNote: settings?.startingNote ?? "C4",
          scale: settings?.scale ?? "major",
          genre: settings?.genre ?? "classical",
          instrument: settings?.instrument ?? "piano",
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      const { activityId, newlyRevealedChallenge } = await res.json()
      const dest = newlyRevealedChallenge
        ? `/activity/${activityId}?reveal=${newlyRevealedChallenge}`
        : `/activity/${activityId}`
      router.push(dest)
    } catch {
      setError("Could not save your activity. Please try again.")
      setState("recording")
    }
  }

  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Map */}
      <div className="flex-1 relative">
        {error && (
          <div className="absolute top-3 left-3 right-3 z-10 bg-beat text-white text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        <RecordMap points={points} />
      </div>

      {/* Recording HUD */}
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
                className="text-wave"
                style={{ transform: `rotate(${bearing}deg)`, transition: "transform 0.8s ease-out" }}
              />
              <p className="text-2xl font-bold text-ink">{Math.round(bearing)}°</p>
            </div>
            <p className="text-xs text-muted mt-0.5">{t("hud.bearing")}</p>
          </div>
        </div>

        {/* Genre badge */}
        <div className="flex justify-center mb-5">
          <span className="flex items-center gap-2 text-xs font-medium text-wave bg-wave/10 px-3 py-1.5 rounded-full">
            <Music2 size={12} />
            {settings?.genre} · {settings?.scale?.replace("_", " ")} · {settings?.startingNote}
          </span>
        </div>

        {/* Free tier progress */}
        {!isPro && (
          <div className="mb-4">
            <div className="h-1.5 bg-border rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-wave rounded-full transition-all"
                style={{ width: `${pctUsed * 100}%`, backgroundColor: pctUsed > 0.8 ? "#F97316" : "#14B8A6" }}
              />
            </div>
            <p className="text-xs text-muted text-center">
              {minsLeft > 0 ? t("hud.free.left", { n: minsLeft }) : t("hud.free.done")}
            </p>
          </div>
        )}

        {/* Stop button */}
        <button
          onClick={stopRecording}
          disabled={points.length < 5}
          className="w-full flex items-center justify-center gap-3 bg-beat text-white font-semibold rounded-2xl py-4 recording-pulse hover:bg-beat-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
        >
          <Square size={20} fill="white" />
          {t("hud.stop")}
        </button>
        {points.length < 5 && (
          <p className="text-xs text-muted text-center mt-2">{t("hud.wait")}</p>
        )}
      </div>
    </div>
  )
}
