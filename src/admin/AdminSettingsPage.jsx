import { useState, useEffect, useMemo, useCallback, useId } from 'react';
import QRCode from 'qrcode';
import {
  Camera,
  Trash2,
  Copy,
  Check,
  Download,
  ExternalLink,
} from 'lucide-react';
import {
  Button,
  EmptyState,
  Input,
  Num,
  Skeleton,
} from '../components/ui';
import { StoreHeader } from '../features/catalog/StoreHeader';
import {
  getAdminVillageSettings,
  updateAdminVillageSettings,
  uploadVillageLogo,
  deleteProductImage,
} from '../lib/api';
import { formatDigitsInput, parseFormattedInt } from '../lib/format';
import { driveImageUrl } from '../lib/image';
import { useAuth } from './AuthContext';

// eslint-disable-next-line react-refresh/only-export-components
export function buildVillageCatalogUrl(village, customOrigin) {
  if (!village?.subdistrict_slug || !village?.slug) return '';
  const base =
    customOrigin ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://katalog-kdkmp-gresik.pages.dev');
  return `${base.replace(/\/+$/, '')}/${village.subdistrict_slug}/${village.slug}`;
}

// eslint-disable-next-line react-refresh/only-export-components
export async function generateCatalogQrDataUrl(url) {
  const cleanUrl = String(url ?? '').trim();
  if (!cleanUrl) return '';
  return QRCode.toDataURL(cleanUrl, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
}

function extractLocalPhone(rawPhone) {
  if (!rawPhone) return '';
  let digits = String(rawPhone).replace(/\D/g, '');
  if (digits.startsWith('62')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

function VillageSettingsEditor({
  village,
  isDemo,
  actorUserId,
  initialQrDataUrl = '',
  onSaved,
}) {
  const addressId = useId();
  const deliveryNoteId = useId();
  const logoInputId = useId();

  const [businessName, setBusinessName] = useState(
    () => village?.business_name ?? ''
  );
  const [whatsappInput, setWhatsappInput] = useState(
    () => extractLocalPhone(village?.whatsapp_number)
  );
  const [address, setAddress] = useState(() => village?.address ?? '');
  const [gmapsUrl, setGmapsUrl] = useState(() => village?.gmaps_url ?? '');
  const [logoUrl, setLogoUrl] = useState(() => village?.logo_url ?? '');
  const [externalLogoInput, setExternalLogoInput] = useState(() => {
    const raw = String(village?.logo_url ?? '').trim();
    if (!raw || raw.includes('#storage=') || raw.includes('/product-images/')) {
      return '';
    }
    return raw;
  });
  const [openingHour, setOpeningHour] = useState(() =>
    String(village?.opening_hour ?? '07:00').slice(0, 5)
  );
  const [closingHour, setClosingHour] = useState(() =>
    String(village?.closing_hour ?? '20:00').slice(0, 5)
  );
  const [freeDeliveryMinInput, setFreeDeliveryMinInput] = useState(() =>
    village?.free_delivery_min !== undefined &&
    village?.free_delivery_min !== null
      ? formatDigitsInput(village.free_delivery_min)
      : '0'
  );
  const [deliveryNote, setDeliveryNote] = useState(
    () => village?.delivery_note ?? ''
  );

  const [sessionUploadedLogoUrl, setSessionUploadedLogoUrl] = useState(null);
  const [compressionMeta, setCompressionMeta] = useState(null);
  const [failedLogoPreviewUrl, setFailedLogoPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(() => initialQrDataUrl || '');

  const catalogUrl = useMemo(
    () => buildVillageCatalogUrl(village),
    [village]
  );

  useEffect(() => {
    if (initialQrDataUrl || !catalogUrl) return undefined;
    let active = true;

    generateCatalogQrDataUrl(catalogUrl)
      .then((dataUrl) => {
        if (active) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [catalogUrl, initialQrDataUrl]);

  const previewVillage = useMemo(() => {
    let cleanWaDigits = String(whatsappInput ?? '').replace(/\D/g, '');
    if (cleanWaDigits.startsWith('62')) {
      cleanWaDigits = cleanWaDigits.slice(2);
    } else if (cleanWaDigits.startsWith('0')) {
      cleanWaDigits = cleanWaDigits.slice(1);
    }
    const normalizedWa = cleanWaDigits ? `62${cleanWaDigits}` : '';
    const parsedFreeMin = parseFormattedInt(freeDeliveryMinInput) ?? 0;
    return {
      ...village,
      business_name: businessName.trim() || village?.business_name || 'KDKMP',
      whatsapp_number: normalizedWa,
      address: address.trim() || null,
      gmaps_url: gmapsUrl.trim() || null,
      logo_url: logoUrl.trim() ? driveImageUrl(logoUrl.trim()) : null,
      opening_hour: openingHour || '07:00',
      closing_hour: closingHour || '20:00',
      free_delivery_min: parsedFreeMin,
      delivery_note: deliveryNote.trim() || null,
    };
  }, [
    village,
    businessName,
    whatsappInput,
    address,
    gmapsUrl,
    logoUrl,
    openingHour,
    closingHour,
    freeDeliveryMinInput,
    deliveryNote,
  ]);

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('62')) {
      val = val.slice(2);
    } else if (val.startsWith('0')) {
      val = val.slice(1);
    }
    setWhatsappInput(val);
    if (errors.whatsapp_number) {
      setErrors((prev) => ({ ...prev, whatsapp_number: '' }));
    }
  };

  const handlePhoneBlur = () => {
    let val = String(whatsappInput ?? '').replace(/\D/g, '');
    if (val.startsWith('62')) {
      val = val.slice(2);
    } else if (val.startsWith('0')) {
      val = val.slice(1);
    }
    setWhatsappInput(val);
  };

  const handleLogoFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFormError('');
    setToastMessage('');
    setErrors((prev) => ({ ...prev, logo_url: '' }));
    setIsUploading(true);

    try {
      const result = await uploadVillageLogo(
        {
          villageId: village.id,
          file,
          previousLogoUrl: sessionUploadedLogoUrl,
        },
        { isDemo, actorUserId }
      );

      setSessionUploadedLogoUrl(result.publicUrl);
      setLogoUrl(result.publicUrl);
      setExternalLogoInput('');
      setCompressionMeta({
        width: result.width,
        height: result.height,
        compressedSizeKb: Math.max(1, Math.round(result.compressedSize / 1024)),
      });
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        logo_url: err?.message || 'Gagal mengunggah logo koperasi.',
      }));
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleExternalLogoChange = async (event) => {
    const raw = event.target.value;
    setExternalLogoInput(raw);
    setToastMessage('');
    setErrors((prev) => ({ ...prev, logo_url: '' }));

    if (sessionUploadedLogoUrl) {
      const toDelete = sessionUploadedLogoUrl;
      setSessionUploadedLogoUrl(null);
      setCompressionMeta(null);
      await deleteProductImage(toDelete, {
        villageId: village.id,
        isDemo,
        actorUserId,
      }).catch(() => {});
    }

    setLogoUrl(driveImageUrl(raw));
  };

  const handleRemoveLogo = async () => {
    setToastMessage('');
    setErrors((prev) => ({ ...prev, logo_url: '' }));
    if (sessionUploadedLogoUrl) {
      const toDelete = sessionUploadedLogoUrl;
      setSessionUploadedLogoUrl(null);
      await deleteProductImage(toDelete, {
        villageId: village.id,
        isDemo,
        actorUserId,
      }).catch(() => {});
    }
    setCompressionMeta(null);
    setExternalLogoInput('');
    setLogoUrl('');
  };

  const handleCopyUrl = async () => {
    if (!catalogUrl) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(catalogUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || typeof document === 'undefined') return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-kdkmp-${village?.slug || 'koperasi'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setToastMessage('');

    const nextErrors = {};
    const cleanBusinessName = businessName.trim();
    if (!cleanBusinessName) {
      nextErrors.business_name = 'Nama koperasi wajib diisi.';
    } else if (cleanBusinessName.length > 150) {
      nextErrors.business_name = 'Nama koperasi maksimal 150 karakter.';
    }

    let cleanWaDigits = String(whatsappInput ?? '').replace(/\D/g, '');
    if (cleanWaDigits.startsWith('62')) {
      cleanWaDigits = cleanWaDigits.slice(2);
    } else if (cleanWaDigits.startsWith('0')) {
      cleanWaDigits = cleanWaDigits.slice(1);
    }
    setWhatsappInput(cleanWaDigits);

    if (!cleanWaDigits) {
      nextErrors.whatsapp_number = 'Nomor WhatsApp wajib diisi.';
    } else if (!cleanWaDigits.startsWith('8')) {
      nextErrors.whatsapp_number =
        'Nomor WhatsApp harus dimulai dengan angka 8.';
    } else if (cleanWaDigits.length < 8 || cleanWaDigits.length > 13) {
      nextErrors.whatsapp_number =
        'Nomor WhatsApp harus 8–13 digit setelah +62.';
    }

    const normalizedWa = `62${cleanWaDigits}`;

    const cleanMaps = gmapsUrl.trim();
    if (cleanMaps && !/^https?:\/\/.+/i.test(cleanMaps)) {
      nextErrors.gmaps_url = 'URL Maps harus diawali http:// atau https://.';
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(openingHour)) {
      nextErrors.opening_hour = 'Format jam buka tidak valid.';
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(closingHour)) {
      nextErrors.closing_hour = 'Format jam tutup tidak valid.';
    }

    const parsedFreeDelivery = parseFormattedInt(freeDeliveryMinInput) ?? 0;
    if (parsedFreeDelivery < 0) {
      nextErrors.free_delivery_min =
        'Minimal gratis ongkir harus minimal Rp 0.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const updated = await updateAdminVillageSettings(
        village.id,
        {
          business_name: cleanBusinessName,
          whatsapp_number: normalizedWa,
          address: address.trim() || null,
          gmaps_url: cleanMaps || null,
          logo_url: logoUrl.trim() ? driveImageUrl(logoUrl.trim()) : null,
          opening_hour: openingHour,
          closing_hour: closingHour,
          free_delivery_min: parsedFreeDelivery,
          delivery_note: deliveryNote.trim() || null,
        },
        { isDemo, actorUserId }
      );

      setSessionUploadedLogoUrl(null);
      setToastMessage('Tersimpan.');
      onSaved?.(updated);
    } catch (err) {
      setFormError(err?.message || 'Gagal menyimpan pengaturan koperasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rawCustomLogoSrc = logoUrl ? driveImageUrl(logoUrl) : '';
  const cleanCustomLogoSrc = rawCustomLogoSrc
    ? rawCustomLogoSrc.split('#')[0]
    : '';
  const activeLogoPreviewSrc =
    cleanCustomLogoSrc && cleanCustomLogoSrc !== failedLogoPreviewUrl
      ? cleanCustomLogoSrc
      : '/logo-kdkmp.jpg';

  return (
    <div className="space-y-4">
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-primary-700 bg-primary-50 px-3.5 py-2.5 text-xs font-medium text-primary-700"
        >
          {formError}
        </div>
      )}

      {toastMessage && (
        <div
          role="status"
          className="rounded-lg border border-border bg-ok-50 px-3.5 py-2.5 text-xs font-semibold text-ok-700"
        >
          {toastMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 rounded-xl border border-border bg-surface p-4"
        >
          <Input
            label="Nama Koperasi"
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              if (errors.business_name) {
                setErrors((prev) => ({ ...prev, business_name: '' }));
              }
            }}
            error={errors.business_name}
            placeholder="Contoh: KDKMP Desa Golokan"
            required
          />

          <Input
            label="Nomor WhatsApp"
            prefix="+62"
            type="tel"
            inputMode="numeric"
            value={whatsappInput}
            onChange={handlePhoneChange}
            onBlur={handlePhoneBlur}
            error={errors.whatsapp_number}
            placeholder="81234567890"
            className="tabular-nums"
            required
          />

          <div>
            <label
              htmlFor={addressId}
              className="mb-1.5 block text-sm font-medium text-text"
            >
              Alamat
            </label>
            <textarea
              id={addressId}
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Alamat lengkap koperasi"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-3 outline-none transition focus:border-primary-700 focus:ring-1 focus:ring-primary-700"
            />
          </div>

          <Input
            label="URL Maps"
            type="url"
            value={gmapsUrl}
            onChange={(e) => {
              setGmapsUrl(e.target.value);
              if (errors.gmaps_url) {
                setErrors((prev) => ({ ...prev, gmaps_url: '' }));
              }
            }}
            error={errors.gmaps_url}
            placeholder="https://maps.google.com/?q=..."
          />

          <div className="space-y-3 rounded-xl border border-border bg-surface p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-text">
                Logo Koperasi (256×256 WebP)
              </span>
              <div className="flex items-center gap-2">
                <label
                  htmlFor={logoInputId}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text transition-colors hover:bg-surface-3 cursor-pointer"
                >
                  <Camera
                    className="h-4 w-4 text-primary-700"
                    aria-hidden="true"
                  />
                  {isUploading ? 'Mengompres...' : 'Unggah Logo'}
                </label>
                <input
                  id={logoInputId}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  disabled={isUploading || isSubmitting}
                  className="sr-only"
                />
                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLogo}
                    aria-label="Hapus Logo"
                  >
                    <Trash2
                      className="h-4 w-4 text-primary-700"
                      aria-hidden="true"
                    />
                    Hapus Logo
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={activeLogoPreviewSrc}
                alt={`Logo ${businessName || 'KDKMP'}`}
                width="64"
                height="64"
                onError={() => {
                  if (cleanCustomLogoSrc) {
                    setFailedLogoPreviewUrl(cleanCustomLogoSrc);
                  }
                }}
                className="h-16 w-16 shrink-0 rounded-xl border border-border bg-white object-contain"
              />
              <div className="text-xs text-text-2">
                {compressionMeta ? (
                  <>
                    <div>
                      WebP · <Num value={compressionMeta.width} />×
                      <Num value={compressionMeta.height} /> px
                    </div>
                    <div>
                      Ukuran: <Num value={compressionMeta.compressedSizeKb} />{' '}
                      KB
                    </div>
                  </>
                ) : (
                  <div>
                    {logoUrl ? 'Logo kustom aktif' : 'Logo standar KDKMP'}
                  </div>
                )}
              </div>
            </div>

            <Input
              label="URL Logo (Alternatif)"
              type="url"
              value={externalLogoInput}
              onChange={handleExternalLogoChange}
              error={errors.logo_url}
              placeholder="https://drive.google.com/file/d/..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Jam Buka (WIB)"
              type="time"
              value={openingHour}
              onChange={(e) => {
                setOpeningHour(e.target.value);
                if (errors.opening_hour) {
                  setErrors((prev) => ({ ...prev, opening_hour: '' }));
                }
              }}
              error={errors.opening_hour}
              className="tabular-nums"
              required
            />

            <Input
              label="Jam Tutup (WIB)"
              type="time"
              value={closingHour}
              onChange={(e) => {
                setClosingHour(e.target.value);
                if (errors.closing_hour) {
                  setErrors((prev) => ({ ...prev, closing_hour: '' }));
                }
              }}
              error={errors.closing_hour}
              className="tabular-nums"
              required
            />
          </div>

          <Input
            label="Minimal Gratis Ongkir (Rp)"
            type="text"
            inputMode="numeric"
            value={freeDeliveryMinInput}
            onChange={(e) => {
              setFreeDeliveryMinInput(formatDigitsInput(e.target.value));
              if (errors.free_delivery_min) {
                setErrors((prev) => ({ ...prev, free_delivery_min: '' }));
              }
            }}
            error={errors.free_delivery_min}
            placeholder="0"
            className="tabular-nums text-right"
          />

          <div>
            <label
              htmlFor={deliveryNoteId}
              className="mb-1.5 block text-sm font-medium text-text"
            >
              Catatan Pengantaran
            </label>
            <textarea
              id={deliveryNoteId}
              rows={2}
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="Contoh: Gratis ongkir area desa min. belanja Rp 50.000"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-3 outline-none transition focus:border-primary-700 focus:ring-1 focus:ring-primary-700"
            />
          </div>

          <div className="sticky bottom-14 z-20 -mx-4 border-t border-border bg-surface px-4 py-3 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || isUploading}
              className="w-full md:w-auto"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        </form>

        <div className="space-y-6 lg:sticky lg:top-20">
          <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <h2 className="text-base font-bold text-text">
              Pratinjau Header Katalog
            </h2>
            <StoreHeader village={previewVillage} />
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-text">Bagikan Katalog</h2>
              {village?.subdistrict_slug && village?.slug && (
                <a
                  href={`/${village.subdistrict_slug}/${village.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                >
                  <span>Lihat Katalog</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                readOnly
                aria-label="URL Katalog"
                value={catalogUrl}
                className="min-h-11 w-full flex-1 rounded-lg border border-border bg-surface-3 px-3.5 py-2.5 text-xs font-medium text-text outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleCopyUrl}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check
                      className="h-4 w-4 text-ok-700"
                      aria-hidden="true"
                    />
                    Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Salin
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Katalog ${previewVillage.business_name}`}
                    width="128"
                    height="128"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Skeleton className="h-full w-full rounded-lg" />
                )}
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleDownloadQr}
                  disabled={!qrDataUrl}
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Unduh QR (PNG)
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function AdminSettingsPage({
  initialVillage = null,
  initialQrDataUrl = '',
}) {
  const { activeVillageId, activeVillage, session, refreshProfile } = useAuth();
  const isDemo = Boolean(session?.is_demo);
  const actorUserId = session?.user?.id;

  const [fetchedVillage, setFetchedVillage] = useState(
    () => initialVillage ?? null
  );
  const [isLoading, setIsLoading] = useState(
    () => !initialVillage && !activeVillage && Boolean(activeVillageId)
  );
  const [loadError, setLoadError] = useState('');

  const resolvedVillage = useMemo(() => {
    if (fetchedVillage && fetchedVillage.id === activeVillageId) {
      return fetchedVillage;
    }
    if (initialVillage && initialVillage.id === activeVillageId) {
      return initialVillage;
    }
    if (activeVillage && activeVillage.id === activeVillageId) {
      return activeVillage;
    }
    return initialVillage || activeVillage || fetchedVillage || null;
  }, [fetchedVillage, initialVillage, activeVillage, activeVillageId]);

  const fetchVillage = useCallback(async () => {
    if (!activeVillageId) {
      setFetchedVillage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError('');
    try {
      const data = await getAdminVillageSettings(activeVillageId, {
        isDemo,
        actorUserId,
      });
      setFetchedVillage(data);
    } catch (err) {
      setLoadError(err?.message || 'Gagal memuat pengaturan koperasi.');
    } finally {
      setIsLoading(false);
    }
  }, [activeVillageId, isDemo, actorUserId]);

  useEffect(() => {
    if (initialVillage !== null) return undefined;
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return null;
        if (!activeVillageId) {
          setFetchedVillage(null);
          setIsLoading(false);
          return null;
        }
        return getAdminVillageSettings(activeVillageId, {
          isDemo,
          actorUserId,
        });
      })
      .then((data) => {
        if (!active || !data) return;
        setFetchedVillage(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err?.message || 'Gagal memuat pengaturan koperasi.');
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeVillageId, isDemo, actorUserId, initialVillage]);

  const handleSaved = useCallback(
    async (updatedVillage) => {
      setFetchedVillage(updatedVillage);
      await refreshProfile?.();
    },
    [refreshProfile]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text md:text-2xl">
        Pengaturan Koperasi
      </h1>

      {loadError && !resolvedVillage ? (
        <EmptyState
          message={loadError}
          actionLabel="Coba lagi"
          onAction={fetchVillage}
        />
      ) : isLoading && !resolvedVillage ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-busy="true">
          <Skeleton className="h-96 w-full rounded-xl" />
          <div className="space-y-6">
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
        </div>
      ) : !resolvedVillage ? (
        <EmptyState message="Data koperasi tidak ditemukan." />
      ) : (
        <VillageSettingsEditor
          key={resolvedVillage.id}
          village={resolvedVillage}
          isDemo={isDemo}
          actorUserId={actorUserId}
          initialQrDataUrl={initialQrDataUrl}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

export default AdminSettingsPage;

