export default function EnsembleResultLoading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded bg-mist" />
        <div className="h-6 w-48 bg-mist rounded" />
      </div>
      <div className="h-4 w-40 bg-mist rounded mb-6" />

      {/* Member avatars */}
      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-mist" />
            <div className="h-2.5 w-10 bg-mist rounded" />
            <div className="h-2.5 w-12 bg-mist rounded" />
          </div>
        ))}
      </div>

      {/* Player */}
      <div className="h-28 w-full rounded-2xl bg-mist mb-6" />

      {/* Track breakdown */}
      <div className="mb-6">
        <div className="h-4 w-12 bg-mist rounded mb-3" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded-lg bg-mist" />
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <div className="flex-1 h-12 rounded-xl bg-mist" />
        <div className="flex-1 h-12 rounded-xl bg-mist" />
      </div>
    </div>
  )
}
