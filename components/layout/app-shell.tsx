"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Map, Plus, Search, Trophy, Award } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/notification-bell"
import { useT } from "@/components/layout/language-provider"
import type { Lang } from "@/lib/i18n"

function StaffIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <line x1="2" y1="5"    x2="22" y2="5"    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="2" y1="8.5"  x2="22" y2="8.5"  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="2" y1="12"   x2="22" y2="12"   stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="2" y1="15.5" x2="22" y2="15.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="2" y1="19"   x2="22" y2="19"   stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* Note 1 — between lines 4 & 5 */}
      <ellipse cx="8" cy="17.2" rx="2.8" ry="2" transform="rotate(-15 8 17.2)" fill="currentColor" />
      <line x1="10.6" y1="16.5" x2="10.6" y2="6.5" stroke="currentColor" strokeWidth="1.4" />
      {/* Note 2 — between lines 2 & 3 */}
      <ellipse cx="16.5" cy="10.2" rx="2.8" ry="2" transform="rotate(-15 16.5 10.2)" fill="currentColor" />
      <line x1="19.1" y1="9.5" x2="19.1" y2="0.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function EnsembleIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      {/* Three ascending notes with a shared beam */}
      <line x1="5"  y1="19" x2="5"  y2="7"  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="19" y1="15" x2="19" y2="4"  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* Shared beam */}
      <line x1="5" y1="7" x2="19" y2="4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Note heads */}
      <ellipse cx="5"  cy="19.5" rx="3" ry="2.1" transform="rotate(-15 5 19.5)"  fill="currentColor" />
      <ellipse cx="12" cy="17.5" rx="3" ry="2.1" transform="rotate(-15 12 17.5)" fill="currentColor" />
      <ellipse cx="19" cy="15.5" rx="3" ry="2.1" transform="rotate(-15 19 15.5)" fill="currentColor" />
    </svg>
  )
}

function ConductorIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {/* Head */}
      <circle cx="11" cy="7" r="3.5" />
      {/* Shoulders */}
      <path d="M 4,21 C 4,15.5 7.5,13.5 11,13.5 C 14.5,13.5 17,15 17,19" />
      {/* Baton — extends diagonally up-right from raised hand */}
      <line x1="16" y1="15.5" x2="22" y2="7" />
      {/* Baton tip */}
      <circle cx="22" cy="7" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function AppShell({ children, lang: _lang }: { children: React.ReactNode; lang?: Lang }) {
  const pathname = usePathname()
  const t = useT()

  const NAV = [
    { href: "/dashboard",  labelKey: "nav.feed"     as const, icon: StaffIcon     },
    { href: "/map",        labelKey: "nav.map"      as const, icon: Map           },
    { href: "/record",     labelKey: "nav.record"   as const, icon: Plus          },
    { href: "/ensemble",   labelKey: "nav.ensemble" as const, icon: EnsembleIcon  },
    { href: "/profile",    labelKey: "nav.profile"  as const, icon: ConductorIcon },
  ]

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto relative">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border flex items-center justify-between px-4 h-14">
        <Link href="/dashboard">
          <Image src="/assets/logo.svg" alt="Cadenzio" width={100} height={28} priority />
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/hall" className="p-2 text-muted hover:text-ink transition-colors" aria-label="Hall of the Great">
            <Trophy size={20} />
          </Link>
          <Link href="/challenges" className="p-2 text-muted hover:text-ink transition-colors" aria-label="Challenges">
            <Award size={20} />
          </Link>
          <Link href="/search" className="p-2 text-muted hover:text-ink transition-colors">
            <Search size={20} />
          </Link>
          <NotificationBell />
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-surface border-t border-border z-40">
        <div className="flex items-center justify-around h-16">
          {NAV.map(({ href, labelKey, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
            const isRecord = href === "/record"
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3",
                  isRecord && "relative -top-4 z-50"
                )}
              >
                {isRecord ? (
                  <span className="flex items-center justify-center w-14 h-14 rounded-full bg-wave text-white shadow-lg">
                    <Icon size={24} />
                  </span>
                ) : (
                  <>
                    <Icon size={22} className={cn(active ? "text-wave" : "text-muted")} />
                    <span className={cn("text-[10px]", active ? "text-wave font-medium" : "text-muted")}>
                      {t(labelKey)}
                    </span>
                  </>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
