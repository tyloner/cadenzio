"use client"

import { useState } from "react"
import { UserPlus, UserCheck } from "lucide-react"

interface Props {
  userId: string
  initialFollowing: boolean
  compact?: boolean
}

export function FollowButton({ userId, initialFollowing, compact }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const res = await fetch(`/api/profile/${userId}/follow`, { method: "POST" })
    if (res.ok) {
      const data = await res.json()
      setFollowing(data.following)
    }
    setLoading(false)
  }

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center transition-colors disabled:opacity-60 ${
          following ? "border border-border text-muted hover:bg-mist" : "bg-wave text-white hover:bg-wave/80"
        }`}
      >
        {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-6 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
        following
          ? "border border-border text-ink hover:bg-mist"
          : "bg-wave text-white hover:bg-wave/80"
      }`}
    >
      {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
      {following ? "Following" : "Follow"}
    </button>
  )
}
