import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Package,
  Check,
} from 'lucide-react';
import {
  Button,
  Badge,
  EmptyState,
  Input,
  Money,
  Num,
  Select,
  Skeleton,
  Pagination,
} from '../components/ui';
import {
  getAdminProducts,
  getAdminCategories,
  updateAdminProduct,
  batchUpdateAdminProductPrices,
  deleteAdminProduct,
  PRODUCT_STOCK_OPTIONS,
} from '../lib/api';
import { formatDigitsInput, parseFormattedInt } from '../lib/format';
import { driveImageUrl } from '../lib/image';
import { matchesProduct } from '../lib/search';
import { useAuth } from './AuthContext';
import { ProductFormSheet } from './ProductFormSheet';
import {
  applyOptimisticProductPatch,
  rollbackOptimisticProduct,
  computeQuickPriceChanges,
} from './adminProductUtils';

const NO_CATEGORY_FILTER = '__none__';
const PAGE_SIZE = 10;

function getStockBadgeVariant(status) {
  if (status === 'ready') return 'ok';
  if (status === 'pre-order') return 'warn';
  return 'mute';
}

function getStockLabel(status) {
  if (status === 'ready') return 'Tersedia';
  if (status === 'pre-order') return 'Pre-Order';
  return 'Habis';
}

