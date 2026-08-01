/**
 * Neutral admin loading shape: a page heading and a few list rows.
 *
 * Every admin page below the dashboard is a heading over a list of cards, so
 * one shape covers them all — and it matters that it is the *right* shape. A
 * skeleton that does not match what arrives reads as the page flashing rather
 * than loading.
 */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true" aria-label="লোড হচ্ছে">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-6 w-44 rounded-md bg-cream-200" />
          <div className="h-4 w-60 rounded-md bg-cream-200/70" />
        </div>
        <div className="h-10 w-32 rounded-full bg-cream-200" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl border border-cream-200 bg-cream-050" />
        ))}
      </div>
    </div>
  );
}
