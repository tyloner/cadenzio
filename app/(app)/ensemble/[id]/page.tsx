import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { EnsembleDetail } from "@/components/ensemble/ensemble-detail"

export const metadata = { title: "Ensemble" }

export default async function EnsembleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id
  const { id } = await params

  const [ensemble, sub, profile] = await Promise.all([
    db.ensemble.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        members: { include: { user: { select: { id: true, name: true, image: true, profile: { select: { username: true } } } } } },
        sessions: {
          where: { status: { in: ["LOBBY", "ACTIVE"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    db.subscription.findUnique({ where: { userId }, select: { tier: true } }),
    db.profile.findUnique({ where: { userId }, select: { ensembleTrialUsed: true } }),
  ])

  if (!ensemble) notFound()

  const isMember = ensemble.members.some((m) => m.userId === userId)
  if (!isMember) notFound()

  const isPro = sub?.tier === "PRO"
  const hasFreeTrial = !profile?.ensembleTrialUsed
  const activeSession = ensemble.sessions[0] ?? null

  return (
    <EnsembleDetail
      ensemble={ensemble}
      currentUserId={userId}
      isPro={isPro}
      hasFreeTrial={hasFreeTrial}
      activeSession={activeSession}
    />
  )
}
