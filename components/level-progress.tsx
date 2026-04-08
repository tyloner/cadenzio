import { getProgress, LEVELS } from "@/lib/levels"

interface Props {
  totalActivities: number
}

export function LevelProgress({ totalActivities }: Props) {
  const { current, next, pct, clefs, clefsCap } = getProgress(totalActivities)

  return (
    <div className="bg-mist border border-border rounded-2xl px-4 py-4 mt-4">
      {/* Current level label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
          <span>{current.emoji}</span>
          {current.name}
        </span>
        {next ? (
          <span className="text-xs text-muted">{clefs} / {clefsCap} clefs</span>
        ) : (
          <span className="text-xs text-yellow-600 font-semibold">Max level reached</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2.5 bg-border rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-700 ${current.color}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      {/* Next level label */}
      {next && (
        <p className="text-xs text-muted">
          {clefsCap - clefs} more composition{clefsCap - clefs !== 1 ? "s" : ""} to reach{" "}
          <span className={`font-semibold ${next.textColor}`}>{next.emoji} {next.name}</span>
        </p>
      )}

      {/* All levels row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        {LEVELS.slice(1).map((lvl) => {
          const earned = totalActivities >= lvl.threshold
          return (
            <div key={lvl.name} className="flex flex-col items-center gap-0.5">
              <span className={`text-lg ${earned ? "opacity-100" : "opacity-25 grayscale"}`}>
                {lvl.emoji}
              </span>
              <span className={`text-[9px] font-medium ${earned ? lvl.textColor : "text-muted"}`}>
                {lvl.name}
              </span>
              <span className="text-[9px] text-muted">{lvl.threshold}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
