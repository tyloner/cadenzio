"use client"

import { useState } from "react"
import { Check, Lock, Download, Trash2 } from "lucide-react"
import Link from "next/link"

const COUNTRIES = ["Argentina", "Australia", "Brazil", "Canada", "France", "Germany", "Italy", "Mexico", "Netherlands", "Portugal", "Spain", "United Kingdom", "United States", "Other"]
const MUSICAL_INTERESTS = ["Classical", "Blues", "Jazz", "Electronic", "Ambient", "Folk", "Pop", "Rock", "Hip-hop", "R&B"]

interface Props {
  profile: { username: string; bio: string | null; country: string | null; musicalInterests: string[]; isPublic: boolean; units: string } | null
  tier: string
  userId: string
  userEmail: string
  userName: string
}

export function SettingsForm({ profile, tier, userEmail, userName }: Props) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [bio, setBio] = useState(profile?.bio ?? "")
  const [country, setCountry] = useState(profile?.country ?? "")
  const [interests, setInterests] = useState<string[]>(profile?.musicalInterests ?? [])
  const [username, setUsername] = useState(profile?.username ?? "")
  const [units, setUnits] = useState<"metric" | "imperial">((profile?.units ?? "metric") as "metric" | "imperial")
  const isPro = tier === "PRO"

  function toggleInterest(v: string) {
    setInterests((prev) => prev.includes(v) ? prev.filter((i) => i !== v) : [...prev, v])
  }

  async function save() {
    setSaving(true)
    setSaveError(null)
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, country, musicalInterests: interests, username, units }),
    })
    setSaving(false)
    if (!res.ok) {
      const { error } = await res.json()
      setSaveError(error ?? "Could not save changes")
      return
    }
    const data = await res.json()
    if (data.username) setUsername(data.username)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Account info (read-only) */}
      <section className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-ink mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted">Name</label>
            <p className="text-sm text-ink font-medium mt-0.5">{userName}</p>
          </div>
          <div>
            <label className="text-xs text-muted">Email</label>
            <p className="text-sm text-ink font-medium mt-0.5">{userEmail}</p>
          </div>
        </div>
      </section>

      {/* Subscription */}
      <section className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-ink">Plan</h2>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isPro ? "bg-wave/10 text-wave" : "bg-mist text-muted border border-border"}`}>
            {isPro ? "Pro" : "Free"}
          </span>
        </div>
        {!isPro && (
          <div className="mt-3">
            <p className="text-xs text-muted mb-3 leading-relaxed">
              Upgrade to unlock unlimited recordings, all genres, style tagging, and more.
            </p>
            <Link
              href="/settings/upgrade"
              className="block w-full text-center bg-wave text-white font-medium rounded-xl py-2.5 text-sm hover:bg-wave-dark transition-colors"
            >
              Upgrade to Pro
            </Link>
          </div>
        )}
      </section>

      {/* Profile */}
      <section className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-ink mb-4">Profile</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={30}
                placeholder="your_username"
                className="w-full border border-border rounded-xl pl-7 pr-3 py-2.5 text-sm text-ink bg-mist focus:outline-none focus:ring-2 focus:ring-wave/30"
              />
            </div>
            <p className="text-xs text-muted mt-1">Only letters, numbers and underscores. Min 3 characters.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">Units</label>
            <div className="flex rounded-xl border border-border overflow-hidden">
              {(["metric", "imperial"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnits(u)}
                  className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
                    units === u ? "bg-wave text-white" : "bg-mist text-muted hover:text-ink"
                  }`}
                >
                  {u === "metric" ? "Metric (km)" : "Imperial (mi)"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="A few words about yourself…"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-ink bg-mist resize-none focus:outline-none focus:ring-2 focus:ring-wave/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-ink bg-mist focus:outline-none focus:ring-2 focus:ring-wave/30"
            >
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-2">Musical interests</label>
            <div className="flex flex-wrap gap-2">
              {MUSICAL_INTERESTS.map((i) => (
                <button
                  key={i}
                  onClick={() => toggleInterest(i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    interests.includes(i)
                      ? "bg-wave text-white border-wave"
                      : "bg-mist text-muted border-border hover:border-wave/50"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>

        {saveError && (
          <p className="text-xs text-red-500 mt-3 text-center">{saveError}</p>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="w-full mt-5 flex items-center justify-center gap-2 bg-ink text-white font-medium rounded-xl py-3 text-sm hover:bg-slate transition-colors disabled:opacity-60"
        >
          {saved ? <><Check size={14} /> Saved!</> : saving ? "Saving…" : "Save changes"}
        </button>
      </section>

      {/* Privacy */}
      <section className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-ink mb-3">Privacy & Data</h2>
        <div className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">Your location data is only stored as part of your activity records and never sold to third parties.</p>
          <div className="flex gap-4 text-xs">
            <Link href="/legal/privacy" className="text-wave hover:underline">Privacy Policy</Link>
            <Link href="/legal/terms" className="text-wave hover:underline">Terms of Service</Link>
          </div>

          {/* Export data */}
          <div className="pt-1 border-t border-border">
            <p className="text-xs text-muted mb-2">Download a copy of all your data (account, profile, activities, compositions) as JSON.</p>
            <a
              href="/api/user/export"
              download
              className="inline-flex items-center gap-1.5 text-xs font-medium text-wave border border-wave/40 rounded-xl px-3 py-2 hover:bg-wave/5 transition-colors"
            >
              <Download size={12} /> Export my data
            </a>
          </div>

          {/* Delete account */}
          <DeleteAccountSection />
        </div>
      </section>

      {/* Style tagging — Pro gate */}
      {!isPro && (
        <section className="bg-surface border border-border rounded-2xl p-5 opacity-70">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold text-ink">Style Profile</h2>
            <Lock size={12} className="text-muted" />
          </div>
          <p className="text-xs text-muted">Your musical persona and style tags appear here on Pro.</p>
        </section>
      )}
    </div>
  )
}

function DeleteAccountSection() {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState("")

  async function deleteAccount() {
    setDeleting(true)
    const res = await fetch("/api/user", { method: "DELETE" })
    if (res.ok) {
      // Force full reload to clear session
      window.location.href = "/"
    } else {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (!confirming) {
    return (
      <div className="pt-1 border-t border-border">
        <p className="text-xs text-muted mb-2">Permanently delete your account and all associated data. This cannot be undone.</p>
        <button
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-xl px-3 py-2 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={12} /> Delete account
        </button>
      </div>
    )
  }

  return (
    <div className="pt-1 border-t border-border space-y-3">
      <p className="text-xs font-semibold text-red-500">This will permanently delete your account, all compositions, activities, and profile data.</p>
      <div>
        <label className="block text-xs text-muted mb-1">Type <span className="font-mono font-semibold text-ink">DELETE</span> to confirm</label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm text-ink bg-mist focus:outline-none focus:ring-2 focus:ring-red-300"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={deleteAccount}
          disabled={confirmText !== "DELETE" || deleting}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-red-500 rounded-xl py-2.5 hover:bg-red-600 transition-colors disabled:opacity-40"
        >
          <Trash2 size={12} /> {deleting ? "Deleting…" : "Delete my account"}
        </button>
        <button
          onClick={() => { setConfirming(false); setConfirmText("") }}
          className="px-4 text-xs text-muted border border-border rounded-xl py-2.5 hover:bg-mist transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