export function AdminProductsPage({
  initialProducts = null,
  initialCategories = null,
  initialQuickPriceMode = false,
  initialPage = 1,
}) {
  const { activeVillageId, session, role } = useAuth();
  const isSuperAdmin = role === 'super_admin';
  const isDemo = Boolean(session?.is_demo);
  const actorUserId = session?.user?.id;

  const [products, setProducts] = useState(() => initialProducts ?? []);
  const [categories, setCategories] = useState(() => initialCategories ?? []);
  const [isLoading, setIsLoading] = useState(
    () => initialProducts === null && Boolean(activeVillageId || isSuperAdmin)
  );
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const [page, setPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStock, setSelectedStock] = useState('');

  const [quickPriceMode, setQuickPriceMode] = useState(
    () => Boolean(initialQuickPriceMode)
  );
  const [draftPrices, setDraftPrices] = useState(() => {
    if (!initialQuickPriceMode || !Array.isArray(initialProducts)) return {};
    const map = {};
    for (const p of initialProducts) {
      map[p.id] = formatDigitsInput(p.price);
    }
    return map;
  });
  const [isSavingQuickPrices, setIsSavingQuickPrices] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);

  const fetchAll = useCallback(async () => {
    const targetVillage = isSuperAdmin ? null : activeVillageId;
    if (!targetVillage && !isSuperAdmin) {
      setProducts([]);
      setCategories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError('');
    try {
      const [prodsData, catsData] = await Promise.all([
        getAdminProducts(targetVillage, { isDemo, actorUserId, isSuperAdmin }),
        getAdminCategories(targetVillage, { isDemo, actorUserId, isSuperAdmin }),
      ]);
      setProducts(prodsData);
      setCategories(catsData);
    } catch (err) {
      setLoadError(err?.message || 'Gagal memuat daftar produk.');
    } finally {
      setIsLoading(false);
    }
  }, [activeVillageId, isDemo, actorUserId, isSuperAdmin]);

  useEffect(() => {
    if (initialProducts !== null) return undefined;
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return null;
        const targetVillage = isSuperAdmin ? null : activeVillageId;
        if (!targetVillage && !isSuperAdmin) {
          setProducts([]);
          setCategories([]);
          setIsLoading(false);
          return null;
        }
        setIsLoading(true);
        setLoadError('');
        return Promise.all([
          getAdminProducts(targetVillage, { isDemo, actorUserId, isSuperAdmin }),
          getAdminCategories(targetVillage, { isDemo, actorUserId, isSuperAdmin }),
        ]);
      })
      .then((res) => {
        if (!active || !res) return;
        setProducts(res[0]);
        setCategories(res[1]);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err?.message || 'Gagal memuat daftar produk.');
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeVillageId, isDemo, actorUserId, initialProducts, isSuperAdmin]);

  const villageFilterOptions = useMemo(() => {
    if (!isSuperAdmin) return [];
    const map = new Map();
    for (const p of products) {
      if (p.village_id) {
        const label = p.kdkmp_name || `KDKMP Desa ${p.village_name || ''}`;
        if (!map.has(p.village_id)) {
          map.set(p.village_id, label);
        }
      }
    }
    return [
      { value: '', label: 'Semua KDKMP' },
      ...Array.from(map.entries())
        .map(([id, label]) => ({ value: id, label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'id')),
    ];
  }, [isSuperAdmin, products]);

  const categoryFilterOptions = useMemo(() => {
    return [
      { value: '', label: 'Semua Kategori' },
      { value: NO_CATEGORY_FILTER, label: 'Tanpa Kategori' },
      ...categories.map((c) => ({
        value: c.id,
        label: c.name,
      })),
    ];
  }, [categories]);

  const stockFilterOptions = useMemo(() => {
    return [
      { value: '', label: 'Semua Stok' },
      ...PRODUCT_STOCK_OPTIONS,
    ];
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (isSuperAdmin && selectedVillage && prod.village_id !== selectedVillage) {
        return false;
      }

      if (selectedCategory === NO_CATEGORY_FILTER) {
        if (prod.category_id) return false;
      } else if (selectedCategory && prod.category_id !== selectedCategory) {
        return false;
      }

      if (selectedStock && prod.stock_status !== selectedStock) {
        return false;
      }

      return matchesProduct(prod, searchQuery);
    });
  }, [products, isSuperAdmin, selectedVillage, selectedCategory, selectedStock, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, safePage]);

  const handleToggleStock = async (product) => {
    setActionError('');
    setActionNotice('');
    const previous = { ...product };
    const nextStatus = product.stock_status === 'habis' ? 'ready' : 'habis';

    setProducts((prev) =>
      applyOptimisticProductPatch(prev, product.id, {
        stock_status: nextStatus,
      })
    );

    try {
      const updated = await updateAdminProduct(
        product.id,
        { stock_status: nextStatus },
        { villageId: activeVillageId, isDemo, actorUserId }
      );
      setProducts((prev) =>
        applyOptimisticProductPatch(prev, product.id, updated)
      );
    } catch (err) {
      setProducts((prev) => rollbackOptimisticProduct(prev, previous));
      setActionError(
        err?.message || 'Gagal mengubah status stok. Perubahan dibatalkan.'
      );
    }
  };

  const handleToggleFeatured = async (product) => {
    setActionError('');
    setActionNotice('');
    const previous = { ...product };
    const nextFeatured = !product.is_featured;

    setProducts((prev) =>
      applyOptimisticProductPatch(prev, product.id, {
        is_featured: nextFeatured,
      })
    );

    try {
      const updated = await updateAdminProduct(
        product.id,
        { is_featured: nextFeatured },
        { villageId: activeVillageId, isDemo, actorUserId }
      );
      setProducts((prev) =>
        applyOptimisticProductPatch(prev, product.id, updated)
      );
    } catch (err) {
      setProducts((prev) => rollbackOptimisticProduct(prev, previous));
      setActionError(
        err?.message || 'Gagal mengubah status unggulan. Perubahan dibatalkan.'
      );
    }
  };

  const handleEnterQuickPriceMode = () => {
    setActionError('');
    setActionNotice('');
    const initialMap = {};
    for (const p of products) {
      initialMap[p.id] = formatDigitsInput(p.price);
    }
    setDraftPrices(initialMap);
    setQuickPriceMode(true);
  };

  const handleCancelQuickPriceMode = () => {
    setQuickPriceMode(false);
    setDraftPrices({});
    setActionError('');
  };

  const changedQuickPrices = useMemo(
    () => computeQuickPriceChanges(products, draftPrices),
    [products, draftPrices]
  );

  const handleSaveQuickPrices = async (event) => {
    if (event) event.preventDefault();
    setActionError('');
    setActionNotice('');

    if (changedQuickPrices.length === 0) {
      setQuickPriceMode(false);
      return;
    }

    setIsSavingQuickPrices(true);
    try {
      const result = await batchUpdateAdminProductPrices(changedQuickPrices, {
        villageId: activeVillageId,
        isDemo,
        actorUserId,
      });
      setProducts(result.products);
      setQuickPriceMode(false);
      setDraftPrices({});
      setActionNotice('Harga produk berhasil disimpan.');
    } catch (err) {
      setActionError(err?.message || 'Gagal menyimpan perubahan harga.');
    } finally {
      setIsSavingQuickPrices(false);
    }
  };

  const handleOpenCreate = () => {
    setActionError('');
    setActionNotice('');
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (product) => {
    setActionError('');
    setActionNotice('');
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleProductSaved = (savedProduct) => {
    if (!savedProduct?.id) {
      fetchAll();
      return;
    }
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === savedProduct.id);
      if (exists) {
        return prev.map((p) => (p.id === savedProduct.id ? savedProduct : p));
      }
      return [...prev, savedProduct];
    });
    setActionNotice('Produk berhasil disimpan.');
  };

  const handleConfirmDelete = async (product) => {
    setActionError('');
    setActionNotice('');
    setIsDeletingId(product.id);
    try {
      await deleteAdminProduct(product.id, {
        villageId: activeVillageId,
        isDemo,
        actorUserId,
      });
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setConfirmDeleteId(null);
      setActionNotice('Produk berhasil dihapus.');
    } catch (err) {
      setActionError(err?.message || 'Gagal menghapus produk.');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-text md:text-2xl">Produk</h1>
          {isSuperAdmin && <Badge variant="mute">Semua KDKMP</Badge>}
        </div>

        {!isSuperAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            {quickPriceMode ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelQuickPriceMode}
                  disabled={isSavingQuickPrices}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSaveQuickPrices}
                  disabled={isSavingQuickPrices}
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  {isSavingQuickPrices ? 'Menyimpan...' : 'Simpan'}
                  {changedQuickPrices.length > 0 && (
                    <span>
                      (<Num value={changedQuickPrices.length} />)
                    </span>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleEnterQuickPriceMode}
                  disabled={products.length === 0}
                >
                  Ubah Harga Cepat
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleOpenCreate}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Tambah Produk
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-lg border border-primary-700 bg-primary-50 px-3.5 py-2.5 text-xs font-medium text-primary-700"
        >
          {actionError}
        </div>
      )}

      {actionNotice && (
        <div
          role="status"
          className="rounded-lg border border-border bg-ok-50 px-3.5 py-2.5 text-xs font-medium text-ok-700"
        >
          {actionNotice}
        </div>
      )}

      <div
        className={`grid grid-cols-1 gap-2.5 ${
          isSuperAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'
        }`}
      >
        <Input
          aria-label="Cari produk"
          placeholder="Cari produk..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
        />
        {isSuperAdmin && (
          <Select
            aria-label="Filter KDKMP"
            value={selectedVillage}
            onChange={(e) => {
              setSelectedVillage(e.target.value);
              setPage(1);
            }}
            options={villageFilterOptions}
          />
        )}
        <Select
          aria-label="Filter kategori"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
          options={categoryFilterOptions}
        />
        <Select
          aria-label="Filter stok"
          value={selectedStock}
          onChange={(e) => {
            setSelectedStock(e.target.value);
            setPage(1);
          }}
          options={stockFilterOptions}
        />
      </div>

      {loadError ? (
        <EmptyState
          message={loadError}
          actionLabel="Coba lagi"
          onAction={fetchAll}
        />
      ) : isLoading ? (
        <div
          className="grid grid-cols-1 gap-3 md:grid-cols-2"
          aria-busy="true"
        >
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          message={
            products.length === 0
              ? isSuperAdmin
                ? 'Belum ada produk yang terdaftar di seluruh KDKMP.'
                : 'Belum ada produk di koperasi ini.'
              : 'Produk tidak ditemukan.'
          }
          actionLabel={
            products.length === 0
              ? isSuperAdmin
                ? ''
                : 'Tambah Produk'
              : 'Reset Filter'
          }
          onAction={() => {
            if (products.length === 0) {
              if (!isSuperAdmin) handleOpenCreate();
            } else {
              setSearchQuery('');
              setSelectedVillage('');
              setSelectedCategory('');
              setSelectedStock('');
              setPage(1);
            }
          }}
        />
      ) : quickPriceMode && !isSuperAdmin ? (
        <form
          onSubmit={handleSaveQuickPrices}
          className="space-y-3 rounded-xl border border-border bg-surface p-4"
        >
          <div className="divide-y divide-border">
            {paginatedProducts.map((product) => {
              const currentDraft =
                draftPrices[product.id] ?? formatDigitsInput(product.price);
              const parsedDraft = parseFormattedInt(currentDraft);
              const isChanged =
                parsedDraft !== null && parsedDraft !== Number(product.price);

              return (
                <div
                  key={product.id}
                  className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-text">
                      {product.name}
                    </div>
                    <div className="text-xs text-text-2">
                      Harga saat ini: <Money value={product.price} /> /{' '}
                      {product.unit}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:w-56">
                    <span className="text-xs font-medium text-text-2">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`Harga ${product.name}`}
                      value={currentDraft}
                      onChange={(e) => {
                        const formatted = formatDigitsInput(e.target.value);
                        setDraftPrices((prev) => ({
                          ...prev,
                          [product.id]: formatted,
                        }));
                      }}
                      className={`min-h-11 w-full rounded-lg border bg-surface px-3 py-2 text-right text-sm font-semibold text-text tabular-nums outline-none transition focus:border-primary-700 focus:ring-1 focus:ring-primary-700 ${isChanged ? 'border-primary-700 bg-primary-50' : 'border-border'
                        }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancelQuickPriceMode}
              disabled={isSavingQuickPrices}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSavingQuickPrices}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {isSavingQuickPrices ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      ) : (
        <>
          {/* Mobile (1 col) & Tablet md (2 cols) Card List */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
            {paginatedProducts.map((product) => {
              const imgSrc = product.image_url
                ? driveImageUrl(product.image_url).split('#')[0]
                : '';
              const isAvailable = product.stock_status !== 'habis';
              const isConfirmingDelete = confirmDeleteId === product.id;

              return (
                <div
                  key={product.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-surface p-3.5"
                >
                  <div className="flex items-start gap-3">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={product.name}
                        width="64"
                        height="64"
                        loading="lazy"
                        decoding="async"
                        className="h-16 w-16 shrink-0 rounded-lg border border-border bg-surface object-contain"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-3 text-text-3">
                        <Package className="h-6 w-6" aria-hidden="true" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {isSuperAdmin && (
                        <div className="mb-0.5 truncate text-xs font-semibold text-primary-700">
                          {product.kdkmp_name || 'KDKMP'}
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="line-clamp-2 text-sm font-semibold text-text">
                          {product.name}
                        </h2>
                        <Badge
                          variant={getStockBadgeVariant(product.stock_status)}
                        >
                          {getStockLabel(product.stock_status)}
                        </Badge>
                      </div>

                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-text-2">
                          {product.category_name || 'Tanpa Kategori'}
                        </span>
                        {isSuperAdmin && product.is_featured && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700">
                            <Star className="h-3 w-3" fill="currentColor" aria-hidden="true" />
                            Unggulan
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
                        <Money
                          value={product.price}
                          className="text-sm font-bold text-primary-700"
                        />
                        <span className="text-xs text-text-2">
                          / {product.unit}
                        </span>
                        {product.original_price > product.price && (
                          <Money
                            value={product.original_price}
                            className="text-xs text-text-3 line-through"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {!isSuperAdmin && (
                    isConfirmingDelete ? (
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-primary-700 bg-primary-50 px-3 py-2 text-xs">
                        <span className="truncate font-semibold text-primary-700">
                          Hapus produk ini?
                        </span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={isDeletingId === product.id}
                          >
                            Batal
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => handleConfirmDelete(product)}
                            disabled={isDeletingId === product.id}
                          >
                            Ya, Hapus
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isAvailable}
                            aria-label={`Saklar stok ${product.name}`}
                            onClick={() => handleToggleStock(product)}
                            className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${isAvailable
                              ? 'border-border bg-ok-50 text-ok-700'
                              : 'border-border bg-mute-50 text-mute-700'
                              }`}
                          >
                            <span>
                              {isAvailable ? 'Stok Tersedia' : 'Stok Habis'}
                            </span>
                          </button>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={Boolean(product.is_featured)}
                            aria-label={`Unggulan ${product.name}`}
                            onClick={() => handleToggleFeatured(product)}
                            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${product.is_featured
                              ? 'border-primary-700 bg-primary-50 text-primary-700'
                              : 'border-border bg-surface text-text-3 hover:bg-surface-3'
                              }`}
                          >
                            <Star
                              className="h-4 w-4"
                              fill={product.is_featured ? 'currentColor' : 'none'}
                              aria-hidden="true"
                            />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEdit(product)}
                            aria-label={`Ubah ${product.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Ubah
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteId(product.id)}
                            aria-label={`Hapus ${product.name}`}
                          >
                            <Trash2
                              className="h-4 w-4 text-primary-700"
                              aria-hidden="true"
                            />
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop lg Table: Foto, Nama, [KDKMP if super_admin], Kategori, Harga kanan, Satuan, Stok, Unggulan, [Aksi if !super_admin] */}
          <div className="hidden lg:block overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-3 text-xs font-semibold text-text-2">
                  <th className="w-16 px-4 py-3">Foto</th>
                  <th className="px-4 py-3">Nama</th>
                  {isSuperAdmin && <th className="px-4 py-3">KDKMP</th>}
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Harga</th>
                  <th className="px-4 py-3">Satuan</th>
                  <th className="px-4 py-3">Stok</th>
                  <th className="px-4 py-3 text-center">Unggulan</th>
                  {!isSuperAdmin && <th className="px-4 py-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedProducts.map((product) => {
                  const imgSrc = product.image_url
                    ? driveImageUrl(product.image_url).split('#')[0]
                    : '';
                  const isAvailable = product.stock_status !== 'habis';
                  const isConfirmingDelete = confirmDeleteId === product.id;

                  return (
                    <tr key={product.id} className="hover:bg-surface-3/50">
                      <td className="px-4 py-3">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={product.name}
                            width="48"
                            height="48"
                            loading="lazy"
                            decoding="async"
                            className="h-12 w-12 rounded-lg border border-border bg-surface object-contain"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-surface-3 text-text-3">
                            <Package className="h-5 w-5" aria-hidden="true" />
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 font-semibold text-text">
                        {product.name}
                      </td>

                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-xs font-semibold text-primary-700 whitespace-nowrap">
                          {product.kdkmp_name || 'KDKMP'}
                        </td>
                      )}

                      <td className="px-4 py-3 text-text-2">
                        {product.category_name || 'Tanpa Kategori'}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Money
                          value={product.price}
                          className="font-bold text-primary-700"
                        />
                        {product.original_price > product.price && (
                          <div>
                            <Money
                              value={product.original_price}
                              className="text-xs text-text-3 line-through"
                            />
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-text-2">{product.unit}</td>

                      <td className="px-4 py-3">
                        {isSuperAdmin ? (
                          <Badge variant={getStockBadgeVariant(product.stock_status)}>
                            {getStockLabel(product.stock_status)}
                          </Badge>
                        ) : (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isAvailable}
                            aria-label={`Saklar stok ${product.name}`}
                            onClick={() => handleToggleStock(product)}
                            className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${product.stock_status === 'ready'
                              ? 'border-border bg-ok-50 text-ok-700'
                              : product.stock_status === 'pre-order'
                                ? 'border-border bg-warn-50 text-warn-700'
                                : 'border-border bg-mute-50 text-mute-700'
                              }`}
                          >
                            <span>{getStockLabel(product.stock_status)}</span>
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {isSuperAdmin ? (
                          <div className="flex items-center justify-center">
                            <Star
                              className="h-4 w-4 text-primary-700"
                              fill={product.is_featured ? 'currentColor' : 'none'}
                              aria-hidden="true"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={Boolean(product.is_featured)}
                            aria-label={`Saklar unggulan ${product.name}`}
                            onClick={() => handleToggleFeatured(product)}
                            className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${product.is_featured
                              ? 'border-primary-700 bg-primary-50 text-primary-700'
                              : 'border-border bg-surface text-text-3 hover:bg-surface-3'
                              }`}
                          >
                            <Star
                              className="h-4 w-4"
                              fill={product.is_featured ? 'currentColor' : 'none'}
                              aria-hidden="true"
                            />
                          </button>
                        )}
                      </td>

                      {!isSuperAdmin && (
                        <td className="px-4 py-3 text-right">
                          {isConfirmingDelete ? (
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <span className="text-xs font-semibold text-primary-700">
                                Hapus?
                              </span>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={isDeletingId === product.id}
                              >
                                Batal
                              </Button>
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={() => handleConfirmDelete(product)}
                                disabled={isDeletingId === product.id}
                              >
                                Ya, Hapus
                              </Button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenEdit(product)}
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                Ubah
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmDeleteId(product.id)}
                                aria-label={`Hapus ${product.name}`}
                              >
                                <Trash2
                                  className="h-4 w-4 text-primary-700"
                                  aria-hidden="true"
                                />
                              </Button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      {!isSuperAdmin && formOpen && (
        <ProductFormSheet
          key={editingProduct?.id || 'new-product'}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          initialProduct={editingProduct}
          categories={categories}
          villageId={activeVillageId}
          isDemo={isDemo}
          actorUserId={actorUserId}
          onSaved={handleProductSaved}
        />
      )}
    </div>
  );
}

export default AdminProductsPage;
