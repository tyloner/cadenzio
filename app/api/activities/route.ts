import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { processGpsToNotes, estimateAvgBpm } from "@/lib/music-engine/gps-processor"
import { computeStyleAnalysis } from "@/lib/music-engine/style-tagger"
import { FREE_LIMITS } from "@/lib/constants"
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

  // Check free tier limits
  const subscription = await db.subscription.findUnique({ where: { userId } })
  const isPro = subscription?.tier === "PRO"

  const body = await req.json()
  const { title, gpsTrack, durationSec, distanceM, startingNote, scale, genre, instrument } = body

  // Enforce 30-min combined cap for free users
  if (!isPro) {
    const used = await db.activity.aggregate({ where: { userId }, _sum: { durationSec: true } })
    const usedSeconds = used._sum.durationSec ?? 0
    if (usedSeconds + durationSec > FREE_LIMITS.MAX_RECORDING_SECONDS) {
      return NextResponse.json({ error: "Combined recording time exceeds free tier limit of 30 minutes." }, { status: 403 })
    }
  }

  // Enforce composition count for free users
  if (!isPro) {
    const count = await db.composition.count({ where: { userId } })
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
      title: title ?? "Untitled Walk",
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

  // Update profile stats and compute earned badges
  const updatedProfile = await db.profile.update({
    where: { userId },
    data: {
      totalActivities: { increment: 1 },
      totalDistance: { increment: distanceM ?? 0 },
    },
    select: { totalActivities: true, badges: true },
  })

  const count = updatedProfile.totalActivities
  const BADGE_THRESHOLDS: [number, string][] = [
    [1,  "Opus Prima"],
    [10, "Repertoire"],
    [20, "Gifted"],
    [30, "Virtuoso"],
  ]
  const newBadges = BADGE_THRESHOLDS
    .filter(([threshold]) => count >= threshold)
    .map(([, name]) => name)
    .filter((name) => !updatedProfile.badges.includes(name))

  if (newBadges.length > 0) {
    await db.profile.update({
      where: { userId },
      data: { badges: { push: newBadges } },
    })
  }

  // Style tagging (pro only)
  if (isPro) {
    const profile = await db.profile.findUnique({ where: { userId } })
    const analysis = computeStyleAnalysis(midiEvents, genre as GenreName, bpmAvg, profile?.totalActivities ?? 1, (instrument as InstrumentName) ?? "piano")
    await db.profile.updateMany({
      where: { userId },
      data: {
        styleTags: analysis.tags,
        personaName: analysis.personaName,
      },
    })
  }

  return NextResponse.json({ activityId: activity.id }, { status: 201 })
}
