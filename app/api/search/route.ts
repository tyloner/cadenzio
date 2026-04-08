import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const results = await db.profile.findMany({
    where: {
      isPublic: true,
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
  })

  return NextResponse.json(results)
}
