import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ActivityCard } from "@/components/activity-card"
import { EmptyFeed } from "@/components/empty-feed"
import { SeedButton } from "@/components/dev/seed-button"
import { Compass } from "lucide-react"
import { getServerLang, t } from "@/lib/i18n/server"

export const metadata = { title: "Feed" }

export default async function DashboardPage() {
  const session = await auth()
  const myId = session!.user!.id!

  // Get IDs of users the current user follows + their units preference
  const lang = await getServerLang()
  const [following, viewerProfile] = await Promise.all([
    db.follow.findMany({ where: { followerId: myId }, select: { followingId: true } }),
    db.profile.findUnique({ where: { userId: myId }, select: { units: true } }),
  ])
  const units = (viewerProfile?.units ?? "metric") as "metric" | "imperial"
  const followingIds = following.map((f: { followingId: string }) => f.followingId)

  const activityInclude = {
    user: { select: { name: true, image: true } },
    composition: { select: { genre: true, scale: true, audioUrl: true, instrument: true } },
    _count: { select: { likes: true, comments: true } },
  } as const

  // Own activities (public + private) + followed users' public activities
  const activities = await db.activity.findMany({
    where: {
      OR: [
        { userId: myId },
        { userId: { in: followingIds }, isPublic: true },
      ],
    },
    orderBy: { startedAt: "desc" },
    take: 30,
    include: activityInclude,
  })

  // Discover: recent public activities from people not yet followed (shown when feed is short)
  const showDiscover = activities.length < 5
  const excludeIds = [myId, ...followingIds]
  const discover: typeof activities = showDiscover
    ? await db.activity.findMany({
        where: {
          isPublic: true,
          userId: { notIn: excludeIds },
        },
        orderBy: { startedAt: "desc" },
        take: 10,
        include: activityInclude,
      })
    : []

  const isDev = process.env.NODE_ENV === "development"

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ink">{t(lang, "dashboard.title")}</h1>
        {isDev && <SeedButton />}
      </div>

      {activities.length === 0 && discover.length === 0 ? (
        <EmptyFeed lang={lang} />
      ) : (
        <div className="flex flex-col gap-4">
          {activities.map((a) => (
            <ActivityCard key={a.id} activity={a} units={units} />
          ))}

          {showDiscover && discover.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-2">
                <Compass size={14} className="text-wave" />
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                  {t(lang, "dashboard.discover")}
                </p>
              </div>
              {discover.map((a) => (
                <ActivityCard key={a.id} activity={a} units={units} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
