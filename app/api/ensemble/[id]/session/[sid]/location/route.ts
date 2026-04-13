import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// POST /api/ensemble/[id]/session/[sid]/location — upsert member location in lobby
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id
    const { id: ensembleId, sid: sessionId } = await params
  
    const { lat, lng } = await req.json()
    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "lat and lng required" }, { status: 400 })
    }
  
    // Verify user is a member
    const member = await db.ensembleMember.findUnique({
      where: { ensembleId_userId: { ensembleId, userId } },
    })
    if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 })
  
    await db.ensembleLobbyLocation.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      update: { lat, lng },
      create: { sessionId, userId, lat, lng },
    })
  
    return NextResponse.json({ ok: true })
  
  } catch (err) {
    console.error("[location]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}