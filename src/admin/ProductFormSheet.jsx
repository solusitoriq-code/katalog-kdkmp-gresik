import { useState, useId, useEffect, useMemo } from 'react';
import { Camera, Trash2, Star, Package, ScanBarcode } from 'lucide-react';
import { Button, Input, Select, Sheet, Num } from '../components/ui';
import {
  PRODUCT_UNITS,
  PRODUCT_STOCK_OPTIONS,
  getAdminProductUnits,
  uploadProductImage,
  deleteProductImage,
  createAdminProduct,
  updateAdminProduct,
} from '../lib/api';
import { formatDigitsInput, parseFormattedInt } from '../lib/format';
import { driveImageUrl } from '../lib/image';
import { BarcodeScannerModal } from './BarcodeScannerModal';

const STANDARD_UNITS = PRODUCT_UNITS.filter((u) => u !== 'lainnya');

function getInitialUnitState(unit) {
  const clean = String(unit ?? 'pcs').trim();
  if (!clean) {
    return { unitSelect: 'pcs', customUnit: '' };
  }
  if (STANDARD_UNITS.includes(clean)) {
    return { unitSelect: clean, customUnit: '' };
  }
  if (clean === 'lainnya') {
    return { unitSelect: 'lainnya', customUnit: '' };
  }
  return { unitSelect: 'lainnya', customUnit: clean };
}

