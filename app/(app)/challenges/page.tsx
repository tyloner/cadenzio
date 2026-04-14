import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { evaluateLevels, LEVELS } from "@/lib/levels"
import { getActiveCollectible, getWeekKey } from "@/lib/collectibles"
import { ChallengesView } from "@/components/challenges/challenges-view"

export const metadata = { title: "Challenges & Badges" }

export default async function ChallengesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  const weekKey = getWeekKey()
  const activeCollectible = getActiveCollectible()

  const [profile, noteCaptures, activeNote] = await Promise.all([
    db.profile.findUnique({
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
    }),
    db.hiddenNoteCapture.findMany({
      where: { userId },
      include: { note: { select: { noteKey: true, weekKey: true } } },
      orderBy: { capturedAt: "asc" },
    }),
    db.hiddenNote.findUnique({
      where: { userId_weekKey: { userId, weekKey } },
      include: { capture: { select: { capturedAt: true } } },
    }),
  ])

  const totalActivities = profile?.totalActivities ?? 0
  const uniqueScales = new Set(profile?.user.compositions.map((c) => c.scale) ?? []).size
  const uniqueInstruments = new Set(profile?.user.compositions.map((c) => c.instrument) ?? []).size
  const revealedChallenges = profile?.revealedChallenges ?? []
  const badges = profile?.badges ?? []

  const levelData = evaluateLevels(totalActivities, uniqueScales, uniqueInstruments, revealedChallenges)
  const collectedNoteKeys = noteCaptures.map((c) => c.note.noteKey)

  return (
    <ChallengesView
      levels={LEVELS}
      levelData={levelData}
      totalActivities={totalActivities}
      uniqueScales={uniqueScales}
      uniqueInstruments={uniqueInstruments}
      revealedChallenges={revealedChallenges}
      badges={badges}
      collectedNoteKeys={collectedNoteKeys}
      activeCollectible={activeCollectible}
      activeNoteCaptured={activeNote?.capture !== null && activeNote?.capture !== undefined}
    />
  )
}
