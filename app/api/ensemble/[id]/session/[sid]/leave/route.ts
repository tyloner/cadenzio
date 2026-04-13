import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { processGpsToNotes, estimateAvgBpm, type GpsPoint } from "@/lib/music-engine/gps-processor"
import { SCALES, GENRE_CONFIG, type ScaleName, type GenreName } from "@/lib/music-engine/scales"
import { finalizeSession } from "@/lib/ensemble/finalize-session"

const MAX_SESSION_SECONDS = 120

// POST /api/ensemble/[id]/session/[sid]/leave
// Any member (including host) can leave mid-session.
// Whatever GPS data they have is submitted as their track contribution.
// After leaving, the session continues for remaining members.
// If they happen to be the last unsubmitted member, finalization triggers normally.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id
    const { id: ensembleId, sid: sessionId } = await params
  
    const ensSession = await db.ensembleSession.findUnique({
      where: { id: sessionId, ensembleId },
      include: { tracks: true },
    })
  
    if (!ensSession) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (ensSession.status !== "ACTIVE" && ensSession.status !== "COMPLETING") {
      return NextResponse.json({ error: "Session is not active" }, { status: 400 })
    }
  
    const member = await db.ensembleMember.findUnique({
      where: { ensembleId_userId: { ensembleId, userId } },
    })
    if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 })
  
    const { gpsPoints, instrument, scale, startingNote, genre } = await req.json()
  
    const rawPoints: GpsPoint[] = Array.isArray(gpsPoints) ? gpsPoints : []
  
    // Trim to session cap
    let points = rawPoints
    if (ensSession.startedAt && points.length > 0) {
      const capMs = ensSession.startedAt.getTime() + MAX_SESSION_SECONDS * 1000
      points = rawPoints.filter((p) => p.timestamp <= capMs)
      if (points.length < 2) points = rawPoints.slice(0, 2)
    }
  
    const validScale = typeof scale === "string" && scale in SCALES ? (scale as ScaleName) : "major"
    const validGenre: GenreName = typeof genre === "string" && genre in GENRE_CONFIG ? (genre as GenreName) : "classical"
    const rhythmEnabled = GENRE_CONFIG[validGenre].rhythm
  
    // Generate events from whatever GPS data exists (may be empty if they left immediately)
    const midiEvents = points.length >= 2
      ? processGpsToNotes(points, startingNote ?? "C4", validScale, rhythmEnabled, validGenre)
      : []
    const bpmAvg = points.length >= 2 ? estimateAvgBpm(points) : 90
  
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const midiJson: any = JSON.parse(JSON.stringify(midiEvents))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gpsJson: any = JSON.parse(JSON.stringify(points))
  
    await db.ensembleTrack.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      update: { instrument: instrument ?? "piano", scale: validScale, startingNote: startingNote ?? "C4", bpmAvg, midiEvents: midiJson, gpsPoints: gpsJson },
      create: { sessionId, userId, instrument: instrument ?? "piano", scale: validScale, startingNote: startingNote ?? "C4", bpmAvg, midiEvents: midiJson, gpsPoints: gpsJson },
    })
  
    // Check if this departure causes all members to now have tracks (triggers finalization)
    const ensemble = await db.ensemble.findUnique({
      where: { id: ensembleId },
      include: { members: true },
    })
    const allTracks = await db.ensembleTrack.findMany({ where: { sessionId } })
    const memberIds = ensemble?.members.map((m) => m.userId) ?? []
    const allSubmitted = memberIds.every((mid) => allTracks.some((t) => t.userId === mid))
  
    if (allSubmitted) {
      const claimed = await db.ensembleSession.updateMany({
        where: { id: sessionId, status: "ACTIVE" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { status: "COMPLETING" as any },
      })
      if (claimed.count > 0) {
        await finalizeSession(sessionId, ensembleId, allTracks, ensSession.scales, ensSession.hostId)
      }
    }
  
    return NextResponse.json({ ok: true })
  
  } catch (err) {
    console.error("[leave]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}