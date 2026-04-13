import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id

    const subscription = await db.subscription.findUnique({
      where: { userId },
      select: { stripeSubId: true, tier: true },
    })

    if (subscription?.stripeSubId && subscription.tier === "PRO") {
      await stripe.subscriptions.cancel(subscription.stripeSubId).catch(() => {})
    }

    await db.user.delete({ where: { id: userId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[DELETE /api/user]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
