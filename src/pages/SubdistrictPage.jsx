import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { isReservedSlug } from '../config/reservedSlugs';
import { EmptyState, Skeleton } from '../components/ui';
import {
  VillageCard,
  VillageGridSkeleton,
  DirectorySearchInput,
} from '../features/directory';
import { getSubdistricts, getVillageDirectory } from '../lib/api';
import { useQuery } from '../lib/hooks/useQuery';
import { useDebouncedValue } from '../lib/hooks/useDebouncedValue';
import { matchesTextFields } from '../lib/search';
import { NotFoundPage } from './NotFoundPage';

export function SubdistrictPage() {
  const { kecamatan } = useParams();
  const kecSlug = String(kecamatan ?? '').trim().toLowerCase();
  const isReserved = !kecSlug || isReservedSlug(kecSlug);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlQ = searchParams.get('q') ?? '';

  const [searchInput, setSearchInput] = useState(urlQ);
  const debouncedSearch = useDebouncedValue(searchInput, 200);
  const lastSyncedQRef = useRef(urlQ);

  useEffect(() => {
    if (urlQ !== lastSyncedQRef.current) {
      lastSyncedQRef.current = urlQ;
      setSearchInput(urlQ);
    }
  }, [urlQ]);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === lastSyncedQRef.current) return;

    lastSyncedQRef.current = trimmed;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (trimmed) {
          next.set('q', trimmed);
        } else {
          next.delete('q');
        }
        return next;
      },
      { replace: true }
    );
  }, [debouncedSearch, setSearchParams]);

  const { data, error, isLoading, refetch } = useQuery(
    async ({ force = false } = {}) => {
      const [subdistricts, villages] = await Promise.all([
        getSubdistricts({ force }),
        getVillageDirectory({ kecamatan: kecSlug, force }),
      ]);
      return { subdistricts, villages };
    },
    [kecSlug],
    { enabled: !isReserved }
  );

  const handleClearSearch = useCallback(() => {
    lastSyncedQRef.current = '';
    setSearchInput('');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('q');
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const activeSubdistrict = useMemo(() => {
    if (!data?.subdistricts) return null;
    return (
      data.subdistricts.find(
        (sub) => String(sub.slug || '').toLowerCase() === kecSlug
      ) || null
    );
  }, [data, kecSlug]);

  useEffect(() => {
    if (activeSubdistrict?.name) {
      document.title = `KDKMP Kec. ${activeSubdistrict.name} – Katalog KDKMP Gresik`;
    }
  }, [activeSubdistrict?.name]);

  const filteredVillages = useMemo(() => {
    const rows = data?.villages ?? [];
    const query = debouncedSearch.trim();
    if (!query) return rows;

    return rows.filter((row) =>
      matchesTextFields(
        [
          row.business_name,
          row.name,
          row.type,
          row.subdistrict_name,
          row.address,
        ],
        query
      )
    );
  }, [data, debouncedSearch]);

  if (isReserved) {
    return <NotFoundPage />;
  }

  if (error) {
    return (
      <section className="py-4">
        <EmptyState
          message="Gagal memuat daftar koperasi."
          actionLabel="Coba lagi"
          onAction={() => refetch({ force: true })}
        />
      </section>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-40" />
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-11 w-full md:max-w-sm" />
        </div>
        <VillageGridSkeleton count={6} />
      </div>
    );
  }

  if (!activeSubdistrict) {
    return <NotFoundPage />;
  }

  return (
    <div className="space-y-6">
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-1.5 text-xs text-text-2"
      >
        <Link
          to="/"
          className="shrink-0 rounded hover:text-primary-700 focus-visible:ring-2 focus-visible:ring-primary-600 outline-none"
        >
          Beranda
        </Link>
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 text-text-3"
          aria-hidden="true"
        />
        <span className="truncate font-medium text-text" aria-current="page">
          Kec. {activeSubdistrict.name}
        </span>
      </nav>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-bold text-text md:text-2xl">
          Kec. {activeSubdistrict.name}
        </h1>
        <div className="w-full md:max-w-sm">
          <DirectorySearchInput
            value={searchInput}
            onChange={setSearchInput}
            onClear={handleClearSearch}
            placeholder={`Cari koperasi di Kec. ${activeSubdistrict.name}...`}
            ariaLabel={`Cari koperasi di Kec. ${activeSubdistrict.name}`}
          />
        </div>
      </div>

      {filteredVillages.length === 0 ? (
        <EmptyState
          message="Koperasi tidak ditemukan."
          actionLabel={debouncedSearch.trim() ? 'Reset Pencarian' : undefined}
          onAction={debouncedSearch.trim() ? handleClearSearch : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVillages.map((village) => (
            <VillageCard
              key={village.id || `${village.subdistrict_slug}-${village.slug}`}
              village={village}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SubdistrictPage;
