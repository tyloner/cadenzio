import { evaluateLevels, LEVELS } from "@/lib/levels"
import { t, type Lang } from "@/lib/i18n/server"
import type { ConditionStatus } from "@/lib/levels"

interface Props {
  totalActivities: number
  uniqueScales: number
  uniqueInstruments: number
  revealedChallenges: string[]
  lang?: Lang
}

function ConditionPill({ cond, lang }: { cond: ConditionStatus; lang: Lang }) {
  const filled = `${cond.current}/${cond.required}`
  const label =
    cond.type === "compositions"
      ? t(lang, "level.cond.compositions", { n: filled })
      : cond.type === "scales"
      ? t(lang, "level.cond.scales", { n: filled })
      : t(lang, "level.cond.instruments", { n: filled })

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
        cond.met
          ? "bg-wave/10 border-wave/30 text-wave"
          : "bg-mist border-border text-muted"
      }`}
    >
      <span>{cond.met ? "✓" : "✗"}</span>
      {label}
    </span>
  )
}

export function LevelProgress({
  totalActivities,
  uniqueScales,
  uniqueInstruments,
  revealedChallenges,
  lang = "en",
}: Props) {
  const data = evaluateLevels(totalActivities, uniqueScales, uniqueInstruments, revealedChallenges)
  const { current, next, compositionPct, compositionCurrent, compositionRequired, conditions, challengeRevealed } = data

  // Find revealAt for current level (threshold to reveal next challenge)
  const currentLevelDef = LEVELS.find((l) => l.name === current.name)
  const revealAt = currentLevelDef?.revealAt ?? null

  return (
    <div className="bg-mist border border-border rounded-2xl px-4 py-4 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
          <span>{current.emoji}</span>
          {current.name}
        </span>
        {next ? (
          <span className="text-xs text-muted font-mono">
            {compositionCurrent} / {compositionRequired}
          </span>
        ) : (
          <span className="text-xs text-yellow-600 font-semibold">{t(lang, "level.max")}</span>
        )}
      </div>

      {/* Composition progress bar */}
      <div className="h-2.5 bg-border rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ${current.color}`}
          style={{ width: `${compositionPct * 100}%` }}
        />
      </div>

      {/* Conditions / secret challenge block */}
      {next && (
        <div className="mb-3">
          {challengeRevealed && conditions ? (
            <div className="space-y-2">
              {/* Check if any are OR conditions */}
              {(() => {
                const orConds = conditions.filter((c) => c.isOr)
                const andConds = conditions.filter((c) => !c.isOr)
                return (
                  <>
                    {andConds.map((cond, i) => (
                      <div key={i} className="flex flex-wrap gap-1.5">
                        <ConditionPill cond={cond} lang={lang} />
                      </div>
                    ))}
                    {orConds.length === 2 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <ConditionPill cond={orConds[0]} lang={lang} />
                        <span className="text-xs font-bold text-muted">{t(lang, "level.cond.or")}</span>
                        <ConditionPill cond={orConds[1]} lang={lang} />
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>🔒</span>
              <span className="font-medium">{t(lang, "level.challenge.locked")}</span>
              {revealAt && (
                <span className="text-muted/70">
                  — {t(lang, "level.challenge.unlock", { n: revealAt })}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Level strip */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        {LEVELS.map((lvl) => {
          const earned =
            !lvl.requirement ||
            (totalActivities >= lvl.requirement.compositions)
          return (
            <div key={lvl.name} className="flex flex-col items-center gap-0.5">
              <span className={`text-lg ${earned ? "opacity-100" : "opacity-25 grayscale"}`}>
                {lvl.emoji}
              </span>
              <span className={`text-[9px] font-medium leading-tight text-center ${earned ? lvl.textColor : "text-muted"}`}>
                {lvl.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
