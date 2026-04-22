"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

const GLYPHS = ["♩", "♪", "♫", "♬"]

interface Note {
  id: number
  x: number   // vw %
  y: number   // vh %
  glyph: string
  nx: string  // CSS --nx value (translate destination)
  ny: string  // CSS --ny value
}

function randomNote(id: number): Note {
  // Pick a random edge to hide toward
  const edge = Math.floor(Math.random() * 4) // 0=top 1=right 2=bottom 3=left
  const x = 8 + Math.random() * 78  // keep away from extreme corners
  const y = 15 + Math.random() * 65 // between header and nav

  const dist = 80 + Math.random() * 60
  const scatter = (Math.random() - 0.5) * 40
  let nx = "0px", ny = "0px"
  if (edge === 0) { nx = `${scatter}px`; ny = `${-dist}px` }
  if (edge === 1) { nx = `${dist}px`;    ny = `${scatter}px` }
  if (edge === 2) { nx = `${scatter}px`; ny = `${dist}px` }
  if (edge === 3) { nx = `${-dist}px`;   ny = `${scatter}px` }

  return {
    id,
    x,
    y,
    glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
    nx,
    ny,
  }
}

export function ScurryingNotes() {
  const pathname = usePathname()
  const [notes, setNotes] = useState<Note[]>([])
  const idRef = useRef(0)
  const isFirst = useRef(true)

  useEffect(() => {
    // Skip the very first mount — only fire on actual navigation
    if (isFirst.current) { isFirst.current = false; return }
    // Suppress during recording — GPS battery/performance sensitive screen
    if (pathname === "/record") return

    const count = 2 + Math.floor(Math.random() * 2) // 2–3 notes
    setNotes(
      Array.from({ length: count }, () => randomNote(++idRef.current))
    )

    const t = setTimeout(() => setNotes([]), 900)
    return () => clearTimeout(t)
  }, [pathname])

  if (notes.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[99] overflow-hidden" aria-hidden>
      {notes.map((n) => (
        <span
          key={n.id}
          className="note-hide absolute select-none text-[15px] text-ink opacity-0"
          style={{
            left: `${n.x}%`,
            top: `${n.y}%`,
            "--nx": n.nx,
            "--ny": n.ny,
          } as React.CSSProperties}
        >
          {n.glyph}
        </span>
      ))}
    </div>
  )
}
