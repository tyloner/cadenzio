import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ActivityCard } from "@/components/activity-card"
import { FollowButton } from "@/components/follow-button"
import { MapPin, Music2, Award, Trophy } from "lucide-react"
import { LevelProgress } from "@/components/level-progress"
import { getServerLang, t } from "@/lib/i18n/server"

const BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  "Opus Prima": { bg: "bg-wave/10",       text: "text-wave",  label: "🎵 Opus Prima" },
  "Repertoire": { bg: "bg-beat/10",       text: "text-beat",  label: "🎼 Repertoire" },
  "Gifted":     { bg: "bg-purple-100",    text: "text-purple-600", label: "✨ Gifted" },
  "Virtuoso":   { bg: "bg-yellow-100",    text: "text-yellow-700", label: "🏆 Virtuoso" },
}

function BadgeChip({ badge }: { badge: string }) {
  const style = BADGE_STYLES[badge] ?? { bg: "bg-mist", text: "text-muted", label: badge }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const session = await auth()
  const lang = await getServerLang()

  const profile = await db.profile.findUnique({
    where: { username },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          _count: { select: { followers: true, following: true } },
          activities: {
            where: { isPublic: true },
            orderBy: { startedAt: "desc" },
            take: 20,
            include: {
              composition: { select: { genre: true, scale: true, audioUrl: true } },
              _count: { select: { likes: true, comments: true } },
              user: { select: { name: true, image: true } },
            },
          },
        },
      },
    },
  })

  if (!profile) notFound()

  const isOwn = session?.user?.id === profile.userId

  const [isFollowing, viewerProfile] = await Promise.all([
    session?.user?.id
      ? db.follow.findUnique({
          where: { followerId_followingId: { followerId: session.user.id, followingId: profile.userId } },
        })
      : null,
    session?.user?.id
      ? db.profile.findUnique({ where: { userId: session.user.id }, select: { units: true } })
      : null,
  ])

  const units = (viewerProfile?.units ?? "metric") as "metric" | "imperial"

  // Format total distance in viewer's preferred units
  const totalDistFormatted = units === "imperial"
    ? `${(profile.totalDistance / 1609.34).toFixed(1)} mi`
    : `${(profile.totalDistance / 1000).toFixed(1)} km`

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="bg-surface border-b border-border px-4 py-6">
        <div className="flex items-start gap-4">
          {profile.user.image ? (
            <Image src={profile.user.image} alt={profile.user.name ?? ""} width={72} height={72} className="rounded-full" />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-wave/20 flex items-center justify-center text-wave text-2xl font-bold">
              {profile.user.name?.[0] ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-ink">{profile.user.name}</h1>
            <p className="text-sm text-muted">@{profile.username}</p>
            {profile.personaName && (
              <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-wave bg-wave/10 px-2 py-0.5 rounded-full">
                <Award size={10} /> {profile.personaName}
              </span>
            )}
            {profile.badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {profile.badges.map((badge) => (
                  <BadgeChip key={badge} badge={badge} />
                ))}
              </div>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-slate mt-4 leading-relaxed">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="text-lg font-bold text-ink">{profile.totalActivities}</p>
            <p className="text-xs text-muted">{t(lang, "profile.compositions")}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-ink">{totalDistFormatted}</p>
            <p className="text-xs text-muted">{t(lang, "profile.walked")}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-ink">{profile.user._count.followers}</p>
            <p className="text-xs text-muted">{t(lang, "profile.followers")}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-ink">{profile.user._count.following}</p>
            <p className="text-xs text-muted">{t(lang, "profile.following")}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted">
          {profile.country && (
            <span className="flex items-center gap-1"><MapPin size={11} />{profile.country}</span>
          )}
          {profile.musicalInterests.length > 0 && (
            <span className="flex items-center gap-1"><Music2 size={11} />{profile.musicalInterests.join(", ")}</span>
          )}
        </div>

        {/* Style tags */}
        {profile.styleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.styleTags.map((tag) => (
              <span key={tag} className="text-xs bg-mist border border-border text-muted px-2 py-0.5 rounded-full capitalize">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Level progress */}
        <LevelProgress totalActivities={profile.totalActivities} lang={lang} />

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {isOwn ? (
            <Link
              href="/settings"
              className="flex-1 text-center border border-border rounded-xl py-2 text-sm font-medium text-ink hover:bg-mist transition-colors"
            >
              {t(lang, "profile.edit")}
            </Link>
          ) : (
            <FollowButton userId={profile.userId} initialFollowing={!!isFollowing} />
          )}
        </div>
      </div>

      {/* Activities */}
      <div className="px-4 pt-4 space-y-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">{t(lang, "profile.compositions.label")}</h2>
        {profile.user.activities.length === 0 ? (
          <p className="text-sm text-muted text-center py-12">{t(lang, "profile.no.activities")}</p>
        ) : (
          profile.user.activities.map((a) => (
            <ActivityCard key={a.id} activity={a} units={units} />
          ))
        )}
      </div>
    </div>
  )
}
