import { NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * GET /api/cron/cleanup
 * Runs weekly (Monday 03:00 UTC via vercel.json cron).
 * Deletes expired HiddenNote rows that were never captured.
 * Captured notes are kept indefinitely — they are part of the user's album.
 */
export async function GET(req: Request) {
  // Vercel signs cron requests with CRON_SECRET; reject anything else in production.
  const authHeader = req.headers.get("authorization")
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // Delete uncaptured notes whose week has passed
  const { count } = await db.hiddenNote.deleteMany({
    where: {
      expiresAt: { lt: now },
      capture: null,
    },
  })

  return NextResponse.json({ deleted: count, at: now.toISOString() })
}
