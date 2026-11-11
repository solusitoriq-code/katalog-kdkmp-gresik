import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Num } from './Num';

// eslint-disable-next-line react-refresh/only-export-components
export function getPaginationRange(currentPage, totalPages, siblingCount = 1) {
  const totalNumbers = siblingCount * 2 + 5;

  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, '...', lastPageIndex];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [firstPageIndex, '...', ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
  }

  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = null,
  pageSize = 10,
  className = '',
}) {
  const paginationRange = useMemo(() => {
    return getPaginationRange(currentPage, totalPages);
  }, [currentPage, totalPages]);

  if (totalPages <= 1 && totalItems === null) {
    return null;
  }

  const from =
    totalItems !== null && totalItems > 0
      ? Math.min((currentPage - 1) * pageSize + 1, totalItems)
      : 0;
  const to =
    totalItems !== null && totalItems > 0
      ? Math.min(currentPage * pageSize, totalItems)
      : 0;

  return (
    <nav
      aria-label="Navigasi Halaman"
      className={`flex flex-col items-center justify-between gap-3 pt-4 sm:flex-row ${className}`.trim()}
    >
      {totalItems !== null && totalItems > 0 ? (
        <p className="text-xs text-text-3 tabular-nums">
          Menampilkan{' '}
          <span className="font-semibold text-text">
            <Num value={from} />
          </span>
          –
          <span className="font-semibold text-text">
            <Num value={to} />
          </span>{' '}
          dari{' '}
          <span className="font-semibold text-text">
            <Num value={totalItems} />
          </span>{' '}
          data
        </p>
      ) : (
        <div />
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Halaman sebelumnya"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-text transition-colors hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline sm:ml-1">Sebelumnya</span>
          </button>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {paginationRange.map((item, idx) => {
              if (item === '...') {
                return (
                  <span
                    key={`dots-${idx}`}
                    className="inline-flex min-h-11 min-w-8 items-center justify-center text-xs font-semibold text-text-3 tabular-nums select-none"
                  >
                    ...
                  </span>
                );
              }

              const isCurrent = item === currentPage;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPageChange?.(item)}
                  aria-current={isCurrent ? 'page' : undefined}
                  aria-label={`Halaman ${item}`}
                  className={`inline-flex min-h-11 min-w-9 sm:min-w-10 items-center justify-center rounded-lg px-2 text-xs font-semibold tabular-nums transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
                    isCurrent
                      ? 'bg-primary-700 text-white'
                      : 'border border-border bg-surface text-text hover:bg-surface-3'
                  }`}
                >
                  <Num value={item} />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Halaman berikutnya"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-text transition-colors hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <span className="hidden sm:inline sm:mr-1">Berikutnya</span>
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
        </div>
      )}
    </nav>
  );
}

export default Pagination;
