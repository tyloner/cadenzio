import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { processGpsToNotes, estimateAvgBpm } from "@/lib/music-engine/gps-processor"
import { computeStyleAnalysis } from "@/lib/music-engine/style-tagger"
import { FREE_LIMITS } from "@/lib/constants"
import { checkNewReveal } from "@/lib/levels"
import type { ScaleName, GenreName, InstrumentName } from "@/lib/music-engine/scales"
import type { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const activities = await db.activity.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    include: { composition: true },
  })
  return NextResponse.json(activities)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id

  // Check free tier limits — subscription + body parse in parallel
  const [subscription, body] = await Promise.all([
    db.subscription.findUnique({ where: { userId } }),
    req.json(),
  ])
  const isPro = subscription?.tier === "PRO"
  const { title, gpsTrack, durationSec, distanceM, startingNote, scale, genre, instrument } = body

  // Enforce free tier caps — both checks in parallel
  if (!isPro) {
    const [used, count] = await Promise.all([
      db.activity.aggregate({ where: { userId }, _sum: { durationSec: true } }),
      db.composition.count({ where: { userId } }),
    ])
    const usedSeconds = used._sum.durationSec ?? 0
    if (usedSeconds + durationSec > FREE_LIMITS.MAX_RECORDING_SECONDS) {
      return NextResponse.json({ error: "Combined recording time exceeds free tier limit of 30 minutes." }, { status: 403 })
    }
    if (count >= FREE_LIMITS.MAX_SAVED_COMPOSITIONS) {
      return NextResponse.json(
        { error: "Free tier composition limit reached. Upgrade to Pro for unlimited saves." },
        { status: 403 }
      )
    }
  }

  // Generate note events from GPS
  const { GENRE_CONFIG } = await import("@/lib/music-engine/scales")
  const genreConfig = GENRE_CONFIG[genre as GenreName] ?? GENRE_CONFIG.classical
  const rhythmEnabled = genreConfig.rhythm

  const midiEvents = processGpsToNotes(
    gpsTrack,
    startingNote ?? "C4",
    (scale as ScaleName) ?? "major",
    rhythmEnabled,
    (genre as GenreName) ?? "classical"
  )
  const bpmAvg = estimateAvgBpm(gpsTrack)

  // Save activity + composition in transaction
  const activity = await db.activity.create({
    data: {
      userId,
      title: title ?? "Andante Walk",
      startedAt: new Date(gpsTrack[0]?.timestamp ?? Date.now()),
      endedAt: new Date(gpsTrack[gpsTrack.length - 1]?.timestamp ?? Date.now()),
      durationSec,
      distanceM,
      gpsTrack,
      composition: {
        create: {
          userId,
          startingNote: startingNote ?? "C4",
          scale: scale ?? "major",
          genre: genre ?? "classical",
          instrument: instrument ?? "piano",
          bpmAvg,
          midiEvents: midiEvents as unknown as Prisma.InputJsonValue,
        },
      },
    },
  })

  // Update profile stats — upsert guards against missing profile after data wipe
  const updatedProfile = await db.profile.upsert({
    where: { userId },
    update: {
      totalActivities: { increment: 1 },
      totalDistance: { increment: distanceM ?? 0 },
    },
    create: {
      userId,
      username: `user_${userId.slice(-8)}`,
      totalActivities: 1,
      totalDistance: distanceM ?? 0,
    },
    select: { totalActivities: true, badges: true, revealedChallenges: true },
  })

  const count = updatedProfile.totalActivities

  // Award composition-count badges
  const BADGE_THRESHOLDS: [number, string][] = [
    [1,  "Opus Prima"],
    [20, "Repertoire"],
    [35, "Gifted"],
    [50, "Virtuoso"],
  ]
  const newBadges = BADGE_THRESHOLDS
    .filter(([threshold]) => count >= threshold)
    .map(([, name]) => name)
    .filter((name) => !updatedProfile.badges.includes(name))

  // Check if a secret challenge should be revealed
  const newlyRevealedChallenge = checkNewReveal(count, updatedProfile.revealedChallenges)

  // Persist badge + reveal updates (guard against duplicate reveals under concurrent saves)
  const profileUpdates: Record<string, unknown> = {}
  if (newBadges.length > 0) profileUpdates.badges = { push: newBadges }
  if (newlyRevealedChallenge && !updatedProfile.revealedChallenges.includes(newlyRevealedChallenge)) {
    profileUpdates.revealedChallenges = { push: newlyRevealedChallenge }
  }
  if (Object.keys(profileUpdates).length > 0) {
    await db.profile.update({ where: { userId }, data: profileUpdates })
  }

  // Style tagging (pro only)
  if (isPro) {
    const analysis = computeStyleAnalysis(midiEvents, genre as GenreName, bpmAvg, count, (instrument as InstrumentName) ?? "piano")
    await db.profile.updateMany({
      where: { userId },
      data: {
        styleTags: analysis.tags,
        personaName: analysis.personaName,
      },
    })
  }

  return NextResponse.json({ activityId: activity.id, newlyRevealedChallenge }, { status: 201 })
}
