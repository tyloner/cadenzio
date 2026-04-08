import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        actor: { select: { name: true, image: true } },
        activity: { select: { id: true, title: true } },
      },
    }),
    db.notification.count({ where: { userId: session.user.id, isRead: false } }),
  ])

  return NextResponse.json({ notifications, unreadCount })
}
