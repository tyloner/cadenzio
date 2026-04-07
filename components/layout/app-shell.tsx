"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Map, List, Plus, User, Settings } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/notification-bell"

const NAV = [
  { href: "/dashboard",  label: "Feed",    icon: List  },
  { href: "/map",        label: "Map",     icon: Map   },
  { href: "/record",     label: "Record",  icon: Plus  },
  { href: "/profile",    label: "Profile", icon: User  },
  { href: "/settings",   label: "Settings",icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto relative">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border flex items-center justify-between px-4 h-14">
        <Link href="/dashboard">
          <Image src="/assets/logo.svg" alt="Cadenzio" width={100} height={28} priority />
        </Link>
        <NotificationBell />
      </header>

      {/* Page content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-surface border-t border-border z-40">
        <div className="flex items-center justify-around h-16">
          {NAV.map(({ href, label, icon: Icon }) => {
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
                    <Icon
                      size={22}
                      className={cn(active ? "text-wave" : "text-muted")}
                    />
                    <span className={cn("text-[10px]", active ? "text-wave font-medium" : "text-muted")}>
                      {label}
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
