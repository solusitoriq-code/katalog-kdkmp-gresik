import { resolveStockStatus } from '../catalog/productUtils';

export const CART_STORAGE_PREFIX = 'cart:';

export function getCartStorageKey(villageId) {
  const id = String(villageId ?? '').trim();
  return id ? `${CART_STORAGE_PREFIX}${id}` : '';
}

export function normalizeCartItem(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const productId = String(raw.productId ?? raw.id ?? '').trim();
  if (!productId) return null;

  const qty = Math.floor(Number(raw.qty ?? 0));
  if (!Number.isFinite(qty) || qty <= 0) return null;

  const priceNum = Math.round(Number(raw.price ?? 0));
  const price = Number.isFinite(priceNum) && priceNum >= 0 ? priceNum : 0;

  return {
    productId,
    name: String(raw.name ?? '').trim(),
    unit: String(raw.unit ?? '').trim(),
    price,
    qty,
  };
}

export function readCartFromStorage(villageId, storage = globalThis?.localStorage) {
  const key = getCartStorageKey(villageId);
  if (!key || !storage || typeof storage.getItem !== 'function') {
    return [];
  }

  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCartItem).filter(Boolean);
  } catch {
    return [];
  }
}

export function writeCartToStorage(
  villageId,
  items,
  storage = globalThis?.localStorage
) {
  const key = getCartStorageKey(villageId);
  if (!key || !storage || typeof storage.setItem !== 'function') {
    return;
  }

  try {
    const normalized = Array.isArray(items)
      ? items.map(normalizeCartItem).filter(Boolean)
      : [];
    storage.setItem(key, JSON.stringify(normalized));
  } catch {
    // Ignore storage quota or private mode errors
  }
}

export function revalidateCartItems(cartItems = [], catalogProducts = []) {
  const safeCart = Array.isArray(cartItems)
    ? cartItems.map(normalizeCartItem).filter(Boolean)
    : [];

  if (safeCart.length === 0) {
    return {
      items: [],
      removedCount: 0,
      priceChangedCount: 0,
      changed: false,
      notice: null,
    };
  }

  const productMap = new Map();
  if (Array.isArray(catalogProducts)) {
    for (const product of catalogProducts) {
      if (product && product.id !== undefined && product.id !== null) {
        productMap.set(String(product.id).trim(), product);
      }
    }
  }

  const nextItems = [];
  let removedCount = 0;
  let priceChangedCount = 0;
  let metaChanged = false;

  for (const item of safeCart) {
    const catalogProduct = productMap.get(item.productId);
    if (!catalogProduct) {
      removedCount += 1;
      continue;
    }

    const stockKey = resolveStockStatus(catalogProduct.stock_status);
    if (stockKey === 'habis') {
      removedCount += 1;
      continue;
    }

    const latestPrice = Math.max(0, Math.round(Number(catalogProduct.price ?? 0)));
    const latestName = String(catalogProduct.name ?? item.name).trim();
    const latestUnit = String(catalogProduct.unit ?? item.unit).trim();

    if (latestPrice !== item.price) {
      priceChangedCount += 1;
    }
    if (latestName !== item.name || latestUnit !== item.unit) {
      metaChanged = true;
    }

    nextItems.push({
      productId: item.productId,
      name: latestName,
      unit: latestUnit,
      price: latestPrice,
      qty: item.qty,
    });
  }

  const changed = removedCount > 0 || priceChangedCount > 0 || metaChanged;

  let notice = null;
  if (removedCount > 0 && priceChangedCount > 0) {
    notice = 'Keranjang diperbarui: produk habis dihapus dan harga disesuaikan.';
  } else if (removedCount > 0) {
    notice = 'Keranjang diperbarui: produk tidak tersedia dihapus dari keranjang.';
  } else if (priceChangedCount > 0) {
    notice = 'Keranjang diperbarui: harga produk disesuaikan dengan katalog terbaru.';
  }

  return {
    items: nextItems,
    removedCount,
    priceChangedCount,
    changed,
    notice,
  };
}

export function calculateCartTotals(items = []) {
  if (!Array.isArray(items)) {
    return { totalItems: 0, totalPrice: 0 };
  }

  let totalItems = 0;
  let totalPrice = 0;

  for (const item of items) {
    const qty = Math.max(0, Math.floor(Number(item?.qty ?? 0)));
    const price = Math.max(0, Math.round(Number(item?.price ?? 0)));
    totalItems += qty;
    totalPrice += price * qty;
  }

  return { totalItems, totalPrice };
}

export function calculateFreeDeliveryProgress(totalPrice = 0, freeDeliveryMin = 0) {
  const min = Math.max(0, Math.round(Number(freeDeliveryMin ?? 0)));
  const total = Math.max(0, Math.round(Number(totalPrice ?? 0)));
  const hasFreeDelivery = Number.isFinite(min) && min > 0;

  if (!hasFreeDelivery) {
    return {
      hasFreeDelivery: false,
      freeDeliveryMin: 0,
      remaining: 0,
      progressPercent: 0,
      isReached: false,
    };
  }

  const remaining = Math.max(0, min - total);
  const progressPercent = Math.min(100, Math.round((total / min) * 100));

  return {
    hasFreeDelivery: true,
    freeDeliveryMin: min,
    remaining,
    progressPercent,
    isReached: remaining === 0 && total > 0,
  };
}

