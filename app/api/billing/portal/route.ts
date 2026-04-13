import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
      select: { stripeCustomerId: true },
    })
    if (!subscription?.stripeCustomerId || subscription.stripeCustomerId.startsWith("pending_")) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (err) {
    console.error("[POST /api/billing/portal]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
