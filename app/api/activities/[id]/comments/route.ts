import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendPush } from "@/lib/push"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    // Only return comments if activity is public or the viewer owns it
    const activity = await db.activity.findUnique({
      where: { id },
      select: { isPublic: true, userId: true },
    })
    if (!activity) return NextResponse.json([], { status: 200 })
    if (!activity.isPublic && activity.userId !== session?.user?.id) {
      return NextResponse.json([], { status: 200 })
    }

    const comments = await db.comment.findMany({
      where: { activityId: id },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true, image: true, profile: { select: { username: true } } } } },
    })
    return NextResponse.json(comments)
  } catch (err) {
    console.error("[GET /api/activities/[id]/comments]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { body } = await req.json()

    if (!body?.trim()) return NextResponse.json({ error: "Empty comment" }, { status: 400 })
    if (body.length > 500) return NextResponse.json({ error: "Too long" }, { status: 400 })

    // Verify the activity exists and commenter has access
    const activity = await db.activity.findUnique({
      where: { id },
      select: { isPublic: true, userId: true, title: true },
    })
    if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (!activity.isPublic && activity.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const actorId = session.user.id
    const comment = await db.comment.create({
      data: { userId: actorId, activityId: id, body: body.trim() },
      include: { user: { select: { name: true, image: true, profile: { select: { username: true } } } } },
    })

    if (activity.userId !== actorId) {
      const actor = await db.user.findUnique({ where: { id: actorId }, select: { name: true } })
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
        tag: `comment-${id}`,
      }).catch(() => {})
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    console.error("[POST /api/activities/[id]/comments]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
