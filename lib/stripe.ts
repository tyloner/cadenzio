import Stripe from "stripe"

// Constants re-exported for any code that still imports from here
export { FREE_LIMITS, PRO_FEATURES } from "@/lib/constants"

export const STRIPE_PLANS = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  PRO_ANNUAL: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
}

// Lazy singleton — not instantiated at build time, only on first API call
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key || !key.startsWith("sk_")) throw new Error("STRIPE_SECRET_KEY is not configured")
    _stripe = new Stripe(key)
  }
  return _stripe
}

// Back-compat alias so callers can keep using `stripe.xxx` after destructuring
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
