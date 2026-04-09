import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { EnsembleSessionClient } from "@/components/ensemble/session-client"

export const metadata = { title: "Ensemble Session" }

export default async function EnsembleSessionPage({
  params,
}: {
  params: Promise<{ id: string; sid: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id
  const { id: ensembleId, sid: sessionId } = await params

  const [ensSession, ensemble] = await Promise.all([
    db.ensembleSession.findUnique({
      where: { id: sessionId, ensembleId },
      include: { host: { select: { id: true, name: true, image: true } } },
    }),
    db.ensemble.findUnique({
      where: { id: ensembleId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    }),
  ])

  if (!ensSession || !ensemble) notFound()
  const isMember = ensemble.members.some((m) => m.userId === userId)
  if (!isMember) notFound()

  if (ensSession.status === "COMPLETED" || ensSession.status === "CANCELLED") {
    redirect(`/ensemble/${ensembleId}`)
  }

  return (
    <EnsembleSessionClient
      sessionId={sessionId}
      ensembleId={ensembleId}
      currentUserId={userId}
      hostId={ensSession.hostId}
      scales={ensSession.scales}
      members={ensemble.members}
      initialStatus={ensSession.status}
    />
  )
}
