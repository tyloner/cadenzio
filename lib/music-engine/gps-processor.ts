import { haversineDistance, computeBearing } from "@/lib/utils"
import { buildScale, noteNameToMidi, GENRE_CONFIG, type ScaleName, type GenreName } from "./scales"

export interface GpsPoint {
  lat: number
  lng: number
  timestamp: number
}

export interface NoteEvent {
  note: number        // MIDI note number
  duration: string   // Tone.js duration string ("4n", "8n", etc.)
  time: number       // Seconds from track start
  velocity: number   // 0–1
  track: "lead" | "rhythm" | "pad"
}

const DURATION_MAP = [
  { maxSpeed: 0.5,  duration: "1n"  },
  { maxSpeed: 1.0,  duration: "2n"  },
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
  // Map -180..+180 to -scale/2..+scale/2
  const normalized = Math.max(-180, Math.min(180, delta))
  return Math.round((normalized / 180) * Math.floor(scaleLength / 2))
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

  const events: NoteEvent[] = []
  let currentIndex = startIndex >= 0 ? startIndex : Math.floor(scaleNotes.length / 2)
  let prevBearing: number | null = null
  let timeAccum = 0
  let rhythmCounter = 0

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]

    const dist = haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng)
    const dt = (curr.timestamp - prev.timestamp) / 1000
    if (dt <= 0) continue

    const speedMs = dist / dt
    const bearing = computeBearing(prev.lat, prev.lng, curr.lat, curr.lng)
    const duration = speedToDuration(speedMs)

    // Bearing delta drives note movement
    if (prevBearing !== null) {
      let delta = bearing - prevBearing
      if (delta > 180) delta -= 360
      if (delta < -180) delta += 360
      const step = bearingDeltaToStep(delta, scaleNotes.length)
      currentIndex = Math.max(0, Math.min(scaleNotes.length - 1, currentIndex + step))
    }
    prevBearing = bearing

    const note = scaleNotes[currentIndex]
    const velocity = Math.min(1, 0.5 + speedMs * 0.05)

    // Lead melody note
    events.push({ note, duration, time: timeAccum, velocity, track: "lead" })

    // Rhythm hit — genre-specific stride, velocity accent, and swing offset
    if (rhythmEnabled && speedMs > 1.5 && i % rhythmPattern.stride === 0) {
      const accentIdx = rhythmCounter % rhythmPattern.velocityAccent.length
      const velocity  = 0.8 * rhythmPattern.velocityAccent[accentIdx]
      // Swing: odd hits are pushed forward by a third-beat (~0.167 s at 0.5 s/step)
      const swingOffset = rhythmPattern.swing && rhythmCounter % 2 === 1 ? 0.167 : 0
      events.push({ note: 36, duration: "16n", time: timeAccum + swingOffset, velocity, track: "rhythm" })
      rhythmCounter++
    }

    // Pad chord every 8 events
    if (i % 8 === 0) {
      const padNote = scaleNotes[Math.max(0, currentIndex - 4)]
      events.push({ note: padNote, duration: "2n", time: timeAccum, velocity: 0.3, track: "pad" })
    }

    // Advance time by a musical step (normalized, not real-time)
    timeAccum += 0.5
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
  // Map 0..4 m/s to 60..160 BPM
  return Math.round(60 + Math.min(avg / 4, 1) * 100)
}
