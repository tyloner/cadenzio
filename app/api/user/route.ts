import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id

  // Cancel active Stripe subscription before deleting
  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { stripeSubId: true, tier: true },
  })

  if (subscription?.stripeSubId && subscription.tier === "PRO") {
    await stripe.subscriptions.cancel(subscription.stripeSubId).catch(() => {
      // Non-fatal: Stripe may have already cancelled or the sub may be missing
    })
  }

  // Deleting the user cascades all related records (via Prisma onDelete: Cascade)
  await db.user.delete({ where: { id: userId } })

  return NextResponse.json({ ok: true })
}
