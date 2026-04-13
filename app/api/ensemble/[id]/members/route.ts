import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { sendPush } from "@/lib/push"

// POST /api/ensemble/[id]/members — invite user by username
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id
    const { id: ensembleId } = await params

    // Only owner can invite
    const ensemble = await db.ensemble.findUnique({
      where: { id: ensembleId },
      select: { id: true, name: true, ownerId: true },
    })
    if (!ensemble) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (ensemble.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const currentCount = await db.ensembleMember.count({ where: { ensembleId } })
    if (currentCount >= 4) return NextResponse.json({ error: "Ensemble is full (max 4 members)" }, { status: 400 })

    const { username } = await req.json()
    if (!username?.trim()) return NextResponse.json({ error: "Username required" }, { status: 400 })

    const profile = await db.profile.findUnique({
      where: { username: username.trim() },
      select: { userId: true, username: true, user: { select: { id: true, name: true, image: true } } },
    })
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (profile.userId === userId) return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 })

    const existing = await db.ensembleMember.findUnique({
      where: { ensembleId_userId: { ensembleId, userId: profile.userId } },
    })
    if (existing) return NextResponse.json({ error: "Already a member" }, { status: 400 })

    const [member, actor] = await Promise.all([
      db.ensembleMember.create({
        data: { ensembleId, userId: profile.userId, role: "MEMBER" },
        include: { user: { select: { id: true, name: true, image: true } } },
      }),
      db.user.findUnique({ where: { id: userId }, select: { name: true } }),
    ])

    // In-app notification — upsert so re-inviting updates rather than errors
    await db.notification.upsert({
      where: {
        actorId_type_activityId_ensembleId: {
          actorId: userId,
          type: "ENSEMBLE_INVITE",
          activityId: null as unknown as string,
          ensembleId,
        },
      },
      create: {
        userId: profile.userId,
        actorId: userId,
        type: "ENSEMBLE_INVITE",
        ensembleId,
        body: ensemble.name,
        isRead: false,
      },
      update: { isRead: false, createdAt: new Date() },
    })

    // Push notification (best-effort)
    sendPush(profile.userId, {
      title: "Ensemble invitation",
      body: `${actor?.name ?? "Someone"} added you to "${ensemble.name}"`,
      url: `/ensemble/${ensembleId}`,
    }).catch(() => {})

    return NextResponse.json(member, { status: 201 })
  } catch (err) {
    console.error("[POST /api/ensemble/[id]/members]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
