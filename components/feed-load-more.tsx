"use client"

import { useState, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { ActivityCard } from "@/components/activity-card"

interface FeedActivity {
  id: string
  title: string
  startedAt: string // ISO string from JSON
  durationSec: number | null
  distanceM: number | null
  user: { name: string | null; image: string | null }
  composition: { genre: string; scale: string; audioUrl: string | null; instrument: string } | null
  _count: { likes: number; comments: number }
}

interface Props {
  initialCursor: string | null
  units: "metric" | "imperial"
}

export function FeedLoadMore({ initialCursor, units }: Props) {
  const [activities, setActivities] = useState<FeedActivity[]>([])
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}`)
      if (!res.ok) return
      const data: { activities: FeedActivity[]; nextCursor: string | null } = await res.json()
      setActivities((prev) => [...prev, ...data.activities])
      setCursor(data.nextCursor)
    } finally {
      setLoading(false)
    }
  }, [cursor, loading])

  // Coerce ISO string dates to Date objects for ActivityCard
  const toCard = (a: FeedActivity) => ({ ...a, startedAt: new Date(a.startedAt) })

  return (
    <>
      {activities.map((a) => (
        <ActivityCard key={a.id} activity={toCard(a)} units={units} />
      ))}

      {cursor && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full py-3 text-sm font-medium text-wave border border-wave/30 rounded-2xl hover:bg-wave/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={14} className="animate-spin" /> Loading…</> : "Load more"}
        </button>
      )}
    </>
  )
}
