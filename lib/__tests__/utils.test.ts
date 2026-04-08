import { describe, it, expect } from "vitest"
import { formatDuration, formatDistance, haversineDistance, computeBearing, timeAgo } from "../utils"

describe("formatDuration", () => {
  it("formats sub-minute as 0:ss", () => {
    expect(formatDuration(0)).toBe("0:00")
    expect(formatDuration(9)).toBe("0:09")
    expect(formatDuration(59)).toBe("0:59")
  })

  it("formats minutes correctly", () => {
    expect(formatDuration(60)).toBe("1:00")
    expect(formatDuration(90)).toBe("1:30")
    expect(formatDuration(3599)).toBe("59:59")
  })

  it("formats hours correctly", () => {
    expect(formatDuration(3600)).toBe("1:00:00")
    expect(formatDuration(3661)).toBe("1:01:01")
    expect(formatDuration(7322)).toBe("2:02:02")
  })
})

describe("formatDistance", () => {
  it("metric: metres under 1000", () => {
    expect(formatDistance(0)).toBe("0 m")
    expect(formatDistance(500)).toBe("500 m")
    expect(formatDistance(999)).toBe("999 m")
  })

  it("metric: kilometres at 1000+", () => {
    expect(formatDistance(1000)).toBe("1.00 km")
    expect(formatDistance(5500)).toBe("5.50 km")
  })

  it("imperial: feet under 528", () => {
    expect(formatDistance(0, "imperial")).toBe("0 ft")
    expect(formatDistance(100, "imperial")).toBe("328 ft")
  })

  it("imperial: miles at 528+ feet", () => {
    // 528 ft = ~160.9 m
    const result = formatDistance(1609.34, "imperial")
    expect(result).toBe("1.00 mi")
  })
})

describe("haversineDistance", () => {
  it("returns 0 for same point", () => {
    expect(haversineDistance(51.5, -0.1, 51.5, -0.1)).toBe(0)
  })

  it("calculates approximate distance between two London landmarks", () => {
    // Buckingham Palace → Tower Bridge ~4.6 km (straight line)
    const d = haversineDistance(51.5014, -0.1419, 51.5055, -0.0754)
    expect(d).toBeGreaterThan(4000)
    expect(d).toBeLessThan(6000)
  })

  it("is symmetric", () => {
    const d1 = haversineDistance(48.8566, 2.3522, 51.5074, -0.1278)
    const d2 = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522)
    expect(Math.abs(d1 - d2)).toBeLessThan(1)
  })
})

describe("computeBearing", () => {
  it("north is 0 degrees", () => {
    const b = computeBearing(51.0, 0.0, 52.0, 0.0)
    expect(b).toBeCloseTo(0, 0)
  })

  it("east is 90 degrees", () => {
    const b = computeBearing(51.0, 0.0, 51.0, 1.0)
    expect(b).toBeCloseTo(90, 0)
  })

  it("south is 180 degrees", () => {
    const b = computeBearing(52.0, 0.0, 51.0, 0.0)
    expect(b).toBeCloseTo(180, 0)
  })

  it("west is 270 degrees", () => {
    const b = computeBearing(51.0, 1.0, 51.0, 0.0)
    expect(b).toBeCloseTo(270, 0)
  })

  it("always returns value in [0, 360)", () => {
    const pairs = [
      [51.5, -0.1, 48.8, 2.3],
      [0, 0, -1, -1],
      [-33.8, 151.2, 35.6, 139.7],
    ]
    for (const [a, b, c, d] of pairs) {
      const bearing = computeBearing(a, b, c, d)
      expect(bearing).toBeGreaterThanOrEqual(0)
      expect(bearing).toBeLessThan(360)
    }
  })
})

describe("timeAgo", () => {
  it("returns 'just now' for recent timestamps", () => {
    expect(timeAgo(new Date(Date.now() - 30_000))).toBe("just now")
  })

  it("returns minutes ago", () => {
    expect(timeAgo(new Date(Date.now() - 5 * 60_000))).toBe("5m ago")
  })

  it("returns hours ago", () => {
    expect(timeAgo(new Date(Date.now() - 3 * 3600_000))).toBe("3h ago")
  })

  it("returns days ago", () => {
    expect(timeAgo(new Date(Date.now() - 3 * 86400_000))).toBe("3d ago")
  })
})
