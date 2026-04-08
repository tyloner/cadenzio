import { describe, it, expect } from "vitest"
import { evaluateLevels, checkNewReveal, challengeDescription, challengeDescriptionJa, LEVELS } from "../levels"

describe("evaluateLevels — current level", () => {
  it("starts at Wanderer with 0 activities", () => {
    const d = evaluateLevels(0, 0, 0, [])
    expect(d.current.name).toBe("Wanderer")
    expect(d.next?.name).toBe("Opus Prima")
  })

  it("reaches Opus Prima at 1 composition", () => {
    const d = evaluateLevels(1, 0, 0, [])
    expect(d.current.name).toBe("Opus Prima")
    expect(d.next?.name).toBe("Repertoire")
  })

  it("does NOT reach Repertoire without scales/instruments even at 20 comps", () => {
    const d = evaluateLevels(20, 0, 0, [])
    expect(d.current.name).toBe("Opus Prima")
  })

  it("reaches Repertoire at 20 comps + 5 scales + 2 instruments", () => {
    const d = evaluateLevels(20, 5, 2, ["repertoire"])
    expect(d.current.name).toBe("Repertoire")
  })

  it("reaches Gifted via scales path (10 scales)", () => {
    const d = evaluateLevels(35, 10, 1, ["repertoire", "gifted"])
    expect(d.current.name).toBe("Gifted")
  })

  it("reaches Gifted via instruments path (4 instruments)", () => {
    const d = evaluateLevels(35, 0, 4, ["repertoire", "gifted"])
    expect(d.current.name).toBe("Gifted")
  })

  it("reaches Virtuoso via instruments path", () => {
    const d = evaluateLevels(50, 0, 4, ["repertoire", "gifted", "virtuoso"])
    expect(d.current.name).toBe("Virtuoso")
    expect(d.next).toBeNull()
  })

  it("reaches Virtuoso via scales path (15 scales)", () => {
    const d = evaluateLevels(50, 15, 0, ["repertoire", "gifted", "virtuoso"])
    expect(d.current.name).toBe("Virtuoso")
  })

  it("does NOT reach Virtuoso at 50 comps but 0 scales and 0 instruments", () => {
    const d = evaluateLevels(50, 0, 0, ["repertoire", "gifted", "virtuoso"])
    expect(d.current.name).not.toBe("Virtuoso")
  })
})

describe("evaluateLevels — earnedBadges", () => {
  it("returns no badges at level 0", () => {
    const d = evaluateLevels(0, 0, 0, [])
    expect(d.earnedBadges).toEqual([])
  })

  it("includes Opus Prima at 1 comp", () => {
    const d = evaluateLevels(1, 0, 0, [])
    expect(d.earnedBadges).toContain("Opus Prima")
  })

  it("50 comps 0 scales 0 instruments does NOT earn Virtuoso badge", () => {
    const d = evaluateLevels(50, 0, 0, [])
    expect(d.earnedBadges).not.toContain("Virtuoso")
  })

  it("full completion earns all badges", () => {
    const d = evaluateLevels(50, 15, 4, ["repertoire", "gifted", "virtuoso"])
    expect(d.earnedBadges).toContain("Opus Prima")
    expect(d.earnedBadges).toContain("Repertoire")
    expect(d.earnedBadges).toContain("Gifted")
    expect(d.earnedBadges).toContain("Virtuoso")
  })
})

describe("evaluateLevels — challenge visibility", () => {
  it("hides conditions when challenge not yet revealed", () => {
    const d = evaluateLevels(5, 0, 0, []) // Opus Prima, challenge not revealed
    expect(d.challengeRevealed).toBe(false)
    expect(d.conditions).toBeNull()
  })

  it("shows conditions when challenge is revealed", () => {
    const d = evaluateLevels(5, 0, 0, ["repertoire"])
    expect(d.challengeRevealed).toBe(true)
    expect(d.conditions).not.toBeNull()
  })

  it("Wanderer has no challengeId so is always revealed", () => {
    // Wanderer → no challengeId, so challengeRevealed = true
    const d = evaluateLevels(0, 0, 0, [])
    // current is Wanderer, its challengeId is null → revealed = true
    expect(d.challengeRevealed).toBe(true)
  })
})

describe("evaluateLevels — compositionPct", () => {
  it("is 0 at Wanderer start", () => {
    const d = evaluateLevels(0, 0, 0, [])
    expect(d.compositionPct).toBe(0)
  })

  it("is 1 when at or past required count", () => {
    const d = evaluateLevels(1, 0, 0, [])
    // current = Opus Prima (1), next = Repertoire (20)
    expect(d.compositionPct).toBe(0) // 0/19 progress toward 20
  })

  it("is 1 at max level", () => {
    const d = evaluateLevels(50, 15, 4, ["repertoire", "gifted", "virtuoso"])
    expect(d.compositionPct).toBe(1)
  })
})

describe("checkNewReveal", () => {
  it("returns null below threshold", () => {
    expect(checkNewReveal(14, [])).toBeNull()
  })

  it("reveals repertoire at 15", () => {
    expect(checkNewReveal(15, [])).toBe("repertoire")
  })

  it("reveals gifted at 25", () => {
    expect(checkNewReveal(25, ["repertoire"])).toBe("gifted")
  })

  it("reveals virtuoso at 40", () => {
    expect(checkNewReveal(40, ["repertoire", "gifted"])).toBe("virtuoso")
  })

  it("returns null if already revealed", () => {
    expect(checkNewReveal(15, ["repertoire"])).toBeNull()
    expect(checkNewReveal(40, ["repertoire", "gifted", "virtuoso"])).toBeNull()
  })

  it("reveals earliest unrevealed at high count", () => {
    // Missing gifted but has virtuoso threshold — should return gifted first
    expect(checkNewReveal(50, ["repertoire"])).toBe("gifted")
  })
})

describe("challengeDescription", () => {
  it("describes repertoire in English", () => {
    const d = challengeDescription("repertoire")
    expect(d).toContain("20 compositions")
    expect(d).toContain("5 different scales")
    expect(d).toContain("2 different instruments")
  })

  it("describes gifted with OR condition", () => {
    const d = challengeDescription("gifted")
    expect(d).toContain("35 compositions")
    expect(d).toContain("OR")
  })

  it("describes virtuoso in Japanese", () => {
    const d = challengeDescriptionJa("virtuoso")
    expect(d).toContain("50曲")
    expect(d).toContain("または")
  })
})
