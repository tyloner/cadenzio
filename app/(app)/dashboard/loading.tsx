export default function DashboardLoading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-7 w-32 bg-border rounded-lg mb-6" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-border flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-28 bg-border rounded" />
                <div className="h-3 w-20 bg-border rounded" />
              </div>
            </div>
            <div className="h-4 w-3/4 bg-border rounded" />
            <div className="h-3 w-1/2 bg-border rounded" />
            <div className="h-2 w-full bg-border rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
