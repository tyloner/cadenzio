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
    // Fired as soon as checkout is completed — flip tier immediately before
    // subscription.created so the /settings?upgraded=1 redirect shows "Pro"
    case "checkout.session.completed": {
      const cs = event.data.object as Stripe.Checkout.Session
      if (cs.mode !== "subscription") break
      const customerId = cs.customer as string
      const subscriptionId = cs.subscription as string | null
      if (!customerId) break
      await db.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          tier: "PRO",
          status: "active",
          ...(subscriptionId ? { stripeSubId: subscriptionId } : {}),
        },
      })
      break
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      await db.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          stripeSubId: sub.id,
          tier: sub.status === "active" || sub.status === "trialing" ? "PRO" : "FREE",
          status: sub.status,
          currentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      })
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      await db.subscription.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data: { tier: "FREE", status: "canceled", stripeSubId: null, cancelAtPeriodEnd: false },
      })
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      if (!customerId) break
      // Mark as past_due; keeps tier active — Stripe retries and sends subscription.updated
      // with status "past_due" which will flip the tier if it stays unpaid
      await db.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: { status: "past_due" },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
