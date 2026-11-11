import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { isReservedSlug } from '../config/reservedSlugs';
import { EmptyState } from '../components/ui';
import {
  StoreHeader,
  ProductCard,
  CatalogToolbar,
  CategorySidebar,
  FeaturedSection,
  CatalogSkeleton,
} from '../features/catalog';
import {
  CartProvider,
  CartSheet,
  FloatingCartBar,
  CartRevalidationBanner,
  useOptionalCart,
} from '../features/cart';
import { CheckoutSheet } from '../features/checkout';
import { getVillageCatalog } from '../lib/api';
import { useQuery } from '../lib/hooks/useQuery';
import { useDebouncedValue } from '../lib/hooks/useDebouncedValue';
import {
  SORT_OPTIONS,
  matchesProduct,
  normalize,
  sortProducts,
} from '../lib/search';
import { saveLastVisitedVillage } from '../lib/recentVillages';
import { NotFoundPage } from './NotFoundPage';

const DEFAULT_DOCUMENT_TITLE = 'Katalog KDKMP Gresik';

function slugifyCategory(value) {
  return normalize(value).replace(/\s+/g, '-');
}

function matchesCategoryFilter(product, rawKat, matchedCategory = null) {
  if (!rawKat) return true;
  if (!product) return false;

  if (matchedCategory) {
    if (
      matchedCategory.id &&
      String(product.category_id ?? '') === String(matchedCategory.id)
    ) {
      return true;
    }
    if (
      matchedCategory.name &&
      String(product.category_name || product.category || '').toLowerCase() ===
        String(matchedCategory.name).toLowerCase()
    ) {
      return true;
    }
    return false;
  }

  const trimmed = String(rawKat).trim();
  const lower = trimmed.toLowerCase();
  const slug = slugifyCategory(trimmed);

  const prodCatId = String(product.category_id ?? '').trim();
  const prodCatName = String(
    product.category_name || product.category || ''
  ).trim();

  return (
    prodCatId === trimmed ||
    prodCatName.toLowerCase() === lower ||
    (Boolean(slug) && slugifyCategory(prodCatName) === slug)
  );
}

function CatalogRevalidationNotice() {
  const cart = useOptionalCart();
  if (!cart?.revalidationNotice) return null;

  return (
    <CartRevalidationBanner
      notice={cart.revalidationNotice}
      onDismiss={cart.dismissNotice}
    />
  );
}

