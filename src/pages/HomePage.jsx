import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { EmptyState } from '../components/ui';
import {
  VillageCard,
  SubdistrictFilter,
  VillageGridSkeleton,
  DirectorySearchInput,
} from '../features/directory';
import { getSubdistricts, getVillageDirectory } from '../lib/api';
import { useQuery } from '../lib/hooks/useQuery';
import { useDebouncedValue } from '../lib/hooks/useDebouncedValue';
import { matchesTextFields } from '../lib/search';
import {
  getRecentVillages,
  resolveRecentVillages,
} from '../lib/recentVillages';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQ = searchParams.get('q') ?? '';
  const selectedKec = (searchParams.get('kec') ?? '').trim().toLowerCase();

  const [searchInput, setSearchInput] = useState(urlQ);
  const debouncedSearch = useDebouncedValue(searchInput, 200);
  const lastSyncedQRef = useRef(urlQ);

  const [recentRaw, setRecentRaw] = useState(() => getRecentVillages());

  useEffect(() => {
    document.title = 'Katalog KDKMP Gresik';
  }, []);

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
      const [subdistricts, allVillages] = await Promise.all([
        getSubdistricts({ force }),
        getVillageDirectory({ force }),
      ]);
      return { subdistricts, allVillages };
    },
    []
  );

  const subdistricts = useMemo(() => data?.subdistricts ?? [], [data]);
  const allVillages = useMemo(() => data?.allVillages ?? [], [data]);

  const countsBySlug = useMemo(() => {
    const counts = {};
    for (const village of allVillages) {
      const slug = String(village.subdistrict_slug || '').toLowerCase();
      if (slug) {
        counts[slug] = (counts[slug] || 0) + 1;
      }
    }
    return counts;
  }, [allVillages]);

  const filteredVillages = useMemo(() => {
    let rows = allVillages;
    if (selectedKec) {
      rows = rows.filter(
        (row) => String(row.subdistrict_slug || '').toLowerCase() === selectedKec
      );
    }

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
  }, [allVillages, selectedKec, debouncedSearch]);

  const recentVillages = useMemo(
    () => resolveRecentVillages(recentRaw, data ? allVillages : null),
    [recentRaw, data, allVillages]
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

  const handleSelectSubdistrict = useCallback(
    (slug) => {
      const normalized = String(slug || '').trim().toLowerCase();
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (normalized) {
            next.set('kec', normalized);
          } else {
            next.delete('kec');
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const handleResetAll = useCallback(() => {
    lastSyncedQRef.current = '';
    setSearchInput('');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('q');
        next.delete('kec');
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const showSubdistrictFilter = subdistricts.length > 1;
  const hasActiveFilter = Boolean(selectedKec || debouncedSearch.trim());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-bold text-text md:text-2xl">
          Katalog KDKMP Gresik
        </h1>
        <div className="w-full md:max-w-sm">
          <DirectorySearchInput
            value={searchInput}
            onChange={setSearchInput}
            onClear={handleClearSearch}
            placeholder="Cari koperasi, desa, atau kecamatan..."
            ariaLabel="Cari koperasi"
          />
        </div>
      </div>

      {recentVillages.length > 0 && (
        <section aria-label="Terakhir dikunjungi" className="space-y-2.5">
          <h2 className="text-sm font-semibold text-text-2">
            Terakhir dikunjungi
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentVillages.map((village) => (
              <VillageCard
                key={`recent-${village.subdistrict_slug}-${village.slug}`}
                village={village}
                onSelect={() => setRecentRaw(getRecentVillages())}
              />
            ))}
          </div>
        </section>
      )}

      {error ? (
        <EmptyState
          message="Gagal memuat daftar koperasi."
          actionLabel="Coba lagi"
          onAction={() => refetch({ force: true })}
        />
      ) : isLoading && !data ? (
        <VillageGridSkeleton count={6} />
      ) : (
        <div
          className={
            showSubdistrictFilter
              ? 'grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr] lg:items-start lg:gap-6'
              : ''
          }
        >
          {showSubdistrictFilter && (
            <SubdistrictFilter
              subdistricts={subdistricts}
              countsBySlug={countsBySlug}
              totalCount={allVillages.length}
              selectedSlug={selectedKec}
              onSelect={handleSelectSubdistrict}
            />
          )}

          <div className="min-w-0">
            {filteredVillages.length === 0 ? (
              <EmptyState
                message="Koperasi tidak ditemukan."
                actionLabel={hasActiveFilter ? 'Reset Pencarian' : undefined}
                onAction={hasActiveFilter ? handleResetAll : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredVillages.map((village) => (
                  <VillageCard
                    key={
                      village.id || `${village.subdistrict_slug}-${village.slug}`
                    }
                    village={village}
                    onSelect={() => setRecentRaw(getRecentVillages())}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
