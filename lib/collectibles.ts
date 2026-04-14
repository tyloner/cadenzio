export type Rarity = "common" | "rare" | "legendary"

export type Collectible = {
  key: string
  name: string
  rarity: Rarity
  emoji: string
  bgColor: string
  textColor: string
  borderColor: string
  description: string
  weekIndex: number  // 0–11, position in the 12-week cycle
}

// The Lost Octave — one full chromatic octave from C3 to B3
export const COLLECTIBLES: Collectible[] = [
  {
    key: "C3",
    name: "The Foundation",
    rarity: "common",
    emoji: "🪨",
    bgColor: "bg-slate-100",
    textColor: "text-slate-700",
    borderColor: "border-slate-300",
    description: "Every melody begins somewhere. This is where it starts.",
    weekIndex: 0,
  },
  {
    key: "C#3",
    name: "Shadow Note",
    rarity: "rare",
    emoji: "🌑",
    bgColor: "bg-indigo-100",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-300",
    description: "Heard between the cracks of ordinary walks.",
    weekIndex: 1,
  },
  {
    key: "D3",
    name: "The Wanderer",
    rarity: "common",
    emoji: "🚶",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
    description: "A note that never stays still for long.",
    weekIndex: 2,
  },
  {
    key: "Eb3",
    name: "Twilight",
    rarity: "rare",
    emoji: "🌆",
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
    borderColor: "border-orange-300",
    description: "The sound of the day giving way to night.",
    weekIndex: 3,
  },
  {
    key: "E3",
    name: "The Meadow",
    rarity: "common",
    emoji: "🌿",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    borderColor: "border-green-300",
    description: "Open and clear, like a path through grass.",
    weekIndex: 4,
  },
  {
    key: "F3",
    name: "The Bridge",
    rarity: "common",
    emoji: "🌉",
    bgColor: "bg-cyan-100",
    textColor: "text-cyan-700",
    borderColor: "border-cyan-300",
    description: "Connects two shores of the same river.",
    weekIndex: 5,
  },
  {
    key: "F#3",
    name: "Midnight",
    rarity: "rare",
    emoji: "🌃",
    bgColor: "bg-violet-100",
    textColor: "text-violet-700",
    borderColor: "border-violet-300",
    description: "Only appears when the streets are quiet.",
    weekIndex: 6,
  },
  {
    key: "G3",
    name: "The Compass",
    rarity: "common",
    emoji: "🧭",
    bgColor: "bg-teal-100",
    textColor: "text-teal-700",
    borderColor: "border-teal-300",
    description: "Points you toward something you can't name.",
    weekIndex: 7,
  },
  {
    key: "Ab3",
    name: "Dusk",
    rarity: "rare",
    emoji: "🌇",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
    borderColor: "border-amber-300",
    description: "A fleeting colour in the sky, gone before you can describe it.",
    weekIndex: 8,
  },
  {
    key: "A3",
    name: "The Echo",
    rarity: "common",
    emoji: "🔊",
    bgColor: "bg-sky-100",
    textColor: "text-sky-700",
    borderColor: "border-sky-300",
    description: "You've heard this before, somewhere far away.",
    weekIndex: 9,
  },
  {
    key: "Bb3",
    name: "The Fog",
    rarity: "rare",
    emoji: "🌫️",
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
    borderColor: "border-gray-300",
    description: "Hard to find, easy to walk past.",
    weekIndex: 10,
  },
  {
    key: "B3",
    name: "The Summit",
    rarity: "legendary",
    emoji: "🏔️",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-400",
    description: "The highest note of the Lost Octave. Few have found it.",
    weekIndex: 11,
  },
]

/** ISO week string, e.g. "2026-W15" */
export function getWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}

/** Which collectible is active this week (deterministic, global) */
export function getActiveCollectible(date = new Date()): Collectible {
  const epochWeek = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000))
  return COLLECTIBLES[epochWeek % COLLECTIBLES.length]
}

/** Expiry = next Monday 00:00 UTC */
export function getWeekExpiry(date = new Date()): Date {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7  // Mon=1 … Sun=7
  const daysUntilMonday = 8 - day
  d.setUTCDate(d.getUTCDate() + daysUntilMonday)
  return d
}

/**
 * Place a note at a random point within radiusM metres of (lat, lng).
 * Uses a seeded LCG so the same user+week always produces the same spot.
 */
export function randomOffsetWithinRadius(
  lat: number,
  lng: number,
  radiusM: number,
  seed: number,
): { lat: number; lng: number } {
  let s = seed | 0
  const next = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
  const angle = next() * 2 * Math.PI
  const r = radiusM * Math.sqrt(next())   // sqrt = uniform distribution in circle
  const dLat = (r * Math.cos(angle)) / 111_320
  const dLng = (r * Math.sin(angle)) / (111_320 * Math.cos((lat * Math.PI) / 180))
  return { lat: lat + dLat, lng: lng + dLng }
}

/** Rough distance ring label for the clue — never reveals exact distance */
export function distanceRing(metres: number): { label: string; ring: "hot" | "warm" | "cold" | "freezing" } {
  if (metres < 100)  return { label: "You're very close — within 100m",   ring: "hot"      }
  if (metres < 300)  return { label: "Close — within 300m",               ring: "warm"     }
  if (metres < 600)  return { label: "Getting warmer — within 600m",      ring: "warm"     }
  if (metres < 1000) return { label: "Within 1km — keep walking",         ring: "cold"     }
  return                    { label: "Far away — explore your area",       ring: "freezing" }
}
