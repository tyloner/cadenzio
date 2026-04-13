import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { db } from "@/lib/db"
import { OnboardingCarousel } from "@/components/layout/onboarding-carousel"
import { LanguageProvider } from "@/components/layout/language-provider"
import { detectLang, LANG_COOKIE, type Lang } from "@/lib/i18n/detect"
import { cookies, headers } from "next/headers"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Resolve language early from cookie/geo — usable even if DB is slow
  const cookieStore = await cookies()
  const headerStore = await headers()
  const cookieLang = cookieStore.get(LANG_COOKIE)?.value as Lang | undefined
  const geoLang = detectLang(
    headerStore.get("x-vercel-ip-country"),
    headerStore.get("accept-language")
  )

  let profile: { onboardingDone: boolean; language: string } | null = null
  try {
    profile = await db.profile.findUnique({
      where: { userId: session.user.id },
      select: { onboardingDone: true, language: true },
    })

    // Safety net: create profile if missing (e.g. user signed up before events.createUser was in place)
    if (!profile) {
      const user = await db.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
      if (user) {
        const base = (user.email?.split("@")[0] ?? "user").replace(/[^a-z0-9]/gi, "").toLowerCase()
        const username = `${base}_${Math.random().toString(36).slice(2, 6)}`
        try {
          profile = await db.profile.create({ data: { userId: session.user.id, username }, select: { onboardingDone: true, language: true } })
          const subExists = await db.subscription.findUnique({ where: { userId: session.user.id } })
          if (!subExists) {
            await db.subscription.create({
              data: { userId: session.user.id, stripeCustomerId: `pending_${session.user.id}`, tier: "FREE", status: "active" },
            })
          }
        } catch { /* profile created by concurrent request */ }
        profile = await db.profile.findUnique({ where: { userId: session.user.id }, select: { onboardingDone: true, language: true } })
      }
    }
  } catch {
    // DB unavailable — continue with defaults so the shell still renders
  }

  // Resolve language: DB preference > lang cookie > geo detection
  const lang: Lang = (profile?.language as Lang) ?? cookieLang ?? geoLang

  return (
    <LanguageProvider lang={lang}>
      <AppShell lang={lang}>
        {!profile?.onboardingDone && <OnboardingCarousel userId={session.user.id} />}
        {children}
      </AppShell>
    </LanguageProvider>
  )
}
