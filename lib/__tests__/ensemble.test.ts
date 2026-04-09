import { describe, it, expect } from "vitest"
import { haversineDistance } from "../utils"

// Proximity logic — mirrors what the lobby + start routes do server-side
function proximityCheck(
  locs: { lat: number; lng: number }[],
  thresholdM = 50
): boolean {
  for (let i = 0; i < locs.length; i++) {
    for (let j = i + 1; j < locs.length; j++) {
      if (haversineDistance(locs[i].lat, locs[i].lng, locs[j].lat, locs[j].lng) <= thresholdM) {
        return true
      }
    }
  }
  return false
}

describe("Ensemble proximity check", () => {
  // London: 51.5074° N, 0.1278° W
  // ~1m apart
  const a = { lat: 51.5074, lng: -0.1278 }
  const b = { lat: 51.50741, lng: -0.1278 }  // ~1m north
  // ~5km apart
  const c = { lat: 51.55, lng: -0.1278 }

  it("detects two users within 50m as ready", () => {
    expect(proximityCheck([a, b])).toBe(true)
  })

  it("rejects two users >50m apart", () => {
    expect(proximityCheck([a, c])).toBe(false)
  })

  it("returns true if at least one pair is within threshold (3 users)", () => {
    expect(proximityCheck([a, b, c])).toBe(true)
  })

  it("returns false with only one location", () => {
    expect(proximityCheck([a])).toBe(false)
  })

  it("returns false with empty locations", () => {
    expect(proximityCheck([])).toBe(false)
  })

  it("respects custom threshold", () => {
    // a and b are ~1m apart — should pass 10m threshold
    expect(proximityCheck([a, b], 10)).toBe(true)
    // a and c are ~5km apart — should fail even 1000m threshold
    expect(proximityCheck([a, c], 1000)).toBe(false)
  })
})

describe("Ensemble session cap", () => {
  it("trims GPS points beyond 2 minutes from session start", () => {
    const startMs = 1_000_000
    const capMs = startMs + 120_000
    const points = [
      { lat: 51.5, lng: -0.1, timestamp: startMs },
      { lat: 51.5001, lng: -0.1, timestamp: startMs + 60_000 },
      { lat: 51.5002, lng: -0.1, timestamp: startMs + 119_000 },
      { lat: 51.5003, lng: -0.1, timestamp: startMs + 121_000 }, // beyond cap
      { lat: 51.5004, lng: -0.1, timestamp: startMs + 150_000 }, // beyond cap
    ]
    const trimmed = points.filter((p) => p.timestamp <= capMs)
    expect(trimmed).toHaveLength(3)
    expect(trimmed[trimmed.length - 1].timestamp).toBeLessThanOrEqual(capMs)
  })
})
