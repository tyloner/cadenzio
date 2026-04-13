"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Heart, Music2, Timer, Ruler, Share2, Globe, Lock, Pencil, Trash2, Check, X } from "lucide-react"
import { useT } from "@/components/layout/language-provider"
import { formatDuration, formatDistance, timeAgo } from "@/lib/utils"
import { useState, useRef } from "react"
import { CompositionPlayer } from "./composition-player"
import { CommentsSection } from "./comments-section"
import { ChallengeRevealPopup } from "./challenge-reveal-popup"
const ActivityMap = dynamic(() => import("./map/activity-map"), { ssr: false })

interface FullActivity {
  id: string
  title: string
  startedAt: Date
  durationSec: number | null
  distanceM: number | null
  isPublic: boolean
  gpsTrack: unknown
  likes: { userId: string }[]
  user: { id: string; name: string | null; image: string | null }
  composition: {
    startingNote: string
    scale: string
    genre: string
    instrument: string
    bpmAvg: number | null
    audioUrl: string | null
    midiEvents: unknown
  } | null
  _count: { likes: number; comments: number }
}

interface Props {
  activity: FullActivity
  currentUserId: string | null
  isLiked: boolean
  units?: "metric" | "imperial"
  revealChallenge?: string | null
}

const GENRE_COLORS: Record<string, string> = {
  blues: "bg-blue-100 text-blue-700",
  classical: "bg-purple-100 text-purple-700",
  jazz: "bg-amber-100 text-amber-700",
  ambient: "bg-teal-100 text-teal-700",
  electronic: "bg-pink-100 text-pink-700",
}

