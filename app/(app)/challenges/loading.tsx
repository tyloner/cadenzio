export default function ChallengesLoading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      {/* Header */}
      <div className="h-6 w-48 rounded bg-mist mb-1" />
      <div className="h-4 w-64 rounded bg-mist mb-6" />

      {/* Level progress bar */}
      <div className="h-20 rounded-2xl bg-mist mb-6" />

      {/* Badge chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 w-24 rounded-full bg-mist" />
        ))}
      </div>

      {/* Challenge cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-mist h-24 mb-3" />
      ))}
    </div>
  )
}
