export default function ActivityLoading() {
  return (
    <div className="animate-pulse">
      {/* Map placeholder */}
      <div className="h-56 bg-border w-full" />

      <div className="px-4 py-4 space-y-4">
        {/* Title + meta */}
        <div className="space-y-2">
          <div className="h-6 w-48 bg-border rounded" />
          <div className="h-3.5 w-32 bg-border rounded" />
        </div>

        {/* Stats row */}
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-1 bg-surface border border-border rounded-xl p-3 space-y-1.5">
              <div className="h-5 w-14 bg-border rounded mx-auto" />
              <div className="h-3 w-10 bg-border rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* Player placeholder */}
        <div className="bg-mist rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-border flex-shrink-0" />
            <div className="flex-1 h-2 bg-border rounded-full" />
          </div>
          <div className="h-3 w-24 bg-border rounded" />
        </div>
      </div>
    </div>
  )
}
