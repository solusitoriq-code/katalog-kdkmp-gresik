import { Num } from '../../components/ui';

export function SubdistrictFilter({
  subdistricts = [],
  countsBySlug = {},
  totalCount = 0,
  selectedSlug = '',
  onSelect,
}) {
  if (!Array.isArray(subdistricts) || subdistricts.length <= 1) {
    return null;
  }

  const normalizedSelected = String(selectedSlug || '')
    .trim()
    .toLowerCase();

  const items = [
    {
      slug: '',
      label: 'Semua Kecamatan',
      count: totalCount,
    },
    ...subdistricts.map((sub) => ({
      slug: String(sub.slug || '').toLowerCase(),
      label: `Kec. ${sub.name}`,
      count: Number(countsBySlug[String(sub.slug || '').toLowerCase()] ?? 0),
    })),
  ];

  return (
    <aside aria-label="Filter kecamatan" className="min-w-0">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-x-visible md:pb-0 lg:flex-col lg:items-stretch lg:gap-1 lg:rounded-xl lg:border lg:border-border lg:bg-surface lg:p-2">
        {items.map((item) => {
          const isSelected = normalizedSelected === item.slug;

          return (
            <button
              key={item.slug || '__all__'}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect?.(item.slug)}
              className={`inline-flex min-h-11 lg:min-h-10 shrink-0 items-center justify-between gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer ${
                isSelected
                  ? 'bg-primary-700 text-white'
                  : 'border border-border bg-surface text-text hover:bg-surface-3 lg:border-transparent'
              }`}
            >
              <span className="truncate">{item.label}</span>
              <Num
                value={item.count}
                className={`hidden lg:inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                  isSelected
                    ? 'bg-primary-800 text-white'
                    : 'bg-surface-3 text-text-2'
                }`}
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default SubdistrictFilter;

