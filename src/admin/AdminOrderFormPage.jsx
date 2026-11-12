import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Check,
  Search,
  X,
  ScanBarcode,
  Package,
  CheckCircle2,
  ShoppingBag,
  ChevronUp,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Sheet,
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
import { BarcodeScannerModal } from './BarcodeScannerModal';

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
        product_id: it.product_id || it.productId || it.id || '',
        name: it.name || it.product_name || it.productName || '',
        qty: Math.max(1, Number(it.qty) || 1),
        price: Math.max(0, Number(it.price) || 0),
        unit: it.unit || 'pcs',
      }));
    }
    return [];
  });

  // Product picker states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [barcodeFeedback, setBarcodeFeedback] = useState(null);
  const feedbackTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  // Filtered products based on search query (name, category, barcode, description)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(q);
      const catMatch = (p.categories?.name || p.category_name || '').toLowerCase().includes(q);
      const barcodeMatch = p.barcode?.toLowerCase().includes(q);
      const descMatch = p.description?.toLowerCase().includes(q);
      return Boolean(nameMatch || catMatch || barcodeMatch || descMatch);
    });
  }, [products, searchQuery]);

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
                product_id: it.product_id || it.productId || it.id || '',
                name: it.name || it.product_name || it.productName || '',
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

  const triggerFeedback = (type, message) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setBarcodeFeedback({ type, message });
    feedbackTimeoutRef.current = setTimeout(() => {
      setBarcodeFeedback(null);
    }, 3500);
  };

  const handleQuickAddProduct = (prod, qtyToAdd = 1) => {
    if (!prod) return;
    const safeQty = Math.max(1, Number(qtyToAdd) || 1);

    setItems((prev) => {
      const existingIdx = prev.findIndex((it) => it.product_id === prod.id);
      if (existingIdx >= 0) {
        return prev.map((it, idx) =>
          idx === existingIdx ? { ...it, qty: it.qty + safeQty } : it
        );
      }
      return [
        ...prev,
        {
          product_id: prod.id,
          name: prod.name,
          qty: safeQty,
          price: Math.max(0, Number(prod.price) || 0),
          unit: prod.unit || 'pcs',
        },
      ];
    });

    setErrorMessage('');
    triggerFeedback('success', `${prod.name} ditambahkan (+${safeQty}).`);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;

      // 1. Exact barcode match
      let match = products.find((p) => p.barcode && p.barcode.toLowerCase() === q);
      // 2. Exact name match
      if (!match) {
        match = products.find((p) => p.name.toLowerCase() === q);
      }
      // 3. Exact single search result
      if (!match && filteredProducts.length === 1) {
        match = filteredProducts[0];
      }

      if (match) {
        handleQuickAddProduct(match, 1);
        setSearchQuery('');
        setIsSearchOpen(false);
      } else {
        triggerFeedback('error', `Produk "${searchQuery.trim()}" tidak ditemukan.`);
      }
    }
  };

  const handleBarcodeScanned = (matchedProduct) => {
    handleQuickAddProduct(matchedProduct, 1);
    setIsSearchOpen(false);
    triggerFeedback('success', `Barcode cocok: ${matchedProduct.name} ditambahkan.`);
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

  const handleScrollToCustomerData = () => {
    setIsCartSheetOpen(false);
    const customerSection = document.getElementById('order-customer-section');
    if (customerSection) {
      customerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const input = document.getElementById('order-customer-name');
      if (input) {
        input.focus({ preventScroll: true });
      }
    }
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
    <div
      className={`space-y-5 max-w-5xl mx-auto ${items.length > 0 ? 'pb-36 md:pb-24 lg:pb-0' : 'pb-16 lg:pb-0'}`}
      aria-label="Halaman Form Transaksi"
    >
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
          {/* Kolom Kiri: Input Cari Produk & Daftar Item Pesanan (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Box 1: Pencarian Cepat & Scan Barcode Produk (Search-to-Add) */}
            <div
              ref={searchContainerRef}
              className="relative rounded-xl border border-border bg-surface p-4 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-2">
                  Pilih Produk Koperasi
                </h2>
                <span className="text-xs text-text-3 tabular-nums">
                  <Num value={products.length} /> produk tersedia
                </span>
              </div>

              {loadingProducts ? (
                <div className="space-y-2">
                  <Skeleton className="h-11 w-full rounded-lg" />
                  <Skeleton className="h-9 w-48 rounded-lg" />
                </div>
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
                <div className="space-y-3">
                  {/* Search Bar + Barcode Scanner Trigger */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3"
                        aria-hidden="true"
                      />
                      <Input
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsSearchOpen(true);
                        }}
                        onFocus={() => setIsSearchOpen(true)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Cari nama, barcode, atau kategori... (tekan Enter)"
                        className="min-h-11 pl-9 pr-9 text-xs md:text-sm"
                        aria-label="Pilih produk dari katalog"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-text-3 hover:text-text"
                          aria-label="Bersihkan pencarian"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsBarcodeModalOpen(true)}
                      className="min-h-11 shrink-0 px-3 font-semibold flex items-center gap-1.5"
                      title="Pindai Barcode via Kamera"
                      aria-label="Pindai barcode via kamera"
                    >
                      <ScanBarcode className="h-4 w-4 text-primary-700" aria-hidden="true" />
                      <span className="hidden sm:inline">Scan Barcode</span>
                    </Button>
                  </div>

                  {/* Feedback Notification (Auto-dismiss) */}
                  {barcodeFeedback && (
                    <div
                      role={barcodeFeedback.type === 'error' ? 'alert' : 'status'}
                      className={`rounded-xl border p-2.5 text-xs font-semibold flex items-center justify-between ${
                        barcodeFeedback.type === 'error'
                          ? 'border-primary-700/20 bg-primary-50 text-primary-700'
                          : 'border-ok-700/20 bg-ok-50 text-ok-700'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {barcodeFeedback.type === 'error' ? (
                          <X className="h-4 w-4 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                        )}
                        <span>{barcodeFeedback.message}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setBarcodeFeedback(null)}
                        className="text-text-3 hover:text-text p-1"
                        aria-label="Tutup notifikasi"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Autocomplete / Quick Picker Suggestions Dropdown */}
                  {isSearchOpen && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-80 overflow-y-auto rounded-xl border border-border bg-surface shadow-xl divide-y divide-border"
                      role="listbox"
                      aria-label="Saran produk"
                    >
                      {filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-text-3">
                          Produk "{searchQuery}" tidak ditemukan.
                        </div>
                      ) : (
                        <>
                          <div className="bg-surface-3/70 px-3 py-1.5 text-[11px] font-semibold text-text-3 flex items-center justify-between">
                            <span>
                              {searchQuery
                                ? `Hasil Pencarian (${filteredProducts.length})`
                                : `Pilihan Cepat (${Math.min(filteredProducts.length, 6)})`}
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsSearchOpen(false)}
                              className="text-[11px] text-text-3 hover:text-text"
                            >
                              Tutup
                            </button>
                          </div>
                          {(searchQuery
                            ? filteredProducts.slice(0, 10)
                            : filteredProducts.slice(0, 6)
                          ).map((p) => {
                            const catName = p.categories?.name || p.category_name;
                            const isOutOfStock = p.stock_status === 'habis';
                            const alreadyInCart = items.find((it) => it.product_id === p.id);

                            return (
                              <div
                                key={p.id}
                                onClick={() => {
                                  handleQuickAddProduct(p, 1);
                                  setSearchQuery('');
                                  setIsSearchOpen(false);
                                }}
                                className={`p-3 flex items-center justify-between gap-3 hover:bg-surface-3 transition-colors cursor-pointer ${
                                  isOutOfStock ? 'opacity-60' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-3 flex items-center justify-center">
                                    {p.image_url ? (
                                      <img
                                        src={p.image_url}
                                        alt=""
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <Package className="h-4 w-4 text-text-3" aria-hidden="true" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs md:text-sm font-semibold text-text truncate">
                                        {p.name}
                                      </span>
                                      {p.stock_status === 'ready' && (
                                        <span className="rounded px-1.5 py-0.2 text-[10px] font-semibold bg-ok-50 text-ok-700">
                                          Tersedia
                                        </span>
                                      )}
                                      {p.stock_status === 'pre-order' && (
                                        <span className="rounded px-1.5 py-0.2 text-[10px] font-semibold bg-warn-50 text-warn-700">
                                          Pre-Order
                                        </span>
                                      )}
                                      {p.stock_status === 'habis' && (
                                        <span className="rounded px-1.5 py-0.2 text-[10px] font-semibold bg-mute-50 text-mute-700">
                                          Habis
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-text-3 mt-0.5">
                                      {catName && <span>{catName}</span>}
                                      {p.barcode && (
                                        <span className="font-mono tabular-nums text-[10px]">
                                          · {p.barcode}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-right">
                                    <Money
                                      value={p.price}
                                      className="text-xs font-bold text-text tabular-nums"
                                    />
                                    <span className="text-[10px] font-normal text-text-3 block">
                                      /{p.unit || 'pcs'}
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="min-h-8 px-2.5 text-xs font-semibold hover:border-primary-700 hover:text-primary-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickAddProduct(p, 1);
                                      setSearchQuery('');
                                      setIsSearchOpen(false);
                                    }}
                                    aria-label={`Tambah ${p.name}`}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>{alreadyInCart ? `+${alreadyInCart.qty}` : 'Tambah'}</span>
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Box 2: Daftar Item Pesanan (Satu-satunya daftar produk di halaman) */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-text-2">
                    Daftar Item ({items.length})
                  </h2>
                  <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700 tabular-nums">
                    <Num value={items.length} />
                  </span>
                </div>
                <span className="text-xs text-text-3 font-medium">
                  Total: <Money value={computedTotal} className="font-bold text-primary-700" />
                </span>
              </div>

              {items.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-3 border border-dashed border-border rounded-xl">
                  Belum ada item pesanan. Ketik nama produk atau scan barcode di atas untuk menambah produk.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {items.map((it, idx) => {
                    const subtotal = it.qty * it.price;
                    const prod = products.find((p) => p.id === it.product_id);
                    const displayName =
                      it.name ||
                      it.product_name ||
                      it.productName ||
                      prod?.name ||
                      'Produk';
                    const displayUnit =
                      it.unit ||
                      prod?.unit ||
                      'pcs';
                    const displayImage = prod?.image_url;

                    return (
                      <div
                        key={it.product_id || idx}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-3 flex items-center justify-center">
                            {displayImage ? (
                              <img
                                src={displayImage}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-text-3" aria-hidden="true" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs md:text-sm font-semibold text-text">
                              {displayName}
                            </p>
                            <p className="text-xs text-text-3 tabular-nums">
                              <Money value={it.price} /> /{displayUnit}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          {/* Stepper */}
                          <div className="flex items-center gap-1 border border-border rounded-lg bg-surface-3/30 p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(idx, Math.max(1, it.qty - 1))}
                              disabled={it.qty <= 1}
                              className="h-8 w-8 flex items-center justify-center rounded text-text-2 hover:bg-surface disabled:opacity-30 disabled:pointer-events-none"
                              aria-label={`Kurangi qty ${displayName}`}
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
                              aria-label={`Tambah qty ${displayName}`}
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
                            aria-label={`Hapus ${displayName}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
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
            <div id="order-customer-section" className="rounded-xl border border-border bg-surface p-4 space-y-4 shadow-xs">
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

      {/* Floating Sticky Bottom Bar di Layar Mobile (< lg), ditempatkan di atas bottom nav admin (bottom-14 di mobile, bottom-0 di tablet) */}
      {items.length > 0 && (
        <aside
          aria-label="Ringkasan belanja mengambang"
          className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 border-t border-border bg-surface p-3 shadow-lg lg:hidden"
        >
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => setIsCartSheetOpen(true)}
              className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity"
              aria-label="Buka rincian item pesanan"
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-700 px-1 text-[10px] font-bold text-white tabular-nums">
                  <Num value={items.length} />
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-text-3">
                  Total (<Num value={items.length} /> item)
                </p>
                <Money
                  value={computedTotal}
                  className="text-sm font-bold text-primary-700 tabular-nums block truncate"
                />
              </div>
              <ChevronUp className="h-4 w-4 text-text-3 shrink-0" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsCartSheetOpen(true)}
                className="min-h-11 px-3 text-xs font-semibold"
              >
                Lihat Item
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleScrollToCustomerData}
                className="min-h-11 px-3.5 text-xs font-semibold flex items-center gap-1"
              >
                <span>Isi Data</span>
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* Mobile Bottom Sheet untuk Daftar Item Pesanan */}
      <Sheet
        open={isCartSheetOpen}
        onClose={() => setIsCartSheetOpen(false)}
        title={`Rincian Pesanan (${items.length} item)`}
        footer={
          <div className="space-y-2.5 w-full">
            <div className="flex items-center justify-between text-xs font-semibold text-text border-t border-border pt-2.5">
              <span>Total Pembayaran</span>
              <Money
                value={computedTotal}
                className="text-base font-bold text-primary-700 tabular-nums"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsCartSheetOpen(false)}
                className="min-h-11 flex-1 text-xs font-semibold"
              >
                Tambah Produk Lain
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleScrollToCustomerData}
                className="min-h-11 flex-1 text-xs font-semibold"
              >
                Lanjut Isi Data
              </Button>
            </div>
          </div>
        }
      >
        <div className="divide-y divide-border">
          {items.map((it, idx) => {
            const subtotal = it.qty * it.price;
            const displayName =
              it.name ||
              it.product_name ||
              it.productName ||
              products.find((p) => p.id === it.product_id)?.name ||
              'Produk';
            const displayUnit =
              it.unit ||
              products.find((p) => p.id === it.product_id)?.unit ||
              'pcs';

            return (
              <div
                key={it.product_id || idx}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-semibold text-text truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-text-3 tabular-nums">
                    <Money value={it.price} /> /{displayUnit}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Stepper */}
                  <div className="flex items-center gap-1 border border-border rounded-lg bg-surface-3/30 p-0.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateItemQty(idx, Math.max(1, it.qty - 1))}
                      disabled={it.qty <= 1}
                      className="h-9 w-9 flex items-center justify-center rounded text-text-2 hover:bg-surface disabled:opacity-30 disabled:pointer-events-none"
                      aria-label={`Kurangi qty ${displayName}`}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold tabular-nums text-text">
                      <Num value={it.qty} />
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateItemQty(idx, it.qty + 1)}
                      className="h-9 w-9 flex items-center justify-center rounded text-text-2 hover:bg-surface"
                      aria-label={`Tambah qty ${displayName}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="w-20 text-right">
                    <Money
                      value={subtotal}
                      className="text-xs font-bold text-text tabular-nums"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="h-9 w-9 inline-flex items-center justify-center rounded text-text-3 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                    title="Hapus produk"
                    aria-label={`Hapus ${displayName}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Sheet>

      {/* Barcode Scanner Modal via Kamera / Input Manual */}
      <BarcodeScannerModal
        open={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        onScan={handleBarcodeScanned}
        products={products}
      />
    </div>
  );
}

export default AdminOrderFormPage;
