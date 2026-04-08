import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { detectLang, LANG_COOKIE } from "@/lib/i18n/detect"

const PUBLIC_PATHS = ["/", "/login", "/legal/privacy", "/legal/terms", "/api/auth"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (req.auth && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  const res = NextResponse.next()

  // Auto-set language cookie from Vercel geo / Accept-Language on first visit
  if (!req.cookies.has(LANG_COOKIE)) {
    const country = req.headers.get("x-vercel-ip-country")
    const accept  = req.headers.get("accept-language")
    const lang    = detectLang(country, accept)
    if (lang !== "en") {
      res.cookies.set(LANG_COOKIE, lang, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      })
    }
  }

  return res
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|api/webhooks).*)"],
}
