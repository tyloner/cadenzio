export default function NotificationsLoading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-7 w-36 bg-border rounded-lg mb-6" />
      <div className="flex flex-col gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-border flex-shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3.5 w-3/4 bg-border rounded" />
              <div className="h-3 w-1/2 bg-border rounded" />
              <div className="h-3 w-20 bg-border rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
