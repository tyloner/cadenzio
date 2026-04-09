import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { MapFeedView } from "@/components/map/map-feed-view"

export const metadata = { title: "Map" }

export default async function MapPage() {
  const session = await auth()
  const userId = session?.user?.id ?? null

  const [viewerProfile, activities, myActivities] = await Promise.all([
    userId ? db.profile.findUnique({ where: { userId }, select: { units: true } }) : null,
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
    userId ? db.activity.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 200,
      select: {
        id: true,
        title: true,
        distanceM: true,
        gpsTrack: true,
        composition: { select: { genre: true } },
      },
    }) : [],
  ])

  const units = (viewerProfile?.units ?? "metric") as "metric" | "imperial"
  const totalDistance = myActivities.reduce((s, a) => s + (a.distanceM ?? 0), 0)

  return (
    <MapFeedView
      activities={activities}
      currentUserId={userId}
      units={units}
      myActivities={myActivities}
      myStats={{ totalWalks: myActivities.length, totalDistanceM: totalDistance }}
    />
  )
}
