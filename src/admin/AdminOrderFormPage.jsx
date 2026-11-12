import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Check,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Money,
  Num,
  Skeleton,
  EmptyState,
} from '../components/ui';
import {
  createOrder,
  updateAdminOrder,
  getAdminOrderById,
  getAdminProducts,
} from '../lib/api';
import { useAuth } from './AuthContext';

export function AdminOrderFormPage({
  mode = 'create',
  initialOrder = null,
  order: propOrder = null,
  initialProducts = null,
  products: propProducts = null,
  defaultVillageId = '',
  onSave = null,
  onClose = null,
}) {
  const navigate = useNavigate();
  const params = useParams();

  const effectiveInitialOrder = propOrder || initialOrder;
  const orderId = params?.orderId || effectiveInitialOrder?.id;
  const isEditing = mode === 'edit' || Boolean(orderId);

  let auth = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    auth = useAuth();
  } catch {
    // fallback when rendered outside AuthProvider
  }

  const role = auth?.role || 'village_admin';
  const isSuperAdmin = role === 'super_admin';
  const activeVillageId =
    defaultVillageId ||
    auth?.activeVillageId ||
    auth?.admin?.village_id ||
    auth?.activeVillage?.id ||
    effectiveInitialOrder?.village_id;
  const villageId = activeVillageId;
  const session = auth?.session;
  const isDemo = Boolean(session?.is_demo);

  const [order, setOrder] = useState(effectiveInitialOrder);
  const [loadingOrder, setLoadingOrder] = useState(() => isEditing && !effectiveInitialOrder);
  const [orderError, setOrderError] = useState('');

  const [products, setProducts] = useState(() => propProducts ?? initialProducts ?? []);
  const [loadingProducts, setLoadingProducts] = useState(
    () => propProducts === null && initialProducts === null && Boolean(villageId)
  );

  // Form states
  const [customerName, setCustomerName] = useState(() => effectiveInitialOrder?.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState(() => effectiveInitialOrder?.customer_phone || '');
  const [deliveryMethod, setDeliveryMethod] = useState(() => effectiveInitialOrder?.delivery_method || 'Diantar');
  const [customerAddress, setCustomerAddress] = useState(() => effectiveInitialOrder?.customer_address || '');
  const [paymentMethod, setPaymentMethod] = useState(() => effectiveInitialOrder?.payment_method || 'COD');
  const [note, setNote] = useState(() => effectiveInitialOrder?.note || '');
  const [items, setItems] = useState(() => {
    if (effectiveInitialOrder?.items && Array.isArray(effectiveInitialOrder.items)) {
      return effectiveInitialOrder.items.map((it) => ({
        product_id: it.product_id || '',
        name: it.name || '',
        qty: Math.max(1, Number(it.qty) || 1),
        price: Math.max(0, Number(it.price) || 0),
        unit: it.unit || 'pcs',
      }));
    }
    return [];
  });

  // Product picker states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [pickerQty, setPickerQty] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch Order if in edit mode
  useEffect(() => {
    if (!isEditing || effectiveInitialOrder !== null || !orderId) return;
    let active = true;

    getAdminOrderById(orderId, { isDemo, isSuperAdmin: false, villageId })
      .then((data) => {
        if (!active) return;
        if (!data) {
          setOrderError('Transaksi tidak ditemukan atau Anda tidak memiliki akses.');
          setLoadingOrder(false);
          return;
        }

        if (data.status === 'completed' || data.status === 'cancelled') {
          setOrderError('Transaksi dengan status Selesai atau Dibatalkan tidak dapat diedit.');
          setLoadingOrder(false);
          return;
        }

        setOrder(data);
        setCustomerName(data.customer_name || '');
        setCustomerPhone(data.customer_phone || '');
        setDeliveryMethod(data.delivery_method || 'Diantar');
        setCustomerAddress(data.customer_address || '');
        setPaymentMethod(data.payment_method || 'COD');
        setNote(data.note || '');
        setItems(
          Array.isArray(data.items)
            ? data.items.map((it) => ({
                product_id: it.product_id || '',
                name: it.name || '',
                qty: Math.max(1, Number(it.qty) || 1),
                price: Math.max(0, Number(it.price) || 0),
                unit: it.unit || 'pcs',
              }))
            : []
        );
        setLoadingOrder(false);
      })
      .catch((err) => {
        if (!active) return;
        setOrderError(err.message || 'Gagal memuat data transaksi.');
        setLoadingOrder(false);
      });

    return () => {
      active = false;
    };
  }, [isEditing, orderId, effectiveInitialOrder, isDemo, villageId]);

  // 2. Fetch Village Products
  useEffect(() => {
    if (propProducts !== null || initialProducts !== null || !villageId) return;
    let active = true;

    getAdminProducts(villageId, { isDemo, isSuperAdmin: false })
      .then((prods) => {
        if (!active) return;
        setProducts(prods || []);
        setLoadingProducts(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, [villageId, isDemo, initialProducts, propProducts]);

  // Block Super Admin from accessing this page
  if (isSuperAdmin) {
    return (
      <div className="space-y-4 py-8 text-center">
        <EmptyState
          message="Super Admin hanya dapat melihat daftar dan rincian transaksi."
          action={
            <Link to="/admin/transaksi">
              <Button variant="secondary" size="sm">
                Kembali ke Daftar Transaksi
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Handle Add Product from Cooperative catalog
  const handleAddProductFromCatalog = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const qtyToAdd = Math.max(1, Number(pickerQty) || 1);

    setItems((prev) => {
      const existingIdx = prev.findIndex((it) => it.product_id === prod.id);
      if (existingIdx >= 0) {
        return prev.map((it, idx) =>
          idx === existingIdx ? { ...it, qty: it.qty + qtyToAdd } : it
        );
      }
      return [
        ...prev,
        {
          product_id: prod.id,
          name: prod.name,
          qty: qtyToAdd,
          price: Math.max(0, Number(prod.price) || 0),
          unit: prod.unit || 'pcs',
        },
      ];
    });

    setSelectedProductId('');
    setPickerQty(1);
    setErrorMessage('');
  };

  const handleUpdateItemQty = (index, newQty) => {
    const safeQty = Math.max(1, Number(newQty) || 1);
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, qty: safeQty } : it))
    );
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const computedTotal = items.reduce((sum, it) => sum + it.qty * it.price, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Nama pemesan wajib diisi.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Pilih minimal 1 produk dari katalog koperasi untuk transaksi ini.');
      return;
    }

    if (!villageId) {
      setErrorMessage('Koperasi desa tidak ditemukan.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSave) {
        await onSave({
          villageId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: deliveryMethod === 'Diantar' ? customerAddress.trim() : '',
          deliveryMethod,
          paymentMethod,
          note: note.trim(),
          items,
          itemsCount: items.length,
          total: computedTotal,
        });
      } else if (isEditing && orderId) {
        await updateAdminOrder(
          orderId,
          {
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            customer_address: deliveryMethod === 'Diantar' ? customerAddress.trim() : '',
            delivery_method: deliveryMethod,
            payment_method: paymentMethod,
            note: note.trim(),
            items,
            items_count: items.length,
            total: computedTotal,
          },
          { isDemo, isSuperAdmin: false, villageId }
        );
      } else {
        await createOrder(
          {
            villageId,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerAddress: deliveryMethod === 'Diantar' ? customerAddress.trim() : '',
            deliveryMethod,
            paymentMethod,
            items,
            itemsCount: items.length,
            total: computedTotal,
            note: note.trim(),
            status: 'pending',
          },
          { isDemo }
        );
      }

      if (onClose) {
        onClose();
      } else {
        navigate('/admin/transaksi', { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menyimpan transaksi.');
      setIsSubmitting(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    );
  }

  if (orderError) {
    return (
      <div className="space-y-4 py-8 text-center max-w-lg mx-auto">
        <EmptyState
          message={orderError}
          action={
            <Link to="/admin/transaksi">
              <Button variant="secondary" size="sm">
                Kembali ke Transaksi
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const currentOrderNumber = order?.order_number || effectiveInitialOrder?.order_number;

  return (
    <div className="space-y-5 max-w-5xl mx-auto" aria-label="Halaman Form Transaksi">
      {/* Top Bar Navigation */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/transaksi"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-text hover:bg-surface-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Kembali</span>
          </Link>
          <h1 className="text-lg font-bold text-text md:text-xl">
            {isEditing
              ? currentOrderNumber
                ? `Edit Transaksi #${currentOrderNumber}`
                : 'Edit Transaksi'
              : 'Tambah Transaksi'}
          </h1>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-primary-700/20 bg-primary-50 p-3.5 text-xs font-semibold text-primary-700"
        >
          {errorMessage}
        </div>
      )}

      <form id="order-form-page" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Produk Koperasi & Rincian Item (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Box 1: Tambah Produk dari Koperasi */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-2">
                Pilih Produk Koperasi
              </h2>

              {loadingProducts ? (
                <Skeleton className="h-11 w-full rounded-lg" />
              ) : products.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center space-y-2">
                  <p className="text-xs text-text-3">
                    Koperasi belum memiliki produk di katalog.
                  </p>
                  <Link to="/admin/produk">
                    <Button variant="secondary" size="sm">
                      Tambah Produk Koperasi
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="min-h-11 w-full text-xs md:text-sm"
                      aria-label="Pilih produk dari katalog"
                    >
                      <option value="">-- Pilih Produk dari Koperasi --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — Rp {p.price?.toLocaleString('id-ID')} /{p.unit || 'pcs'}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20">
                      <Input
                        type="number"
                        min="1"
                        value={pickerQty}
                        onChange={(e) => setPickerQty(Math.max(1, Number(e.target.value) || 1))}
                        className="min-h-11 text-xs tabular-nums text-center"
                        aria-label="Jumlah produk"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleAddProductFromCatalog}
                      disabled={!selectedProductId}
                      className="min-h-11 shrink-0 font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      <span>Tambah</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Box 2: Rincian Produk dalam Pesanan */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-2">
                  Daftar Item ({items.length})
                </h2>
                <span className="text-xs text-text-3 font-medium">
                  Total: <Money value={computedTotal} className="font-bold text-primary-700" />
                </span>
              </div>

              {items.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-3">
                  Belum ada produk yang ditambahkan ke transaksi.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {items.map((it, idx) => {
                    const subtotal = it.qty * it.price;
                    return (
                      <div
                        key={it.product_id || idx}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs md:text-sm font-semibold text-text">
                            {it.name}
                          </p>
                          <p className="text-xs text-text-3 tabular-nums">
                            <Money value={it.price} /> /{it.unit || 'pcs'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          {/* Qty Stepper */}
                          <div className="flex items-center gap-1 border border-border rounded-lg bg-surface-3/30 p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(idx, Math.max(1, it.qty - 1))}
                              disabled={it.qty <= 1}
                              className="h-8 w-8 flex items-center justify-center rounded text-text-2 hover:bg-surface disabled:opacity-30 disabled:pointer-events-none"
                              aria-label="Kurangi qty"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold tabular-nums text-text">
                              <Num value={it.qty} />
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(idx, it.qty + 1)}
                              className="h-8 w-8 flex items-center justify-center rounded text-text-2 hover:bg-surface"
                              aria-label="Tambah qty"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Subtotal */}
                          <div className="w-24 text-right">
                            <Money
                              value={subtotal}
                              className="text-xs md:text-sm font-bold text-text tabular-nums"
                            />
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded text-text-3 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                            title="Hapus produk"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">Hapus</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total Summary */}
              {items.length > 0 && (
                <div className="rounded-xl border border-border bg-surface-3/60 p-3.5 flex items-center justify-between">
                  <span className="text-xs md:text-sm font-bold text-text">
                    Total Pembayaran
                  </span>
                  <Money
                    value={computedTotal}
                    className="text-base md:text-lg font-bold text-primary-700 tabular-nums"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Data Pemesan & Pengiriman (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-border bg-surface p-4 space-y-4 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-2 border-b border-border pb-2.5">
                Data Pemesan & Pengiriman
              </h2>

              <div className="space-y-1.5">
                <label htmlFor="order-customer-name" className="text-xs font-semibold text-text">
                  Nama Pemesan <span className="text-primary-700">*</span>
                </label>
                <Input
                  id="order-customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Ibu Siti Aminah"
                  className="min-h-11 text-xs md:text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="order-customer-phone" className="text-xs font-semibold text-text">
                  No. WhatsApp
                </label>
                <Input
                  id="order-customer-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="min-h-11 text-xs md:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="order-delivery-method" className="text-xs font-semibold text-text">
                    Pengiriman
                  </label>
                  <Select
                    id="order-delivery-method"
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="min-h-11 w-full text-xs md:text-sm"
                  >
                    <option value="Diantar">Diantar</option>
                    <option value="Ambil Sendiri">Ambil Sendiri</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="order-payment-method" className="text-xs font-semibold text-text">
                    Pembayaran
                  </label>
                  <Select
                    id="order-payment-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="min-h-11 w-full text-xs md:text-sm"
                  >
                    <option value="COD">COD (Bayar di Tempat)</option>
                    <option value="Tunai">Tunai</option>
                    <option value="Transfer-QRIS">Transfer / QRIS</option>
                  </Select>
                </div>
              </div>

              {deliveryMethod === 'Diantar' && (
                <div className="space-y-1.5">
                  <label htmlFor="order-customer-address" className="text-xs font-semibold text-text">
                    Alamat Pengiriman
                  </label>
                  <textarea
                    id="order-customer-address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="RT / RW, nomor rumah, patokan..."
                    rows={2}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs md:text-sm text-text focus:border-primary-700 focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="order-note" className="text-xs font-semibold text-text">
                  Catatan Tambahan
                </label>
                <Input
                  id="order-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Catatan pesanan (opsional)"
                  className="min-h-11 text-xs md:text-sm"
                />
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-border pt-4 flex items-center justify-end gap-2.5">
                {onClose ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={onClose}
                    className="min-h-11"
                  >
                    Batal
                  </Button>
                ) : (
                  <Link to="/admin/transaksi">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      className="min-h-11"
                    >
                      Batal
                    </Button>
                  </Link>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting || items.length === 0}
                  className="min-h-11 font-semibold flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {isSubmitting
                      ? 'Menyimpan...'
                      : isEditing
                      ? 'Simpan Perubahan'
                      : 'Simpan Transaksi'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminOrderFormPage;
