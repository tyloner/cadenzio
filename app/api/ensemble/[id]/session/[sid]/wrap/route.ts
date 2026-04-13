import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { processGpsToNotes, estimateAvgBpm, type GpsPoint } from "@/lib/music-engine/gps-processor"
import { SCALES, GENRE_CONFIG, type ScaleName, type GenreName } from "@/lib/music-engine/scales"
import { finalizeSession } from "@/lib/ensemble/finalize-session"

const MAX_SESSION_SECONDS = 120

// POST /api/ensemble/[id]/session/[sid]/wrap
// Host-only: end the session immediately with whatever data has been collected.
// Upserts the host's own track, creates silent tracks for members who haven't submitted,
// then finalizes so every member's contribution (however small) is included.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id
    const { id: ensembleId, sid: sessionId } = await params
  
    const [ensSession, ensemble] = await Promise.all([
      db.ensembleSession.findUnique({
        where: { id: sessionId, ensembleId },
        include: { tracks: true },
      }),
      db.ensemble.findUnique({
        where: { id: ensembleId },
        include: { members: true },
      }),
    ])
  
    if (!ensSession || !ensemble) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (ensSession.hostId !== userId) return NextResponse.json({ error: "Only the host can wrap up the session" }, { status: 403 })
    if (ensSession.status !== "ACTIVE") return NextResponse.json({ error: "Session is not active" }, { status: 400 })
  
    const { gpsPoints, instrument, scale, startingNote, genre } = await req.json()
  
    // Upsert host's own track (may have GPS data or may be empty if they didn't walk)
    const hostGps: GpsPoint[] = Array.isArray(gpsPoints) ? gpsPoints : []
    let hostPoints = hostGps
    if (ensSession.startedAt && hostPoints.length > 0) {
      const capMs = ensSession.startedAt.getTime() + MAX_SESSION_SECONDS * 1000
      hostPoints = hostGps.filter((p) => p.timestamp <= capMs)
      if (hostPoints.length < 2) hostPoints = hostGps.slice(0, 2)
    }
  
    const validScale = typeof scale === "string" && scale in SCALES ? (scale as ScaleName) : "major"
    const validGenre: GenreName = typeof genre === "string" && genre in GENRE_CONFIG ? (genre as GenreName) : "classical"
    const rhythmEnabled = GENRE_CONFIG[validGenre].rhythm
  
    const hostMidi = hostPoints.length >= 2
      ? processGpsToNotes(hostPoints, startingNote ?? "C4", validScale, rhythmEnabled, validGenre)
      : []
    const hostBpm = hostPoints.length >= 2 ? estimateAvgBpm(hostPoints) : 90
  
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hostMidiJson: any = JSON.parse(JSON.stringify(hostMidi))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hostGpsJson: any = JSON.parse(JSON.stringify(hostPoints))
  
    await db.ensembleTrack.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      update: { instrument: instrument ?? "piano", scale: validScale, startingNote: startingNote ?? "C4", bpmAvg: hostBpm, midiEvents: hostMidiJson, gpsPoints: hostGpsJson },
      create: { sessionId, userId, instrument: instrument ?? "piano", scale: validScale, startingNote: startingNote ?? "C4", bpmAvg: hostBpm, midiEvents: hostMidiJson, gpsPoints: hostGpsJson },
    })
  
    // Atomically claim the COMPLETING state — prevents race with a concurrent normal submit
    const claimed = await db.ensembleSession.updateMany({
      where: { id: sessionId, status: "ACTIVE" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { status: "COMPLETING" as any },
    })
  
    if (claimed.count === 0) {
      // Another process already claimed it — just let the normal flow finish
      return NextResponse.json({ ok: true })
    }
  
    // Create silent placeholder tracks for members who haven't submitted yet
    const allTracks = await db.ensembleTrack.findMany({ where: { sessionId } })
    const submittedIds = new Set(allTracks.map((t) => t.userId))
    const missingMembers = ensemble.members.filter((m) => !submittedIds.has(m.userId))
  
    if (missingMembers.length > 0) {
      await db.ensembleTrack.createMany({
        data: missingMembers.map((m) => ({
          sessionId,
          userId: m.userId,
          instrument: "piano",
          scale: validScale,
          startingNote: "C4",
          bpmAvg: 90,
          midiEvents: [],
          gpsPoints: [],
        })),
        skipDuplicates: true,
      })
    }
  
    // Fetch the final complete track list and finalize
    const finalTracks = await db.ensembleTrack.findMany({ where: { sessionId } })
    await finalizeSession(sessionId, ensembleId, finalTracks, ensSession.scales, userId)
  
    return NextResponse.json({ ok: true })
  
  } catch (err) {
    console.error("[wrap]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}