import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendPush } from "@/lib/push"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const comments = await db.comment.findMany({
    where: { activityId: id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true, image: true, profile: { select: { username: true } } } } },
  })
  return NextResponse.json(comments)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { body } = await req.json()

  if (!body?.trim()) return NextResponse.json({ error: "Empty comment" }, { status: 400 })
  if (body.length > 500) return NextResponse.json({ error: "Too long" }, { status: 400 })

  const actorId = session.user.id
  const comment = await db.comment.create({
    data: { userId: actorId, activityId: id, body: body.trim() },
    include: { user: { select: { name: true, image: true, profile: { select: { username: true } } } } },
  })

  // Notify activity owner (skip self-comment)
  const [activity, actor] = await Promise.all([
    db.activity.findUnique({ where: { id }, select: { userId: true, title: true } }),
    db.user.findUnique({ where: { id: actorId }, select: { name: true } }),
  ])
  if (activity && activity.userId !== actorId) {
    await db.notification.create({
      data: {
        userId: activity.userId,
        actorId,
        type: "COMMENT",
        activityId: id,
        body: body.trim().slice(0, 100),
      },
    })
    sendPush(activity.userId, {
      title: "New comment",
      body: `${actor?.name ?? "Someone"}: "${body.trim().slice(0, 80)}"`,
      url: `/activity/${id}`,
    })
  }

  return NextResponse.json(comment, { status: 201 })
}
