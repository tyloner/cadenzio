"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Users, UserPlus, Trash2, Play, Crown } from "lucide-react"
import Link from "next/link"

interface Member {
  userId: string
  role: string
  user: { id: string; name: string | null; image: string | null; profile?: { username: string } | null }
}

interface EnsembleSession {
  id: string
  status: string
}

interface Props {
  ensemble: {
    id: string
    name: string
    ownerId: string
    members: Member[]
    sessions: EnsembleSession[]
  }
  currentUserId: string
  isPro: boolean
  hasFreeTrial: boolean
  activeSession: EnsembleSession | null
}

export function EnsembleDetail({ ensemble, currentUserId, isPro, hasFreeTrial, activeSession }: Props) {
  const router = useRouter()
  const isOwner = ensemble.ownerId === currentUserId
  const canCreate = isPro || hasFreeTrial

  const [inviteUsername, setInviteUsername] = useState("")
  const [inviteError, setInviteError] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionError, setSessionError] = useState("")

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    setInviteLoading(true)
    setInviteError("")
    const res = await fetch(`/api/ensemble/${ensemble.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: inviteUsername.trim() }),
    })
    const data = await res.json()
    setInviteLoading(false)
    if (!res.ok) { setInviteError(data.error ?? "Failed"); return }
    setInviteUsername("")
    router.refresh()
  }

  async function removeMember(userId: string) {
    await fetch(`/api/ensemble/${ensemble.id}/members/${userId}`, { method: "DELETE" })
    router.refresh()
  }

  async function startSession() {
    setSessionLoading(true)
    setSessionError("")
    const res = await fetch(`/api/ensemble/${ensemble.id}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scales: ["major"] }),
    })
    const data = await res.json()
    setSessionLoading(false)
    if (!res.ok) { setSessionError(data.error ?? "Failed"); return }
    router.push(`/ensemble/${ensemble.id}/session/${data.id}`)
  }

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-wave/20 flex items-center justify-center flex-shrink-0">
          <Users size={22} className="text-wave" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">{ensemble.name}</h1>
          <p className="text-xs text-muted">{ensemble.members.length} member{ensemble.members.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Members */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-ink mb-3">Members</h2>
        <div className="flex flex-col gap-2">
          {ensemble.members.map((m) => (
            <div key={m.userId} className="bg-mist rounded-xl px-4 py-3 flex items-center gap-3">
              {m.user.image ? (
                <Image src={m.user.image} alt={m.user.name ?? ""} width={36} height={36} className="rounded-full flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-wave/20 flex items-center justify-center text-sm font-bold text-wave flex-shrink-0">
                  {(m.user.name ?? "?")[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{m.user.name}</p>
                {m.user.profile?.username && (
                  <p className="text-xs text-muted">@{m.user.profile.username}</p>
                )}
              </div>
              {m.role === "OWNER" && (
                <Crown size={14} className="text-wave flex-shrink-0" />
              )}
              {isOwner && m.userId !== currentUserId && (
                <button
                  onClick={() => removeMember(m.userId)}
                  className="text-muted hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
              {!isOwner && m.userId === currentUserId && (
                <button
                  onClick={() => removeMember(m.userId)}
                  className="text-xs text-muted hover:text-red-500 transition-colors"
                >
                  Leave
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite (owner only, up to 4 members) */}
      {isOwner && ensemble.members.length < 4 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-ink mb-3">Invite by username</h2>
          <form onSubmit={invite} className="flex gap-2">
            <input
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              placeholder="@username"
              className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-wave"
            />
            <button
              type="submit"
              disabled={!inviteUsername.trim() || inviteLoading}
              className="flex items-center gap-1.5 bg-wave text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
            >
              <UserPlus size={14} />
              {inviteLoading ? "…" : "Invite"}
            </button>
          </form>
          {inviteError && <p className="text-xs text-red-500 mt-2">{inviteError}</p>}
        </div>
      )}

      {/* Active session CTA */}
      {activeSession && (
        <div className="mb-4 bg-wave/10 border border-wave/20 rounded-xl p-4">
          <p className="text-sm font-semibold text-wave mb-2">Session in progress</p>
          <Link
            href={`/ensemble/${ensemble.id}/session/${activeSession.id}`}
            className="flex items-center justify-center gap-2 bg-wave text-white rounded-xl py-3 font-semibold text-sm"
          >
            <Play size={16} /> Rejoin Session
          </Link>
        </div>
      )}

      {/* Start session */}
      {isOwner && !activeSession && (
        <div>
          {!canCreate && (
            <div className="bg-mist rounded-xl p-4 mb-3 text-center">
              <p className="text-sm text-muted">You've used your free trial session.</p>
              <Link href="/settings/upgrade" className="text-sm font-semibold text-wave mt-1 inline-block">Upgrade to Pro →</Link>
            </div>
          )}
          <button
            onClick={startSession}
            disabled={!canCreate || sessionLoading || ensemble.members.length < 2}
            className="w-full flex items-center justify-center gap-2 bg-wave text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-40"
          >
            <Play size={16} />
            {sessionLoading ? "Creating session…" : "Start Session"}
          </button>
          {ensemble.members.length < 2 && (
            <p className="text-xs text-muted text-center mt-2">Need at least 2 members to start</p>
          )}
          {sessionError && <p className="text-xs text-red-500 text-center mt-2">{sessionError}</p>}
        </div>
      )}
    </div>
  )
}
