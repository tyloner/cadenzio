import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { db } from "@/lib/db"

export const runtime = "nodejs"

const GENRE_COLORS: Record<string, [string, string]> = {
  blues:      ["#1D4ED8", "#DBEAFE"],
  classical:  ["#7C3AED", "#EDE9FE"],
  jazz:       ["#B45309", "#FEF3C7"],
  ambient:    ["#0F766E", "#CCFBF1"],
  electronic: ["#BE185D", "#FCE7F3"],
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let activity
  try {
    activity = await db.activity.findUnique({
      where: { id, isPublic: true },
      select: {
        title: true,
        distanceM: true,
        durationSec: true,
        user: { select: { name: true } },
        composition: { select: { genre: true, scale: true, instrument: true, bpmAvg: true } },
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }

  if (!activity) {
    return new Response("Not found", { status: 404 })
  }

  const genre = activity.composition?.genre ?? "classical"
  const [accent, pale] = GENRE_COLORS[genre] ?? ["#14B8A6", "#CCFBF1"]

  const km = activity.distanceM ? `${(activity.distanceM / 1000).toFixed(1)} km` : null
  const dur = activity.durationSec
    ? `${Math.floor(activity.durationSec / 60)}m`
    : null
  const bpm = activity.composition?.bpmAvg
    ? `~${Math.round(activity.composition.bpmAvg)} BPM`
    : null

  const pills = [genre, activity.composition?.scale, activity.composition?.instrument]
    .filter(Boolean) as string[]

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F8FAFC",
          padding: "60px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: logo + genre badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: "#14B8A6",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
                <path d="M4 32 C4 32 9 20 13 18 C17 16 19 23 23 21 C27 19 29 13 32 9"
                  stroke="white" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                <circle cx="32" cy="9" r="4.5" fill="white" />
                <line x1="36" y1="9" x2="36" y2="27" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#0F172A" }}>Cadenzio</span>
          </div>
          <div style={{
            background: pale, color: accent,
            padding: "6px 18px", borderRadius: 999,
            fontSize: 18, fontWeight: 600, textTransform: "capitalize",
          }}>
            {genre}
          </div>
        </div>

        {/* Middle: title + composer */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Waveform decoration */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 48, marginBottom: 8 }}>
            {[18, 32, 26, 42, 30, 48, 22, 38, 28, 44, 20, 36, 24, 40, 32].map((h, i) => (
              <div key={i} style={{
                width: 10, height: h, borderRadius: 5,
                background: i % 3 === 0 ? accent : "#CBD5E1",
                opacity: 0.8,
              }} />
            ))}
          </div>
          <h1 style={{ fontSize: 64, fontWeight: 800, color: "#0F172A", margin: 0, lineHeight: 1.1 }}>
            {activity.title.length > 40 ? activity.title.slice(0, 38) + "…" : activity.title}
          </h1>
          <p style={{ fontSize: 28, color: "#64748B", margin: 0 }}>
            by {activity.user.name}
          </p>
        </div>

        {/* Bottom: stats + pills */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 32 }}>
            {[km && `📍 ${km}`, dur && `⏱ ${dur}`, bpm && `🎵 ${bpm}`]
              .filter(Boolean)
              .map((s) => (
                <span key={s} style={{ fontSize: 22, color: "#475569", fontWeight: 500 }}>{s}</span>
              ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {pills.slice(0, 3).map((p) => (
              <span key={p} style={{
                background: "#F1F5F9", color: "#64748B",
                padding: "6px 16px", borderRadius: 999,
                fontSize: 18, fontWeight: 500, textTransform: "capitalize",
              }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    }
  )
}
