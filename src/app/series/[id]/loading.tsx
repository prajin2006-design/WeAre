export default function SeriesLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background animate-pulse">
      {/* Fake Navbar spacer */}
      <div className="h-16 lg:h-20 w-full bg-background/50 border-b border-border/30" />

      {/* Hero Backdrop Skeleton */}
      <div className="relative h-[60vh] min-h-[440px] w-full bg-surface/40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Content Details Layer Skeleton */}
      <div className="mx-auto max-w-[1800px] w-full px-4 sm:px-8 lg:px-14 -mt-44 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-14 items-start">
          {/* Poster Skeleton */}
          <div className="w-52 sm:w-64 lg:w-80 aspect-[2/3] rounded-lg bg-surface/80 border border-border/40 flex-shrink-0 shadow-2xl" />

          {/* Info Skeleton */}
          <div className="flex-1 pt-2 sm:pt-6 space-y-4 w-full">
            <div className="h-4 w-40 bg-surface rounded" />
            <div className="h-12 sm:h-16 w-3/4 max-w-xl bg-surface rounded" />
            <div className="h-4 w-64 bg-surface rounded" />
            <div className="space-y-2 pt-2 max-w-2xl">
              <div className="h-3 w-full bg-surface/70 rounded" />
              <div className="h-3 w-5/6 bg-surface/70 rounded" />
              <div className="h-3 w-4/6 bg-surface/70 rounded" />
            </div>
            <div className="flex items-center gap-4 pt-4">
              <div className="h-12 w-40 rounded-lg bg-surface" />
              <div className="h-12 w-32 rounded-lg bg-surface/70" />
            </div>
          </div>
        </div>

        {/* Episodes Skeleton */}
        <div className="mt-14 border-t border-border/40 pt-10 space-y-4">
          <div className="h-6 w-36 bg-surface rounded" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 w-full rounded-2xl bg-surface/50 border border-border/30"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
