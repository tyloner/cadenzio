"use client"

import { Award, Lock, CheckCircle, ChevronRight, BookOpen } from "lucide-react"
import { type Level, type LevelProgressData, evaluateLevels, LEVELS, challengeDescription, type ChallengeId } from "@/lib/levels"
import { COLLECTIBLES, type Collectible } from "@/lib/collectibles"

interface Props {
  levels: Level[]
  levelData: LevelProgressData
  totalActivities: number
  uniqueScales: number
  uniqueInstruments: number
  revealedChallenges: string[]
  badges: string[]
  collectedNoteKeys: string[]
  activeCollectible: Collectible
  activeNoteCaptured: boolean
}

function ConditionPill({ label, current, required, met, isOr, orMet }: {
  label: string; current: number; required: number; met: boolean; isOr?: boolean; orMet?: boolean
}) {
  const effective = isOr ? orMet ?? met : met
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
      effective ? "bg-green-100 text-green-700" : "bg-mist text-muted"
    }`}>
      {effective ? <CheckCircle size={11} /> : null}
      {current}/{required} {label}
      {isOr && <span className="opacity-60 ml-0.5">or</span>}
    </span>
  )
}

const RARITY_LABEL: Record<string, string> = {
  common: "Common",
  rare: "Rare",
  legendary: "Legendary",
}

const RARITY_BADGE: Record<string, string> = {
  common: "bg-slate-200 text-slate-600",
  rare: "bg-violet-100 text-violet-700",
  legendary: "bg-yellow-100 text-yellow-700",
}

export function ChallengesView({ levels, levelData, totalActivities, uniqueScales, uniqueInstruments, revealedChallenges, badges, collectedNoteKeys, activeCollectible, activeNoteCaptured }: Props) {
  const currentIdx = levels.indexOf(levelData.current)

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Award size={22} className="text-wave" />
        <h1 className="text-xl font-bold text-ink">Challenges & Badges</h1>
      </div>

      {/* Current level hero */}
      <div className={`rounded-2xl p-5 mb-6 ${levelData.current.color} bg-opacity-10`} style={{ background: "var(--color-mist)" }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{levelData.current.emoji}</span>
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Current Level</p>
            <p className={`text-xl font-bold ${levelData.current.textColor}`}>{levelData.current.name}</p>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-muted">
          <span><span className="font-bold text-ink">{totalActivities}</span> compositions</span>
          <span><span className="font-bold text-ink">{uniqueScales}</span> scales</span>
          <span><span className="font-bold text-ink">{uniqueInstruments}</span> instruments</span>
        </div>

        {/* Progress to next level */}
        {levelData.next && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted mb-1.5">
              <span>Progress to <span className="font-medium text-ink">{levelData.next.name}</span></span>
              <span>{Math.round(levelData.compositionPct * 100)}%</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${levelData.next.color}`}
                style={{ width: `${levelData.compositionPct * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* All levels */}
      <h2 className="text-sm font-semibold text-ink mb-3">All Levels</h2>
      <div className="flex flex-col gap-3 mb-8">
        {levels.map((level, idx) => {
          const status: "earned" | "current" | "locked" =
            idx < currentIdx ? "earned" :
            idx === currentIdx ? "current" : "locked"

          const isRevealed = level.challengeId
            ? revealedChallenges.includes(level.challengeId)
            : true

          // Build conditions for this level
          const conditions = level.requirement && (status === "current" || status === "locked") && isRevealed
            ? evaluateLevels(totalActivities, uniqueScales, uniqueInstruments, revealedChallenges).conditions
            : null

          const showConditions = status === "current" && conditions !== null

          return (
            <div
              key={level.name}
              className={`rounded-xl p-4 border transition-colors ${
                status === "earned" ? "border-green-200 bg-green-50" :
                status === "current" ? "border-wave/30 bg-wave/5" :
                "border-border bg-mist opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{level.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-sm ${
                      status === "earned" ? "text-green-700" :
                      status === "current" ? levelData.current.textColor :
                      "text-ink"
                    }`}>{level.name}</p>
                    {status === "earned" && <CheckCircle size={14} className="text-green-600 flex-shrink-0" />}
                    {status === "current" && <ChevronRight size={14} className="text-wave flex-shrink-0" />}
                    {status === "locked" && <Lock size={12} className="text-muted flex-shrink-0" />}
                  </div>
                  {level.requirement ? (
                    <p className="text-xs text-muted mt-0.5">
                      {level.challengeId && !isRevealed && status === "locked"
                        ? `🔒 ${levels.find(l => l.challengeId === level.challengeId)?.revealAt != null ? `Revealed at ${levels.find(l => l.challengeId === level.challengeId)!.revealAt} compositions` : "Keep composing to unlock"}`
                        : challengeDescription(level.challengeId as ChallengeId) || `${level.requirement.compositions} compositions`
                      }
                    </p>
                  ) : (
                    <p className="text-xs text-muted mt-0.5">Starting level</p>
                  )}
                </div>
                {level.badge && status === "earned" && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${level.color} text-white flex-shrink-0`}>
                    {level.badge}
                  </span>
                )}
              </div>

              {/* Condition pills for current level */}
              {showConditions && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-wave/10">
                  {conditions!.map((c, i) => (
                    <ConditionPill key={i} {...c} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Badges earned */}
      {badges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-ink mb-3">Badges Earned</h2>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => {
              const level = levels.find((l) => l.badge === badge)
              return (
                <div key={badge} className="flex items-center gap-2 bg-mist rounded-xl px-3 py-2">
                  <span className="text-lg">{level?.emoji ?? "🏅"}</span>
                  <span className="text-sm font-semibold text-ink">{badge}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* The Lost Octave — collectible album */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={18} className="text-wave" />
          <h2 className="text-sm font-semibold text-ink">The Lost Octave</h2>
          <span className="ml-auto text-xs text-muted">{collectedNoteKeys.length}/{COLLECTIBLES.length}</span>
        </div>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          Each week a hidden note appears within 1km of your last walk. Record a route that passes within 50m to collect it.
        </p>

        {/* Active this week */}
        <div className={`rounded-xl border-2 p-4 mb-4 ${
          activeNoteCaptured
            ? `${activeCollectible.bgColor} ${activeCollectible.borderColor}`
            : "border-wave/40 bg-wave/5"
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{activeCollectible.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-ink">{activeCollectible.name}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${RARITY_BADGE[activeCollectible.rarity]}`}>
                  {RARITY_LABEL[activeCollectible.rarity]}
                </span>
                {activeNoteCaptured && <CheckCircle size={14} className="text-green-600 flex-shrink-0" />}
              </div>
              <p className="text-xs text-muted">{activeCollectible.key} · {activeCollectible.description}</p>
            </div>
          </div>
          <p className="text-xs font-medium mt-3">
            {activeNoteCaptured
              ? <span className="text-green-600">Collected this week ✓</span>
              : <span className="text-wave">Active this week — go find it</span>
            }
          </p>
        </div>

        {/* Full album grid */}
        <div className="grid grid-cols-3 gap-2">
          {COLLECTIBLES.map((c) => {
            const collected = collectedNoteKeys.includes(c.key)
            const isActive = c.key === activeCollectible.key
            return (
              <div
                key={c.key}
                className={`rounded-xl border p-3 flex flex-col items-center gap-1 text-center transition-all ${
                  collected
                    ? `${c.bgColor} ${c.borderColor}`
                    : isActive
                    ? "border-wave/40 bg-wave/5"
                    : "border-border bg-mist opacity-50"
                }`}
              >
                <span className={`text-2xl ${!collected && !isActive ? "grayscale opacity-40" : ""}`}>
                  {c.emoji}
                </span>
                <p className={`text-[11px] font-semibold leading-tight ${collected ? c.textColor : "text-muted"}`}>
                  {collected ? c.name : c.key}
                </p>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                  collected ? RARITY_BADGE[c.rarity] : "bg-border text-muted"
                }`}>
                  {collected ? RARITY_LABEL[c.rarity] : isActive ? "This week" : "?"}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
