import { db } from "@/lib/db"

type Track = {
  userId: string
  instrument: string
  scale: string
  startingNote: string
  bpmAvg: number | null
  midiEvents: unknown
  gpsPoints: unknown
}

/**
 * Finalize an ensemble session: merge all track events, create the feed Activity +
 * Composition, mark the session COMPLETED, and consume the trial for all participants.
 *
 * Call only after atomically claiming the COMPLETING status (updateMany count > 0).
 */
export async function finalizeSession(
  sessionId: string,
  ensembleId: string,
  tracks: Track[],
  scales: string[],
  hostId: string,
) {
  const allEvents = tracks.flatMap((track) => {
    const events = track.midiEvents as {
      note: number
      duration: string
      time: number
      velocity: number
      track: string
    }[]
    return Array.isArray(events)
      ? events.map((e) => ({ ...e, instrument: track.instrument }))
      : []
  })
  allEvents.sort((a, b) => a.time - b.time)

  const avgBpm =
    tracks.length > 0
      ? tracks.reduce((sum, t) => sum + (t.bpmAvg ?? 90), 0) / tracks.length
      : 90

  const now = new Date()

  // Check if an activity for this session already exists (idempotency guard)
  const existing = await db.activity.findUnique({ where: { ensembleSessionId: sessionId } })
  if (existing) return

  // If nobody produced any notes, mark the session complete but skip creating a composition
  if (allEvents.length === 0) {
    await db.ensembleSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", endedAt: now },
    })
    return
  }

  const activity = await db.activity.create({
    data: {
      userId: hostId,
      title: "Ensemble Session",
      startedAt: now,
      endedAt: now,
      durationSec: 120,
      gpsTrack: [],
      source: "ENSEMBLE",
      isPublic: true,
      ensembleSessionId: sessionId,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Mark trial as used for all contributing members
  const participantIds = tracks.map((t) => t.userId)
  if (participantIds.length > 0) {
    await db.profile.updateMany({
      where: { userId: { in: participantIds } },
      data: { ensembleTrialUsed: true },
    })
  }
}
