import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
} from 'lucide-react';
import {
  Button,
  Badge,
  EmptyState,
  Input,
  Num,
  Skeleton,
  Pagination,
} from '../components/ui';
import {
  getAdminCategories,
  getAdminProducts,
  createAdminCategory,
  updateAdminCategory,
  moveAdminCategory,
  deleteAdminCategory,
} from '../lib/api';
import { useAuth } from './AuthContext';
import { swapCategoryOrder } from './adminProductUtils';

const PAGE_SIZE = 10;

export function AdminCategoriesPage({
  initialCategories = null,
  initialProducts = null,
  initialPage = 1,
}) {
  const { activeVillageId, session, role } = useAuth();
  const isSuperAdmin = role === 'super_admin';
  const isDemo = Boolean(session?.is_demo);
  const actorUserId = session?.user?.id;

  const [categories, setCategories] = useState(() => initialCategories ?? []);
  const [products, setProducts] = useState(() => initialProducts ?? []);
  const [isLoading, setIsLoading] = useState(
    () => initialCategories === null && Boolean(activeVillageId || isSuperAdmin)
  );
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const [page, setPage] = useState(initialPage);
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [isReordering, setIsReordering] = useState(false);

  const fetchAll = useCallback(async () => {
    const targetVillage = isSuperAdmin ? null : activeVillageId;
    if (!targetVillage && !isSuperAdmin) {
      setCategories([]);
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError('');
    try {
      const [catsData, prodsData] = await Promise.all([
        getAdminCategories(targetVillage, { isDemo, actorUserId, isSuperAdmin }),
        getAdminProducts(targetVillage, { isDemo, actorUserId, isSuperAdmin }),
      ]);
      setCategories(catsData);
      setProducts(prodsData);
    } catch (err) {
      setLoadError(err?.message || 'Gagal memuat daftar kategori.');
    } finally {
      setIsLoading(false);
    }
  }, [activeVillageId, isDemo, actorUserId, isSuperAdmin]);

  useEffect(() => {
    if (initialCategories !== null) return undefined;
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return null;
        const targetVillage = isSuperAdmin ? null : activeVillageId;
        if (!targetVillage && !isSuperAdmin) {
          setCategories([]);
          setProducts([]);
          setIsLoading(false);
          return null;
        }
        setIsLoading(true);
        setLoadError('');
        return Promise.all([
          getAdminCategories(targetVillage, { isDemo, actorUserId, isSuperAdmin }),
          getAdminProducts(targetVillage, { isDemo, actorUserId, isSuperAdmin }),
        ]);
      })
      .then((res) => {
        if (!active || !res) return;
        setCategories(res[0]);
        setProducts(res[1]);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err?.message || 'Gagal memuat daftar kategori.');
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeVillageId, isDemo, actorUserId, initialCategories, isSuperAdmin]);

  const productCountByCategory = useMemo(() => {
    const map = {};
    let uncategorized = 0;
    for (const p of products) {
      if (p?.category_id) {
        map[p.category_id] = (map[p.category_id] || 0) + 1;
      } else {
        uncategorized += 1;
      }
    }
    return { byId: map, uncategorized };
  }, [products]);

  const totalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedCategories = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return categories.slice(start, start + PAGE_SIZE);
  }, [categories, safePage]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreateError('');
    setActionError('');
    setActionNotice('');

    const clean = newName.trim();
    if (!clean) {
      setCreateError('Nama kategori wajib diisi.');
      return;
    }

    setIsCreating(true);
    try {
      const targetVillage = isSuperAdmin ? null : activeVillageId;
      const created = await createAdminCategory(
        { villageId: targetVillage, name: clean },
        { isDemo, actorUserId }
      );
      setCategories((prev) => [...prev, created]);
      setNewName('');
      setActionNotice('Kategori berhasil ditambahkan.');
    } catch (err) {
      setCreateError(err?.message || 'Gagal menambahkan kategori.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (category) => {
    setActionError('');
    setActionNotice('');
    setConfirmDeleteId(null);
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (categoryId) => {
    setActionError('');
    setActionNotice('');
    const clean = editingName.trim();
    if (!clean) {
      setActionError('Nama kategori wajib diisi.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const targetVillage = isSuperAdmin ? null : activeVillageId;
      const updated = await updateAdminCategory(
        categoryId,
        { name: clean },
        { villageId: targetVillage, isDemo, actorUserId }
      );
      setCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? updated : c))
      );
      setProducts((prev) =>
        prev.map((p) =>
          p.category_id === categoryId ? { ...p, category_name: updated.name } : p
        )
      );
      setEditingId(null);
      setEditingName('');
      setActionNotice('Kategori berhasil diperbarui.');
    } catch (err) {
      setActionError(err?.message || 'Gagal memperbarui kategori.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleMove = async (index, direction) => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    setActionError('');
    setActionNotice('');
    const previous = categories.map((c) => ({ ...c }));
    const category = categories[index];

    setCategories((prev) => swapCategoryOrder(prev, index, targetIdx));
    setIsReordering(true);

    try {
      const targetVillage = isSuperAdmin ? null : activeVillageId;
      const updatedList = await moveAdminCategory(category.id, direction, {
        villageId: targetVillage,
        isDemo,
        actorUserId,
      });
      setCategories(updatedList);
    } catch (err) {
      setCategories(previous);
      setActionError(
        err?.message || 'Gagal mengubah urutan kategori. Perubahan dibatalkan.'
      );
    } finally {
      setIsReordering(false);
    }
  };

  const handleConfirmDelete = async (category) => {
    setActionError('');
    setActionNotice('');
    setIsDeletingId(category.id);
    try {
      const targetVillage = isSuperAdmin ? null : activeVillageId;
      await deleteAdminCategory(category.id, {
        villageId: targetVillage,
        isDemo,
        actorUserId,
      });
      setCategories((prev) =>
        prev
          .filter((c) => c.id !== category.id)
          .map((c, idx) => ({ ...c, sort_order: idx + 1 }))
      );
      setProducts((prev) =>
        prev.map((p) =>
          p.category_id === category.id
            ? { ...p, category_id: null, category_name: null }
            : p
        )
      );
      setConfirmDeleteId(null);
      setActionNotice('Kategori dihapus. Produk terkait menjadi tanpa kategori.');
    } catch (err) {
      setActionError(err?.message || 'Gagal menghapus kategori.');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-text md:text-2xl">Kategori</h1>
          {isSuperAdmin && <Badge variant="mute">Semua KDKMP</Badge>}
        </div>
        {productCountByCategory.uncategorized > 0 && (
          <span className="text-xs font-medium text-text-2">
            Tanpa Kategori: <Num value={productCountByCategory.uncategorized} />{' '}
            produk
          </span>
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

      {!isSuperAdmin && (
        <div className="rounded-xl border border-border bg-surface-3 p-3.5 text-xs text-text-2">
          Kategori master berlaku untuk semua KDKMP. Anda dapat menambah kategori baru jika belum terdaftar. Hubungi Super Admin untuk mengubah atau menghapus kategori master.
        </div>
      )}

      <form
        onSubmit={handleCreate}
        noValidate
        className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-3.5 md:flex-row md:items-start"
      >
        <Input
          aria-label="Nama kategori baru"
          placeholder="Nama kategori baru..."
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            if (createError) setCreateError('');
          }}
          error={createError}
          containerClassName="flex-1"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={isCreating}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {isCreating ? 'Menambah...' : 'Tambah Kategori'}
        </Button>
      </form>

      {loadError ? (
        <EmptyState
          message={loadError}
          actionLabel="Coba lagi"
          onAction={fetchAll}
        />
      ) : isLoading ? (
        <div className="space-y-2.5" aria-busy="true">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState message="Belum ada kategori produk." />
      ) : (
        <div className="space-y-4">
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            {paginatedCategories.map((cat, idx) => {
              const isEditing = editingId === cat.id;
              const isConfirmingDelete = confirmDeleteId === cat.id;
              const prodCount = productCountByCategory.byId[cat.id] || 0;
              const absoluteIndex = (safePage - 1) * PAGE_SIZE + idx;

              return (
                <div
                  key={cat.id}
                  className="flex flex-col gap-2.5 p-3.5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-xs font-bold text-text-2">
                      <Num value={absoluteIndex + 1} />
                    </span>

                  {isEditing ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Input
                        aria-label={`Ubah nama kategori ${cat.name}`}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        containerClassName="flex-1"
                      />
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleSaveEdit(cat.id)}
                        disabled={isSavingEdit}
                        aria-label="Simpan kategori"
                      >
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Simpan
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isSavingEdit}
                        aria-label="Batal ubah kategori"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                        Batal
                      </Button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-text">
                        {cat.name}
                      </div>
                      <div className="text-xs text-text-2">
                        <Num value={prodCount} /> produk
                      </div>
                    </div>
                  )}
                </div>

                {isConfirmingDelete ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary-700 bg-primary-50 px-3 py-2 text-xs">
                    <span className="font-semibold text-primary-700">
                      Hapus kategori? Produk jadi tanpa kategori.
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isDeletingId === cat.id}
                      >
                        Batal
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleConfirmDelete(cat)}
                        disabled={isDeletingId === cat.id}
                      >
                        Ya, Hapus
                      </Button>
                    </div>
                  </div>
                ) : (
                  !isEditing && (
                    isSuperAdmin ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleMove(absoluteIndex, 'up')}
                          disabled={absoluteIndex === 0 || isReordering}
                          aria-label={`Urut naik ${cat.name}`}
                        >
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleMove(absoluteIndex, 'down')}
                          disabled={absoluteIndex === categories.length - 1 || isReordering}
                          aria-label={`Urut turun ${cat.name}`}
                        >
                          <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStartEdit(cat)}
                          aria-label={`Ubah ${cat.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Ubah
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteId(cat.id)}
                          aria-label={`Hapus ${cat.name}`}
                        >
                          <Trash2
                            className="h-4 w-4 text-primary-700"
                            aria-hidden="true"
                          />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end">
                        <span className="rounded bg-surface-3 px-2 py-1 text-[11px] font-medium text-text-3">
                          Master
                        </span>
                      </div>
                    )
                  )
                )}
              </div>
            );
          })}
        </div>

        <Pagination
          page={safePage}
          totalPages={totalPages}
          totalItems={categories.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    )}
    </div>
  );
}

export default AdminCategoriesPage;
