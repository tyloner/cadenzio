import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params
  const s = Math.min(Math.max(parseInt(size) || 192, 16), 1024)
  const r = Math.round(s * 0.18) // border-radius

  return new ImageResponse(
    (
      <div
        style={{
          width: s,
          height: s,
          background: "#14B8A6",
          borderRadius: r,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={s * 0.58}
          height={s * 0.58}
          viewBox="0 0 40 40"
          fill="none"
        >
          {/* Waveform path */}
          <path
            d="M4 32 C4 32 9 20 13 18 C17 16 19 23 23 21 C27 19 29 13 32 9"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Note head */}
          <circle cx="32" cy="9" r="4.5" fill="white" />
          {/* Note stem */}
          <line x1="36" y1="9" x2="36" y2="27" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { width: s, height: s }
  )
}
