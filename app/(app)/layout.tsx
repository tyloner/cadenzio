import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { db } from "@/lib/db"
import { OnboardingCarousel } from "@/components/layout/onboarding-carousel"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  let profile = await db.profile.findUnique({
    where: { userId: session.user.id },
    select: { onboardingDone: true },
  })

  // Safety net: create profile if missing (e.g. user signed up before events.createUser was in place)
  if (!profile) {
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
    if (user) {
      const base = (user.email?.split("@")[0] ?? "user").replace(/[^a-z0-9]/gi, "").toLowerCase()
      const username = `${base}_${Math.random().toString(36).slice(2, 6)}`
      try {
        profile = await db.profile.create({ data: { userId: session.user.id, username }, select: { onboardingDone: true } })
        const subExists = await db.subscription.findUnique({ where: { userId: session.user.id } })
        if (!subExists) {
          await db.subscription.create({
            data: { userId: session.user.id, stripeCustomerId: `pending_${session.user.id}`, tier: "FREE", status: "active" },
          })
        }
      } catch { /* profile created by concurrent request */ }
      profile = await db.profile.findUnique({ where: { userId: session.user.id }, select: { onboardingDone: true } })
    }
  }

  return (
    <AppShell>
      {!profile?.onboardingDone && <OnboardingCarousel userId={session.user.id} />}
      {children}
    </AppShell>
  )
}
