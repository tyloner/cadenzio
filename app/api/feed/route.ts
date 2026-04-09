import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const myId = session.user.id
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor") // ISO date string of last activity's startedAt
  const take = 20

  const following = await db.follow.findMany({
    where: { followerId: myId },
    select: { followingId: true },
  })
  const followingIds = following.map((f) => f.followingId)

  const activities = await db.activity.findMany({
    where: {
      OR: [
        { userId: myId },
        { userId: { in: followingIds }, isPublic: true },
      ],
      ...(cursor ? { startedAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { startedAt: "desc" },
    take: take + 1, // fetch one extra to know if there's a next page
    include: {
      user: { select: { name: true, image: true } },
      composition: { select: { genre: true, scale: true, audioUrl: true, instrument: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  const hasMore = activities.length > take
  const page = activities.slice(0, take)
  const nextCursor = hasMore ? page[page.length - 1].startedAt.toISOString() : null

  return NextResponse.json({ activities: page, nextCursor })
  } catch (err) {
    console.error("[GET /api/feed]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
