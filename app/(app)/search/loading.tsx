export default function SearchLoading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-7 w-24 bg-border rounded mb-4" />
      <div className="h-12 w-full bg-border rounded-2xl mb-6" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-border mb-2">
          <div className="w-11 h-11 rounded-full bg-border flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-32 bg-border rounded" />
            <div className="h-3 w-20 bg-border rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
