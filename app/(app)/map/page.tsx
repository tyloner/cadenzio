import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { MapFeedView } from "@/components/map/map-feed-view"

export const metadata = { title: "Map" }

export default async function MapPage() {
  const session = await auth()

  const viewerProfile = session?.user?.id
    ? await db.profile.findUnique({ where: { userId: session.user.id }, select: { units: true } })
    : null
  const units = (viewerProfile?.units ?? "metric") as "metric" | "imperial"

  const activities = await db.activity.findMany({
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
  })

  return <MapFeedView activities={activities} currentUserId={session?.user?.id ?? null} units={units} />
}
