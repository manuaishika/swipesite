// Shown instantly while a page's data loads, so navigation never looks frozen.
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 rounded-lg bg-gray-200" />
      <div className="mt-3 h-4 w-full max-w-xl rounded bg-gray-200" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-200/80" />
        ))}
      </div>
      <div className="mt-6 h-64 rounded-2xl bg-gray-200/70" />
    </div>
  )
}
