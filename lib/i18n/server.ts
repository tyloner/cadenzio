import { cookies, headers } from "next/headers"
import { detectLang, LANG_COOKIE, type Lang } from "./detect"
import { t } from "./index"
export type { Lang }
export { t }

/** Read lang for server components — DB preference already stored in cookie by app layout */
export async function getServerLang(): Promise<Lang> {
  const cookieStore = await cookies()
  const val = cookieStore.get(LANG_COOKIE)?.value
  if (val === "en" || val === "ja") return val
  const headerStore = await headers()
  return detectLang(
    headerStore.get("x-vercel-ip-country"),
    headerStore.get("accept-language")
  )
}
