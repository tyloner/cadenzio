"use client"

import { useState, Component, type ReactNode } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Map, List, Music2, Timer, Footprints } from "lucide-react"
import { formatDuration, formatDistance, timeAgo } from "@/lib/utils"

const FeedMap = dynamic(() => import("./feed-map"), { ssr: false })
const MyActivitiesMap = dynamic(() => import("./my-activities-map"), { ssr: false })

class MapErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
          <Map size={32} className="text-border" />
          <p className="text-sm text-muted">Map could not be loaded.</p>
          <button
            onClick={() => this.setState({ failed: false })}
            className="text-wave text-sm font-medium hover:underline"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

interface Activity {
  id: string
  title: string
  startedAt: Date
  durationSec: number | null
  distanceM: number | null
  gpsTrack: unknown
  user: { name: string | null; image: string | null }
  composition: { genre: string } | null
  _count: { likes: number }
}

interface MyActivity {
  id: string
  title: string
  distanceM: number | null
  gpsTrack: unknown
  composition: { genre: string } | null
}

interface Props {
  activities: Activity[]
  currentUserId: string | null
  units?: "metric" | "imperial"
  myActivities?: MyActivity[]
  myStats?: { totalWalks: number; totalDistanceM: number }
}

const GENRE_COLORS: Record<string, string> = {
  blues: "bg-blue-100 text-blue-700",
  classical: "bg-purple-100 text-purple-700",
  jazz: "bg-amber-100 text-amber-700",
  ambient: "bg-teal-100 text-teal-700",
  electronic: "bg-pink-100 text-pink-700",
}

export function MapFeedView({ activities, currentUserId, units = "metric", myActivities = [], myStats }: Props) {
  const [view, setView] = useState<"map" | "mine" | "list">("map")

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Toggle bar */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-border bg-surface">
        <button
          onClick={() => setView("map")}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
            view === "map" ? "bg-wave text-white" : "text-muted hover:text-ink"
          }`}
        >
          <Map size={14} /> Discover
        </button>
        {currentUserId && (
          <button
            onClick={() => setView("mine")}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
              view === "mine" ? "bg-wave text-white" : "text-muted hover:text-ink"
            }`}
          >
            <Footprints size={14} /> My Walks
          </button>
        )}
        <button
          onClick={() => setView("list")}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
            view === "list" ? "bg-wave text-white" : "text-muted hover:text-ink"
          }`}
        >
          <List size={14} /> List
        </button>
        <span className="ml-auto text-xs text-muted">{activities.length} public</span>
      </div>

      {/* My stats bar */}
      {view === "mine" && myStats && (
        <div className="flex items-center gap-6 px-4 py-2.5 bg-wave/5 border-b border-wave/10 text-sm">
          <span className="font-semibold text-ink">{myStats.totalWalks} walk{myStats.totalWalks !== 1 ? "s" : ""}</span>
          <span className="text-muted">{formatDistance(myStats.totalDistanceM, units)} total</span>
        </div>
      )}

      {/* Discover map */}
      {view === "map" && (
        <div className="flex-1">
          <MapErrorBoundary>
            <FeedMap activities={activities} />
          </MapErrorBoundary>
        </div>
      )}

      {/* My walks map */}
      {view === "mine" && (
        <div className="flex-1">
          {myActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <Footprints size={32} className="text-wave/40" />
              <p className="text-muted text-sm">No walks recorded yet.</p>
              <Link href="/record" className="text-wave text-sm font-medium hover:underline">
                Start your first walk →
              </Link>
            </div>
          ) : (
            <MapErrorBoundary>
              <MyActivitiesMap activities={myActivities} />
            </MapErrorBoundary>
          )}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <Music2 size={32} className="text-wave/40" />
              <p className="text-muted text-sm">No public compositions yet.</p>
              <Link href="/record" className="text-wave text-sm font-medium hover:underline">
                Be the first →
              </Link>
            </div>
          ) : (
            activities.map((a) => {
              const genreClass = GENRE_COLORS[a.composition?.genre ?? ""] ?? "bg-gray-100 text-gray-600"
              const track = a.gpsTrack as { lat: number; lng: number }[]
              return (
                <Link key={a.id} href={`/activity/${a.id}`}>
                  <div className="bg-surface border border-border rounded-2xl p-4 hover:border-wave/40 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-ink text-sm">{a.title}</p>
                        <p className="text-xs text-muted">{a.user.name} · {timeAgo(a.startedAt)}</p>
                      </div>
                      {a.composition && (
                        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${genreClass}`}>
                          {a.composition.genre}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-muted">
                      {a.durationSec && (
                        <span className="flex items-center gap-1"><Timer size={11} />{formatDuration(a.durationSec)}</span>
                      )}
                      {a.distanceM && <span>{formatDistance(a.distanceM, units)}</span>}
                      {track?.length > 0 && <span className="text-wave">{track.length} clefs</span>}
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
