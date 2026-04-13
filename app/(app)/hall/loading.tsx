export default function HallLoading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      {/* Tab bar skeleton */}
      <div className="flex gap-2 mb-6">
        <div className="h-9 w-24 rounded-xl bg-mist" />
        <div className="h-9 w-24 rounded-xl bg-mist" />
      </div>

      {/* My rank banner */}
      <div className="h-20 rounded-2xl bg-mist mb-6" />

      {/* List rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3 border-b border-border">
          <div className="w-6 h-4 rounded bg-mist" />
          <div className="w-10 h-10 rounded-full bg-mist" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-32 rounded bg-mist" />
            <div className="h-3 w-20 rounded bg-mist" />
          </div>
          <div className="h-3.5 w-12 rounded bg-mist" />
        </div>
      ))}
    </div>
  )
}
