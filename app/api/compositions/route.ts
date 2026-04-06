import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const compositions = await db.composition.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
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
}
