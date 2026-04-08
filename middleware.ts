import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { detectLang, LANG_COOKIE } from "@/lib/i18n"

export function middleware(req: NextRequest) {
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
}

export const config = {
  // Run on all app pages, skip static assets and API routes
  matcher: ["/((?!api|_next/static|_next/image|favicon|assets|sw\\.js|manifest\\.json).*)"],
}
