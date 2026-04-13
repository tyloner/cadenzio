export default function EnsembleLoading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-mist flex-shrink-0" />
        <div className="space-y-2">
          <div className="h-5 w-40 bg-mist rounded" />
          <div className="h-3.5 w-20 bg-mist rounded" />
        </div>
      </div>

      {/* Members section */}
      <div className="mb-6">
        <div className="h-4 w-16 bg-mist rounded mb-3" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-mist rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-border flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-28 bg-border rounded" />
                <div className="h-3 w-20 bg-border rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Start session button */}
      <div className="h-12 w-full rounded-xl bg-mist" />
    </div>
  )
}
