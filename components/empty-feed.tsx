import Link from "next/link"
import { Music2 } from "lucide-react"

export function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-wave/10 flex items-center justify-center">
        <Music2 size={28} className="text-wave" />
      </div>
      <h2 className="text-lg font-semibold text-ink">No compositions yet</h2>
      <p className="text-sm text-muted max-w-xs leading-relaxed">
        Go for a walk to create your first composition, or follow other composers to see their activities here.
      </p>
      <Link
        href="/record"
        className="mt-2 bg-wave text-white font-medium rounded-full px-6 py-3 text-sm hover:bg-wave-dark transition-colors"
      >
        Start recording
      </Link>
    </div>
  )
}
