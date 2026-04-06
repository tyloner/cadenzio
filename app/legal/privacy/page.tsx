import Link from "next/link"

export const metadata = { title: "Privacy Policy" }

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <Link href="/" className="text-wave text-sm hover:underline mb-8 block">← Back</Link>
      <h1 className="text-3xl font-bold text-ink mb-2">Privacy Policy</h1>
      <p className="text-muted text-sm mb-10">Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="prose prose-slate max-w-none text-sm leading-7 space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">1. Who we are</h2>
          <p className="text-muted">Cadenz.io (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a music composition platform operated as a web application. We are committed to protecting your personal data and complying with the EU General Data Protection Regulation (GDPR) and applicable data protection laws.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">2. What data we collect</h2>
          <ul className="list-disc pl-5 text-muted space-y-1">
            <li><strong className="text-ink">Account data:</strong> Name, email address, profile picture (via Google SSO)</li>
            <li><strong className="text-ink">Profile data:</strong> Username, country, musical interests, bio</li>
            <li><strong className="text-ink">Activity data:</strong> GPS track (latitude, longitude, bearing, speed, timestamp) — only stored within your activity records</li>
            <li><strong className="text-ink">Usage data:</strong> App interactions (analytics, if consented)</li>
            <li><strong className="text-ink">Payment data:</strong> Stripe customer ID (payment card data never touches our servers)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">3. How we use your data</h2>
          <ul className="list-disc pl-5 text-muted space-y-1">
            <li>To provide and improve the Cadenz.io service</li>
            <li>To generate musical compositions from your GPS activity</li>
            <li>To manage your account and subscription</li>
            <li>To send transactional emails (subscription receipts, account alerts)</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">4. Location data</h2>
          <p className="text-muted">Location data (GPS coordinates) is collected only during an active recording session and stored solely as part of your activity record. We do not sell, share, or use location data for advertising. Location data is not collected in the background.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">5. Data sharing</h2>
          <p className="text-muted">We share your data only with:</p>
          <ul className="list-disc pl-5 text-muted space-y-1">
            <li><strong className="text-ink">Supabase</strong> — database and file storage (EU region, GDPR compliant)</li>
            <li><strong className="text-ink">Vercel</strong> — hosting and serverless functions (GDPR compliant)</li>
            <li><strong className="text-ink">Stripe</strong> — payment processing (PCI DSS compliant)</li>
            <li><strong className="text-ink">Google</strong> — authentication only (OAuth)</li>
          </ul>
          <p className="text-muted mt-3">We never sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">6. Your rights (GDPR)</h2>
          <ul className="list-disc pl-5 text-muted space-y-1">
            <li><strong className="text-ink">Access:</strong> Request a copy of your data</li>
            <li><strong className="text-ink">Rectification:</strong> Correct inaccurate data</li>
            <li><strong className="text-ink">Erasure:</strong> Delete your account and all associated data</li>
            <li><strong className="text-ink">Portability:</strong> Export your data in JSON format</li>
            <li><strong className="text-ink">Objection:</strong> Object to processing for marketing purposes</li>
          </ul>
          <p className="text-muted mt-3">Exercise your rights from <Link href="/settings" className="text-wave hover:underline">Settings → Privacy</Link> or by emailing <span className="text-wave">privacy@cadenz.io</span></p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">7. Data retention</h2>
          <p className="text-muted">We retain your data for as long as your account is active. Inactive accounts receive a notice at 12 months and are deleted at 24 months. You may request deletion at any time.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">8. Cookies</h2>
          <p className="text-muted">We use essential cookies for authentication. Analytics cookies are only set with your explicit consent via the banner shown on first visit.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-3">9. Contact</h2>
          <p className="text-muted">Data controller: Cadenz.io · <span className="text-wave">privacy@cadenz.io</span></p>
        </section>
      </div>
    </main>
  )
}
