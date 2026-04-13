"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Trophy, Crown, Medal } from "lucide-react"
import { formatDistance } from "@/lib/utils"

interface Entry {
  user: { id: string; name: string | null; image: string | null; subscription: { tier: string } | null }
  username: string
  totalActivities: number
  totalDistance: number
}

interface Props {
  allTime: Entry[]
  weekly: Entry[]
  currentUserId: string
  myAllTimeRank: number | null
  myWeeklyRank: number | null
  myProfile: { totalActivities: number; totalDistance: number; username: string } | null
  myWeeklyCount: number
  myWeeklyDistance: number
}

const RANK_STYLES = [
  "text-yellow-500",   // 1st
  "text-slate-400",    // 2nd
  "text-amber-600",    // 3rd
]

function RankNumber({ rank }: { rank: number }) {
  if (rank <= 3) {
    return <Medal size={18} className={RANK_STYLES[rank - 1]} />
  }
  return <span className="text-sm font-bold text-muted w-5 text-center">{rank}</span>
}

function LeaderboardRow({ entry, rank, currentUserId, units }: {
  entry: Entry
  rank: number
  currentUserId: string
  units: "metric" | "imperial"
}) {
  const isMe = entry.user.id === currentUserId
  const isPro = entry.user.subscription?.tier === "PRO"

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
      isMe ? "bg-wave/10 border border-wave/20" : "bg-mist"
    }`}>
      <div className="w-6 flex items-center justify-center flex-shrink-0">
        <RankNumber rank={rank} />
      </div>

      <Link href={`/profile/${entry.username}`} className="flex items-center gap-2.5 flex-1 min-w-0">
        {entry.user.image ? (
          <Image src={entry.user.image} alt={entry.user.name ?? ""} width={36} height={36} className="rounded-full flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-wave/20 flex items-center justify-center text-sm font-bold text-wave flex-shrink-0">
            {(entry.user.name ?? "?")[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-ink truncate">{entry.user.name}</p>
            {isPro && <Crown size={12} className="text-wave flex-shrink-0" />}
            {isMe && <span className="text-xs text-wave font-medium">you</span>}
          </div>
          <p className="text-xs text-muted truncate">@{entry.username}</p>
        </div>
      </Link>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-ink">{entry.totalActivities}</p>
        <p className="text-xs text-muted">{formatDistance(entry.totalDistance, units)}</p>
      </div>
    </div>
  )
}

export function LeaderboardView({ allTime, weekly, currentUserId, myAllTimeRank, myWeeklyRank, myProfile, myWeeklyCount, myWeeklyDistance }: Props) {
  const [tab, setTab] = useState<"alltime" | "weekly">("alltime")
  const units = "metric"

  const entries = tab === "alltime" ? allTime : weekly
  const myRank = tab === "alltime" ? myAllTimeRank : myWeeklyRank
  const inTop = entries.some((e) => e.user.id === currentUserId)

  // Build my entry for the pinned row
  const myEntry = entries.find((e) => e.user.id === currentUserId)

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Trophy size={22} className="text-yellow-500" />
        <h1 className="text-xl font-bold text-ink">Hall of the Great</h1>
      </div>
      <p className="text-xs text-muted mb-6">The greatest walksicians of Cadenzio</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-mist rounded-xl p-1">
        <button
          onClick={() => setTab("alltime")}
          className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
            tab === "alltime" ? "bg-surface text-ink shadow-sm" : "text-muted"
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => setTab("weekly")}
          className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
            tab === "weekly" ? "bg-surface text-ink shadow-sm" : "text-muted"
          }`}
        >
          This Week
        </button>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 mb-2">
        <div className="w-6" />
        <p className="flex-1 text-xs font-semibold text-muted uppercase tracking-wide">Walksician</p>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Walks · Dist</p>
      </div>

      {/* List */}
      {entries.length === 0 ? (
        <div className="text-center py-16">
          <Trophy size={32} className="text-muted mx-auto mb-3" />
          <p className="text-muted text-sm">No one here yet — be the first!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry, i) => (
            <LeaderboardRow key={entry.user.id} entry={entry} rank={i + 1} currentUserId={currentUserId} units={units} />
          ))}
        </div>
      )}

      {/* Pinned: my rank if outside top 20 */}
      {!inTop && myRank && myProfile && (tab === "alltime" || myWeeklyCount > 0) && (
        <div className="mt-4">
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted text-center mb-2">Your rank</p>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-wave/10 border border-wave/20">
              <div className="w-6 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-wave">#{myRank}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">You</p>
                <p className="text-xs text-muted">@{myProfile.username}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-ink">{tab === "alltime" ? myProfile.totalActivities : myWeeklyCount}</p>
                <p className="text-xs text-muted">{formatDistance(tab === "alltime" ? myProfile.totalDistance : myWeeklyDistance, units)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
