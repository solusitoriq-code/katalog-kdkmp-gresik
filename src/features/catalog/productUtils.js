export function resolveStockStatus(rawStatus) {
  if (!rawStatus) return 'ready';
  const normalized = String(rawStatus).toLowerCase().trim();
  if (normalized === 'ready' || normalized === 'tersedia') return 'ready';
  if (normalized.includes('pre') || normalized === 'po') return 'pre-order';
  if (
    normalized === 'habis' ||
    normalized === 'kosong' ||
    normalized.includes('sold')
  ) {
    return 'habis';
  }
  return 'ready';
}

export function calculateDiscountPercent(price, originalPrice) {
  const numPrice = Number(price);
  const numOriginal = Number(originalPrice);
  if (
    !Number.isFinite(numPrice) ||
    !Number.isFinite(numOriginal) ||
    numOriginal <= 0 ||
    numOriginal <= numPrice
  ) {
    return 0;
  }
  return Math.max(1, Math.round(((numOriginal - numPrice) / numOriginal) * 100));
}

