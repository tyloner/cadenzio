import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { haversineDistance } from "@/lib/utils"

// POST /api/ensemble/[id]/session/[sid]/start — host starts the session
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id
    const { id: ensembleId, sid: sessionId } = await params
  
    const ensSession = await db.ensembleSession.findUnique({
      where: { id: sessionId, ensembleId },
      include: { lobbyLocations: true },
    })
  
    if (!ensSession) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (ensSession.hostId !== userId) return NextResponse.json({ error: "Only host can start" }, { status: 403 })
    if (ensSession.status !== "LOBBY") return NextResponse.json({ error: "Session already started" }, { status: 400 })
  
    // Validate proximity: at least 2 members within 50m
    const locs = ensSession.lobbyLocations
    let proximityOk = false
    for (let i = 0; i < locs.length && !proximityOk; i++) {
      for (let j = i + 1; j < locs.length; j++) {
        if (haversineDistance(locs[i].lat, locs[i].lng, locs[j].lat, locs[j].lng) <= 50) {
          proximityOk = true
          break
        }
      }
    }
  
    if (!proximityOk) {
      return NextResponse.json({ error: "At least 2 members must be within 50 metres of each other" }, { status: 400 })
    }
  
    const started = await db.ensembleSession.update({
      where: { id: sessionId },
      data: { status: "ACTIVE", startedAt: new Date() },
    })
  
    return NextResponse.json(started)
  
  } catch (err) {
    console.error("[start]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
// DELETE /api/ensemble/[id]/session/[sid]/start — host cancels the lobby
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id
    const { id: ensembleId, sid: sessionId } = await params
  
    const ensSession = await db.ensembleSession.findUnique({
      where: { id: sessionId, ensembleId },
    })
    if (!ensSession) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (ensSession.hostId !== userId) return NextResponse.json({ error: "Only host can cancel" }, { status: 403 })
    if (ensSession.status !== "LOBBY") return NextResponse.json({ error: "Session already started" }, { status: 400 })
  
    await db.ensembleSession.update({
      where: { id: sessionId },
      data: { status: "CANCELLED" },
    })
  
    return NextResponse.json({ ok: true })
  
  } catch (err) {
    console.error("[start]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}