export function ActivityDetail({ activity, currentUserId, isLiked: initialLiked, units = "metric", revealChallenge }: Props) {
  const router = useRouter()
  const t = useT()
  const isOwner = currentUserId === activity.user.id

  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(activity._count.likes)
  const [liking, setLiking] = useState(false)
  const [mapProgress, setMapProgress] = useState<number | undefined>(undefined)
  const [titleError, setTitleError] = useState<string | null>(null)

  // Owner: title editing
  const [title, setTitle] = useState(activity.title)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(activity.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Owner: visibility
  const [isPublic, setIsPublic] = useState(activity.isPublic)
  const [togglingVisibility, setTogglingVisibility] = useState(false)

  // Owner: delete
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  async function toggleLike() {
    if (liking) return
    const next = !liked
    setLiked(next)
    setLikeCount((c) => (next ? c + 1 : c - 1))
    setLiking(true)
    try {
      const res = await fetch(`/api/activities/${activity.id}/like`, { method: next ? "POST" : "DELETE" })
      if (!res.ok) {
        // Revert optimistic update on failure
        setLiked(!next)
        setLikeCount((c) => (next ? c - 1 : c + 1))
      }
    } catch {
      setLiked(!next)
      setLikeCount((c) => (next ? c - 1 : c + 1))
    } finally {
      setLiking(false)
    }
  }

  function startEditTitle() {
    setTitleDraft(title)
    setEditingTitle(true)
    setTimeout(() => titleInputRef.current?.focus(), 0)
  }

  async function saveTitle() {
    const trimmed = titleDraft.trim()
    if (!trimmed || trimmed === title) { setEditingTitle(false); return }
    setTitleError(null)
    try {
      const res = await fetch(`/api/activities/${activity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      })
      if (res.ok) {
        setTitle(trimmed)
        setEditingTitle(false)
      } else {
        setTitleError("Failed to save. Try again.")
      }
    } catch {
      setTitleError("Network error. Check your connection.")
    }
  }

  async function toggleVisibility() {
    setTogglingVisibility(true)
    const next = !isPublic
    try {
      const res = await fetch(`/api/activities/${activity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      })
      if (res.ok) setIsPublic(next)
      // On failure: leave isPublic unchanged — the toggle visually reverts automatically
    } catch {
      // Network error: state unchanged, user can retry
    } finally {
      setTogglingVisibility(false)
    }
  }

  async function deleteActivity() {
    setDeleting(true)
    const res = await fetch(`/api/activities/${activity.id}`, { method: "DELETE" })
    if (res.ok) router.replace("/")
    else setDeleting(false)
  }

  const gpsTrack = activity.gpsTrack as { lat: number; lng: number; timestamp: number }[]
  const genreClass = GENRE_COLORS[activity.composition?.genre ?? ""] ?? "bg-gray-100 text-gray-600"

  return (
    <div className="flex flex-col">
      {/* Challenge reveal popup */}
      {revealChallenge && (
        <ChallengeRevealPopup challengeId={revealChallenge} activityId={activity.id} />
      )}

      {/* Map */}
      <div className="h-64">
        <ActivityMap points={gpsTrack} progress={mapProgress} />
      </div>

      <div className="px-4 py-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {activity.user.image ? (
            <Image src={activity.user.image} alt={activity.user.name ?? ""} width={40} height={40} className="rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-wave/20 flex items-center justify-center text-wave font-bold">
              {activity.user.name?.[0]}
            </div>
          )}
          <div className="flex-1">
            <p className="font-semibold text-ink">{activity.user.name}</p>
            <p className="text-xs text-muted">{timeAgo(activity.startedAt)}</p>
          </div>
          {activity.composition && (
            <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${genreClass}`}>
              {activity.composition.genre}
            </span>
          )}
        </div>

        {/* Title + owner controls */}
        {editingTitle ? (
          <div className="flex flex-col gap-1 mb-4">
            <div className="flex items-center gap-2">
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => { setTitleDraft(e.target.value); setTitleError(null) }}
                onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") { setEditingTitle(false); setTitleError(null) } }}
                maxLength={100}
                className="flex-1 text-xl font-bold text-ink bg-mist rounded-lg px-3 py-1 outline-none border border-wave"
              />
              <button onClick={saveTitle} className="text-wave hover:text-wave/70 transition-colors">
                <Check size={20} />
              </button>
              <button onClick={() => { setEditingTitle(false); setTitleError(null) }} className="text-muted hover:text-ink transition-colors">
                <X size={20} />
              </button>
            </div>
            {titleError && <p className="text-xs text-beat px-1">{titleError}</p>}
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-xl font-bold text-ink flex-1">{title}</h1>
            {isOwner && (
              <button onClick={startEditTitle} className="text-muted hover:text-ink transition-colors flex-shrink-0">
                <Pencil size={16} />
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Timer,  label: t("activity.duration"), value: activity.durationSec ? formatDuration(activity.durationSec) : "—" },
            { icon: Ruler,  label: t("activity.distance"), value: activity.distanceM ? formatDistance(activity.distanceM, units) : "—" },
            { icon: Music2, label: t("activity.bpm"),      value: activity.composition?.bpmAvg ? `${Math.round(activity.composition.bpmAvg)}` : "—" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-mist rounded-xl p-3 text-center">
              <Icon size={16} className="text-wave mx-auto mb-1" />
              <p className="text-sm font-semibold text-ink">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>

        {/* Composition player */}
        {activity.composition && (() => {
          const midiEvs = (activity.composition!.midiEvents as { note: number; duration: string; time: number; velocity: number; track: "lead" | "rhythm" | "pad" }[]) ?? []
          if (midiEvs.length === 0) return (
            <div className="bg-mist rounded-xl p-4 mb-6 flex items-center gap-3 text-sm text-muted">
              <Music2 size={18} className="flex-shrink-0" />
              Audio composition unavailable for this recording.
            </div>
          )
          return (
            <CompositionPlayer
              midiEvents={midiEvs}
              bpmAvg={activity.composition!.bpmAvg}
              genre={activity.composition!.genre}
              instrument={activity.composition!.instrument}
              startingNote={activity.composition!.startingNote}
              scale={activity.composition!.scale}
              onProgress={setMapProgress}
            />
          )
        })()}

        {/* Actions row */}
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <button
            onClick={toggleLike}
            disabled={!currentUserId || liking}
            className="flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-40"
            style={{ touchAction: "manipulation" }}
          >
            <Heart size={20} className={liked ? "text-beat fill-beat" : "text-muted"} />
            <span className={liked ? "text-beat" : "text-muted"}>{likeCount}</span>
          </button>

          {isOwner && (
            <>
              <button
                onClick={toggleVisibility}
                disabled={togglingVisibility}
                title={isPublic ? "Make private" : "Make public"}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors disabled:opacity-40"
              >
                {isPublic ? <Globe size={16} /> : <Lock size={16} />}
                {isPublic ? t("activity.public") : t("activity.private")}
              </button>

              {confirmDelete ? (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-red-500">{t("activity.delete.confirm")}</span>
                  <button
                    onClick={deleteActivity}
                    disabled={deleting}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-40"
                  >
                    {deleting ? t("activity.delete.ing") : t("activity.delete.yes")}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-muted hover:text-ink"
                  >
                    {t("activity.delete.cancel")}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="ml-auto text-muted hover:text-red-500 transition-colors"
                  title="Delete activity"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </>
          )}

          <button
            onClick={async () => {
              const url = window.location.href
              if (navigator.share) {
                await navigator.share({ title, url }).catch(() => {})
              } else {
                await navigator.clipboard.writeText(url).catch(() => {})
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }
            }}
            className={`flex items-center gap-2 text-sm font-medium text-muted hover:text-wave transition-colors ${isOwner ? "" : "ml-auto"}`}
          >
            <Share2 size={18} />
            {copied ? "Copied!" : t("activity.share")}
          </button>
        </div>
      </div>

      {/* Comments */}
      <CommentsSection
        activityId={activity.id}
        currentUserId={currentUserId}
        initialCount={activity._count.comments}
      />
    </div>
  )
}
