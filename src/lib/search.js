export const SORT_OPTIONS = [
  { value: 'ready', label: 'Tersedia Dahulu' },
  { value: 'termurah', label: 'Harga Termurah' },
  { value: 'termahal', label: 'Harga Termahal' },
  { value: 'nama-az', label: 'Nama (A-Z)' },
];

const STOCK_RANK = {
  ready: 0,
  'pre-order': 1,
  habis: 2,
};

export function getStockRank(status) {
  const key = String(status ?? '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(STOCK_RANK, key) ? STOCK_RANK[key] : 3;
}

export function normalize(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(query) {
  const norm = normalize(query);
  if (!norm) return [];
  return norm.split(' ').filter(Boolean);
}

export function matchesProduct(product, query) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return true;
  if (!product || typeof product !== 'object') return false;

  const haystack = normalize(
    `${product.name || ''} ${product.category_name || product.category || ''} ${product.description || ''}`
  );

  return tokens.every((token) => haystack.includes(token));
}

export function matchesTextFields(fields, query) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return true;
  const list = Array.isArray(fields) ? fields : [fields];
  const haystack = normalize(list.filter(Boolean).join(' '));
  return tokens.every((token) => haystack.includes(token));
}

function compareNameStrings(aName, bName) {
  return String(aName ?? '').localeCompare(String(bName ?? ''), 'id-ID', {
    sensitivity: 'base',
  });
}

export function compareReadyFirst(a, b) {
  const rankDiff = getStockRank(a?.stock_status) - getStockRank(b?.stock_status);
  if (rankDiff !== 0) return rankDiff;

  const orderA = Number.isFinite(Number(a?.sort_order)) ? Number(a.sort_order) : 0;
  const orderB = Number.isFinite(Number(b?.sort_order)) ? Number(b.sort_order) : 0;
  if (orderA !== orderB) return orderA - orderB;

  return compareNameStrings(a?.name, b?.name);
}

export function compareCheapest(a, b) {
  const priceA = Number.isFinite(Number(a?.price)) ? Number(a.price) : 0;
  const priceB = Number.isFinite(Number(b?.price)) ? Number(b.price) : 0;
  if (priceA !== priceB) return priceA - priceB;

  const rankDiff = getStockRank(a?.stock_status) - getStockRank(b?.stock_status);
  if (rankDiff !== 0) return rankDiff;

  return compareNameStrings(a?.name, b?.name);
}

export function compareMostExpensive(a, b) {
  const priceA = Number.isFinite(Number(a?.price)) ? Number(a.price) : 0;
  const priceB = Number.isFinite(Number(b?.price)) ? Number(b.price) : 0;
  if (priceA !== priceB) return priceB - priceA;

  const rankDiff = getStockRank(a?.stock_status) - getStockRank(b?.stock_status);
  if (rankDiff !== 0) return rankDiff;

  return compareNameStrings(a?.name, b?.name);
}

export function compareNameAz(a, b) {
  const nameDiff = compareNameStrings(a?.name, b?.name);
  if (nameDiff !== 0) return nameDiff;

  const priceA = Number.isFinite(Number(a?.price)) ? Number(a.price) : 0;
  const priceB = Number.isFinite(Number(b?.price)) ? Number(b.price) : 0;
  return priceA - priceB;
}

export function getProductComparator(sortBy = 'ready') {
  const key = String(sortBy ?? 'ready').trim().toLowerCase();
  switch (key) {
    case 'termurah':
    case 'cheapest':
    case 'price-asc':
    case 'price_asc':
      return compareCheapest;
    case 'termahal':
    case 'expensive':
    case 'price-desc':
    case 'price_desc':
      return compareMostExpensive;
    case 'nama-az':
    case 'name':
    case 'name-asc':
    case 'name_asc':
    case 'az':
      return compareNameAz;
    case 'ready':
    case 'ready-dulu':
    case 'default':
    default:
      return compareReadyFirst;
  }
}

export function sortProducts(products = [], sortBy = 'ready') {
  if (!Array.isArray(products)) return [];
  const comparator = getProductComparator(sortBy);
  return [...products].sort(comparator);
}

export function searchProducts(
  products = [],
  { q = '', categoryId = '', category = '', sortBy = 'ready' } = {}
) {
  if (!Array.isArray(products)) return [];

  const normCategory = String(category ?? '').trim().toLowerCase();
  const normCategoryId = String(categoryId ?? '').trim();

  const filtered = products.filter((product) => {
    if (normCategoryId && String(product.category_id ?? '') !== normCategoryId) {
      return false;
    }
    if (normCategory) {
      const prodCat = String(product.category_name || product.category || '')
        .trim()
        .toLowerCase();
      if (prodCat !== normCategory) return false;
    }
    return matchesProduct(product, q);
  });

  return sortProducts(filtered, sortBy);
}

