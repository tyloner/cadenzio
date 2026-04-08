import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-mist">
      <p className="text-6xl mb-4">🎵</p>
      <h1 className="text-2xl font-bold text-ink mb-2">Page not found</h1>
      <p className="text-sm text-muted mb-8 max-w-xs">
        This page doesn&apos;t exist — or the composition has been deleted.
      </p>
      <Link
        href="/dashboard"
        className="px-6 py-3 bg-wave text-white rounded-xl text-sm font-semibold hover:bg-wave/80 transition-colors"
      >
        Back to feed
      </Link>
    </div>
  )
}
