export default function ProfileLoading() {
  return (
    <div className="pb-6 animate-pulse">
      {/* Header */}
      <div className="bg-surface border-b border-border px-4 py-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-[72px] h-[72px] rounded-full bg-border flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-5 w-36 bg-border rounded" />
            <div className="h-3.5 w-24 bg-border rounded" />
          </div>
        </div>
        {/* Stats */}
        <div className="flex gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <div className="h-6 w-10 bg-border rounded mx-auto" />
              <div className="h-3 w-14 bg-border rounded mx-auto" />
            </div>
          ))}
        </div>
        {/* Action button */}
        <div className="h-10 w-full bg-border rounded-xl" />
      </div>

      {/* Activity cards */}
      <div className="px-4 pt-4 space-y-4">
        <div className="h-4 w-24 bg-border rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <div className="h-4 w-40 bg-border rounded" />
            <div className="h-3 w-28 bg-border rounded" />
            <div className="h-2 w-full bg-border rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
