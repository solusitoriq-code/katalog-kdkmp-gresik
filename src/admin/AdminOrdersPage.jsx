import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Search,
  Eye,
  Trash2,
  MessageCircle,
  Check,
  X,
  Plus,
  Pencil,
} from 'lucide-react';
import {
  Button,
  Badge,
  Input,
  Select,
  Sheet,
  Skeleton,
  EmptyState,
  Money,
  Num,
  DateText,
  Pagination,
} from '../components/ui';
import {
  getAdminOrders,
  updateAdminOrderStatus,
  deleteAdminOrder,
} from '../lib/api';
import { normalizePhone } from '../lib/whatsapp';
import { useAuth } from './AuthContext';
import { STATUS_CONFIG, STATUS_TABS } from './adminOrderUtils';
export { AdminOrderFormPage, AdminOrderFormPage as OrderFormSheet } from './AdminOrderFormPage';

const PAGE_SIZE = 10;

export function OrderDetailsSheet({
  order,
  open,
  onClose,
  onStatusChange,
  onDelete,
  onEdit,
  isUpdating = false,
  isDeleting = false,
  isSuperAdmin = false,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [prevOrderId, setPrevOrderId] = useState(() => order?.id);

  if (order?.id !== prevOrderId) {
    setPrevOrderId(order?.id);
    setShowDeleteConfirm(false);
  }

  if (!order) return null;

  const currentCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const items = Array.isArray(order.items) ? order.items : [];
  const cleanPhone = normalizePhone(order.customer_phone);
  const isTerminal = order.status === 'completed' || order.status === 'cancelled';
  const isReadOnly = isSuperAdmin || isTerminal;

  const handleConfirmDelete = () => {
    onDelete?.(order.id);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Transaksi #${order.order_number}`}
      mobileFull
      footer={
        isReadOnly ? (
          <div className="flex w-full justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Tutup
            </Button>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between gap-2">
            {showDeleteConfirm ? (
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-xs font-semibold text-primary-700">
                  Hapus transaksi ini?
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isDeleting}
                    onClick={handleConfirmDelete}
                    className="bg-primary-700 text-white"
                  >
                    {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex w-full items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit?.(order)}
                    className="text-text-2 hover:text-text font-medium"
                    title="Edit transaksi"
                  >
                    <Pencil className="h-4 w-4 mr-1" aria-hidden="true" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-text-2 hover:text-primary-700"
                    title="Hapus transaksi"
                  >
                    <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
                    <span>Hapus</span>
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onClose}
                >
                  Tutup
                </Button>
              </div>
            )}
          </div>
        )
      }
    >
      <div className="space-y-5 pb-4 text-xs md:text-sm">
        {/* Info Ringkas Status & Waktu */}
        <div className="rounded-xl border border-border bg-surface-3/50 p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-text">
              {order.order_number}
            </span>
            <Badge variant={currentCfg.badgeVariant}>
              {currentCfg.label}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-text-3">
            <span>Waktu Pemesanan</span>
            <DateText value={order.created_at} mode="longDateTime" className="font-medium text-text-2" />
          </div>
          {order.village_name && (
            <div className="flex items-center justify-between gap-2 text-xs text-text-3">
              <span>Koperasi</span>
              <span className="font-semibold text-text">{order.village_name}</span>
            </div>
          )}
        </div>

        {/* Informasi Pemesan */}
        <section aria-label="Informasi pemesan" className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-2">
            Data Pemesan
          </h3>
          <div className="rounded-xl border border-border p-3.5 space-y-2">
            <div className="flex justify-between gap-3">
              <span className="text-text-3">Nama</span>
              <span className="font-semibold text-text text-right">{order.customer_name}</span>
            </div>
            {order.customer_phone && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-3">No. WhatsApp</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium tabular-nums text-text">{order.customer_phone}</span>
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-7 items-center gap-1 rounded bg-ok-50 px-2 py-0.5 text-[11px] font-semibold text-ok-700 hover:bg-ok-100"
                    >
                      <MessageCircle className="h-3 w-3" aria-hidden="true" />
                      <span>Chat</span>
                    </a>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-text-3">Pengiriman</span>
              <span className="font-medium text-text text-right">{order.delivery_method}</span>
            </div>
            {order.delivery_method === 'Diantar' && order.customer_address && (
              <div className="flex justify-between gap-3">
                <span className="text-text-3">Alamat</span>
                <span className="text-right text-text max-w-[65%]">{order.customer_address}</span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-text-3">Pembayaran</span>
              <span className="font-medium text-text text-right">{order.payment_method}</span>
            </div>
            {order.note && (
              <div className="flex justify-between gap-3 border-t border-border pt-2">
                <span className="text-text-3">Catatan</span>
                <span className="text-right italic text-text-2 max-w-[65%]">{order.note}</span>
              </div>
            )}
          </div>
        </section>

        {/* Rincian Produk */}
        <section aria-label="Rincian produk" className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-2">
            Rincian Item (<Num value={order.items_count} />)
          </h3>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-3/50 text-text-3">
                <tr className="border-b border-border">
                  <th className="py-2.5 px-3 font-semibold">Produk</th>
                  <th className="py-2.5 px-2 text-right font-semibold">Qty</th>
                  <th className="py-2.5 px-2 text-right font-semibold">Harga</th>
                  <th className="py-2.5 pr-3 text-right font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((it, idx) => {
                  const qty = Math.max(1, Math.round(Number(it.qty) || 1));
                  const price = Math.max(0, Math.round(Number(it.price) || 0));
                  const subtotal = qty * price;
                  return (
                    <tr key={it.product_id || idx} className="hover:bg-surface-3/30">
                      <td className="py-2.5 px-3 font-medium text-text">
                        {it.name || 'Produk'}
                        {it.unit ? <span className="text-text-3"> /{it.unit}</span> : null}
                      </td>
                      <td className="py-2.5 px-2 text-right font-medium text-text-2 tabular-nums">
                        <Num value={qty} />
                      </td>
                      <td className="py-2.5 px-2 text-right font-medium text-text-2 tabular-nums">
                        <Money value={price} />
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-text tabular-nums">
                        <Money value={subtotal} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-border bg-surface-3/50 font-bold">
                <tr>
                  <td colSpan={3} className="py-3 px-3 text-text">
                    Total Pembayaran
                  </td>
                  <td className="py-3 pr-3 text-right text-sm text-primary-700 tabular-nums">
                    <Money value={order.total} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Pengubah Status - Hanya untuk manager dan status non-terminal */}
        {!isReadOnly && (
          <section aria-label="Ubah status pesanan" className="rounded-xl border border-border p-3.5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-2">
              Ubah Status Pesanan
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {order.status === 'pending' && (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={isUpdating}
                  onClick={() => onStatusChange?.(order.id, 'processing')}
                  className="min-h-11 flex-1 sm:flex-initial font-semibold"
                >
                  Tandai Diproses
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={isUpdating}
                onClick={() => onStatusChange?.(order.id, 'completed')}
                className="min-h-11 flex-1 sm:flex-initial font-semibold border-ok-700/40 text-ok-700 hover:bg-ok-50"
              >
                <Check className="h-4 w-4 mr-1.5" aria-hidden="true" />
                <span>Tandai Selesai</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={isUpdating}
                onClick={() => onStatusChange?.(order.id, 'cancelled')}
                className="min-h-11 flex-1 sm:flex-initial font-semibold border-primary-700/40 text-primary-700 hover:bg-primary-50"
              >
                <X className="h-4 w-4 mr-1.5" aria-hidden="true" />
                <span>Batalkan Pesanan</span>
              </Button>
            </div>
          </section>
        )}
      </div>
    </Sheet>
  );
}

export function AdminOrdersPage({
  initialOrders = null,
  initialPage = 1,
  initialStatus = 'all',
  initialSearch = '',
  initialSelectedOrder = null,
}) {
  const navigate = useNavigate();

  let auth = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    auth = useAuth();
  } catch {
    // fallback when rendered outside AuthProvider
  }

  const role = auth?.role || 'village_admin';
  const isSuperAdmin = role === 'super_admin';
  const activeVillageId = auth?.activeVillageId || auth?.admin?.village_id || auth?.activeVillage?.id;
  const villageId = isSuperAdmin ? null : activeVillageId;
  const session = auth?.session;
  const isDemo = Boolean(session?.is_demo);

  const [orders, setOrders] = useState(() => initialOrders ?? []);
  const [loading, setLoading] = useState(() => initialOrders === null);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [page, setPage] = useState(initialPage);
  const [totalOrders, setTotalOrders] = useState(() => initialOrders?.length ?? 0);
  const [selectedOrder, setSelectedOrder] = useState(initialSelectedOrder);
  const [isDetailOpen, setIsDetailOpen] = useState(Boolean(initialSelectedOrder));
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  }, []);

  useEffect(() => {
    if (initialOrders !== null) return undefined;
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoading(true);
        const targetVillage = isSuperAdmin ? (selectedVillageId || null) : villageId;
        return getAdminOrders(
          {
            villageId: targetVillage,
            status: statusFilter,
            search: searchQuery,
            page,
            pageSize: PAGE_SIZE,
            isSuperAdmin,
          },
          { isDemo }
        );
      })
      .then((res) => {
        if (!active || !res) return;
        setOrders(res.orders || []);
        setTotalOrders(res.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        showToast(err.message || 'Gagal memuat daftar transaksi.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialOrders, isSuperAdmin, selectedVillageId, villageId, statusFilter, searchQuery, page, isDemo, showToast]);

  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE));

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (isSuperAdmin) {
      showToast('Super Admin tidak memiliki izin mengubah status transaksi.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await updateAdminOrderStatus(orderId, newStatus, {
        isDemo,
        isSuperAdmin: false,
        villageId,
      });

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      showToast(`Status transaksi diubah menjadi ${STATUS_CONFIG[newStatus]?.label || newStatus}.`);
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui status transaksi.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (isSuperAdmin) {
      showToast('Super Admin tidak memiliki izin menghapus transaksi.');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAdminOrder(orderId, {
        isDemo,
        isSuperAdmin: false,
        villageId,
      });

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setTotalOrders((prev) => Math.max(0, prev - 1));
      handleCloseDetail();
      showToast('Transaksi berhasil dihapus.');
    } catch (err) {
      showToast(err.message || 'Gagal menghapus transaksi.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5" aria-label="Halaman Transaksi">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 z-50 rounded-lg bg-text px-4 py-2 text-xs font-semibold text-white shadow-lg md:text-sm"
        >
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-text md:text-2xl">Transaksi</h1>
          <span className="text-xs text-text-3 tabular-nums">
            Total: <Num value={totalOrders} /> transaksi
          </span>
        </div>
        {!isSuperAdmin && (
          <Link to="/admin/transaksi/tambah">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="min-h-11 sm:min-h-9 flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Tambah Transaksi</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Status Tabs */}
      <div className="flex overflow-x-auto pb-1 gap-1 border-b border-border" aria-label="Filter status transaksi">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`min-h-11 shrink-0 rounded-t-lg px-3.5 py-2 text-xs md:text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
                isActive
                  ? 'border-b-2 border-primary-700 bg-primary-50/50 text-primary-700 font-bold'
                  : 'text-text-2 hover:bg-surface-3 hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Secondary Filter Toolbar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" aria-hidden="true" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari pemesan atau no. order..."
            className="pl-9 min-h-11 text-xs md:text-sm"
            aria-label="Cari transaksi"
          />
        </div>
        {isSuperAdmin && (
          <div className="w-full sm:w-56 shrink-0">
            <Select
              value={selectedVillageId}
              onChange={(e) => {
                setSelectedVillageId(e.target.value);
                setPage(1);
              }}
              className="min-h-11 text-xs md:text-sm"
              aria-label="Filter koperasi"
            >
              <option value="">Semua Koperasi</option>
              {(auth?.villages || []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.business_name || v.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Content List / Table */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          message={searchQuery || statusFilter !== 'all' ? 'Tidak ada transaksi yang cocok dengan filter.' : 'Belum ada transaksi.'}
          action={
            (searchQuery || statusFilter !== 'all') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setPage(1);
                }}
              >
                Reset Filter
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Tampilan Mobile & Tablet (<1024px): Kartu Rapi */}
          <div className="space-y-3 lg:hidden" aria-label="Daftar transaksi mobile">
            {orders.map((o) => {
              const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
              const isTerminal = o.status === 'completed' || o.status === 'cancelled';
              const showActions = !isSuperAdmin && !isTerminal;

              return (
                <div
                  key={o.id}
                  className="rounded-xl border border-border bg-surface p-4 space-y-3 shadow-xs hover:border-text-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-text">
                      {o.order_number}
                    </span>
                    <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-text text-sm">{o.customer_name}</span>
                      <DateText value={o.created_at} mode="longDateTime" className="text-text-3 text-[11px]" />
                    </div>
                    <div className="text-text-2">
                      <span>{o.delivery_method}</span> • <span>{o.payment_method}</span>
                    </div>
                    {isSuperAdmin && o.village_name && (
                      <div className="text-text-3 font-medium">
                        Koperasi: {o.village_name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between gap-2 border-t border-border pt-2.5">
                    <span className="text-xs text-text-3">
                      Total (<Num value={o.items_count} /> item)
                    </span>
                    <Money
                      value={o.total}
                      className="text-base font-bold text-primary-700 tabular-nums"
                    />
                  </div>

                  {!showActions ? (
                    <div className="pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenDetail(o)}
                        className="min-h-11 w-full flex items-center justify-center gap-1.5"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        <span>Detail Transaksi</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <div className="flex flex-1 gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenDetail(o)}
                          className="min-h-11 flex-1 flex items-center justify-center gap-1.5"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          <span>Detail</span>
                        </Button>
                        <Link to={`/admin/transaksi/${o.id}/edit`} className="min-h-11 flex-1">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="min-h-11 w-full flex items-center justify-center gap-1.5"
                            title="Edit transaksi"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            <span>Edit</span>
                          </Button>
                        </Link>
                        {o.status === 'pending' && (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusChange(o.id, 'processing')}
                            className="min-h-11 flex-1 font-semibold flex items-center justify-center gap-1.5"
                            disabled={isUpdatingStatus}
                          >
                            <span>Proses</span>
                          </Button>
                        )}
                        {o.status === 'processing' && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusChange(o.id, 'completed')}
                            className="min-h-11 flex-1 font-semibold border-ok-700/40 text-ok-700 hover:bg-ok-50 flex items-center justify-center gap-1.5"
                            disabled={isUpdatingStatus}
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                            <span>Selesai</span>
                          </Button>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStatusChange(o.id, 'cancelled')}
                        className="min-h-11 text-text-3 hover:text-primary-700 font-medium flex items-center justify-center gap-1"
                        disabled={isUpdatingStatus}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                        <span>Batalkan</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tampilan Desktop (>=1024px): Tabel Rapi */}
          <div className="hidden lg:block overflow-x-auto rounded-xl border border-border bg-surface" aria-label="Tabel transaksi desktop">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-3/60 text-text-3 font-semibold">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3">No. Transaksi</th>
                  <th className="py-3 px-3 whitespace-nowrap">Waktu</th>
                  <th className="py-3 px-3">Pemesan</th>
                  {isSuperAdmin && <th className="py-3 px-3">Koperasi</th>}
                  <th className="py-3 px-3">Pengiriman</th>
                  <th className="py-3 px-3">Pembayaran</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center w-64">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o, idx) => {
                  const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
                  const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                  const isTerminal = o.status === 'completed' || o.status === 'cancelled';
                  const showActions = !isSuperAdmin && !isTerminal;

                  return (
                    <tr key={o.id} className="hover:bg-surface-3/30 transition-colors">
                      <td className="py-3 px-3 text-center font-medium text-text-3 tabular-nums">
                        <Num value={rowNum} />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-text">
                        {o.order_number}
                      </td>
                      <td className="py-3 px-3 text-text-3 tabular-nums whitespace-nowrap">
                        <DateText value={o.created_at} mode="longDateTime" />
                      </td>
                      <td className="py-3 px-3 font-semibold text-text">
                        {o.customer_name}
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3 px-3 text-text-2">
                          {o.village_name || '-'}
                        </td>
                      )}
                      <td className="py-3 px-3 text-text-2">
                        {o.delivery_method}
                      </td>
                      <td className="py-3 px-3 text-text-2">
                        {o.payment_method}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-primary-700 tabular-nums whitespace-nowrap">
                        <Money value={o.total} />
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {!showActions ? (
                          <div className="flex items-center justify-center">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenDetail(o)}
                              className="min-h-8 text-xs inline-flex items-center gap-1.5"
                              title="Lihat rincian transaksi"
                            >
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Detail</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenDetail(o)}
                              className="min-h-8 text-xs inline-flex items-center gap-1"
                              title="Lihat rincian transaksi"
                            >
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Detail</span>
                            </Button>
                            <Link to={`/admin/transaksi/${o.id}/edit`}>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="min-h-8 text-xs inline-flex items-center gap-1"
                                title="Edit transaksi"
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Edit</span>
                              </Button>
                            </Link>
                            {o.status === 'pending' && (
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={() => handleStatusChange(o.id, 'processing')}
                                className="min-h-8 text-xs font-semibold px-2.5"
                                disabled={isUpdatingStatus}
                                title="Ubah status ke Sedang Diproses"
                              >
                                Proses
                              </Button>
                            )}
                            {o.status === 'processing' && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => handleStatusChange(o.id, 'completed')}
                                className="min-h-8 text-xs font-semibold px-2.5 border-ok-700/40 text-ok-700 hover:bg-ok-50 inline-flex items-center gap-1"
                                disabled={isUpdatingStatus}
                                title="Selesaikan pesanan"
                              >
                                <Check className="h-3 w-3" aria-hidden="true" />
                                <span>Selesai</span>
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStatusChange(o.id, 'cancelled')}
                              className="min-h-8 text-xs text-text-3 hover:text-primary-700 px-2"
                              disabled={isUpdatingStatus}
                              title="Batalkan pesanan"
                            >
                              Batalkan
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </>
      )}

      {/* Detail & Mutation Sheet */}
      <OrderDetailsSheet
        order={selectedOrder}
        open={isDetailOpen}
        onClose={handleCloseDetail}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteOrder}
        onEdit={(ord) => {
          handleCloseDetail();
          navigate(`/admin/transaksi/${ord.id}/edit`);
        }}
        isUpdating={isUpdatingStatus}
        isDeleting={isDeleting}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}

export default AdminOrdersPage;
