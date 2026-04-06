import Stripe from "stripe"

// Constants re-exported for any code that still imports from here
export { FREE_LIMITS, PRO_FEATURES } from "@/lib/constants"

export const STRIPE_PLANS = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  PRO_ANNUAL: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
}

// Only instantiated by billing/webhook routes — never by UI components
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
