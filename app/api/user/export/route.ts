import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id

  const [user, profile, activities] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, createdAt: true },
    }),
    db.profile.findUnique({
      where: { userId },
      select: {
        username: true, bio: true, country: true, musicalInterests: true,
        totalActivities: true, totalDistance: true, badges: true,
        styleTags: true, personaName: true, units: true, createdAt: true,
      },
    }),
    db.activity.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: {
        composition: {
          select: {
            startingNote: true, scale: true, genre: true, instrument: true,
            bpmAvg: true, midiEvents: true, createdAt: true,
          },
        },
      },
    }),
  ])

  const payload = {
    exportedAt: new Date().toISOString(),
    account: user,
    profile,
    activities: activities.map((a) => ({
      id: a.id,
      title: a.title,
      startedAt: a.startedAt,
      endedAt: a.endedAt,
      durationSec: a.durationSec,
      distanceM: a.distanceM,
      isPublic: a.isPublic,
      gpsTrack: a.gpsTrack,
      composition: a.composition,
    })),
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="cadenz-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
