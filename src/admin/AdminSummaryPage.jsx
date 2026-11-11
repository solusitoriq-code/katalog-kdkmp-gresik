import { useState } from 'react';
import { Badge, EmptyState, Money, Num, Skeleton } from '../components/ui';
import { getAdminProductSummary, getVillageStats } from '../lib/api';
import { useQuery } from '../lib/hooks/useQuery';
import { useAuth } from './AuthContext';

const PERIOD_OPTIONS = [
  { label: 'Hari ini', days: 1 },
  { label: '7 Hari', days: 7 },
  { label: '30 Hari', days: 30 },
];

export function DailyCheckoutChart({ dailyStats = [], periodDays = 7 }) {
  const stats = Array.isArray(dailyStats) ? dailyStats : [];
  const maxCount = stats.reduce(
    (max, d) => Math.max(max, Number(d?.checkout_count ?? 0)),
    0
  );

  return (
    <div
      aria-label="Grafik checkout WA harian"
      className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-text">Grafik Checkout WA Harian</h2>
        <span className="text-xs font-medium text-text-3">
          Tertinggi: <Num value={maxCount} />
        </span>
      </div>

      <div className="w-full overflow-x-auto pb-2">
        <div
          className={`flex h-44 items-end gap-2 md:gap-3 ${
            periodDays === 30 ? 'min-w-[560px]' : 'min-w-full'
          }`}
        >
          {stats.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-xs text-text-3">
              Belum ada data checkout WA.
            </div>
          ) : (
            stats.map((day) => {
              const count = Number(day?.checkout_count ?? 0);
              const heightPercent =
                maxCount > 0 && count > 0
                  ? Math.max(12, Math.round((count / maxCount) * 100))
                  : 0;

              return (
                <div
                  key={day.date}
                  className="group relative flex flex-1 flex-col items-center justify-end h-full min-w-0"
                  title={`${day.date}: ${count} checkout WA`}
                >
                  {count > 0 ? (
                    <Num
                      value={count}
                      className="mb-1 text-[10px] font-bold text-text-2 tabular-nums"
                    />
                  ) : (
                    <span className="mb-1 text-[10px] text-transparent select-none">
                      0
                    </span>
                  )}

                  <div className="flex h-32 w-full items-end justify-center">
                    {count > 0 ? (
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[28px] rounded-t bg-primary-700 transition-all duration-300 group-hover:brightness-95"
                      />
                    ) : (
                      <div className="h-1 w-full max-w-[28px] rounded-t bg-border/70" />
                    )}
                  </div>

                  <span className="mt-2 text-[10px] font-medium text-text-3 tabular-nums">
                    {day.day_label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function TopProductsTable({ topProducts = [] }) {
  const products = Array.isArray(topProducts) ? topProducts : [];

  return (
    <div
      aria-label="Top 5 produk"
      className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-text">Top 5 Produk</h2>
        <span className="text-xs font-medium text-text-3">
          Berdasarkan jumlah checkout
        </span>
      </div>

      {products.length === 0 ? (
        <div className="flex h-44 w-full items-center justify-center text-xs text-text-3">
          Belum ada data produk pada periode ini.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-text-3">
                <th className="py-2 pr-2 text-center w-8">No</th>
                <th className="py-2 pr-3">Produk</th>
                <th className="py-2 px-2 text-right">Checkout WA</th>
                <th className="py-2 pl-3 text-right">Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p, idx) => (
                <tr key={p.product_id || idx} className="hover:bg-surface-3/50">
                  <td className="py-2.5 pr-2 text-center font-medium text-text-3 tabular-nums">
                    <Num value={idx + 1} />
                  </td>
                  <td className="py-2.5 pr-3 font-semibold text-text truncate max-w-[140px] md:max-w-[200px]">
                    {p.name}
                  </td>
                  <td className="py-2.5 px-2 text-right font-medium text-text-2 tabular-nums">
                    <Num value={p.qty} />
                  </td>
                  <td className="py-2.5 pl-3 text-right font-bold text-primary-700 tabular-nums">
                    <Money value={p.total_value} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function SuperAdminBreakdown({ byVillage = [], bySubdistrict = [] }) {
  const [tab, setTab] = useState('village');
  const villages = Array.isArray(byVillage) ? byVillage : [];
  const subdistricts = Array.isArray(bySubdistrict) ? bySubdistrict : [];

  return (
    <div
      aria-label="Ringkasan wilayah super admin"
      className="space-y-3 rounded-xl border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-bold text-text">Peringkat Wilayah</h2>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-3/60 p-0.5">
          <button
            type="button"
            onClick={() => setTab('village')}
            className={`min-h-[36px] rounded-md px-3 text-xs font-semibold transition-colors ${
              tab === 'village'
                ? 'bg-surface text-primary-700 shadow-xs'
                : 'text-text-2 hover:text-text'
            }`}
          >
            Per Koperasi (<Num value={villages.length} />)
          </button>
          <button
            type="button"
            onClick={() => setTab('subdistrict')}
            className={`min-h-[36px] rounded-md px-3 text-xs font-semibold transition-colors ${
              tab === 'subdistrict'
                ? 'bg-surface text-primary-700 shadow-xs'
                : 'text-text-2 hover:text-text'
            }`}
          >
            Per Kecamatan (<Num value={subdistricts.length} />)
          </button>
        </div>
      </div>

      {tab === 'village' ? (
        villages.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-3">
            Belum ada data koperasi pada periode ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-3">
                  <th className="py-2 pr-2 text-center w-8">No</th>
                  <th className="py-2 pr-3">Koperasi</th>
                  <th className="py-2 pr-3">Kecamatan</th>
                  <th className="py-2 px-2 text-right">Checkout WA</th>
                  <th className="py-2 pl-3 text-right">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {villages.map((v, idx) => (
                  <tr key={v.village_id || idx} className="hover:bg-surface-3/50">
                    <td className="py-2.5 pr-2 text-center font-medium text-text-3 tabular-nums">
                      <Num value={idx + 1} />
                    </td>
                    <td className="py-2.5 pr-3 font-semibold text-text">
                      {v.village_name}
                    </td>
                    <td className="py-2.5 pr-3 text-text-2">
                      {v.subdistrict_name}
                    </td>
                    <td className="py-2.5 px-2 text-right font-medium text-text-2 tabular-nums">
                      <Num value={v.checkout_count} />
                    </td>
                    <td className="py-2.5 pl-3 text-right font-bold text-primary-700 tabular-nums">
                      <Money value={v.total_value} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : subdistricts.length === 0 ? (
        <div className="py-6 text-center text-xs text-text-3">
          Belum ada data kecamatan pada periode ini.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-text-3">
                <th className="py-2 pr-2 text-center w-8">No</th>
                <th className="py-2 pr-3">Kecamatan</th>
                <th className="py-2 px-2 text-right">Checkout WA</th>
                <th className="py-2 pl-3 text-right">Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subdistricts.map((s, idx) => (
                <tr key={s.subdistrict_id || idx} className="hover:bg-surface-3/50">
                  <td className="py-2.5 pr-2 text-center font-medium text-text-3 tabular-nums">
                    <Num value={idx + 1} />
                  </td>
                  <td className="py-2.5 pr-3 font-semibold text-text">
                    Kec. {s.subdistrict_name}
                  </td>
                  <td className="py-2.5 px-2 text-right font-medium text-text-2 tabular-nums">
                    <Num value={s.checkout_count} />
                  </td>
                  <td className="py-2.5 pl-3 text-right font-bold text-primary-700 tabular-nums">
                    <Money value={s.total_value} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminSummaryPage({
  initialSummary = null,
  initialStats = null,
  initialPeriodDays = 7,
}) {
  const { activeVillageId, session, role } = useAuth();
  const isSuperAdmin = role === 'super_admin';
  const isDemo = Boolean(session?.is_demo);
  const actorUserId = session?.user?.id;

  const [periodDays, setPeriodDays] = useState(initialPeriodDays);

  // 1. Query Ringkasan Produk
  const {
    data: productData,
    error: productError,
    isLoading: isProductLoading,
    refetch: refetchProducts,
  } = useQuery(
    async () => {
      if (initialSummary) return initialSummary;
      const targetVillage = isSuperAdmin ? null : activeVillageId;
      if (!targetVillage && !isSuperAdmin) {
        return { total: 0, ready: 0, habis: 0, preOrder: 0 };
      }
      return getAdminProductSummary(targetVillage, {
        isDemo,
        isSuperAdmin,
        actorUserId,
      });
    },
    [activeVillageId, isDemo, initialSummary, isSuperAdmin, actorUserId]
  );

  // 2. Query Statistik Checkout WA
  const {
    data: statsData,
    error: statsError,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useQuery(
    async () => {
      if (initialStats) return initialStats;
      const targetVillage = isSuperAdmin ? null : activeVillageId;
      if (!targetVillage && !isSuperAdmin) {
        return {
          period_days: periodDays,
          summary: { checkout_count: 0, total_value: 0, average_value: 0 },
          top_products: [],
          daily_stats: [],
          by_village: [],
          by_subdistrict: [],
        };
      }
      return getVillageStats(targetVillage, periodDays, {
        isDemo,
        isSuperAdmin,
      });
    },
    [activeVillageId, isDemo, initialStats, isSuperAdmin, periodDays]
  );

  const summary = initialSummary || productData;
  const stats = initialStats || statsData;

  const handleRefetch = () => {
    refetchProducts({ force: true });
    refetchStats({ force: true });
  };

  const checkoutSummary = stats?.summary || {
    checkout_count: 0,
    total_value: 0,
    average_value: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header & Periode Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-text md:text-2xl">Ringkasan</h1>
          {isSuperAdmin && <Badge variant="mute">Semua KDKMP</Badge>}
        </div>

        {/* Periode filter */}
        <div
          role="radiogroup"
          aria-label="Periode statistik"
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          {PERIOD_OPTIONS.map((opt) => {
            const isActive = periodDays === opt.days;
            return (
              <button
                key={opt.days}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setPeriodDays(opt.days)}
                className={`min-h-11 rounded-lg px-3.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary-700 text-white shadow-xs'
                    : 'border border-border bg-surface text-text-2 hover:bg-surface-3'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {statsError || productError ? (
        <EmptyState
          message="Gagal memuat ringkasan data."
          actionLabel="Coba lagi"
          onAction={handleRefetch}
        />
      ) : null}

      {/* 3 Kartu Metrik Checkout WA */}
      {isStatsLoading && !stats ? (
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4"
          aria-busy="true"
        >
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
          <div className="flex flex-col justify-between gap-2 rounded-xl border border-border bg-surface p-4">
            <span className="text-xs font-medium text-text-2">Checkout WA</span>
            <Num
              value={checkoutSummary.checkout_count}
              className="text-2xl font-bold text-text md:text-3xl"
            />
          </div>

          <div className="flex flex-col justify-between gap-2 rounded-xl border border-border bg-surface p-4">
            <span className="text-xs font-medium text-text-2">Nilai</span>
            <Money
              value={checkoutSummary.total_value}
              className="text-2xl font-bold text-primary-700 md:text-3xl"
            />
          </div>

          <div className="flex flex-col justify-between gap-2 rounded-xl border border-border bg-surface p-4">
            <span className="text-xs font-medium text-text-2">Rata-rata</span>
            <Money
              value={checkoutSummary.average_value}
              className="text-2xl font-bold text-text md:text-3xl"
            />
          </div>
        </div>
      )}

      {/* Grid Grafik Batang & Top 5 Produk */}
      {isStatsLoading && !stats ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-60 w-full rounded-xl" />
          <Skeleton className="h-60 w-full rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DailyCheckoutChart
            dailyStats={stats?.daily_stats}
            periodDays={periodDays}
          />
          <TopProductsTable topProducts={stats?.top_products} />
        </div>
      )}

      {/* Super Admin breakdown per koperasi & per kecamatan */}
      {isSuperAdmin && (
        isStatsLoading && !stats ? (
          <Skeleton className="h-56 w-full rounded-xl" />
        ) : (
          <SuperAdminBreakdown
            byVillage={stats?.by_village}
            bySubdistrict={stats?.by_subdistrict}
          />
        )
      )}

      {/* Ringkasan Status Katalog Produk */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-bold text-text">Katalog Produk</h2>
        {isProductLoading && !summary ? (
          <div
            className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
            aria-busy="true"
          >
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <div className="flex flex-col justify-between gap-2 rounded-xl border border-border bg-surface p-4">
              <span className="text-xs font-medium text-text-2">
                Total Produk
              </span>
              <Num
                value={summary.total}
                className="text-2xl font-bold text-text md:text-3xl"
              />
            </div>

            <div className="flex flex-col justify-between gap-2 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-text-2">Tersedia</span>
                <Badge variant="ok">Tersedia</Badge>
              </div>
              <Num
                value={summary.ready}
                className="text-2xl font-bold text-ok-700 md:text-3xl"
              />
            </div>

            <div className="flex flex-col justify-between gap-2 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-text-2">Habis</span>
                <Badge variant="mute">Habis</Badge>
              </div>
              <Num
                value={summary.habis}
                className="text-2xl font-bold text-mute-700 md:text-3xl"
              />
            </div>

            <div className="flex flex-col justify-between gap-2 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-text-2">Pre-Order</span>
                <Badge variant="warn">Pre-Order</Badge>
              </div>
              <Num
                value={summary.preOrder}
                className="text-2xl font-bold text-warn-700 md:text-3xl"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AdminSummaryPage;
