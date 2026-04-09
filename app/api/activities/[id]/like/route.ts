import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendPush } from "@/lib/push"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const actorId = session.user.id

  await db.like.upsert({
    where: { userId_activityId: { userId: actorId, activityId: id } },
    create: { userId: actorId, activityId: id },
    update: {},
  })

  // Notify activity owner (skip self-like)
  const [activity, actor] = await Promise.all([
    db.activity.findUnique({ where: { id }, select: { userId: true, title: true } }),
    db.user.findUnique({ where: { id: actorId }, select: { name: true } }),
  ])
  if (activity && activity.userId !== actorId) {
    await db.notification.upsert({
      where: { actorId_type_activityId: { actorId, type: "LIKE", activityId: id } },
      create: { userId: activity.userId, actorId, type: "LIKE", activityId: id },
      update: { isRead: false, createdAt: new Date() },
    })
    sendPush(activity.userId, {
      title: "New like",
      body: `${actor?.name ?? "Someone"} liked "${activity.title}"`,
      url: `/activity/${id}`,
    }).catch(() => { /* best-effort — don't fail the request */ })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await db.like.deleteMany({
    where: { userId: session.user.id, activityId: id },
  })
  return NextResponse.json({ ok: true })
}
