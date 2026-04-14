import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { processGpsToNotes, estimateAvgBpm } from "@/lib/music-engine/gps-processor"
import { computeStyleAnalysis } from "@/lib/music-engine/style-tagger"
import { FREE_LIMITS } from "@/lib/constants"
import { checkNewReveal } from "@/lib/levels"
import { checkHiddenNoteCapture } from "@/app/api/hidden-note/route"
import type { ScaleName, GenreName, InstrumentName } from "@/lib/music-engine/scales"
import type { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const activities = await db.activity.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      take: 100,
      include: { composition: true },
    })
    return NextResponse.json(activities)
  } catch (err) {
    console.error("[GET /api/activities]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const [subscription, body] = await Promise.all([
      db.subscription.findUnique({ where: { userId } }),
      req.json(),
    ])
    const isPro = subscription?.tier === "PRO"
    const { title, gpsTrack, durationSec, distanceM, startingNote, scale, genre, instrument } = body

    // ── Input validation ────────────────────────────────────────────────────
    if (!Array.isArray(gpsTrack) || gpsTrack.length < 2) {
      return NextResponse.json({ error: "Invalid GPS track" }, { status: 400 })
    }
    if (gpsTrack.length > 10_000) {
      return NextResponse.json({ error: "GPS track too long" }, { status: 400 })
    }
    for (const pt of gpsTrack as { lat: unknown; lng: unknown }[]) {
      if (
        typeof pt.lat !== "number" || typeof pt.lng !== "number" ||
        !Number.isFinite(pt.lat) || !Number.isFinite(pt.lng) ||
        pt.lat < -90 || pt.lat > 90 || pt.lng < -180 || pt.lng > 180
      ) {
        return NextResponse.json({ error: "Invalid GPS coordinates" }, { status: 400 })
      }
    }
    if (typeof durationSec !== "number" || durationSec < 5 || durationSec > 7_200 || !Number.isFinite(durationSec)) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 })
    }
    if (distanceM !== undefined && distanceM !== null) {
      if (typeof distanceM !== "number" || distanceM < 0 || distanceM > 500_000 || !Number.isFinite(distanceM)) {
        return NextResponse.json({ error: "Invalid distance" }, { status: 400 })
      }
    }

    // ── Free tier genre / instrument enforcement ────────────────────────────
    if (!isPro) {
      if (typeof genre === "string" && !FREE_LIMITS.GENRES.includes(genre)) {
        return NextResponse.json({ error: "Genre not available on free tier" }, { status: 403 })
      }
      if (typeof instrument === "string" && !FREE_LIMITS.INSTRUMENTS.includes(instrument)) {
        return NextResponse.json({ error: "Instrument not available on free tier" }, { status: 403 })
      }
    }

    // ── Free tier enforcement (atomic via transaction) ───────────────────────
    if (!isPro) {
      // Use a transaction so both the limit check and the create are atomic.
      // The tx serialises with other writes for this user via the unique userId FK.
      const activity = await db.$transaction(async (tx) => {
        const [used, count] = await Promise.all([
          tx.activity.aggregate({ where: { userId }, _sum: { durationSec: true } }),
          tx.composition.count({ where: { userId } }),
        ])
        const usedSeconds = used._sum.durationSec ?? 0
        if (usedSeconds + durationSec > FREE_LIMITS.MAX_RECORDING_SECONDS) {
          throw Object.assign(new Error("LIMIT_DURATION"), { code: "LIMIT_DURATION" })
        }
        if (count >= FREE_LIMITS.MAX_SAVED_COMPOSITIONS) {
          throw Object.assign(new Error("LIMIT_COUNT"), { code: "LIMIT_COUNT" })
        }
        return createActivity(tx, { userId, title, gpsTrack, durationSec, distanceM, startingNote, scale, genre, instrument })
      })
      return await finaliseActivity(activity.id, userId, isPro, { genre, instrument })
    }

    // Pro users skip the limit check
    const activity = await createActivity(db, { userId, title, gpsTrack, durationSec, distanceM, startingNote, scale, genre, instrument })
    return await finaliseActivity(activity.id, userId, isPro, { genre, instrument })
  } catch (err: unknown) {
    if (err instanceof Error) {
      if ((err as NodeJS.ErrnoException).code === "LIMIT_DURATION") {
        return NextResponse.json({ error: "Combined recording time exceeds free tier limit of 30 minutes." }, { status: 403 })
      }
      if ((err as NodeJS.ErrnoException).code === "LIMIT_COUNT") {
        return NextResponse.json({ error: "Free tier composition limit reached. Upgrade to Pro for unlimited saves." }, { status: 403 })
      }
    }
    console.error("[POST /api/activities]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

type DbOrTx = Parameters<Parameters<typeof db.$transaction>[0]>[0] | typeof db

async function createActivity(
  client: DbOrTx,
  { userId, title, gpsTrack, durationSec, distanceM, startingNote, scale, genre, instrument }: {
    userId: string; title: unknown; gpsTrack: unknown[]; durationSec: number
    distanceM: unknown; startingNote: unknown; scale: unknown; genre: unknown; instrument: unknown
  }
) {
  const { GENRE_CONFIG } = await import("@/lib/music-engine/scales")
  const genreConfig = GENRE_CONFIG[(genre as GenreName)] ?? GENRE_CONFIG.classical
  const midiEvents = processGpsToNotes(
    gpsTrack as Parameters<typeof processGpsToNotes>[0],
    (startingNote as string) ?? "C4",
    (scale as ScaleName) ?? "major",
    genreConfig.rhythm,
    (genre as GenreName) ?? "classical"
  )
  const bpmAvg = estimateAvgBpm(gpsTrack as Parameters<typeof estimateAvgBpm>[0])

  return client.activity.create({
    data: {
      userId,
      title: (typeof title === "string" && title.trim()) || "Andante Walk",
      startedAt: new Date((gpsTrack[0] as { timestamp?: number })?.timestamp ?? Date.now()),
      endedAt: new Date((gpsTrack[gpsTrack.length - 1] as { timestamp?: number })?.timestamp ?? Date.now()),
      durationSec,
      distanceM: (typeof distanceM === "number" ? distanceM : null),
      gpsTrack: gpsTrack as unknown as Prisma.InputJsonValue,
      composition: {
        create: {
          userId,
          startingNote: (startingNote as string) ?? "C4",
          scale: (scale as string) ?? "major",
          genre: (genre as string) ?? "classical",
          instrument: (instrument as string) ?? "piano",
          bpmAvg,
          midiEvents: midiEvents as unknown as Prisma.InputJsonValue,
        },
      },
    },
    select: { id: true },
  })
}

async function finaliseActivity(
  activityId: string,
  userId: string,
  isPro: boolean,
  { genre, instrument }: { genre: unknown; instrument: unknown }
): Promise<NextResponse> {
  const updatedProfile = await db.profile.upsert({
    where: { userId },
    update: {
      totalActivities: { increment: 1 },
      totalDistance: { increment: 0 }, // distanceM already baked in above
    },
    create: {
      userId,
      username: `user_${userId.slice(-8)}`,
      totalActivities: 1,
      totalDistance: 0,
    },
    select: { totalActivities: true, badges: true, revealedChallenges: true },
  })

  // Re-fetch distance from the created activity to increment correctly
  const act = await db.activity.findUnique({ where: { id: activityId }, select: { distanceM: true } })
  if (act?.distanceM) {
    await db.profile.update({ where: { userId }, data: { totalDistance: { increment: act.distanceM } } })
  }

  const count = updatedProfile.totalActivities
  const BADGE_THRESHOLDS: [number, string][] = [
    [1, "Opus Prima"], [20, "Repertoire"], [35, "Gifted"], [50, "Virtuoso"],
  ]
  const newBadges = BADGE_THRESHOLDS
    .filter(([t]) => count >= t)
    .map(([, name]) => name)
    .filter((name) => !updatedProfile.badges.includes(name))

  const newlyRevealedChallenge = checkNewReveal(count, updatedProfile.revealedChallenges)

  // Atomic badge + reveal push using a transaction so concurrent saves don't duplicate
  if (newBadges.length > 0 || newlyRevealedChallenge) {
    await db.$transaction(async (tx) => {
      const fresh = await tx.profile.findUnique({
        where: { userId },
        select: { badges: true, revealedChallenges: true },
      })
      const updates: Record<string, unknown> = {}
      const freshBadges = newBadges.filter((b) => !fresh?.badges.includes(b))
      if (freshBadges.length > 0) updates.badges = { push: freshBadges }
      if (newlyRevealedChallenge && !fresh?.revealedChallenges.includes(newlyRevealedChallenge)) {
        updates.revealedChallenges = { push: newlyRevealedChallenge }
      }
      if (Object.keys(updates).length > 0) {
        await tx.profile.update({ where: { userId }, data: updates })
      }
    })
  }

  if (isPro) {
    const midiEvents = await db.composition.findUnique({
      where: { activityId },
      select: { midiEvents: true, bpmAvg: true },
    })
    const analysis = computeStyleAnalysis(
      midiEvents?.midiEvents as unknown as Parameters<typeof computeStyleAnalysis>[0],
      genre as GenreName,
      midiEvents?.bpmAvg ?? 90,
      count,
      (instrument as InstrumentName) ?? "piano"
    )
    await db.profile.updateMany({
      where: { userId },
      data: { styleTags: analysis.tags, personaName: analysis.personaName },
    })
  }

  // Check if the GPS track captured this week's hidden note
  const act2 = await db.activity.findUnique({ where: { id: activityId }, select: { gpsTrack: true } })
  const gpsPoints = (act2?.gpsTrack ?? []) as { lat: number; lng: number }[]
  const capturedNoteKey = await checkHiddenNoteCapture(userId, activityId, gpsPoints).catch(() => null)

  return NextResponse.json({
    activityId,
    newlyRevealedChallenge: newlyRevealedChallenge ?? null,
    capturedNoteKey: capturedNoteKey ?? null,
  }, { status: 201 })
}
