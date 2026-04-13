export default function ProfileLoading() {
  return (
    <div className="animate-pulse">
      {/* Cover / avatar area */}
      <div className="h-32 bg-mist" />
      <div className="px-4 pb-6">
        <div className="flex items-end gap-4 -mt-10 mb-4">
          <div className="w-20 h-20 rounded-full bg-border ring-4 ring-surface" />
          <div className="flex-1 space-y-2 pt-10">
            <div className="h-5 w-36 rounded bg-mist" />
            <div className="h-3.5 w-24 rounded bg-mist" />
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-mist" />
          ))}
        </div>
        {/* Activity cards */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-mist mb-3" />
        ))}
      </div>
    </div>
  )
}
