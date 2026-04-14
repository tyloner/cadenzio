import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { haversineDistance } from "@/lib/utils"
import { sendPush } from "@/lib/push"
import {
  getWeekKey,
  getWeekExpiry,
  getActiveCollectible,
  randomOffsetWithinRadius,
  distanceRing,
  COLLECTIBLES,
} from "@/lib/collectibles"

const NOTE_RADIUS_M = 1000
const CAPTURE_RADIUS_M = 50

/**
 * GET /api/hidden-note
 * Returns this week's hidden note status for the authenticated user.
 * Lazy-creates the note on first call each week using the user's last known position.
 * Never returns the exact coordinates — only a distance ring clue.
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id

    const weekKey = getWeekKey()
    const collectible = getActiveCollectible()

    // Check if we already have a note placed for this week
    let note = await db.hiddenNote.findUnique({
      where: { userId_weekKey: { userId, weekKey } },
      include: { capture: { select: { capturedAt: true } } },
    })

    if (!note) {
      // Lazy-create: find user's last GPS point
      const lastActivity = await db.activity.findFirst({
        where: { userId },
        orderBy: { startedAt: "desc" },
        select: { gpsTrack: true },
      })

      if (!lastActivity) {
        // No walks yet — can't place a note without a known location
        return NextResponse.json({ available: false, reason: "Complete your first walk to unlock hidden notes." })
      }

      const track = lastActivity.gpsTrack as { lat: number; lng: number }[]
      const lastPoint = track[track.length - 1]

      // Seed from userId + weekKey for deterministic placement per user per week
      const seed = [...`${userId}${weekKey}`].reduce((acc, c) => acc + c.charCodeAt(0), 0)
      const position = randomOffsetWithinRadius(lastPoint.lat, lastPoint.lng, NOTE_RADIUS_M, seed)

      note = await db.hiddenNote.create({
        data: {
          userId,
          weekKey,
          noteKey: collectible.key,
          lat: position.lat,
          lng: position.lng,
          expiresAt: getWeekExpiry(),
        },
        include: { capture: { select: { capturedAt: true } } },
      })
    }

    const captured = note.capture !== null

    return NextResponse.json({
      available: true,
      weekKey,
      noteKey: note.noteKey,
      name: collectible.name,
      rarity: collectible.rarity,
      emoji: collectible.emoji,
      description: collectible.description,
      expiresAt: note.expiresAt,
      captured,
      capturedAt: note.capture?.capturedAt ?? null,
      // Clue: distance from user's LAST activity endpoint, not exact position
      clue: null, // populated by client if they share location, or on walk complete
    })
  } catch (err) {
    console.error("[GET /api/hidden-note]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * GET /api/hidden-note?lat=X&lng=Y
 * Returns clue ring based on provided coordinates (called from client with device location).
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id

    const { lat, lng } = await req.json()
    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "lat and lng required" }, { status: 400 })
    }

    const weekKey = getWeekKey()
    const note = await db.hiddenNote.findUnique({
      where: { userId_weekKey: { userId, weekKey } },
      include: { capture: { select: { capturedAt: true } } },
    })

    if (!note) return NextResponse.json({ available: false })

    const dist = haversineDistance(lat, lng, note.lat, note.lng)
    const clue = distanceRing(dist)

    // Auto-capture if within range and not already captured
    if (!note.capture && dist <= CAPTURE_RADIUS_M) {
      // Capture is normally done on activity submit; this path handles
      // the edge case where a user checks their position manually near the note.
      // We return "hot" without creating a capture — the activity submit is authoritative.
    }

    return NextResponse.json({
      available: true,
      captured: note.capture !== null,
      capturedAt: note.capture?.capturedAt ?? null,
      clue,
      // Still don't reveal exact coordinates
    })
  } catch (err) {
    console.error("[POST /api/hidden-note]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Exported helper: check if a GPS track captures this week's hidden note.
 * Called from the activity submit pipeline.
 * Returns the noteKey if captured, null otherwise.
 */
export async function checkHiddenNoteCapture(
  userId: string,
  activityId: string,
  gpsTrack: { lat: number; lng: number }[],
): Promise<string | null> {
  const weekKey = getWeekKey()
  const note = await db.hiddenNote.findUnique({
    where: { userId_weekKey: { userId, weekKey } },
    include: { capture: true },
  })

  if (!note || note.capture) return null  // no note this week, or already captured

  // Check if any GPS point passed within capture radius
  const hit = gpsTrack.some(
    (pt) => haversineDistance(pt.lat, pt.lng, note.lat, note.lng) <= CAPTURE_RADIUS_M
  )

  if (!hit) return null

  await db.hiddenNoteCapture.create({
    data: { userId, noteId: note.id, activityId },
  })

  const collectible = COLLECTIBLES.find((c) => c.key === note.noteKey)
  sendPush(userId, {
    title: `${collectible?.emoji ?? "🎵"} Note collected!`,
    body: `You found ${collectible?.name ?? note.noteKey} — added to your Lost Octave album.`,
    url: "/challenges",
  }).catch(() => {})

  return note.noteKey
}

/** All collected note keys for a user — for the album view */
export async function getCollectedNoteKeys(userId: string): Promise<string[]> {
  const captures = await db.hiddenNoteCapture.findMany({
    where: { userId },
    include: { note: { select: { noteKey: true } } },
  })
  return captures.map((c) => c.note.noteKey)
}
