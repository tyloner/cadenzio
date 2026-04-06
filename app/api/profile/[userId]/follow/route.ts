import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { userId: followingId } = await params
  if (followingId === session.user.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
  }

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId } },
  })

  if (existing) {
    // Unfollow
    await db.follow.delete({
      where: { followerId_followingId: { followerId: session.user.id, followingId } },
    })
    return NextResponse.json({ following: false })
  } else {
    // Follow + notify
    await db.follow.create({ data: { followerId: session.user.id, followingId } })
    // Replace any existing FOLLOW notif from this actor so it surfaces as new
    await db.notification.deleteMany({
      where: { actorId: session.user.id, userId: followingId, type: "FOLLOW" },
    })
    await db.notification.create({
      data: { userId: followingId, actorId: session.user.id, type: "FOLLOW" },
    })
    return NextResponse.json({ following: true })
  }
}
