"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"

export function NotificationBell() {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setUnread(d.unreadCount ?? 0))
      .catch(() => {})
  }, [])

  return (
    <Link href="/notifications" className="relative p-1 text-muted hover:text-ink transition-colors">
      <Bell size={22} />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-beat text-white text-[10px] font-bold px-1">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  )
}
