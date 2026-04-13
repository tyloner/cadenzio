import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { ActivityDetail } from "@/components/activity-detail"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const activity = await db.activity.findUnique({
    where: { id },
    select: {
      title: true,
      isPublic: true,
      distanceM: true,
      durationSec: true,
      user: { select: { name: true } },
      composition: { select: { genre: true, scale: true } },
    },
  })

  if (!activity || !activity.isPublic) return { title: "Cadenz.io" }

  const km = activity.distanceM ? `${(activity.distanceM / 1000).toFixed(1)} km` : null
  const genre = activity.composition?.genre ?? "composition"
  const description = [
    `A ${genre} composition by ${activity.user.name}`,
    km ? `composed on a ${km} walk` : null,
  ].filter(Boolean).join(", ")

  return {
    title: `${activity.title} · Cadenz.io`,
    description,
    openGraph: {
      title: activity.title,
      description,
      images: [{ url: `/api/og/${id}`, width: 1200, height: 630 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: activity.title,
      description,
      images: [`/api/og/${id}`],
    },
  }
}

export default async function ActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ reveal?: string }>
}) {
  const VALID_REVEALS = new Set(["repertoire", "gifted", "virtuoso"])
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const reveal = sp.reveal && VALID_REVEALS.has(sp.reveal) ? sp.reveal : null
  const session = await auth()

  const [activity, viewerProfile] = await Promise.all([
    db.activity.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        composition: true,
        likes: { where: { userId: session?.user?.id ?? "" } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    session?.user?.id
      ? db.profile.findUnique({ where: { userId: session.user.id }, select: { units: true } })
      : null,
  ])

  if (!activity || (!activity.isPublic && activity.userId !== session?.user?.id)) {
    notFound()
  }

  const units = (viewerProfile?.units ?? "metric") as "metric" | "imperial"

  return (
    <ActivityDetail
      activity={activity}
      currentUserId={session?.user?.id ?? null}
      currentUserName={session?.user?.name ?? null}
      currentUserImage={session?.user?.image ?? null}
      isLiked={activity.likes.length > 0}
      units={units}
      revealChallenge={reveal ?? null}
    />
  )
}
