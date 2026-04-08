import Link from "next/link"
import { Music2 } from "lucide-react"
import { t, type Lang } from "@/lib/i18n/server"

export function EmptyFeed({ lang = "en" }: { lang?: Lang }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-wave/10 flex items-center justify-center">
        <Music2 size={28} className="text-wave" />
      </div>
      <h2 className="text-lg font-semibold text-ink">{t(lang, "dashboard.empty.title")}</h2>
      <p className="text-sm text-muted max-w-xs leading-relaxed">
        {t(lang, "dashboard.empty.sub")}
      </p>
      <Link
        href="/record"
        className="mt-2 bg-wave text-white font-medium rounded-full px-6 py-3 text-sm hover:bg-wave/80 transition-colors"
      >
        {t(lang, "dashboard.empty.cta")}
      </Link>
    </div>
  )
}
