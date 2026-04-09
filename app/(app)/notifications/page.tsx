import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Heart, MessageCircle, UserPlus, Bell } from "lucide-react"
import { timeAgo } from "@/lib/utils"
import { MarkNotificationsRead } from "./mark-read"

export const metadata = { title: "Notifications" }

const TYPE_ICON = {
  LIKE:    { icon: Heart,         color: "text-beat",  bg: "bg-beat/10"  },
  COMMENT: { icon: MessageCircle, color: "text-wave",  bg: "bg-wave/10"  },
  FOLLOW:  { icon: UserPlus,      color: "text-ink",   bg: "bg-mist"     },
}

const TYPE_LABEL = {
  LIKE:    "liked your composition",
  COMMENT: "commented on your composition",
  FOLLOW:  "started following you",
}

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user?.id) notFound()

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      actor: { select: { name: true, image: true, profile: { select: { username: true } } } },
      activity: { select: { id: true, title: true } },
    },
  })

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-ink mb-6">Notifications</h1>

      {/* Mark all read client-side on mount */}
      <MarkNotificationsRead />

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Bell size={40} className="text-border" />
          <p className="text-sm text-muted">No notifications yet.</p>
          <p className="text-xs text-muted">When someone likes or comments on your compositions, you&apos;ll see it here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {notifications.map((n) => {
            const { icon: Icon, color, bg } = TYPE_ICON[n.type]
            const label = TYPE_LABEL[n.type]
            const href = n.activity
              ? `/activity/${n.activity.id}`
              : n.actor.profile?.username
                ? `/profile/${n.actor.profile.username}`
                : "/dashboard"

            return (
              <Link
                key={n.id}
                href={href}
                className={`flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-mist ${!n.isRead ? "bg-wave/5 border border-wave/10" : ""}`}
              >
                {/* Actor avatar */}
                <div className="relative flex-shrink-0">
                  {n.actor.image ? (
                    <Image src={n.actor.image} alt={n.actor.name ?? ""} width={40} height={40} className="rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-wave/20 flex items-center justify-center text-wave font-bold">
                      {n.actor.name?.[0] ?? "?"}
                    </div>
                  )}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${bg} flex items-center justify-center`}>
                    <Icon size={11} className={color} />
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink leading-snug">
                    <span className="font-semibold">{n.actor.name}</span>{" "}
                    {label}
                    {n.activity && (
                      <span className="text-muted"> · {n.activity.title}</span>
                    )}
                  </p>
                  {n.body && (
                    <p className="text-xs text-muted mt-0.5 line-clamp-1">&ldquo;{n.body}&rdquo;</p>
                  )}
                  <p className="text-xs text-muted mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>

                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-wave flex-shrink-0 mt-1.5" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
