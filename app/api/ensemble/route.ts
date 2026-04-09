import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// GET /api/ensemble — list ensembles the current user belongs to
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const ensembles = await db.ensemble.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      _count: { select: { sessions: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(ensembles)
}

// POST /api/ensemble — create a new ensemble
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const ensemble = await db.ensemble.create({
    data: {
      name: name.trim(),
      ownerId: userId,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  })

  return NextResponse.json(ensemble, { status: 201 })
}
