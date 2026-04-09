import { test, expect } from "@playwright/test"

test.describe("Ensemble pages — unauthenticated", () => {
  test("GET /ensemble redirects to login", async ({ page }) => {
    await page.goto("/ensemble")
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe("Ensemble API — unauthenticated", () => {
  test("GET /api/ensemble returns 401", async ({ request }) => {
    const res = await request.get("/api/ensemble")
    expect(res.status()).toBe(401)
  })

  test("POST /api/ensemble returns 401", async ({ request }) => {
    const res = await request.post("/api/ensemble", { data: { name: "Test" } })
    expect(res.status()).toBe(401)
  })

  test("POST /api/ensemble/fake-id/members returns 401", async ({ request }) => {
    const res = await request.post("/api/ensemble/fake-id/members", { data: { username: "someone" } })
    expect(res.status()).toBe(401)
  })

  test("POST /api/ensemble/fake-id/session returns 401", async ({ request }) => {
    const res = await request.post("/api/ensemble/fake-id/session", { data: { scales: ["major"] } })
    expect(res.status()).toBe(401)
  })

  test("GET /api/ensemble/fake-id/session/fake-sid/lobby returns 401", async ({ request }) => {
    const res = await request.get("/api/ensemble/fake-id/session/fake-sid/lobby")
    expect(res.status()).toBe(401)
  })

  test("POST /api/ensemble/fake-id/session/fake-sid/location returns 401", async ({ request }) => {
    const res = await request.post("/api/ensemble/fake-id/session/fake-sid/location", {
      data: { lat: 51.5, lng: -0.1 },
    })
    expect(res.status()).toBe(401)
  })

  test("POST /api/ensemble/fake-id/session/fake-sid/start returns 401", async ({ request }) => {
    const res = await request.post("/api/ensemble/fake-id/session/fake-sid/start")
    expect(res.status()).toBe(401)
  })

  test("POST /api/ensemble/fake-id/session/fake-sid/submit returns 401", async ({ request }) => {
    const res = await request.post("/api/ensemble/fake-id/session/fake-sid/submit", {
      data: { gpsPoints: [], instrument: "piano", scale: "major", startingNote: "C4" },
    })
    expect(res.status()).toBe(401)
  })
})
