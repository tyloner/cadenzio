// DEV ONLY — blocked in production at runtime
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { processGpsToNotes, estimateAvgBpm } from "@/lib/music-engine/gps-processor"

// Simulate a 20-minute walk around a city block
function generateMockGpsTrack() {
  const points = []
  const startLat = 48.8584   // Paris-ish
  const startLng = 2.2945
  const startTime = Date.now() - 20 * 60 * 1000 // 20 mins ago

  const waypoints = [
    [startLat,        startLng],
    [startLat + 0.003, startLng + 0.001],
    [startLat + 0.006, startLng - 0.001],
    [startLat + 0.009, startLng + 0.003],
    [startLat + 0.007, startLng + 0.006],
    [startLat + 0.003, startLng + 0.005],
    [startLat,        startLng + 0.002],
    [startLat,        startLng],
  ]

  let elapsed = 0
  for (let w = 0; w < waypoints.length - 1; w++) {
    const [lat1, lng1] = waypoints[w]
    const [lat2, lng2] = waypoints[w + 1]
    const steps = 30
    for (let s = 0; s < steps; s++) {
      const t = s / steps
      const lat = lat1 + (lat2 - lat1) * t + (Math.random() - 0.5) * 0.0002
      const lng = lng1 + (lng2 - lng1) * t + (Math.random() - 0.5) * 0.0002
      points.push({ lat, lng, timestamp: startTime + elapsed * 1000 })
      elapsed += 40 + Math.random() * 10 // ~40-50s per point
    }
  }
  return points
}

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const genres      = ["classical", "blues", "jazz", "ambient", "electronic"]
  const scales      = ["major", "natural_minor", "pentatonic_major", "blues", "dorian"]
  const notes       = ["C4", "D4", "E4", "F4", "G4", "A4"]
  const instruments = ["piano", "synth", "violin", "drums"]
  const genre       = genres[Math.floor(Math.random() * genres.length)]
  const instrument  = instruments[Math.floor(Math.random() * instruments.length)]
  const scale  = scales[Math.floor(Math.random() * scales.length)] as Parameters<typeof processGpsToNotes>[2]
  const startingNote = notes[Math.floor(Math.random() * notes.length)]

  const gpsTrack = generateMockGpsTrack()
  const midiEvents = processGpsToNotes(gpsTrack, startingNote, scale, true)
  const bpmAvg = estimateAvgBpm(gpsTrack)
  const durationSec = Math.round((gpsTrack[gpsTrack.length - 1].timestamp - gpsTrack[0].timestamp) / 1000)
  const titles = ["Evening Stroll", "Morning Walk", "City Loop", "Park Run", "Riverside Path", "Twilight Wander"]
  const title = titles[Math.floor(Math.random() * titles.length)]

  const activity = await db.activity.create({
    data: {
      userId: session.user.id,
      title,
      startedAt: new Date(gpsTrack[0].timestamp),
      endedAt: new Date(gpsTrack[gpsTrack.length - 1].timestamp),
      durationSec,
      distanceM: 2400 + Math.random() * 1600,
      gpsTrack,
      isPublic: true,
      composition: {
        create: {
          userId: session.user.id,
          startingNote,
          scale,
          genre,
          instrument,
          bpmAvg,
          midiEvents: midiEvents as object[],
          durationSec: Math.round(midiEvents[midiEvents.length - 1]?.time ?? durationSec),
        },
      },
    },
  })

  await db.profile.updateMany({
    where: { userId: session.user.id },
    data: { totalActivities: { increment: 1 }, totalDistance: { increment: 2400 } },
  })

  return NextResponse.json({ activityId: activity.id }, { status: 201 })
}
