import { Skeleton } from '../../components/ui';

export function VillageGridSkeleton({ count = 6 }) {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat daftar koperasi"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-surface p-4"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2 py-0.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default VillageGridSkeleton;

