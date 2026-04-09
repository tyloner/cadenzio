import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Public paths that never require auth
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks")

  if (!isPublic && !req.auth) {
    const loginUrl = new URL("/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals, static assets, and icons
    "/((?!_next/static|_next/image|favicon.ico|assets|manifest.json|sw.js|api/icon).*)",
  ],
}
