import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// POST /api/ensemble/[id]/session — create a new lobby session (owner only)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id: ensembleId } = await params

  const ensemble = await db.ensemble.findUnique({
    where: { id: ensembleId },
    include: { members: true },
  })
  if (!ensemble) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (ensemble.ownerId !== userId) return NextResponse.json({ error: "Only the owner can start a session" }, { status: 403 })
  if (ensemble.members.length < 2) return NextResponse.json({ error: "Need at least 2 members" }, { status: 400 })

  // Premium gate: check trial
  const profile = await db.profile.findUnique({ where: { userId }, select: { ensembleTrialUsed: true } })
  const sub = await db.subscription.findUnique({ where: { userId }, select: { tier: true } })
  const isPro = sub?.tier === "PRO"

  if (!isPro && profile?.ensembleTrialUsed) {
    return NextResponse.json({ error: "Ensemble is a Pro feature. You have used your free trial session." }, { status: 403 })
  }

  // Cancel any existing LOBBY sessions for this ensemble
  await db.ensembleSession.updateMany({
    where: { ensembleId, status: "LOBBY" },
    data: { status: "CANCELLED" },
  })

  const { scales } = await req.json()
  const validScales = Array.isArray(scales) && scales.length > 0 ? scales.slice(0, 2) : ["major"]

  const newSession = await db.ensembleSession.create({
    data: {
      ensembleId,
      hostId: userId,
      status: "LOBBY",
      scales: validScales,
    },
    include: {
      host: { select: { id: true, name: true, image: true } },
    },
  })

  return NextResponse.json(newSession, { status: 201 })
}
