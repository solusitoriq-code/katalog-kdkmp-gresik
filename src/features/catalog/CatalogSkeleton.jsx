import { Skeleton } from '../../components/ui';

export function CatalogSkeleton({ count = 8 }) {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat katalog koperasi"
      className="space-y-5"
    >
      <Skeleton className="h-4 w-48" />

      <div className="flex flex-col gap-3.5 rounded-xl border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 flex-1">
          <Skeleton className="h-14 w-14 shrink-0 rounded-xl md:h-16 md:w-16" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-56 max-w-full" />
            <Skeleton className="h-4 w-44 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28 rounded-lg" />
          <Skeleton className="h-11 w-24 rounded-lg" />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="hidden lg:block lg:w-52 lg:shrink-0">
          <div className="space-y-1.5 rounded-xl border border-border bg-surface p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex items-center gap-2 md:gap-3">
            <Skeleton className="h-11 flex-1 rounded-lg" />
            <Skeleton className="h-11 w-40 rounded-lg md:w-52" />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface"
              >
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="space-y-2 p-3 md:p-3.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CatalogSkeleton;

