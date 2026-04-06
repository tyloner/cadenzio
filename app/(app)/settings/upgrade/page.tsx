import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Check, ChevronLeft, Zap } from "lucide-react"
import { UpgradeButtons } from "@/components/upgrade-buttons"

export const metadata = { title: "Upgrade to Pro" }

const FREE_ITEMS = [
  "Up to 30 min per recording",
  "Up to 10 saved compositions",
  "Classical & Blues genres",
]

const PRO_ITEMS = [
  "Unlimited recording length",
  "Unlimited compositions",
  "All 5 genres (Jazz, Ambient, Electronic + more)",
  "Style profile & persona tagging",
  "MP3 export (coming soon)",
  "Strava import (coming soon)",
  "Orchestra — combine activities into multi-instrument pieces (coming soon)",
  "Priority support",
]

export default async function UpgradePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
    select: { tier: true, status: true },
  })

  if (subscription?.tier === "PRO") {
    redirect("/settings")
  }

  const hasStripeKeys =
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID &&
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID.length > 4 &&
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_SECRET_KEY !== "sk_test_"

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Back */}
      <Link href="/settings" className="flex items-center gap-1 text-sm text-muted mb-6 hover:text-ink transition-colors">
        <ChevronLeft size={16} />
        Back to settings
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-wave/10 flex items-center justify-center mx-auto mb-4">
          <Zap size={24} className="text-wave" />
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">Cadenz Pro</h1>
        <p className="text-muted text-sm leading-relaxed">
          Unlock the full composition experience — unlimited walks, all genres, and deeper musical analysis.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {/* Monthly */}
        <div className="bg-surface border border-border rounded-2xl p-5 text-center">
          <p className="text-xs text-muted uppercase tracking-wide mb-2">Monthly</p>
          <p className="text-3xl font-bold text-ink">€7</p>
          <p className="text-xs text-muted mt-0.5">per month</p>
        </div>

        {/* Annual — highlighted */}
        <div className="bg-wave/5 border-2 border-wave rounded-2xl p-5 text-center relative">
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-wave text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
            BEST VALUE
          </span>
          <p className="text-xs text-muted uppercase tracking-wide mb-2">Annual</p>
          <p className="text-3xl font-bold text-ink">€5</p>
          <p className="text-xs text-muted mt-0.5">per month</p>
          <p className="text-[10px] text-wave font-medium mt-1">Save 29%</p>
        </div>
      </div>

      {/* Feature comparison */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Free</p>
          <ul className="space-y-2">
            {FREE_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
                <Check size={14} className="text-border mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold text-wave uppercase tracking-wide mb-3">Pro — everything in Free, plus:</p>
          <ul className="space-y-2">
            {PRO_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-ink">
                <Check size={14} className="text-wave mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      {hasStripeKeys ? (
        <UpgradeButtons userId={session.user.id} />
      ) : (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 text-center">
            Stripe not configured yet — add price IDs to .env to enable payments.
          </div>
          <button
            disabled
            className="w-full bg-wave text-white font-semibold rounded-xl py-3.5 text-sm opacity-40 cursor-not-allowed"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      <p className="text-xs text-muted text-center mt-4">
        Cancel anytime. No questions asked.
      </p>
    </div>
  )
}
