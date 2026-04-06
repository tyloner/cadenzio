import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default async function LandingPage() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <main className="min-h-screen bg-ink text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <Image src="/assets/logo.svg" alt="Cadenz.io" width={110} height={30} className="invert" priority />
        <Link
          href="/login"
          className="text-sm font-medium text-wave border border-wave rounded-full px-5 py-2 hover:bg-wave hover:text-white transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 gap-8">
        {/* Animated waveform logo mark */}
        <div className="flex items-end gap-1 h-12 mb-4">
          {[3, 6, 9, 5, 8, 4, 7].map((h, i) => (
            <span
              key={i}
              className="wave-bar block w-2 rounded-sm bg-wave"
              style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight max-w-xl">
          Your walk,<br />
          <span className="text-wave">your music.</span>
        </h1>

        <p className="text-lg text-white/60 max-w-md leading-relaxed">
          Cadenz.io turns every walk or run into a unique musical composition.
          Your direction becomes your melody. Your speed sets the rhythm.
        </p>

        <Link
          href="/login"
          className="mt-4 inline-flex items-center gap-2 bg-wave text-white font-semibold rounded-full px-8 py-4 text-base hover:bg-wave-dark transition-colors shadow-lg"
        >
          Start composing free
        </Link>

        <p className="text-xs text-white/30 mt-2">No credit card needed · Free tier available</p>
      </section>

      {/* Features strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/10 border-t border-white/10">
        {[
          { icon: "🗺️", title: "GPS to melody", desc: "Direction changes drive note movement up and down the scale." },
          { icon: "🎵", title: "Choose your genre", desc: "Blues, classical, jazz, ambient — each genre has its own sound palette." },
          { icon: "🤝", title: "Share your walks", desc: "Post compositions to your feed. Follow friends. Build a musical log." },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-ink px-8 py-10 flex flex-col gap-3">
            <span className="text-3xl">{icon}</span>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      <footer className="text-center text-white/20 text-xs py-6">
        © {new Date().getFullYear()} Cadenz.io ·{" "}
        <Link href="/legal/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
        {" · "}
        <Link href="/legal/terms" className="hover:text-white/50 transition-colors">Terms</Link>
      </footer>
    </main>
  )
}
