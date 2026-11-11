import { useId } from 'react';
import { Search, ShoppingCart, X } from 'lucide-react';
import { Num, Select } from '../../components/ui';
import { SORT_OPTIONS } from '../../lib/search';
import { useOptionalCart } from '../cart/CartContext';

export function CategorySidebar({
  categories = [],
  countsByCategory = {},
  totalCount = 0,
  selectedCategory = '',
  onSelectCategory,
}) {
  const items = [
    {
      key: '',
      label: 'Semua Kategori',
      count: totalCount,
    },
    ...categories.map((cat) => {
      const key = String(cat.name || cat.id || '');
      return {
        key,
        id: String(cat.id || ''),
        name: String(cat.name || ''),
        label: String(cat.name || ''),
        count: Number(countsByCategory[key] ?? countsByCategory[cat.id] ?? 0),
      };
    }),
  ];

  return (
    <aside
      aria-label="Filter kategori produk"
      className="hidden lg:block lg:w-44 lg:shrink-0 xl:w-52"
    >
      <div className="flex flex-col items-stretch gap-1 rounded-xl border border-border bg-surface p-2 lg:sticky lg:top-20">
        {items.map((item) => {
          const isSelected =
            selectedCategory === item.key ||
            (Boolean(selectedCategory) &&
              (selectedCategory === item.id ||
                selectedCategory.toLowerCase() === item.label.toLowerCase()));

          return (
            <button
              key={item.key || '__all__'}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectCategory?.(item.key)}
              className={`inline-flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer ${
                isSelected
                  ? 'bg-primary-700 text-white'
                  : 'bg-surface text-text hover:bg-surface-3'
              }`}
            >
              <span className="truncate">{item.label}</span>
              <Num
                value={item.count}
                className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
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

export function CatalogToolbar({
  searchValue = '',
  onSearchChange,
  onSearchClear,
  categories = [],
  selectedCategory = '',
  onSelectCategory,
  sortBy = 'ready',
  onSortChange,
  onOpenCart,
}) {
  const searchInputId = useId();
  const sortSelectId = useId();
  const cart = useOptionalCart();
  const totalItems = Number(cart?.totalItems ?? 0);

  const chipItems = [
    { key: '', label: 'Semua' },
    ...categories.map((cat) => ({
      key: String(cat.name || cat.id || ''),
      id: String(cat.id || ''),
      label: String(cat.name || ''),
    })),
  ];

  return (
    <div className="sticky top-14 z-30 -mx-4 border-b border-border bg-surface px-4 py-2.5 md:top-16 md:-mx-6 md:px-6 lg:static lg:z-auto lg:mx-0 lg:border-none lg:bg-transparent lg:p-0">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative min-w-0 flex-1">
          <label htmlFor={searchInputId} className="sr-only">
            Cari produk
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3"
          />
          <input
            id={searchInputId}
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Cari produk..."
            aria-label="Cari produk"
            className="min-h-11 w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-10 text-sm text-text placeholder:text-text-3 outline-none transition focus:border-primary-700 focus:ring-1 focus:ring-primary-700"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                if (onSearchClear) {
                  onSearchClear();
                } else {
                  onSearchChange?.('');
                }
              }}
              aria-label="Hapus pencarian produk"
              className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-r-lg text-text-3 hover:text-text focus-visible:ring-2 focus-visible:ring-primary-600 outline-none cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="w-40 shrink-0 md:w-52">
          <label htmlFor={sortSelectId} className="sr-only">
            Urutkan produk
          </label>
          <Select
            id={sortSelectId}
            aria-label="Urutkan produk"
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value)}
            options={SORT_OPTIONS}
            className="px-2.5 text-xs md:px-3.5 md:text-sm"
          />
        </div>

        {onOpenCart && (
          <button
            type="button"
            onClick={onOpenCart}
            aria-label="Buka keranjang"
            className="hidden min-h-11 shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-text transition-colors hover:bg-surface-3 focus-visible:ring-2 focus-visible:ring-primary-600 outline-none cursor-pointer lg:inline-flex"
          >
            <ShoppingCart
              className="h-4 w-4 shrink-0 text-primary-700"
              aria-hidden="true"
            />
            <span>Keranjang</span>
            <Num
              value={totalItems}
              className={`inline-flex min-w-5 items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-bold ${
                totalItems > 0
                  ? 'bg-primary-700 text-white'
                  : 'bg-surface-3 text-text-2'
              }`}
            />
          </button>
        )}
      </div>

      {chipItems.length > 1 && (
        <div
          role="group"
          aria-label="Kategori produk"
          className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 lg:hidden"
        >
          {chipItems.map((chip) => {
            const isSelected =
              selectedCategory === chip.key ||
              (Boolean(selectedCategory) &&
                (selectedCategory === chip.id ||
                  selectedCategory.toLowerCase() === chip.label.toLowerCase()));

            return (
              <button
                key={chip.key || '__all__'}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectCategory?.(chip.key)}
                className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-3.5 py-2 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer ${
                  isSelected
                    ? 'bg-primary-700 text-white'
                    : 'border border-border bg-surface text-text hover:bg-surface-3'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CatalogToolbar;

