export type ChallengeId = "repertoire" | "gifted" | "virtuoso"

export type LevelCondition = {
  compositions: number
  scales?: number        // must use N distinct scales
  instruments?: number   // must use N distinct instruments (AND for basic, OR alternative)
  scalesOrInstruments?: { scales: number; instruments: number } // satisfy EITHER
}

export type Level = {
  name: string
  badge: string
  emoji: string
  color: string       // Tailwind bg class for bar fill
  textColor: string
  /** Requirement to ENTER this level (null = starting level) */
  requirement: LevelCondition | null
  /** At which composition count to reveal the challenge for the NEXT level */
  revealAt: number | null
  /** Key used in revealedChallenges array */
  challengeId: ChallengeId | null
}

export const LEVELS: Level[] = [
  {
    name: "Wanderer",
    badge: "",
    emoji: "🚶",
    color: "bg-muted/40",
    textColor: "text-muted",
    requirement: null,
    revealAt: null,
    challengeId: null,
  },
  {
    name: "Opus Prima",
    badge: "Opus Prima",
    emoji: "🎵",
    color: "bg-wave",
    textColor: "text-wave",
    requirement: { compositions: 1 },
    revealAt: 15,           // reveal Repertoire challenge at 15 compositions
    challengeId: "repertoire",
  },
  {
    name: "Repertoire",
    badge: "Repertoire",
    emoji: "🎼",
    color: "bg-beat",
    textColor: "text-beat",
    requirement: {
      compositions: 20,
      scales: 5,
      instruments: 2,       // AND: need both scales AND instruments
    },
    revealAt: 25,           // reveal Gifted challenge at 25 compositions
    challengeId: "gifted",
  },
  {
    name: "Gifted",
    badge: "Gifted",
    emoji: "✨",
    color: "bg-purple-500",
    textColor: "text-purple-600",
    requirement: {
      compositions: 35,
      scalesOrInstruments: { scales: 10, instruments: 4 }, // OR
    },
    revealAt: 40,           // reveal Virtuoso challenge at 40 compositions
    challengeId: "virtuoso",
  },
  {
    name: "Virtuoso",
    badge: "Virtuoso",
    emoji: "🏆",
    color: "bg-yellow-400",
    textColor: "text-yellow-600",
    requirement: {
      compositions: 50,
      scalesOrInstruments: { scales: 15, instruments: 4 }, // all 4 instruments OR 15 scales
    },
    revealAt: null,
    challengeId: null,
  },
]

export type ConditionStatus = {
  type: "compositions" | "scales" | "instruments" | "scales_or_instruments"
  label: string
  current: number
  required: number
  met: boolean
  isOr?: boolean        // true = this is part of an OR group
  orMet?: boolean       // true = the OR pair is satisfied (either branch)
}

export type LevelProgressData = {
  current: Level
  next: Level | null
  /** 0–1 fill of the composition bar */
  compositionPct: number
  compositionCurrent: number
  compositionRequired: number
  /** Condition pills (scales/instruments), null if challenge not yet revealed */
  conditions: ConditionStatus[] | null
  /** Whether the challenge for next level is revealed */
  challengeRevealed: boolean
  /** Whether all conditions (including secret ones) to reach next level are met */
  allConditionsMet: boolean
  /** Newly unlocked badges based on current stats */
  earnedBadges: string[]
}

export function evaluateLevels(
  totalActivities: number,
  uniqueScales: number,
  uniqueInstruments: number,
  revealedChallenges: string[],
): LevelProgressData {
  // Find the highest level achieved
  let currentIdx = 0
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const req = LEVELS[i].requirement
    if (!req) { currentIdx = 0; continue }
    if (meetsRequirement(req, totalActivities, uniqueScales, uniqueInstruments)) {
      currentIdx = i
      break
    }
  }

  const current = LEVELS[currentIdx]
  const next = LEVELS[currentIdx + 1] ?? null

  // Composition progress within the current → next window
  const compStart = current.requirement?.compositions ?? 0
  const compEnd   = next?.requirement?.compositions ?? compStart
  const compositionPct = next
    ? Math.min(1, (totalActivities - compStart) / Math.max(1, compEnd - compStart))
    : 1
  const compositionCurrent  = totalActivities
  const compositionRequired = compEnd

  // Secret challenge visibility
  const challengeId = current.challengeId
  const challengeRevealed = !challengeId || revealedChallenges.includes(challengeId)

  // Build condition pills for the next level
  let conditions: ConditionStatus[] | null = null
  if (next?.requirement && challengeRevealed) {
    conditions = buildConditions(next.requirement, totalActivities, uniqueScales, uniqueInstruments)
  }

  const allConditionsMet = next
    ? meetsRequirement(next.requirement!, totalActivities, uniqueScales, uniqueInstruments)
    : true

  // Earned badges
  const earnedBadges = LEVELS.slice(1)
    .filter((l) => l.requirement && meetsRequirement(l.requirement, totalActivities, uniqueScales, uniqueInstruments))
    .map((l) => l.badge)

  return {
    current,
    next,
    compositionPct,
    compositionCurrent,
    compositionRequired,
    conditions,
    challengeRevealed,
    allConditionsMet,
    earnedBadges,
  }
}

