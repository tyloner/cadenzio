import { haversineDistance, computeBearing } from "@/lib/utils"
import { buildScale, noteNameToMidi, GENRE_CONFIG, type ScaleName, type GenreName } from "./scales"

export interface GpsPoint {
  lat: number
  lng: number
  timestamp: number
  heading?: number | null  // device compass heading (degrees, 0=N) when available
}

export interface NoteEvent {
  note: number        // MIDI note number
  duration: string   // Tone.js duration string ("4n", "8n", etc.)
  time: number       // Seconds from track start
  velocity: number   // 0–1
  track: "lead" | "rhythm" | "pad"
}

// Speed threshold below which user is considered "stopped"
const STOP_THRESHOLD_MS = 0.3  // m/s (~1 km/h)

const DURATION_MAP = [
  { maxSpeed: 0.5,  duration: "2n"  },
  { maxSpeed: 1.0,  duration: "4n"  },
  { maxSpeed: 1.8,  duration: "4n"  },
  { maxSpeed: 2.8,  duration: "8n"  },
  { maxSpeed: 4.0,  duration: "8n"  },
  { maxSpeed: Infinity, duration: "16n" },
]

function speedToDuration(speedMs: number): string {
  for (const entry of DURATION_MAP) {
    if (speedMs <= entry.maxSpeed) return entry.duration
  }
  return "16n"
}

function bearingDeltaToStep(delta: number, scaleLength: number): number {
  const normalized = Math.max(-180, Math.min(180, delta))
  return Math.round((normalized / 180) * Math.floor(scaleLength / 2))
}

// Seeded pseudo-random from GPS coords — deterministic per walk
function seededRand(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

export function processGpsToNotes(
  points: GpsPoint[],
  startingNote: string,
  scale: ScaleName,
  rhythmEnabled: boolean,
  genre: GenreName = "classical"
): NoteEvent[] {
  if (points.length < 2) return []

  const rootMidi = noteNameToMidi(startingNote)
  const scaleNotes = buildScale(rootMidi, scale)
  const startIndex = scaleNotes.indexOf(rootMidi) ?? Math.floor(scaleNotes.length / 2)
  const rhythmPattern = GENRE_CONFIG[genre].rhythmPattern
  const rand = seededRand(Math.round(points[0].lat * 1000 + points[0].lng * 1000))

  const events: NoteEvent[] = []
  let currentIndex = startIndex >= 0 ? startIndex : Math.floor(scaleNotes.length / 2)
  let prevBearing: number | null = null
  let timeAccum = 0
  let rhythmCounter = 0
  let noteCount = 0

  // Phrase shaping
  const PHRASE_LENGTH = 8
  let phraseDirection = 0
  let phraseSteps = 0

  // Stopped-time accumulator
  let stoppedDuration = 0

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]

    const dist = haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng)
    const dt = (curr.timestamp - prev.timestamp) / 1000
    if (dt <= 0) continue

    const speedMs = dist / dt

    // ── Stop / silence detection ──────────────────────────────────────────────
    if (speedMs < STOP_THRESHOLD_MS) {
      stoppedDuration += dt

      if (stoppedDuration > 5) {
        // Pure silence — advance timeline with a small rest gap and emit nothing
        timeAccum += 0.15
        continue
      }

      // Determine note duration from how long the user has been stopped
      const stoppedNote = scaleNotes[currentIndex]
      const stoppedVelocity = 0.25 + rand() * 0.1  // soft, trailing off
      const stoppedDur = stoppedDuration > 2 ? "1n" : "2n"

      // Emit one note per stop event but only if this is the first stopped step
      // (avoids flooding the track with sustained duplicate notes)
      if (stoppedDuration <= dt + 0.05) {
        events.push({ note: stoppedNote, duration: stoppedDur, time: timeAccum, velocity: stoppedVelocity, track: "lead" })
        noteCount++
      }

      timeAccum += 0.15
      continue
    }

    // User is moving — reset stop accumulator
    stoppedDuration = 0

    // ── Bearing resolution ────────────────────────────────────────────────────
    // Prefer device compass heading (more stable when walking slowly or turning)
    const bearing = curr.heading != null
      ? curr.heading
      : computeBearing(prev.lat, prev.lng, curr.lat, curr.lng)

    const duration = speedToDuration(speedMs)

    // Note movement from bearing change
    let step = 0
    if (prevBearing !== null) {
      let delta = bearing - prevBearing
      if (delta > 180) delta -= 360
      if (delta < -180) delta += 360
      step = bearingDeltaToStep(delta, scaleNotes.length)

      // Minimum drift when going straight
      if (Math.abs(delta) < 8) {
        step += phraseDirection !== 0 ? phraseDirection : (rand() > 0.5 ? 1 : -1)
      }
    } else {
      step = 1 + Math.floor(rand() * 2)
    }

    // Phrase-level shaping every PHRASE_LENGTH notes
    if (noteCount > 0 && noteCount % PHRASE_LENGTH === 0) {
      phraseDirection = phraseSteps % 2 === 0 ? 1 : -1
      if (rand() > 0.75) phraseDirection *= -1
      phraseSteps++
      step += phraseDirection * (3 + Math.floor(rand() * 3))
    }

    currentIndex = Math.max(0, Math.min(scaleNotes.length - 1, currentIndex + step))
    // Nudge away from range extremes
    if (currentIndex <= 2) currentIndex += 3
    if (currentIndex >= scaleNotes.length - 3) currentIndex -= 3

    const note = scaleNotes[currentIndex]
    const velocity = Math.min(0.9, Math.max(0.3, 0.3 + speedMs * 0.12))
    const stepDuration = speedMs < 1.0 ? 0.65 : speedMs < 2.0 ? 0.5 : 0.38

    events.push({ note, duration, time: timeAccum, velocity, track: "lead" })
    noteCount++

    if (rhythmEnabled && speedMs > 1.5 && i % rhythmPattern.stride === 0) {
      const accentIdx = rhythmCounter % rhythmPattern.velocityAccent.length
      const rVelocity = 0.8 * rhythmPattern.velocityAccent[accentIdx]
      const swingOffset = rhythmPattern.swing && rhythmCounter % 2 === 1 ? 0.167 : 0
      events.push({ note: 36, duration: "16n", time: timeAccum + swingOffset, velocity: rVelocity, track: "rhythm" })
      rhythmCounter++
    }

    if (i % 8 === 0) {
      const padIdx = Math.min(scaleNotes.length - 1, currentIndex + 2)
      events.push({ note: scaleNotes[padIdx], duration: "2n", time: timeAccum, velocity: 0.25 + rand() * 0.1, track: "pad" })
    }

    prevBearing = bearing
    timeAccum += stepDuration
  }

  return events
}

export function estimateAvgBpm(points: GpsPoint[]): number {
  if (points.length < 2) return 80
  const speeds: number[] = []
  for (let i = 1; i < points.length; i++) {
    const dist = haversineDistance(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng
    )
    const dt = (points[i].timestamp - points[i - 1].timestamp) / 1000
    if (dt > 0) speeds.push(dist / dt)
  }
  const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length
  return Math.round(60 + Math.min(avg / 4, 1) * 100)
}
