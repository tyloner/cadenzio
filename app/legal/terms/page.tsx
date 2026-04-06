import Link from "next/link"

export const metadata = { title: "Terms of Service" }

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <Link href="/" className="text-wave text-sm hover:underline mb-8 block">← Back</Link>
      <h1 className="text-3xl font-bold text-ink mb-2">Terms of Service</h1>
      <p className="text-muted text-sm mb-10">Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="prose prose-slate max-w-none text-sm leading-7 space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">1. Acceptance</h2>
          <p className="text-muted">By creating an account on Cadenz.io you agree to these Terms of Service. If you do not agree, do not use the service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">2. The service</h2>
          <p className="text-muted">Cadenz.io is a music composition platform that converts GPS activity data into musical compositions. We provide both a free tier and a paid Pro tier with additional features.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">3. Your content</h2>
          <p className="text-muted">You retain ownership of all compositions you create using Cadenz.io. By marking an activity as public, you grant Cadenz.io a non-exclusive, royalty-free licence to display and share that activity within the platform. You may make activities private or delete them at any time.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">4. Acceptable use</h2>
          <p className="text-muted">You agree not to:</p>
          <ul className="list-disc pl-5 text-muted space-y-1">
            <li>Use the platform for any unlawful purpose</li>
            <li>Share false or misleading activity data</li>
            <li>Attempt to reverse engineer the music engine or circumvent subscription limits</li>
            <li>Harass other users</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">5. Subscription and billing</h2>
          <p className="text-muted">Pro subscriptions are billed monthly or annually via Stripe. Subscriptions auto-renew unless cancelled. You may cancel at any time from Settings; access continues until the end of the billing period. Refunds are not provided for partial periods.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">6. Free tier limits</h2>
          <p className="text-muted">The free tier includes recordings up to 30 minutes, up to 10 saved compositions, 2 genres, and piano + synth instruments. Features marked Pro require an active Pro subscription.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">7. Safety</h2>
          <p className="text-muted">You are responsible for your physical safety while using Cadenz.io outdoors. Use headphones responsibly. Be aware of your surroundings. Cadenz.io is not liable for any injury incurred while recording an activity.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">8. Disclaimer of warranties</h2>
          <p className="text-muted">The service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee the accuracy of GPS data or musical output.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">9. Changes</h2>
          <p className="text-muted">We may update these terms. Material changes will be notified by email. Continued use constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">10. Contact</h2>
          <p className="text-muted">Questions: <span className="text-wave">hello@cadenz.io</span></p>
        </section>
      </div>
    </main>
  )
}
