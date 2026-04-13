import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { haversineDistance } from "@/lib/utils"

// GET /api/ensemble/[id]/session/[sid]/lobby — poll lobby state (members only)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id
    const { id: ensembleId, sid: sessionId } = await params

    // Verify caller is a member before returning any location data
    const member = await db.ensembleMember.findUnique({
      where: { ensembleId_userId: { ensembleId, userId } },
    })
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const [ensSession, ensemble] = await Promise.all([
      db.ensembleSession.findUnique({
        where: { id: sessionId, ensembleId },
        include: {
          host: { select: { id: true, name: true, image: true } },
          lobbyLocations: {
            include: { user: { select: { id: true, name: true, image: true } } },
          },
          tracks: { select: { userId: true } },
        },
      }),
      db.ensemble.findUnique({
        where: { id: ensembleId },
        include: {
          members: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
      }),
    ])

    if (!ensSession) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Check proximity — find pairs within 50m
    const locs = ensSession.lobbyLocations
    let proximityOk = false
    const nearby: string[] = []

    for (let i = 0; i < locs.length && !proximityOk; i++) {
      for (let j = i + 1; j < locs.length; j++) {
        const dist = haversineDistance(locs[i].lat, locs[i].lng, locs[j].lat, locs[j].lng)
        if (dist <= 50) {
          proximityOk = true
          nearby.push(locs[i].userId, locs[j].userId)
          break
        }
      }
    }

    const submittedIds = ensSession.tracks.map((t) => t.userId)

    return NextResponse.json({
      session: {
        id: ensSession.id,
        status: ensSession.status,
        scales: ensSession.scales,
        startedAt: ensSession.startedAt,
        endedAt: ensSession.endedAt,
        hostId: ensSession.hostId,
      },
      members: ensemble?.members ?? [],
      locations: locs.map((l) => ({
        userId: l.userId,
        user: l.user,
        lat: l.lat,
        lng: l.lng,
        updatedAt: l.updatedAt,
      })),
      proximityOk,
      nearbyUserIds: [...new Set(nearby)],
      submittedIds,
    })
  } catch (err) {
    console.error("[GET /api/ensemble/session/lobby]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
