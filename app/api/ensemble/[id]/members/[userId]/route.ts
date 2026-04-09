import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// DELETE /api/ensemble/[id]/members/[userId] — remove member (owner) or leave (self)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const currentUserId = session.user.id
  const { id: ensembleId, userId: targetUserId } = await params

  const ensemble = await db.ensemble.findUnique({ where: { id: ensembleId } })
  if (!ensemble) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Owner can remove anyone; members can only remove themselves
  if (currentUserId !== ensemble.ownerId && currentUserId !== targetUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  // Owner cannot remove themselves (must delete ensemble instead)
  if (targetUserId === ensemble.ownerId) {
    return NextResponse.json({ error: "Owner cannot leave — delete the ensemble instead" }, { status: 400 })
  }

  await db.ensembleMember.delete({
    where: { ensembleId_userId: { ensembleId, userId: targetUserId } },
  })

  return NextResponse.json({ ok: true })
}
