import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const activity = await db.activity.findUnique({ where: { id }, select: { userId: true } })

  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (activity.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const data: { title?: string; isPublic?: boolean } = {}

  if (typeof body.title === "string") {
    const title = body.title.trim()
    if (!title) return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 })
    if (title.length > 100) return NextResponse.json({ error: "Title too long" }, { status: 400 })
    data.title = title
  }

  if (typeof body.isPublic === "boolean") {
    data.isPublic = body.isPublic
  }

  const updated = await db.activity.update({ where: { id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const activity = await db.activity.findUnique({ where: { id }, select: { userId: true } })

  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (activity.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await db.activity.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
