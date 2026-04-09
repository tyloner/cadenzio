import { test, expect } from "@playwright/test"

test.describe("Public pages", () => {
  test("homepage loads and shows sign-in CTA", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/Cadenzio/)
    // Either the marketing page or a redirect to login
    const url = page.url()
    expect(url).toMatch(/\/(login)?$/)
  })

  test("login page renders Google sign-in button", async ({ page }) => {
    await page.goto("/login")
    await expect(page.locator("text=Continue with Google")).toBeVisible()
  })

  test("protected dashboard redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)
  })

  test("protected profile redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/profile")
    await expect(page).toHaveURL(/\/login/)
  })

  test("protected record redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/record")
    await expect(page).toHaveURL(/\/login/)
  })

  test("unknown route returns 404 page", async ({ page }) => {
    await page.goto("/this-does-not-exist-xyz")
    // Next.js shows our not-found page
    const body = await page.textContent("body")
    expect(body).toMatch(/not found|doesn't exist/i)
  })
})
