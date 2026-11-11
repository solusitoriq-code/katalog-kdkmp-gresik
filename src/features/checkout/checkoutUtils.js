export const BUYER_STORAGE_KEY = 'kdkmp:buyer';

export const DELIVERY_OPTIONS = [
  { value: 'Diantar', label: 'Diantar' },
  { value: 'Ambil di Koperasi', label: 'Ambil di Koperasi' },
];

export const PAYMENT_OPTIONS = [
  { value: 'COD', label: 'COD' },
  { value: 'Transfer-QRIS', label: 'Transfer-QRIS' },
];

function getStorage(customStorage) {
  if (customStorage) return customStorage;
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Ignore storage access errors
  }
  return null;
}

export function normalizeDeliveryOption(rawValue) {
  const lower = String(rawValue ?? '')
    .trim()
    .toLowerCase();

  if (
    lower === 'pickup' ||
    lower === 'ambil' ||
    lower.includes('ambil di koperasi') ||
    lower.includes('ambil sendiri')
  ) {
    return 'Ambil di Koperasi';
  }
  return 'Diantar';
}

export function normalizePaymentOption(rawValue) {
  const lower = String(rawValue ?? '')
    .trim()
    .toLowerCase();

  if (
    lower === 'transfer' ||
    lower === 'qris' ||
    lower === 'transfer-qris' ||
    lower === 'transfer / qris'
  ) {
    return 'Transfer-QRIS';
  }
  return 'COD';
}

export const DEFAULT_BUYER_PREFS = Object.freeze({
  name: '',
  address: '',
  deliveryMethod: 'Diantar',
  paymentMethod: 'COD',
});

export function sanitizeBuyerPrefs(buyer = {}) {
  return {
    name: String(buyer?.name ?? ''),
    address: String(buyer?.address ?? ''),
    deliveryMethod: normalizeDeliveryOption(
      buyer?.deliveryMethod ?? buyer?.delivery
    ),
    paymentMethod: normalizePaymentOption(
      buyer?.paymentMethod ?? buyer?.payment
    ),
  };
}

export function readBuyerFromStorage(customStorage) {
  const storage = getStorage(customStorage);
  if (!storage) return { ...DEFAULT_BUYER_PREFS };

  try {
    const raw = storage.getItem(BUYER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_BUYER_PREFS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_BUYER_PREFS };
    }
    return sanitizeBuyerPrefs(parsed);
  } catch {
    return { ...DEFAULT_BUYER_PREFS };
  }
}

export function writeBuyerToStorage(buyer, customStorage) {
  const storage = getStorage(customStorage);
  const sanitized = sanitizeBuyerPrefs(buyer);
  if (!storage) return sanitized;

  try {
    storage.setItem(BUYER_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Ignore storage quota errors
  }
  return sanitized;
}

export function validateCheckoutForm(buyer = {}) {
  const errors = {};
  const trimmedName = String(buyer?.name ?? '').trim();
  const deliveryMethod = normalizeDeliveryOption(
    buyer?.deliveryMethod ?? buyer?.delivery
  );
  const trimmedAddress = String(buyer?.address ?? '').trim();

  if (!trimmedName) {
    errors.name = 'Nama penerima wajib diisi.';
  }

  if (deliveryMethod === 'Diantar' && !trimmedAddress) {
    errors.address = 'Alamat / patokan RT-RW wajib diisi.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function openWhatsAppUrl(url, win) {
  const targetUrl = String(url ?? '').trim();
  if (!targetUrl) return { method: 'none', url: '' };

  const targetWin =
    win || (typeof window !== 'undefined' ? window : undefined);
  if (!targetWin) return { method: 'none', url: targetUrl };

  try {
    if (typeof targetWin.open === 'function') {
      const opened = targetWin.open(
        targetUrl,
        '_blank',
        'noopener,noreferrer'
      );
      if (opened) {
        return { method: 'window.open', url: targetUrl };
      }
    }
  } catch {
    // Fallback to location.href
  }

  if (targetWin.location) {
    targetWin.location.href = targetUrl;
    return { method: 'location.href', url: targetUrl };
  }

  return { method: 'none', url: targetUrl };
}

