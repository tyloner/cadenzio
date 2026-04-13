import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
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
      // Cap at 500 activities; exclude raw gpsTrack to keep payload manageable
      db.activity.findMany({
        where: { userId },
        orderBy: { startedAt: "desc" },
        take: 500,
        select: {
          id: true,
          title: true,
          startedAt: true,
          endedAt: true,
          durationSec: true,
          distanceM: true,
          isPublic: true,
          source: true,
          composition: {
            select: {
              startingNote: true, scale: true, genre: true, instrument: true,
              bpmAvg: true, createdAt: true,
              // midiEvents omitted — large JSON; available via activity page
            },
          },
        },
      }),
    ])

    const payload = {
      exportedAt: new Date().toISOString(),
      note: "GPS tracks and MIDI events are omitted for size. Export up to 500 most recent activities.",
      account: user,
      profile,
      activities,
    }

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="cadenz-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (err) {
    console.error("[GET /api/user/export]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