function meetsRequirement(
  req: LevelCondition,
  compositions: number,
  scales: number,
  instruments: number,
): boolean {
  if (compositions < req.compositions) return false
  if (req.scales !== undefined && scales < req.scales) return false
  if (req.instruments !== undefined && instruments < req.instruments) return false
  if (req.scalesOrInstruments) {
    const { scales: reqS, instruments: reqI } = req.scalesOrInstruments
    if (scales < reqS && instruments < reqI) return false
  }
  return true
}

function buildConditions(
  req: LevelCondition,
  compositions: number,
  scales: number,
  instruments: number,
): ConditionStatus[] {
  const out: ConditionStatus[] = []

  out.push({
    type: "compositions",
    label: "compositions",
    current: compositions,
    required: req.compositions,
    met: compositions >= req.compositions,
  })

  if (req.scales !== undefined) {
    out.push({
      type: "scales",
      label: "scales",
      current: scales,
      required: req.scales,
      met: scales >= req.scales,
    })
  }

  if (req.instruments !== undefined) {
    out.push({
      type: "instruments",
      label: "instruments",
      current: instruments,
      required: req.instruments,
      met: instruments >= req.instruments,
    })
  }

  if (req.scalesOrInstruments) {
    const { scales: reqS, instruments: reqI } = req.scalesOrInstruments
    const orMet = scales >= reqS || instruments >= reqI
    out.push({
      type: "scales",
      label: "scales",
      current: scales,
      required: reqS,
      met: scales >= reqS,
      isOr: true,
      orMet,
    })
    out.push({
      type: "instruments",
      label: "instruments",
      current: instruments,
      required: reqI,
      met: instruments >= reqI,
      isOr: true,
      orMet,
    })
  }

  return out
}

/** Which challenge (if any) should be revealed given the NEW total */
export function checkNewReveal(
  newTotal: number,
  revealedChallenges: string[],
): ChallengeId | null {
  for (const level of LEVELS) {
    if (
      level.revealAt !== null &&
      level.challengeId !== null &&
      newTotal >= level.revealAt &&
      !revealedChallenges.includes(level.challengeId)
    ) {
      return level.challengeId
    }
  }
  return null
}

/** Human-readable description of a challenge requirement */
export function challengeDescription(challengeId: ChallengeId): string {
  const level = LEVELS.find((l) => l.challengeId === challengeId)
  if (!level?.requirement) return ""
  const req = level.requirement
  const parts: string[] = [`${req.compositions} compositions`]
  if (req.scales)       parts.push(`${req.scales} different scales`)
  if (req.instruments)  parts.push(`${req.instruments} different instruments`)
  if (req.scalesOrInstruments) {
    parts.push(`${req.scalesOrInstruments.scales} scales OR ${req.scalesOrInstruments.instruments} instruments`)
  }
  return parts.join(" · ")
}

/** Japanese description */
export function challengeDescriptionJa(challengeId: ChallengeId): string {
  const level = LEVELS.find((l) => l.challengeId === challengeId)
  if (!level?.requirement) return ""
  const req = level.requirement
  const parts: string[] = [`楽曲${req.compositions}曲`]
  if (req.scales)       parts.push(`異なる音階${req.scales}種類`)
  if (req.instruments)  parts.push(`異なる楽器${req.instruments}種類`)
  if (req.scalesOrInstruments) {
    parts.push(`音階${req.scalesOrInstruments.scales}種類または楽器${req.scalesOrInstruments.instruments}種類`)
  }
  return parts.join(' · ')
}
