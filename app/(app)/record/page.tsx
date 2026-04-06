import { RecordScreen } from "@/components/record/record-screen"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export const metadata = { title: "Record" }

export default async function RecordPage() {
  const session = await auth()
  const [subscription, profile] = await Promise.all([
    db.subscription.findUnique({ where: { userId: session!.user!.id! }, select: { tier: true } }),
    db.profile.findUnique({ where: { userId: session!.user!.id! }, select: { units: true } }),
  ])
  const isPro = subscription?.tier === "PRO"
  const units = (profile?.units ?? "metric") as "metric" | "imperial"

  return <RecordScreen isPro={isPro} userId={session!.user!.id!} units={units} />
}
