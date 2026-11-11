import { parseFormattedInt } from '../lib/format';

export function applyOptimisticProductPatch(products, productId, patch) {
  return (products || []).map((item) =>
    item.id === productId ? { ...item, ...patch } : item
  );
}

export function rollbackOptimisticProduct(products, previousProduct) {
  if (!previousProduct?.id) return products || [];
  return (products || []).map((item) =>
    item.id === previousProduct.id ? { ...previousProduct } : item
  );
}

export function computeQuickPriceChanges(products = [], draftPrices = {}) {
  const changes = [];
  for (const prod of products) {
    if (!prod?.id) continue;
    if (!Object.prototype.hasOwnProperty.call(draftPrices, prod.id)) continue;
    const parsed = parseFormattedInt(draftPrices[prod.id]);
    if (parsed === null || parsed < 0) continue;
    if (parsed !== Number(prod.price)) {
      changes.push({
        id: prod.id,
        price: parsed,
      });
    }
  }
  return changes;
}

export function swapCategoryOrder(categories = [], indexA, indexB) {
  const list = [...categories];
  if (
    indexA < 0 ||
    indexB < 0 ||
    indexA >= list.length ||
    indexB >= list.length ||
    indexA === indexB
  ) {
    return list;
  }
  const temp = list[indexA];
  list[indexA] = list[indexB];
  list[indexB] = temp;
  return list.map((item, idx) => ({
    ...item,
    sort_order: idx + 1,
  }));
}

