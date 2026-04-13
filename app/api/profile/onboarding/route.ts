import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await db.profile.updateMany({
      where: { userId: session.user.id },
      data: { onboardingDone: true },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[POST /api/profile/onboarding]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
