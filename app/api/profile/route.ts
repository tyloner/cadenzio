import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { bio, country, musicalInterests, username, units, language } = await req.json()

    const data: Record<string, unknown> = {}

    if (bio !== undefined) {
      if (typeof bio !== "string" || bio.length > 300) return NextResponse.json({ error: "Bio too long" }, { status: 400 })
      data.bio = bio.trim()
    }
    if (country !== undefined) {
      data.country = typeof country === "string" && country.length > 0 ? country.slice(0, 100) : null
    }
    if (Array.isArray(musicalInterests)) {
      data.musicalInterests = (musicalInterests as unknown[]).filter((i) => typeof i === "string").slice(0, 10)
    }
    if (units === "metric" || units === "imperial") data.units = units
    if (language === "en" || language === "ja") data.language = language

    if (username !== undefined) {
      const trimmed = (username as string).trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
      if (trimmed.length < 3) return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 })
      if (trimmed.length > 30) return NextResponse.json({ error: "Username too long" }, { status: 400 })

      const existing = await db.profile.findFirst({
        where: { username: trimmed, NOT: { userId: session.user.id } },
      })
      if (existing) return NextResponse.json({ error: "Username already taken" }, { status: 409 })
      data.username = trimmed
    }

    await db.profile.updateMany({ where: { userId: session.user.id }, data })
    return NextResponse.json({ ok: true, username: data.username })
  } catch (err) {
    console.error("[PATCH /api/profile]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
