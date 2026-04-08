"use client"

import Link from "next/link"
import Image from "next/image"
import { Heart, MessageCircle, Music2, Timer, Ruler, Share2 } from "lucide-react"
import { formatDuration, formatDistance, timeAgo } from "@/lib/utils"

interface Props {
  activity: {
    id: string
    title: string
    startedAt: Date
    durationSec: number | null
    distanceM: number | null
    user: { name: string | null; image: string | null }
    composition: { genre: string; scale: string; audioUrl: string | null } | null
    _count: { likes: number; comments: number }
  }
  units?: "metric" | "imperial"
}

const GENRE_COLORS: Record<string, string> = {
  blues:      "bg-blue-100 text-blue-700",
  classical:  "bg-purple-100 text-purple-700",
  jazz:       "bg-amber-100 text-amber-700",
  ambient:    "bg-teal-100 text-teal-700",
  electronic: "bg-pink-100 text-pink-700",
}

export function ActivityCard({ activity, units = "metric" }: Props) {
  const { user, composition } = activity
  const genreClass = GENRE_COLORS[composition?.genre ?? ""] ?? "bg-gray-100 text-gray-600"

  return (
    <Link href={`/activity/${activity.id}`} className="block">
      <article className="bg-surface rounded-2xl border border-border p-5 hover:border-wave/40 transition-colors">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {user.image ? (
            <Image src={user.image} alt={user.name ?? ""} width={36} height={36} className="rounded-full" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-wave/20 flex items-center justify-center text-wave font-bold text-sm">
              {user.name?.[0] ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
            <p className="text-xs text-muted">{timeAgo(activity.startedAt)}</p>
          </div>
          {composition && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${genreClass}`}>
              {composition.genre}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-ink mb-3">{activity.title}</h3>

        {/* Stats row */}
        <div className="flex items-center gap-5 text-sm text-muted mb-4">
          {activity.durationSec && (
            <span className="flex items-center gap-1.5">
              <Timer size={14} />
              {formatDuration(activity.durationSec)}
            </span>
          )}
          {activity.distanceM && (
            <span className="flex items-center gap-1.5">
              <Ruler size={14} />
              {formatDistance(activity.distanceM, units)}
            </span>
          )}
          {composition && (
            <span className="flex items-center gap-1.5">
              <Music2 size={14} />
              {composition.scale.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Waveform placeholder */}
        {composition && (
          <div className="flex items-end gap-0.5 h-8 mb-4">
            {Array.from({ length: 40 }).map((_, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm bg-wave/30"
                style={{ height: `${20 + Math.sin(i * 0.7) * 14}px` }}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-5 pt-3 border-t border-border">
          <span className="flex items-center gap-1.5 text-sm text-muted">
            <Heart size={16} />
            {activity._count.likes}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted">
            <MessageCircle size={16} />
            {activity._count.comments}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault()
              navigator.share?.({
                title: activity.title,
                url: `${window.location.origin}/activity/${activity.id}`,
              })
            }}
            className="ml-auto flex items-center gap-1.5 text-sm text-muted hover:text-wave transition-colors"
            aria-label="Share activity"
          >
            <Share2 size={15} />
          </button>
        </div>
      </article>
    </Link>
  )
}
