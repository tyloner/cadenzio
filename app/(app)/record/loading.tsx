export default function RecordLoading() {
  return (
    <div className="px-4 py-6 flex flex-col items-center animate-pulse">
      {/* Genre / instrument pickers */}
      <div className="w-full h-16 rounded-2xl bg-mist mb-4" />
      <div className="w-full h-16 rounded-2xl bg-mist mb-8" />

      {/* Record button */}
      <div className="w-32 h-32 rounded-full bg-mist mb-6" />

      <div className="h-4 w-48 rounded bg-mist" />
    </div>
  )
}
