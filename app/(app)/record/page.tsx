import { RecordScreen } from "@/components/record/record-screen"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

export const metadata = { title: "Record" }

export default async function RecordPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id
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