export function ProductFormSheet({
  open,
  onClose,
  initialProduct = null,
  categories = [],
  units = null,
  villageId,
  isDemo = false,
  actorUserId,
  onSaved,
}) {
  const isEdit = Boolean(initialProduct?.id);
  const descId = useId();
  const fileInputId = useId();

  const [availableUnits, setAvailableUnits] = useState(() => units || []);

  useEffect(() => {
    if (units && units.length > 0) {
      setAvailableUnits(units);
      return;
    }
    let active = true;
    getAdminProductUnits({ isDemo, actorUserId })
      .then((data) => {
        if (active && data && data.length > 0) {
          setAvailableUnits(data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [units, isDemo, actorUserId]);

  const unitNames = useMemo(() => {
    const list = availableUnits.map((u) => u.name || u);
    if (list.length === 0) return PRODUCT_UNITS;
    return list.includes('lainnya') ? list : [...list, 'lainnya'];
  }, [availableUnits]);

  const initUnit = getInitialUnitState(initialProduct?.unit);

  const [name, setName] = useState(() => initialProduct?.name ?? '');
  const [barcode, setBarcode] = useState(() => initialProduct?.barcode ?? '');
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(
    () => initialProduct?.category_id ?? ''
  );
  const [priceInput, setPriceInput] = useState(() =>
    initialProduct?.price !== undefined && initialProduct?.price !== null
      ? formatDigitsInput(initialProduct.price)
      : ''
  );
  const [originalPriceInput, setOriginalPriceInput] = useState(() =>
    initialProduct?.original_price
      ? formatDigitsInput(initialProduct.original_price)
      : ''
  );
  const [unitSelect, setUnitSelect] = useState(() => initUnit.unitSelect);
  const [customUnit, setCustomUnit] = useState(() => initUnit.customUnit);
  const [stockStatus, setStockStatus] = useState(
    () => initialProduct?.stock_status ?? 'ready'
  );
  const [isFeatured, setIsFeatured] = useState(() =>
    Boolean(initialProduct?.is_featured)
  );
  const [description, setDescription] = useState(
    () => initialProduct?.description ?? ''
  );
  const [imageUrl, setImageUrl] = useState(
    () => initialProduct?.image_url ?? ''
  );
  const [externalUrlInput, setExternalUrlInput] = useState(() => {
    const raw = String(initialProduct?.image_url ?? '').trim();
    if (!raw || raw.includes('#storage=') || raw.includes('/product-images/')) {
      return '';
    }
    return raw;
  });
  const [sessionUploadedUrl, setSessionUploadedUrl] = useState(null);
  const [compressionMeta, setCompressionMeta] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const categoryOptions = [
    { value: '', label: 'Tanpa Kategori' },
    ...categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })),
  ];

  const unitOptions = useMemo(
    () => unitNames.map((u) => ({ value: u, label: u })),
    [unitNames]
  );

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFormError('');
    setErrors((prev) => ({ ...prev, image_url: '' }));
    setIsUploading(true);

    try {
      const result = await uploadProductImage(
        {
          villageId,
          file,
          previousImageUrl: sessionUploadedUrl,
        },
        { isDemo, actorUserId }
      );

      setSessionUploadedUrl(result.publicUrl);
      setImageUrl(result.publicUrl);
      setExternalUrlInput('');
      setCompressionMeta({
        width: result.width,
        height: result.height,
        originalSizeKb: Math.max(1, Math.round(result.originalSize / 1024)),
        compressedSizeKb: Math.max(1, Math.round(result.compressedSize / 1024)),
        compressedBytes: result.compressedSize,
      });
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        image_url: err?.message || 'Gagal mengunggah foto produk.',
      }));
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleExternalUrlChange = async (event) => {
    const raw = event.target.value;
    setExternalUrlInput(raw);
    setErrors((prev) => ({ ...prev, image_url: '' }));

    if (sessionUploadedUrl) {
      const toDelete = sessionUploadedUrl;
      setSessionUploadedUrl(null);
      setCompressionMeta(null);
      await deleteProductImage(toDelete, {
        villageId,
        isDemo,
        actorUserId,
      }).catch(() => {});
    }

    const transformed = driveImageUrl(raw);
    setImageUrl(transformed);
  };

  const handleRemovePhoto = async () => {
    setErrors((prev) => ({ ...prev, image_url: '' }));
    if (sessionUploadedUrl) {
      const toDelete = sessionUploadedUrl;
      setSessionUploadedUrl(null);
      await deleteProductImage(toDelete, {
        villageId,
        isDemo,
        actorUserId,
      }).catch(() => {});
    }
    setCompressionMeta(null);
    setExternalUrlInput('');
    setImageUrl('');
  };

  const handleCancel = async () => {
    if (sessionUploadedUrl) {
      await deleteProductImage(sessionUploadedUrl, {
        villageId,
        isDemo,
        actorUserId,
      }).catch(() => {});
    }
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const nextErrors = {};
    const cleanName = name.trim();
    if (!cleanName) {
      nextErrors.name = 'Nama produk wajib diisi.';
    } else if (cleanName.length > 150) {
      nextErrors.name = 'Nama produk maksimal 150 karakter.';
    }

    const parsedPrice = parseFormattedInt(priceInput);
    if (parsedPrice === null || parsedPrice < 0) {
      nextErrors.price = 'Harga wajib diisi.';
    }

    const parsedOrig = parseFormattedInt(originalPriceInput);
    if (
      parsedOrig !== null &&
      parsedPrice !== null &&
      parsedOrig <= parsedPrice
    ) {
      nextErrors.original_price =
        'Harga coret harus lebih besar dari harga jual.';
    }

    const resolvedUnit =
      unitSelect === 'lainnya'
        ? customUnit.trim() || 'lainnya'
        : unitSelect.trim() || 'pcs';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        village_id: villageId,
        name: cleanName,
        barcode: barcode.trim() || null,
        category_id: categoryId || null,
        price: parsedPrice,
        original_price: parsedOrig,
        unit: resolvedUnit,
        stock_status: stockStatus,
        is_featured: isFeatured,
        description: description.trim() || null,
        image_url: imageUrl.trim() ? driveImageUrl(imageUrl.trim()) : null,
      };

      let saved;
      if (isEdit) {
        saved = await updateAdminProduct(initialProduct.id, payload, {
          villageId,
          isDemo,
          actorUserId,
        });
      } else {
        saved = await createAdminProduct(payload, {
          isDemo,
          actorUserId,
        });
      }

      setSessionUploadedUrl(null);
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      setFormError(err?.message || 'Gagal menyimpan produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewUrl = imageUrl ? driveImageUrl(imageUrl) : '';

  return (
    <>
      <Sheet
      open={open}
      onClose={handleCancel}
      title={isEdit ? 'Ubah Produk' : 'Tambah Produk'}
      dialogOnLg
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSubmitting || isUploading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="admin-product-form"
            variant="primary"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
          </Button>
        </div>
      }
    >
      <form
        id="admin-product-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4"
      >
        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-primary-700 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700"
          >
            {formError}
          </div>
        )}

        <Input
          label="Nama Produk"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
          }}
          error={errors.name}
          placeholder="Contoh: Beras Pandan Wangi 5kg"
          required
        />

        <Select
          label="Kategori"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={categoryOptions}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="product-form-barcode"
            className="text-xs font-semibold text-text"
          >
            Barcode / Kode Produk (Opsional)
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="product-form-barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Contoh: 899100100001"
              className="min-h-11 flex-1 font-mono tabular-nums text-xs md:text-sm"
              aria-label="Barcode / Kode Produk (Opsional)"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsBarcodeScannerOpen(true)}
              className="min-h-11 shrink-0 px-3 font-semibold flex items-center gap-1.5"
              title="Pindai Barcode via Kamera"
              aria-label="Pindai barcode via kamera"
            >
              <ScanBarcode className="h-4 w-4 text-primary-700" aria-hidden="true" />
              <span>Scan Barcode</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            label="Harga (Rp)"
            type="text"
            inputMode="numeric"
            value={priceInput}
            onChange={(e) => {
              setPriceInput(formatDigitsInput(e.target.value));
              if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
            }}
            error={errors.price}
            placeholder="0"
            className="tabular-nums text-right"
            required
          />

          <Input
            label="Harga Coret (Rp)"
            type="text"
            inputMode="numeric"
            value={originalPriceInput}
            onChange={(e) => {
              setOriginalPriceInput(formatDigitsInput(e.target.value));
              if (errors.original_price) {
                setErrors((prev) => ({ ...prev, original_price: '' }));
              }
            }}
            error={errors.original_price}
            placeholder="Opsional"
            className="tabular-nums text-right"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Select
            label="Satuan"
            value={unitSelect}
            onChange={(e) => setUnitSelect(e.target.value)}
            options={unitOptions}
            error={errors.unit}
          />

          <Select
            label="Stok"
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value)}
            options={PRODUCT_STOCK_OPTIONS}
          />
        </div>

        {unitSelect === 'lainnya' && (
          <Input
            label="Satuan Lainnya"
            value={customUnit}
            onChange={(e) => setCustomUnit(e.target.value)}
            placeholder="Contoh: bungkus, pouch, kotak"
          />
        )}

        <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-text">
            <Star className="h-4 w-4 text-primary-700" aria-hidden="true" />
            Produk Unggulan
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isFeatured}
            aria-label="Produk Unggulan"
            onClick={() => setIsFeatured((prev) => !prev)}
            className={`inline-flex min-h-11 min-w-16 items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              isFeatured
                ? 'border-primary-700 bg-primary-700 text-white'
                : 'border-border bg-surface-3 text-text-2'
            }`}
          >
            {isFeatured ? 'Aktif' : 'Nonaktif'}
          </button>
        </div>

        <div>
          <label
            htmlFor={descId}
            className="mb-1.5 block text-sm font-medium text-text"
          >
            Deskripsi
          </label>
          <textarea
            id={descId}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi singkat produk"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-3 outline-none transition focus:border-primary-700 focus:ring-1 focus:ring-primary-700"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-surface p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-text">Foto Produk</span>
            <div className="flex items-center gap-2">
              <label
                htmlFor={fileInputId}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text transition-colors hover:bg-surface-3 cursor-pointer"
              >
                <Camera className="h-4 w-4 text-primary-700" aria-hidden="true" />
                {isUploading ? 'Mengompres...' : 'Ambil / Pilih Foto'}
              </label>
              <input
                id={fileInputId}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                disabled={isUploading || isSubmitting}
                className="sr-only"
              />
              {previewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePhoto}
                  aria-label="Hapus Foto"
                >
                  <Trash2 className="h-4 w-4 text-primary-700" aria-hidden="true" />
                  Hapus Foto
                </Button>
              )}
            </div>
          </div>

          {previewUrl ? (
            <div className="flex items-center gap-3">
              <img
                src={previewUrl.split('#')[0]}
                alt={name || 'Pratinjau foto produk'}
                width="120"
                height="90"
                className="aspect-[4/3] h-20 w-28 shrink-0 rounded-lg border border-border bg-surface object-contain"
              />
              {compressionMeta && (
                <div className="text-xs text-text-2">
                  <div>
                    WebP · <Num value={compressionMeta.width} />×
                    <Num value={compressionMeta.height} /> px
                  </div>
                  <div>
                    Ukuran: <Num value={compressionMeta.compressedSizeKb} /> KB
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-20 items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-3 text-xs text-text-3">
              <Package className="h-4 w-4" aria-hidden="true" />
              <span>Belum ada foto</span>
            </div>
          )}

          <Input
            label="URL Foto (Alternatif)"
            type="url"
            value={externalUrlInput}
            onChange={handleExternalUrlChange}
            error={errors.image_url}
            placeholder="https://drive.google.com/file/d/..."
          />
        </div>
      </form>
    </Sheet>
    <BarcodeScannerModal
      open={isBarcodeScannerOpen}
      onClose={() => setIsBarcodeScannerOpen(false)}
      onScan={(scannedCode) => {
        setBarcode(scannedCode);
      }}
      mode="raw"
      title="Pindai Barcode Produk"
    />
  </>
);
}

export default ProductFormSheet;

