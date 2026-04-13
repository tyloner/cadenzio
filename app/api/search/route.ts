import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const q = req.nextUrl.searchParams.get("q")?.trim()
    if (!q || q.length < 2 || q.length > 50) return NextResponse.json([])

    const userId = session.user.id

    const [results, following] = await Promise.all([
      db.profile.findMany({
        where: {
          isPublic: true,
          NOT: { userId }, // exclude self
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { user: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        take: 20,
        select: {
          username: true,
          totalActivities: true,
          user: { select: { id: true, name: true, image: true } },
        },
      }),
      db.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      }),
    ])

    const followingSet = new Set(following.map((f) => f.followingId))
    const withFollowStatus = results.map((r) => ({
      ...r,
      isFollowing: followingSet.has(r.user.id),
    }))

    return NextResponse.json(withFollowStatus)
  } catch (err) {
    console.error("[GET /api/search]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