export function VillageCatalogPage({
  now,
  onAddProduct,
  onCheckout,
  cartPanel,
}) {
  const { kecamatan, desa } = useParams();
  const kecSlug = String(kecamatan ?? '').trim().toLowerCase();
  const desaSlug = String(desa ?? '').trim().toLowerCase();
  const isReserved =
    !kecSlug ||
    !desaSlug ||
    isReservedSlug(kecSlug) ||
    isReservedSlug(desaSlug);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlQ = searchParams.get('q') ?? '';
  const urlKat = (searchParams.get('kat') ?? '').trim();
  const rawSort = (searchParams.get('sort') ?? 'ready').trim().toLowerCase();
  const sortBy = SORT_OPTIONS.some((opt) => opt.value === rawSort)
    ? rawSort
    : 'ready';

  const [searchInput, setSearchInput] = useState(urlQ);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [checkoutSheetOpen, setCheckoutSheetOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput, 200);
  const lastSyncedQRef = useRef(urlQ);

  const handleOpenCheckout = useCallback(
    (payload) => {
      setCartSheetOpen(false);
      setCheckoutSheetOpen(true);
      onCheckout?.(payload);
    },
    [onCheckout]
  );

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
    async ({ force = false } = {}) =>
      getVillageCatalog(kecSlug, desaSlug, { force }),
    [kecSlug, desaSlug],
    { enabled: !isReserved }
  );

  const isRouteDataMatched = useMemo(() => {
    if (!data?.village) return false;
    const loadedDesa = String(data.village.slug ?? '').trim().toLowerCase();
    const loadedKec = String(
      data.subdistrict?.slug ?? data.village.subdistrict_slug ?? ''
    )
      .trim()
      .toLowerCase();
    return loadedDesa === desaSlug && (!loadedKec || loadedKec === kecSlug);
  }, [data, kecSlug, desaSlug]);

  const village = isRouteDataMatched ? data?.village ?? null : null;
  const subdistrict = isRouteDataMatched ? data?.subdistrict ?? null : null;
  const categories = useMemo(
    () => (isRouteDataMatched ? data?.categories ?? [] : []),
    [data, isRouteDataMatched]
  );
  const products = useMemo(
    () => (isRouteDataMatched ? data?.products ?? [] : []),
    [data, isRouteDataMatched]
  );

  useEffect(() => {
    if (!village || village.is_active === false) return;
    saveLastVisitedVillage({
      ...village,
      product_count: products.length,
    });
  }, [village, products.length]);

  useEffect(() => {
    if (!village?.business_name) return undefined;
    document.title = `${village.business_name} – ${DEFAULT_DOCUMENT_TITLE}`;
    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
    };
  }, [village?.business_name]);

  const matchedCategory = useMemo(() => {
    if (!urlKat) return null;
    const lower = urlKat.toLowerCase();
    const slug = slugifyCategory(urlKat);
    return (
      categories.find(
        (cat) =>
          String(cat.id || '') === urlKat ||
          String(cat.name || '').toLowerCase() === lower ||
          (Boolean(slug) && slugifyCategory(cat.name) === slug)
      ) || null
    );
  }, [categories, urlKat]);

  const activeCategoryKey = matchedCategory
    ? String(matchedCategory.name || matchedCategory.id || '')
    : urlKat;

  const countsByCategory = useMemo(() => {
    const counts = {};
    for (const product of products) {
      const catId = String(product.category_id ?? '');
      const catName = String(product.category_name || product.category || '');
      if (catId) {
        counts[catId] = (counts[catId] || 0) + 1;
      }
      if (catName) {
        counts[catName] = (counts[catName] || 0) + 1;
      }
    }
    return counts;
  }, [products]);

  const featuredProducts = useMemo(() => {
    const query = debouncedSearch.trim();
    const featured = products.filter(
      (product) =>
        Boolean(product.is_featured) &&
        matchesCategoryFilter(product, urlKat, matchedCategory) &&
        matchesProduct(product, query)
    );
    return sortProducts(featured, 'ready');
  }, [products, urlKat, matchedCategory, debouncedSearch]);

  const filteredProducts = useMemo(() => {
    const query = debouncedSearch.trim();
    const matched = products.filter(
      (product) =>
        matchesCategoryFilter(product, urlKat, matchedCategory) &&
        matchesProduct(product, query)
    );
    return sortProducts(matched, sortBy);
  }, [products, urlKat, matchedCategory, debouncedSearch, sortBy]);

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

  const handleSelectCategory = useCallback(
    (categoryKey) => {
      const trimmed = String(categoryKey ?? '').trim();
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (trimmed) {
            next.set('kat', trimmed);
          } else {
            next.delete('kat');
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const handleSortChange = useCallback(
    (nextSort) => {
      const normalized = String(nextSort ?? 'ready').trim().toLowerCase();
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (normalized && normalized !== 'ready') {
            next.set('sort', normalized);
          } else {
            next.delete('sort');
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
        next.delete('kat');
        next.delete('sort');
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  if (isReserved) {
    return <NotFoundPage />;
  }

  if (error) {
    return (
      <section className="py-4">
        <EmptyState
          message="Gagal memuat katalog koperasi."
          actionLabel="Coba lagi"
          onAction={() => refetch({ force: true })}
        />
      </section>
    );
  }

  if (isLoading && !isRouteDataMatched) {
    return <CatalogSkeleton count={8} />;
  }

  if (!village || village.is_active === false) {
    return <NotFoundPage />;
  }

  const subdistrictName = subdistrict?.name || village.subdistrict_name || '';
  const subdistrictSlug =
    subdistrict?.slug || village.subdistrict_slug || kecSlug;
  const hasActiveFilter = Boolean(urlKat || debouncedSearch.trim());

  return (
    <CartProvider villageId={village.id} products={products}>
      <div className="space-y-5 pb-24">
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
          {subdistrictName && (
            <>
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-text-3"
                aria-hidden="true"
              />
              <Link
                to={`/${subdistrictSlug}`}
                className="shrink-0 rounded hover:text-primary-700 focus-visible:ring-2 focus-visible:ring-primary-600 outline-none"
              >
                Kec. {subdistrictName}
              </Link>
            </>
          )}
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 text-text-3"
            aria-hidden="true"
          />
          <span className="truncate font-medium text-text" aria-current="page">
            {village.business_name}
          </span>
        </nav>

        <StoreHeader village={village} now={now} />

        <CatalogRevalidationNotice />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
          <CategorySidebar
            categories={categories}
            countsByCategory={countsByCategory}
            totalCount={products.length}
            selectedCategory={activeCategoryKey}
            onSelectCategory={handleSelectCategory}
          />

          <div className="min-w-0 flex-1 space-y-5">
            <CatalogToolbar
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              onSearchClear={handleClearSearch}
              categories={categories}
              selectedCategory={activeCategoryKey}
              onSelectCategory={handleSelectCategory}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              onOpenCart={() => setCartSheetOpen(true)}
            />

            <FeaturedSection
              products={featuredProducts}
              onAddProduct={onAddProduct}
            />

            {filteredProducts.length === 0 ? (
              <EmptyState
                message="Produk tidak ditemukan."
                actionLabel={hasActiveFilter ? 'Reset Filter' : undefined}
                onAction={hasActiveFilter ? handleResetAll : undefined}
              />
            ) : (
              <section aria-label="Daftar produk" className="space-y-3">
                {featuredProducts.length > 0 && (
                  <h2 className="text-base font-bold text-text">Semua Produk</h2>
                )}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={onAddProduct}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {cartPanel ? (
            <aside
              aria-label="Keranjang belanja"
              className="hidden lg:block lg:w-80 lg:shrink-0"
            >
              {cartPanel}
            </aside>
          ) : null}
        </div>

        <FloatingCartBar onOpen={() => setCartSheetOpen(true)} />

        <CartSheet
          open={cartSheetOpen}
          onClose={() => setCartSheetOpen(false)}
          village={village}
          onCheckout={handleOpenCheckout}
        />

        <CheckoutSheet
          open={checkoutSheetOpen}
          onClose={() => setCheckoutSheetOpen(false)}
          village={village}
          now={now}
        />
      </div>
    </CartProvider>
  );
}

export default VillageCatalogPage;
