export default function EnsembleLoading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-6 w-32 rounded bg-mist mb-1" />
      <div className="h-4 w-56 rounded bg-mist mb-6" />

      {/* Create button placeholder */}
      <div className="h-12 w-full rounded-xl bg-mist mb-6" />

      {/* Ensemble cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-mist h-28 mb-3" />
      ))}
    </div>
  )
}
