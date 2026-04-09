import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { processGpsToNotes, estimateAvgBpm, type GpsPoint } from "@/lib/music-engine/gps-processor"
import { GENRE_CONFIG, type ScaleName, type GenreName } from "@/lib/music-engine/scales"

const MAX_SESSION_SECONDS = 120 // 2 minutes hard cap

// POST /api/ensemble/[id]/session/[sid]/submit — member submits GPS track after walk
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id: ensembleId, sid: sessionId } = await params

  const ensSession = await db.ensembleSession.findUnique({
    where: { id: sessionId, ensembleId },
    include: { tracks: true },
  })

  if (!ensSession) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (ensSession.status !== "ACTIVE") return NextResponse.json({ error: "Session is not active" }, { status: 400 })

  // Verify member
  const member = await db.ensembleMember.findUnique({
    where: { ensembleId_userId: { ensembleId, userId } },
  })
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const { gpsPoints, instrument, scale, startingNote, genre } = await req.json()
  if (!Array.isArray(gpsPoints) || gpsPoints.length < 2) {
    return NextResponse.json({ error: "Need at least 2 GPS points" }, { status: 400 })
  }

  // Enforce 2-minute cap — trim points beyond startedAt + 120s
  let points: GpsPoint[] = gpsPoints
  if (ensSession.startedAt) {
    const capMs = ensSession.startedAt.getTime() + MAX_SESSION_SECONDS * 1000
    points = gpsPoints.filter((p: GpsPoint) => p.timestamp <= capMs)
    if (points.length < 2) points = gpsPoints.slice(0, 2)
  }

  const validScale = (scale as string) in GENRE_CONFIG ? (scale as ScaleName) : "major"
  const validGenre: GenreName = (genre as string) in GENRE_CONFIG ? (genre as GenreName) : "classical"
  const rhythmEnabled = GENRE_CONFIG[validGenre].rhythm

  const midiEvents = processGpsToNotes(points, startingNote ?? "C4", validScale, rhythmEnabled, validGenre)
  const bpmAvg = estimateAvgBpm(points)

  // Upsert track — JSON.parse(JSON.stringify()) satisfies Prisma's InputJsonValue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const midiJson: any = JSON.parse(JSON.stringify(midiEvents))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gpsJson: any = JSON.parse(JSON.stringify(points))

  await db.ensembleTrack.upsert({
    where: { sessionId_userId: { sessionId, userId } },
    update: { instrument, scale: validScale, startingNote: startingNote ?? "C4", bpmAvg, midiEvents: midiJson, gpsPoints: gpsJson },
    create: { sessionId, userId, instrument, scale: validScale, startingNote: startingNote ?? "C4", bpmAvg, midiEvents: midiJson, gpsPoints: gpsJson },
  })

  // Check if all members submitted — use atomic status update to prevent race conditions
  const ensemble = await db.ensemble.findUnique({
    where: { id: ensembleId },
    include: { members: true },
  })
  const allTracks = await db.ensembleTrack.findMany({ where: { sessionId } })
  const memberIds = ensemble?.members.map((m) => m.userId) ?? []
  const allSubmitted = memberIds.every((mid) => allTracks.some((t) => t.userId === mid))

  if (allSubmitted) {
    // Atomic: only the first request to set COMPLETING wins — prevents duplicate finalization
    const claimed = await db.ensembleSession.updateMany({
      where: { id: sessionId, status: "ACTIVE" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { status: "COMPLETING" as any },
    })
    if (claimed.count > 0) {
      await finalizeSession(sessionId, ensSession.ensembleId, allTracks, ensSession.scales, userId)
    }
  }

  return NextResponse.json({ ok: true, trackCount: allTracks.length, allSubmitted })
}

async function finalizeSession(
  sessionId: string,
  ensembleId: string,
  tracks: Awaited<ReturnType<typeof db.ensembleTrack.findMany>>,
  scales: string[],
  hostId: string
) {
  // Merge all midiEvents — offset each track so they play simultaneously
  const allEvents = tracks.flatMap((track) => {
    const events = track.midiEvents as { note: number; duration: string; time: number; velocity: number; track: string }[]
    return events.map((e) => ({ ...e, instrument: track.instrument }))
  })
  allEvents.sort((a, b) => a.time - b.time)

  const avgBpm = tracks.reduce((sum, t) => sum + (t.bpmAvg ?? 90), 0) / tracks.length

  // Create a synthetic Activity + Composition for the feed
  const now = new Date()
  const activity = await db.activity.create({
    data: {
      userId: hostId,
      title: `Ensemble Session`,
      startedAt: now,
      endedAt: now,
      durationSec: 120,
      gpsTrack: [],
      source: "ENSEMBLE",
      isPublic: true,
      ensembleSessionId: sessionId,
    },
  })

  await db.composition.create({
    data: {
      activityId: activity.id,
      userId: hostId,
      startingNote: tracks[0]?.startingNote ?? "C4",
      scale: scales[0] ?? "major",
      genre: "classical",
      instrument: tracks[0]?.instrument ?? "piano",
      bpmAvg: avgBpm,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      midiEvents: JSON.parse(JSON.stringify(allEvents)) as any,
    },
  })

  await db.ensembleSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", endedAt: now },
  })

  // Mark trial as used for all members
  const memberIds = tracks.map((t) => t.userId)
  await db.profile.updateMany({
    where: { userId: { in: memberIds } },
    data: { ensembleTrialUsed: true },
  })
}
