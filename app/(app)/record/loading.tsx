export default function RecordLoading() {
  return (
    <div className="px-4 py-6 max-w-sm mx-auto animate-pulse">
      {/* Heading */}
      <div className="h-6 w-40 bg-mist rounded mb-2" />
      <div className="h-4 w-56 bg-mist rounded mb-8" />

      {/* Title input */}
      <div className="mb-6">
        <div className="h-4 w-16 bg-mist rounded mb-2" />
        <div className="h-11 w-full bg-mist rounded-xl" />
      </div>

      {/* Instrument grid */}
      <div className="mb-6">
        <div className="h-4 w-20 bg-mist rounded mb-2" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-mist" />
          ))}
        </div>
      </div>

      {/* Note chips */}
      <div className="mb-6">
        <div className="h-4 w-24 bg-mist rounded mb-2" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="h-9 w-12 rounded-lg bg-mist" />
          ))}
        </div>
      </div>

      {/* Scale grid */}
      <div className="mb-6">
        <div className="h-4 w-12 bg-mist rounded mb-2" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-mist" />
          ))}
        </div>
      </div>

      {/* Genre grid */}
      <div className="mb-8">
        <div className="h-4 w-14 bg-mist rounded mb-2" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-11 rounded-xl bg-mist" />
          ))}
        </div>
      </div>

      {/* Start button */}
      <div className="h-14 w-full rounded-2xl bg-mist" />
    </div>
  )
}
