import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe, STRIPE_PLANS } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { plan } = await req.json()
    if (plan !== "monthly" && plan !== "annual") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const priceId = plan === "annual" ? STRIPE_PLANS.PRO_ANNUAL : STRIPE_PLANS.PRO_MONTHLY
    if (!priceId) return NextResponse.json({ error: "Price not configured" }, { status: 500 })

    const [subscription, user] = await Promise.all([
      db.subscription.findUnique({ where: { userId: session.user.id }, select: { stripeCustomerId: true } }),
      db.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true } }),
    ])

    let customerId = subscription?.stripeCustomerId
    if (!customerId || customerId.startsWith("pending_")) {
      const customer = await stripe.customers.create({
        email: user?.email ?? undefined,
        name: user?.name ?? undefined,
        metadata: { userId: session.user.id },
      })
      customerId = customer.id
      await db.subscription.update({
        where: { userId: session.user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const appUrl = process.env.APP_URL ?? "http://localhost:3000"
    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?upgraded=1`,
      cancel_url: `${appUrl}/settings/upgrade`,
      metadata: { userId: session.user.id },
      subscription_data: { metadata: { userId: session.user.id } },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: checkout.url })
  } catch (err) {
    console.error("[POST /api/billing/checkout]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
