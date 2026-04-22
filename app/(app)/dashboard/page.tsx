import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { ActivityCard } from "@/components/activity-card"
import { FeedLoadMore } from "@/components/feed-load-more"
import { EmptyFeed } from "@/components/empty-feed"
import { SeedButton } from "@/components/dev/seed-button"
import { Compass } from "lucide-react"
import { getServerLang, t } from "@/lib/i18n/server"

export const metadata = { title: "Feed" }

const PAGE_SIZE = 20

const activityInclude = {
  user: { select: { name: true, image: true } },
  composition: { select: { genre: true, scale: true, audioUrl: true, instrument: true } },
  _count: { select: { likes: true, comments: true } },
} as const

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const myId = session.user.id as string

  const lang = await getServerLang()
  const [following, viewerProfile] = await Promise.all([
    db.follow.findMany({ where: { followerId: myId }, select: { followingId: true } }),
    db.profile.findUnique({ where: { userId: myId }, select: { units: true } }),
  ])
  const units = (viewerProfile?.units ?? "metric") as "metric" | "imperial"
  const followingIds = following.map((f) => f.followingId)

  // Cap to 100 to avoid Postgres IN clause size issues on large follow counts
  const excludeIds = [myId, ...followingIds.slice(0, 100)]

  // First page of feed + discover candidates — both in parallel
  const [rawActivities, discover] = await Promise.all([
    db.activity.findMany({
      where: {
        OR: [
          { userId: myId },
          { userId: { in: followingIds }, isPublic: true },
        ],
      },
      orderBy: { startedAt: "desc" },
      take: PAGE_SIZE + 1, // extra to detect next page
      include: activityInclude,
    }),
    db.activity.findMany({
      where: { isPublic: true, userId: { notIn: excludeIds } },
      orderBy: { startedAt: "desc" },
      take: 10,
      include: activityInclude,
    }),
  ])

  const hasMore = rawActivities.length > PAGE_SIZE
  const activities = rawActivities.slice(0, PAGE_SIZE)
  const showDiscover = activities.length < 5

  // Cursor = startedAt of last item in first page
  const initialCursor = hasMore ? activities[activities.length - 1].startedAt.toISOString() : null

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

          {/* Client-side pagination — renders additional pages on demand */}
          <FeedLoadMore initialCursor={initialCursor} units={units} />
        </div>
      )}
    </div>
  )
}
