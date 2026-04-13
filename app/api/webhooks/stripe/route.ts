import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import type Stripe from "stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription & { current_period_end: number }
      const customerId = sub.customer as string
      await db.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          stripeSubId: sub.id,
          tier: sub.status === "active" ? "PRO" : "FREE",
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      })
      break
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      await db.subscription.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data: { tier: "FREE", status: "inactive", stripeSubId: null },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
