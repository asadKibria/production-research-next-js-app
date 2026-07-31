/**
 * Shown while a dynamic admin page waits on the database. Keeps navigation
 * feeling instant instead of blocking on a blank screen.
 */
export default function AdminDashboardLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true" aria-label="লোড হচ্ছে">
      <div className="flex flex-col gap-2">
        <div className="h-6 w-48 rounded-md bg-cream-200" />
        <div className="h-4 w-64 rounded-md bg-cream-200/70" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-cream-200 bg-cream-050" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="h-64 rounded-2xl border border-cream-200 bg-cream-050" />
        <div className="h-64 rounded-2xl border border-cream-200 bg-cream-050" />
      </div>
    </div>
  );
}
