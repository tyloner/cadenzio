import { RecordScreen } from "@/components/record/record-screen"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export const metadata = { title: "Record" }

export default async function RecordPage() {
  const session = await auth()
  const userId = session!.user!.id!
  const [subscription, profile, usedSecondsResult] = await Promise.all([
    db.subscription.findUnique({ where: { userId }, select: { tier: true } }),
    db.profile.findUnique({ where: { userId }, select: { units: true } }),
    db.activity.aggregate({ where: { userId }, _sum: { durationSec: true } }),
  ])
  const isPro = subscription?.tier === "PRO"
  const units = (profile?.units ?? "metric") as "metric" | "imperial"
  const usedSeconds = usedSecondsResult._sum.durationSec ?? 0

  return <RecordScreen isPro={isPro} userId={userId} units={units} usedSeconds={usedSeconds} />
}
