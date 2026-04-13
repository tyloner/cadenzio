"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Send } from "lucide-react"
import { timeAgo } from "@/lib/utils"

interface Comment {
  id: string
  body: string
  createdAt: string
  user: { name: string | null; image: string | null; profile: { username: string } | null }
}

interface Props {
  activityId: string
  currentUserId: string | null
  currentUserName?: string | null
  currentUserImage?: string | null
  initialCount: number
}

export function CommentsSection({ activityId, currentUserId, currentUserName, currentUserImage, initialCount }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState("")
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [count, setCount] = useState(initialCount)
  const [loadError, setLoadError] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  async function loadComments() {
    setLoadError(false)
    try {
      const res = await fetch(`/api/activities/${activityId}/comments`)
      if (res.ok) setComments(await res.json())
      else setLoadError(true)
    } catch {
      setLoadError(true)
    }
  }

  function toggle() {
    if (!open) loadComments()
    setOpen((o) => !o)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed || posting) return
    setPosting(true)
    setPostError(null)
    setBody("")

    // Optimistic insert
    const optimisticId = `opt-${Date.now()}`
    const optimistic: Comment = {
      id: optimisticId,
      body: trimmed,
      createdAt: new Date().toISOString(),
      user: { name: currentUserName ?? null, image: currentUserImage ?? null, profile: null },
    }
    setComments((prev) => [...prev, optimistic])
    setCount((c) => c + 1)

    try {
      const res = await fetch(`/api/activities/${activityId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      })
      if (res.ok) {
        const comment = await res.json()
        setComments((prev) => prev.map((c) => c.id === optimisticId ? comment : c))
      } else {
        // Revert optimistic
        setComments((prev) => prev.filter((c) => c.id !== optimisticId))
        setCount((c) => c - 1)
        setBody(trimmed)
        setPostError("Failed to post comment. Try again.")
      }
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimisticId))
      setCount((c) => c - 1)
      setBody(trimmed)
      setPostError("Network error. Check your connection.")
    }
    setPosting(false)
  }

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  return (
    <div className="border-t border-border">
      {/* Toggle header */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted hover:text-ink transition-colors"
      >
        <span className="font-medium">{count === 0 ? "No comments" : `${count} comment${count !== 1 ? "s" : ""}`}</span>
        <span className="text-xs">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          {/* Comment list */}
          {loadError ? (
            <p className="text-sm text-beat text-center py-4">Couldn't load comments. <button onClick={loadComments} className="underline hover:text-beat/70">Retry</button></p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">Be the first to comment.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => {
                const profileHref = c.user.profile?.username ? `/profile/${c.user.profile.username}` : null
                const Avatar = () => c.user.image ? (
                  <Image src={c.user.image} alt={c.user.name ?? ""} width={28} height={28} className="rounded-full flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-wave/20 flex items-center justify-center text-wave text-xs font-bold flex-shrink-0 mt-0.5">
                    {c.user.name?.[0] ?? "?"}
                  </div>
                )
                return (
                  <li key={c.id} className="flex gap-3">
                    {profileHref ? (
                      <Link href={profileHref} className="flex-shrink-0 mt-0.5 hover:opacity-80 transition-opacity">
                        <Avatar />
                      </Link>
                    ) : (
                      <div className="flex-shrink-0 mt-0.5"><Avatar /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        {profileHref ? (
                          <Link href={profileHref} className="text-xs font-semibold text-ink hover:text-wave transition-colors">
                            {c.user.name}
                          </Link>
                        ) : (
                          <span className="text-xs font-semibold text-ink">{c.user.name}</span>
                        )}
                        <span className="text-[10px] text-muted">{timeAgo(new Date(c.createdAt))}</span>
                      </div>
                      <p className="text-sm text-slate mt-0.5 leading-relaxed">{c.body}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Input */}
          {currentUserId && (
            <form onSubmit={submit} className="flex flex-col gap-1.5 pt-1">
            {postError && (
              <p className="text-xs text-beat px-1">{postError}</p>
            )}
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e as unknown as React.FormEvent) }
                }}
                placeholder="Add a comment…"
                rows={1}
                maxLength={500}
                className="flex-1 resize-none border border-border rounded-xl px-3 py-2 text-sm text-ink bg-mist focus:outline-none focus:ring-2 focus:ring-wave/30"
              />
              <button
                type="submit"
                disabled={!body.trim() || posting}
                className="w-9 h-9 flex-shrink-0 rounded-xl bg-wave text-white flex items-center justify-center hover:bg-wave/80 transition-colors disabled:opacity-40 self-end"
              >
                <Send size={14} />
              </button>
            </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
