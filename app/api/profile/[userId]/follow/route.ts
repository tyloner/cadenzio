import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { userId: followingId } = await params
    if (followingId === session.user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    // Check if target user exists
    const target = await db.user.findUnique({ where: { id: followingId }, select: { id: true } })
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const existing = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId } },
    })

    if (existing) {
      // Unfollow
      await db.follow.delete({
        where: { followerId_followingId: { followerId: session.user.id, followingId } },
      })
      return NextResponse.json({ following: false })
    }

    // Follow — upsert is atomic so concurrent requests don't create duplicates
    await db.follow.upsert({
      where: { followerId_followingId: { followerId: session.user.id, followingId } },
      create: { followerId: session.user.id, followingId },
      update: {},
    })

    // Replace any existing FOLLOW notif from this actor so it surfaces as new
    await db.notification.deleteMany({
      where: { actorId: session.user.id, userId: followingId, type: "FOLLOW" },
    })
    await db.notification.create({
      data: { userId: followingId, actorId: session.user.id, type: "FOLLOW" },
    })

    return NextResponse.json({ following: true })
  } catch (err) {
    console.error("[POST /api/profile/[userId]/follow]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
