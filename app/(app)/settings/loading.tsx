export default function SettingsLoading() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto animate-pulse space-y-4">
      <div className="h-7 w-24 bg-border rounded-lg mb-6" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-5 space-y-3">
          <div className="h-4 w-28 bg-border rounded" />
          <div className="h-10 w-full bg-border rounded-xl" />
          <div className="h-10 w-full bg-border rounded-xl" />
        </div>
      ))}
    </div>
  )
}
