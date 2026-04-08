export type Level = {
  name: string
  badge: string
  emoji: string
  threshold: number          // totalActivities needed to reach this level
  color: string              // Tailwind bg class for the bar fill
  textColor: string
}

export const LEVELS: Level[] = [
  { name: "Wanderer",    badge: "",            emoji: "🚶", threshold: 0,  color: "bg-muted/40",   textColor: "text-muted"       },
  { name: "Opus Prima",  badge: "Opus Prima",  emoji: "🎵", threshold: 1,  color: "bg-wave",        textColor: "text-wave"        },
  { name: "Repertoire",  badge: "Repertoire",  emoji: "🎼", threshold: 10, color: "bg-beat",        textColor: "text-beat"        },
  { name: "Gifted",      badge: "Gifted",      emoji: "✨", threshold: 20, color: "bg-purple-500",  textColor: "text-purple-600"  },
  { name: "Virtuoso",    badge: "Virtuoso",    emoji: "🏆", threshold: 30, color: "bg-yellow-400",  textColor: "text-yellow-600"  },
]

export function getProgress(totalActivities: number): {
  current: Level
  next: Level | null
  pct: number          // 0–1 fill within current level range
  clefs: number        // activities in current window
  clefsCap: number     // activities needed to reach next level from current
} {
  // Find the highest level achieved
  let currentIdx = 0
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalActivities >= LEVELS[i].threshold) { currentIdx = i; break }
  }

  const current = LEVELS[currentIdx]
  const next = LEVELS[currentIdx + 1] ?? null

  if (!next) {
    return { current, next: null, pct: 1, clefs: totalActivities, clefsCap: current.threshold }
  }

  const clefs = totalActivities - current.threshold
  const clefsCap = next.threshold - current.threshold
  const pct = Math.min(1, clefs / clefsCap)

  return { current, next, pct, clefs, clefsCap }
}
