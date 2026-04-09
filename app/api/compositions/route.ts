import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const compositions = await db.composition.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          startedAt: true,
          distanceM: true,
          durationSec: true,
          isPublic: true,
        },
      },
    },
  })

  return NextResponse.json(compositions)
  } catch (err) {
    console.error("[GET /api/compositions]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
