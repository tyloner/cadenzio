import { test, expect } from "@playwright/test"

test.describe("API routes — unauthenticated", () => {
  test("GET /api/activities returns 401", async ({ request }) => {
    const res = await request.get("/api/activities")
    expect(res.status()).toBe(401)
  })

  test("GET /api/notifications returns 401", async ({ request }) => {
    const res = await request.get("/api/notifications")
    expect(res.status()).toBe(401)
  })

  test("GET /api/search without auth returns 401", async ({ request }) => {
    const res = await request.get("/api/search?q=test")
    expect(res.status()).toBe(401)
  })

  test("GET /api/search with short query returns empty", async ({ request }) => {
    // If auth were bypassed, short query should return []
    const res = await request.get("/api/search?q=a")
    // Either 401 (no auth) or [] (authed but too short)
    expect([200, 401]).toContain(res.status())
    if (res.status() === 200) {
      const data = await res.json()
      expect(data).toEqual([])
    }
  })

  test("POST /api/push/subscribe returns 401 without auth", async ({ request }) => {
    const res = await request.post("/api/push/subscribe", {
      data: { endpoint: "https://example.com", keys: { p256dh: "x", auth: "y" } },
    })
    expect(res.status()).toBe(401)
  })

  test("GET /api/push/subscribe returns publicKey field", async ({ request }) => {
    const res = await request.get("/api/push/subscribe")
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty("publicKey")
  })
})

test.describe("OG image route", () => {
  test("GET /api/og/nonexistent returns 404", async ({ request }) => {
    const res = await request.get("/api/og/nonexistent-id-xyz")
    expect(res.status()).toBe(404)
  })

  test("GET /api/icon/192 returns a PNG image", async ({ request }) => {
    const res = await request.get("/api/icon/192")
    expect(res.status()).toBe(200)
    expect(res.headers()["content-type"]).toContain("image/png")
  })

  test("GET /api/icon/512 returns a PNG image", async ({ request }) => {
    const res = await request.get("/api/icon/512")
    expect(res.status()).toBe(200)
    expect(res.headers()["content-type"]).toContain("image/png")
  })
})

test.describe("Manifest and service worker", () => {
  test("manifest.json is valid", async ({ request }) => {
    const res = await request.get("/manifest.json")
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data.name).toBe("Cadenzio")
    expect(data.start_url).toBeDefined()
    expect(Array.isArray(data.icons)).toBe(true)
  })

  test("sw.js is served with no-cache header", async ({ request }) => {
    const res = await request.get("/sw.js")
    expect(res.status()).toBe(200)
    expect(res.headers()["cache-control"]).toContain("must-revalidate")
  })
})
