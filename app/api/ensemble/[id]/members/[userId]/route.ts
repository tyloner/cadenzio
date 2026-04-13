import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const currentUserId = session.user.id
    const { id: ensembleId, userId: targetUserId } = await params

    const ensemble = await db.ensemble.findUnique({ where: { id: ensembleId } })
    if (!ensemble) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (currentUserId !== ensemble.ownerId && currentUserId !== targetUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (targetUserId === ensemble.ownerId) {
      return NextResponse.json({ error: "Owner cannot leave" }, { status: 400 })
    }
    await db.ensembleMember.delete({
      where: { ensembleId_userId: { ensembleId, userId: targetUserId } },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[DELETE /api/ensemble/[id]/members/[userId]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
