import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id

    const ensembles = await db.ensemble.findMany({
      where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(ensembles)
  } catch (err) {
    console.error("[GET /api/ensemble]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id

    const { name } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })
    if (name.trim().length > 50) return NextResponse.json({ error: "Name too long" }, { status: 400 })

    const ensemble = await db.ensemble.create({
      data: {
        name: name.trim(),
        ownerId: userId,
        members: { create: { userId, role: "OWNER" } },
      },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
    })

    return NextResponse.json(ensemble, { status: 201 })
  } catch (err) {
    console.error("[POST /api/ensemble]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
