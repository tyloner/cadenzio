import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { LeaderboardView } from "@/components/hall/leaderboard-view"

export const metadata = { title: "Hall of the Great" }

export default async function HallPage() {
  // WEEK_AGO must live inside the function body — a module-level Date literal is
  // evaluated once when the Vercel function first warms up and stays frozen thereafter.
  const WEEK_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const userId = session.user.id

  // Fire all independent queries in parallel
  const [allTimeRaw, weeklyGroups, myProfile, myWeeklyCount] = await Promise.all([
    db.profile.findMany({
      where: { isPublic: true },
      orderBy: { totalActivities: "desc" },
      take: 20,
      select: {
        username: true,
        totalActivities: true,
        totalDistance: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            subscription: { select: { tier: true } },
          },
        },
      },
    }),
    db.activity.groupBy({
      by: ["userId"],
      where: { startedAt: { gte: WEEK_AGO }, source: { not: "ENSEMBLE" } },
      _count: { id: true },
      _sum: { distanceM: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    }),
    db.profile.findUnique({
      where: { userId },
      select: { totalActivities: true, totalDistance: true, username: true },
    }),
    db.activity.count({
      where: { userId, startedAt: { gte: WEEK_AGO }, source: { not: "ENSEMBLE" } },
    }),
  ])

  // Fetch profiles for weekly top 20 (second round-trip, but batched)
  const weeklyUserIds = weeklyGroups.map((g) => g.userId)
  const weeklyProfiles = weeklyUserIds.length > 0
    ? await db.profile.findMany({
        where: { userId: { in: weeklyUserIds }, isPublic: true },
        select: {
          username: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              subscription: { select: { tier: true } },
            },
          },
        },
      })
    : []

  // All-time rank for current user
  let myAllTimeRank: number | null = null
  if (myProfile) {
    const ahead = await db.profile.count({
      where: { isPublic: true, totalActivities: { gt: myProfile.totalActivities } },
    })
    myAllTimeRank = ahead + 1
  }

  const weekly = weeklyGroups
    .map((g) => {
      const profile = weeklyProfiles.find((p) => p.user.id === g.userId)
      if (!profile) return null
      return {
        user: profile.user,
        username: profile.username,
        totalActivities: g._count.id,
        totalDistance: g._sum.distanceM ?? 0,
      }
    })
    .filter(Boolean) as {
      user: { id: string; name: string | null; image: string | null; subscription: { tier: string } | null }
      username: string
      totalActivities: number
      totalDistance: number
    }[]

  const myWeeklyGroup = weeklyGroups.find((g) => g.userId === userId)
  const myWeeklyDistance = myWeeklyGroup?._sum.distanceM ?? 0
  const aheadWeekly = weeklyGroups.filter((g) => g._count.id > myWeeklyCount).length
  const myWeeklyRank = myWeeklyCount > 0 ? aheadWeekly + 1 : null

  const allTime = allTimeRaw.map((p) => ({
    user: p.user,
    username: p.username,
    totalActivities: p.totalActivities,
    totalDistance: p.totalDistance,
  }))

  return (
    <LeaderboardView
      allTime={allTime}
      weekly={weekly}
      currentUserId={userId}
      myAllTimeRank={myAllTimeRank}
      myWeeklyRank={myWeeklyRank}
      myProfile={myProfile ? { totalActivities: myProfile.totalActivities, totalDistance: myProfile.totalDistance, username: myProfile.username } : null}
      myWeeklyCount={myWeeklyCount}
      myWeeklyDistance={myWeeklyDistance}
    />
  )
}
