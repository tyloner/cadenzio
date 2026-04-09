import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { evaluateLevels, LEVELS } from "@/lib/levels"
import { ChallengesView } from "@/components/challenges/challenges-view"

export const metadata = { title: "Challenges & Badges" }

export default async function ChallengesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const profile = await db.profile.findUnique({
    where: { userId },
    select: {
      totalActivities: true,
      totalDistance: true,
      revealedChallenges: true,
      badges: true,
      user: {
        select: {
          compositions: { select: { scale: true, instrument: true } },
        },
      },
    },
  })

  const totalActivities = profile?.totalActivities ?? 0
  const uniqueScales = new Set(profile?.user.compositions.map((c) => c.scale) ?? []).size
  const uniqueInstruments = new Set(profile?.user.compositions.map((c) => c.instrument) ?? []).size
  const revealedChallenges = profile?.revealedChallenges ?? []
  const badges = profile?.badges ?? []

  const levelData = evaluateLevels(totalActivities, uniqueScales, uniqueInstruments, revealedChallenges)

  return (
    <ChallengesView
      levels={LEVELS}
      levelData={levelData}
      totalActivities={totalActivities}
      uniqueScales={uniqueScales}
      uniqueInstruments={uniqueInstruments}
      revealedChallenges={revealedChallenges}
      badges={badges}
    />
  )
}
