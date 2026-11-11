import { useState, useEffect, useCallback, useMemo } from 'react';
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
  EmptyState,
  Input,
  Num,
  DateText,
  Skeleton,
  Badge,
  Pagination,
} from '../components/ui';
import {
  getAdminProductUnits,
  createAdminProductUnit,
  updateAdminProductUnit,
  deleteAdminProductUnit,
  moveAdminProductUnit,
} from '../lib/api';
import { useAuth } from './AuthContext';

const PAGE_SIZE = 10;

export function AdminUnitsPage({ initialUnits = null, initialPage = 1 }) {
  let auth = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    auth = useAuth();
  } catch {
    // fallback when rendered outside AuthProvider
  }
  const session = auth?.session;
  const isDemo = Boolean(session?.is_demo);
  const actorUserId = session?.user?.id;

  const [units, setUnits] = useState(() => initialUnits ?? []);
  const [loadingUnits, setLoadingUnits] = useState(() => initialUnits === null);
  const [page, setPage] = useState(initialPage);

  const totalPages = Math.max(1, Math.ceil(units.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedUnits = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return units.slice(start, start + PAGE_SIZE);
  }, [units, safePage]);
  const [newUnitName, setNewUnitName] = useState('');
  const [unitError, setUnitError] = useState('');
  const [isCreatingUnit, setIsCreatingUnit] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editingUnitName, setEditingUnitName] = useState('');
  const [isSavingUnitEdit, setIsSavingUnitEdit] = useState(false);
  const [confirmDeleteUnitId, setConfirmDeleteUnitId] = useState(null);
  const [isDeletingUnitId, setIsDeletingUnitId] = useState(null);
  const [isReorderingUnits, setIsReorderingUnits] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  }, []);

  const fetchUnits = useCallback(async () => {
    setLoadingUnits(true);
    try {
      const data = await getAdminProductUnits({ isDemo, actorUserId });
      setUnits(data);
    } catch (err) {
      showToast(err.message || 'Gagal memuat daftar satuan.');
    } finally {
      setLoadingUnits(false);
    }
  }, [isDemo, actorUserId, showToast]);

  useEffect(() => {
    if (initialUnits !== null) return undefined;
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoadingUnits(true);
        return getAdminProductUnits({ isDemo, actorUserId });
      })
      .then((data) => {
        if (!active || !data) return;
        setUnits(data);
        setLoadingUnits(false);
      })
      .catch((err) => {
        if (!active) return;
        showToast(err.message || 'Gagal memuat daftar satuan.');
        setLoadingUnits(false);
      });

    return () => {
      active = false;
    };
  }, [initialUnits, isDemo, actorUserId, showToast]);

  const handleCreateUnit = async (e) => {
    e.preventDefault();
    setUnitError('');
    const clean = newUnitName.trim();
    if (!clean) {
      setUnitError('Nama satuan wajib diisi.');
      return;
    }

    setIsCreatingUnit(true);
    try {
      const created = await createAdminProductUnit(
        { name: clean },
        { isDemo, actorUserId }
      );
      setUnits((prev) => [...prev, created]);
      setNewUnitName('');
      showToast('Satuan berhasil ditambahkan.');
    } catch (err) {
      setUnitError(err.message || 'Gagal menambahkan satuan.');
    } finally {
      setIsCreatingUnit(false);
    }
  };

  const handleStartEditUnit = (unit) => {
    setEditingUnitId(unit.id);
    setEditingUnitName(unit.name);
    setUnitError('');
  };

  const handleSaveEditUnit = async (unitId) => {
    const clean = editingUnitName.trim();
    if (!clean) {
      setUnitError('Nama satuan wajib diisi.');
      return;
    }

    setIsSavingUnitEdit(true);
    try {
      const updated = await updateAdminProductUnit(
        unitId,
        { name: clean },
        { isDemo, actorUserId }
      );
      setUnits((prev) => prev.map((u) => (u.id === unitId ? updated : u)));
      setEditingUnitId(null);
      setEditingUnitName('');
      showToast('Satuan berhasil diubah.');
    } catch (err) {
      setUnitError(err.message || 'Gagal mengubah satuan.');
    } finally {
      setIsSavingUnitEdit(false);
    }
  };

  const handleDeleteUnit = async (unitId) => {
    setIsDeletingUnitId(unitId);
    try {
      await deleteAdminProductUnit(unitId, { isDemo, actorUserId });
      setUnits((prev) => prev.filter((u) => u.id !== unitId));
      setConfirmDeleteUnitId(null);
      showToast('Satuan berhasil dihapus.');
    } catch (err) {
      showToast(err.message || 'Gagal menghapus satuan.');
    } finally {
      setIsDeletingUnitId(null);
    }
  };

  const handleMoveUnit = async (unitId, direction) => {
    setIsReorderingUnits(true);
    try {
      const updated = await moveAdminProductUnit(unitId, direction, {
        isDemo,
        actorUserId,
      });
      setUnits(updated);
    } catch (err) {
      showToast(err.message || 'Gagal mengubah urutan satuan.');
    } finally {
      setIsReorderingUnits(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-text md:text-2xl">Satuan</h1>
          <Badge variant="mute">Semua KDKMP</Badge>
        </div>
        <span className="text-xs text-text-3">
          <Num value={units.length} /> satuan
        </span>
      </div>

      {toastMessage && (
        <div
          role="status"
          className="rounded-lg border border-border bg-ok-50 px-3.5 py-2.5 text-xs font-medium text-ok-700"
        >
          {toastMessage}
        </div>
      )}

      <section aria-label="Master Satuan Produk" className="space-y-4">
        <form
          onSubmit={handleCreateUnit}
          noValidate
          className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-3.5 md:flex-row md:items-start"
        >
          <Input
            aria-label="Nama satuan baru"
            placeholder="Nama satuan baru..."
            value={newUnitName}
            onChange={(e) => {
              setNewUnitName(e.target.value);
              if (unitError) setUnitError('');
            }}
            error={unitError}
            containerClassName="flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={isCreatingUnit}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {isCreatingUnit ? 'Menambah...' : 'Tambah Satuan'}
          </Button>
        </form>

        {loadingUnits ? (
          <div className="space-y-2.5" aria-busy="true">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : units.length === 0 ? (
          <EmptyState
            message="Belum ada master satuan produk."
            actionLabel="Muat ulang"
            onAction={fetchUnits}
          />
        ) : (
          <div className="space-y-4">
            <div className="divide-y divide-border rounded-xl border border-border bg-surface">
              {paginatedUnits.map((unit, idx) => {
                const isEditing = editingUnitId === unit.id;
                const isConfirming = confirmDeleteUnitId === unit.id;
                const absoluteIndex = (safePage - 1) * PAGE_SIZE + idx;

                return (
                  <div
                    key={unit.id}
                    className="flex flex-col gap-2.5 p-3.5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-xs font-bold text-text-2">
                        <Num value={absoluteIndex + 1} />
                      </span>

                    {isEditing ? (
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Input
                          aria-label={`Ubah nama satuan ${unit.name}`}
                          value={editingUnitName}
                          onChange={(e) => setEditingUnitName(e.target.value)}
                          containerClassName="flex-1"
                        />
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveEditUnit(unit.id)}
                          disabled={isSavingUnitEdit}
                          aria-label="Simpan satuan"
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                          Simpan
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingUnitId(null)}
                          disabled={isSavingUnitEdit}
                          aria-label="Batal ubah satuan"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                          Batal
                        </Button>
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-text">
                          {unit.name}
                        </div>
                        {unit.created_at ? (
                          <div className="text-xs text-text-3">
                            Dibuat <DateText value={unit.created_at} mode="date" />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {isConfirming ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary-700 bg-primary-50 px-3 py-2 text-xs">
                      <span className="font-semibold text-primary-700">
                        Hapus satuan {unit.name}?
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setConfirmDeleteUnitId(null)}
                          disabled={isDeletingUnitId === unit.id}
                        >
                          Batal
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleDeleteUnit(unit.id)}
                          disabled={isDeletingUnitId === unit.id}
                        >
                          {isDeletingUnitId === unit.id ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    !isEditing && (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleMoveUnit(unit.id, 'up')}
                          disabled={absoluteIndex === 0 || isReorderingUnits}
                          aria-label={`Urut naik ${unit.name}`}
                        >
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleMoveUnit(unit.id, 'down')}
                          disabled={absoluteIndex === units.length - 1 || isReorderingUnits}
                          aria-label={`Urut turun ${unit.name}`}
                        >
                          <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStartEditUnit(unit)}
                          aria-label={`Ubah satuan ${unit.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Ubah
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteUnitId(unit.id)}
                          aria-label={`Hapus satuan ${unit.name}`}
                        >
                          <Trash2
                            className="h-4 w-4 text-primary-700"
                            aria-hidden="true"
                          />
                        </Button>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={units.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
      </section>
    </div>
  );
}

export default AdminUnitsPage;
