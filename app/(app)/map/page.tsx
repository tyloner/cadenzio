import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { MapFeedView } from "@/components/map/map-feed-view"

export const metadata = { title: "Map" }

export default async function MapPage() {
  const session = await auth()

  const [viewerProfile, activities] = await Promise.all([
    session?.user?.id
      ? db.profile.findUnique({ where: { userId: session.user.id }, select: { units: true } })
      : null,
    db.activity.findMany({
      where: { isPublic: true },
      orderBy: { startedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        startedAt: true,
        durationSec: true,
        distanceM: true,
        gpsTrack: true,
        user: { select: { name: true, image: true } },
        composition: { select: { genre: true } },
        _count: { select: { likes: true } },
      },
    }),
  ])

  const units = (viewerProfile?.units ?? "metric") as "metric" | "imperial"

  return <MapFeedView activities={activities} currentUserId={session?.user?.id ?? null} units={units} />
}
