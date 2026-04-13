import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { sendPush } from "@/lib/push"

// POST /api/ensemble/[id]/session — create a new lobby session (owner only)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id
  const { id: ensembleId } = await params

  const ensemble = await db.ensemble.findUnique({
    where: { id: ensembleId },
    include: { members: { include: { user: { select: { id: true, name: true } } } } },
  })
  if (!ensemble) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (ensemble.ownerId !== userId) return NextResponse.json({ error: "Only the owner can start a session" }, { status: 403 })
  if (ensemble.members.length < 2) return NextResponse.json({ error: "Need at least 2 members" }, { status: 400 })

  // Premium gate: check trial
  const [profile, sub, actor] = await Promise.all([
    db.profile.findUnique({ where: { userId }, select: { ensembleTrialUsed: true } }),
    db.subscription.findUnique({ where: { userId }, select: { tier: true } }),
    db.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ])
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

  // Notify all non-owner members — in-app + push
  const nonOwnerMembers = ensemble.members.filter((m) => m.userId !== userId)
  const sessionUrl = `/ensemble/${ensembleId}/session/${newSession.id}`
  const hostName = actor?.name ?? "The host"
  const ensembleName = ensemble.name

  // Delete any stale session-start notifications from this host for this ensemble,
  // then create fresh ones per-member. Upsert cannot be used here because the unique
  // constraint [actorId, type, activityId, ensembleId] is identical across all members,
  // causing each upsert to overwrite the previous member's notification.
  await db.notification.deleteMany({
    where: { actorId: userId, type: "ENSEMBLE_SESSION", ensembleId },
  })
  await Promise.allSettled([
    db.notification.createMany({
      data: nonOwnerMembers.map((m) => ({
        userId: m.userId,
        actorId: userId,
        type: "ENSEMBLE_SESSION" as const,
        ensembleId,
        body: ensembleName,
        isRead: false,
      })),
      skipDuplicates: true,
    }),
    // Push notifications
    ...nonOwnerMembers.map((m) =>
      sendPush(m.userId, {
        title: `🎵 ${ensembleName} — session starting!`,
        body: `${hostName} has started a session. Tap to join and accept.`,
        url: sessionUrl,
      }).catch(() => {})
    ),
  ])

  return NextResponse.json(newSession, { status: 201 })
  } catch (err) {
    console.error("[POST /api/ensemble/[id]/session]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
