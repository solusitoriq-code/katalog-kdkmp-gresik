import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { resolveStockStatus } from '../catalog/productUtils';
import {
  readCartFromStorage,
  writeCartToStorage,
  revalidateCartItems,
  calculateCartTotals,
} from './cartUtils';

const CartContext = createContext(null);

export function CartProvider({ villageId: propVillageId, products, children }) {
  const activeVillageId = useMemo(
    () => String(propVillageId ?? '').trim(),
    [propVillageId]
  );

  // Per-village state overrides when mutated in-session
  const [villageStates, setVillageStates] = useState({});

  const currentEntry = activeVillageId ? villageStates[activeVillageId] : null;

  const baseItems = useMemo(() => {
    if (!activeVillageId) return [];
    if (currentEntry?.items) return currentEntry.items;
    return readCartFromStorage(activeVillageId);
  }, [activeVillageId, currentEntry]);

  const hasCatalogProducts = Array.isArray(products);

  const revalidation = useMemo(() => {
    if (!activeVillageId || !hasCatalogProducts) {
      return {
        items: baseItems,
        removedCount: 0,
        priceChangedCount: 0,
        changed: false,
        notice: null,
      };
    }
    return revalidateCartItems(baseItems, products);
  }, [activeVillageId, baseItems, hasCatalogProducts, products]);

  const items = revalidation.items;

  // Persist revalidated items to localStorage whenever revalidation modifies the stored snapshot
  useEffect(() => {
    if (!activeVillageId || !revalidation.changed) return;
    writeCartToStorage(activeVillageId, revalidation.items);
  }, [activeVillageId, revalidation]);

  const revalidationNotice = useMemo(() => {
    if (!activeVillageId) return null;
    if (currentEntry?.manualNotice !== undefined) {
      return currentEntry.manualNotice;
    }
    if (currentEntry?.noticeDismissed) {
      return null;
    }
    return revalidation.notice;
  }, [activeVillageId, currentEntry, revalidation.notice]);

  const updateVillageItems = useCallback(
    (updater, nextManualNotice = undefined) => {
      if (!activeVillageId) return;

      setVillageStates((prev) => {
        const prevEntry = prev[activeVillageId];
        const prevItems = prevEntry?.items ?? items;
        const nextItems =
          typeof updater === 'function' ? updater(prevItems) : updater;

        writeCartToStorage(activeVillageId, nextItems);

        return {
          ...prev,
          [activeVillageId]: {
            items: nextItems,
            noticeDismissed:
              nextManualNotice === undefined
                ? Boolean(prevEntry?.noticeDismissed)
                : false,
            manualNotice:
              nextManualNotice !== undefined
                ? nextManualNotice
                : prevEntry?.manualNotice,
          },
        };
      });
    },
    [activeVillageId, items]
  );

  const dismissNotice = useCallback(() => {
    if (!activeVillageId) return;
    setVillageStates((prev) => {
      const prevEntry = prev[activeVillageId];
      return {
        ...prev,
        [activeVillageId]: {
          items: prevEntry?.items ?? items,
          noticeDismissed: true,
          manualNotice: null,
        },
      };
    });
  }, [activeVillageId, items]);

  const getItemQty = useCallback(
    (productId) => {
      const pid = String(productId ?? '').trim();
      if (!pid) return 0;
      const found = items.find((item) => item.productId === pid);
      return found ? found.qty : 0;
    },
    [items]
  );

  const addItem = useCallback(
    (product, addQty = 1) => {
      if (!activeVillageId || !product) return false;

      const stockKey = resolveStockStatus(product.stock_status);
      if (stockKey === 'habis') return false;

      const pid = String(product.id ?? product.productId ?? '').trim();
      if (!pid) return false;

      const delta = Math.max(1, Math.floor(Number(addQty ?? 1)));
      const name = String(product.name ?? '').trim();
      const unit = String(product.unit ?? '').trim();
      const price = Math.max(0, Math.round(Number(product.price ?? 0)));

      updateVillageItems((prevItems) => {
        const existingIndex = prevItems.findIndex(
          (item) => item.productId === pid
        );
        if (existingIndex === -1) {
          return [
            ...prevItems,
            {
              productId: pid,
              name,
              unit,
              price,
              qty: delta,
            },
          ];
        }

        return prevItems.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                name: name || item.name,
                unit: unit || item.unit,
                price,
                qty: item.qty + delta,
              }
            : item
        );
      });

      return true;
    },
    [activeVillageId, updateVillageItems]
  );

  const incrementItem = useCallback(
    (productOrId) => {
      if (!activeVillageId || !productOrId) return false;

      if (typeof productOrId === 'object') {
        return addItem(productOrId, 1);
      }

      const pid = String(productOrId).trim();
      if (!pid) return false;

      if (Array.isArray(products)) {
        const catalogProduct = products.find(
          (p) => String(p?.id ?? '').trim() === pid
        );
        if (
          catalogProduct &&
          resolveStockStatus(catalogProduct.stock_status) === 'habis'
        ) {
          return false;
        }
      }

      updateVillageItems((prevItems) =>
        prevItems.map((item) =>
          item.productId === pid ? { ...item, qty: item.qty + 1 } : item
        )
      );
      return true;
    },
    [activeVillageId, addItem, products, updateVillageItems]
  );

  const decrementItem = useCallback(
    (productOrId) => {
      if (!activeVillageId || !productOrId) return;
      const pid =
        typeof productOrId === 'object'
          ? String(productOrId.id ?? productOrId.productId ?? '').trim()
          : String(productOrId).trim();
      if (!pid) return;

      updateVillageItems((prevItems) =>
        prevItems
          .map((item) =>
            item.productId === pid ? { ...item, qty: item.qty - 1 } : item
          )
          .filter((item) => item.qty > 0)
      );
    },
    [activeVillageId, updateVillageItems]
  );

  const setItemQty = useCallback(
    (productId, nextQty) => {
      if (!activeVillageId) return;
      const pid = String(productId ?? '').trim();
      if (!pid) return;

      const parsedQty = Math.floor(Number(nextQty ?? 0));
      updateVillageItems((prevItems) => {
        if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
          return prevItems.filter((item) => item.productId !== pid);
        }
        return prevItems.map((item) =>
          item.productId === pid ? { ...item, qty: parsedQty } : item
        );
      });
    },
    [activeVillageId, updateVillageItems]
  );

  const removeItem = useCallback(
    (productId) => {
      if (!activeVillageId) return;
      const pid = String(productId ?? '').trim();
      if (!pid) return;

      updateVillageItems((prevItems) =>
        prevItems.filter((item) => item.productId !== pid)
      );
    },
    [activeVillageId, updateVillageItems]
  );

  const clearCart = useCallback(() => {
    if (!activeVillageId) return;
    updateVillageItems([], null);
  }, [activeVillageId, updateVillageItems]);

  const revalidateCart = useCallback(
    (catalogProducts) => {
      if (!activeVillageId || !Array.isArray(catalogProducts)) {
        return {
          items: [],
          removedCount: 0,
          priceChangedCount: 0,
          changed: false,
          notice: null,
        };
      }
      const res = revalidateCartItems(items, catalogProducts);
      if (res.changed || res.notice) {
        updateVillageItems(res.items, res.notice);
      }
      return res;
    },
    [activeVillageId, items, updateVillageItems]
  );

  const { totalItems, totalPrice } = useMemo(
    () => calculateCartTotals(items),
    [items]
  );

  const value = useMemo(
    () => ({
      villageId: activeVillageId,
      items,
      totalItems,
      totalPrice,
      revalidationNotice,
      dismissNotice,
      getItemQty,
      addItem,
      incrementItem,
      decrementItem,
      setItemQty,
      removeItem,
      clearCart,
      revalidateCart,
    }),
    [
      activeVillageId,
      items,
      totalItems,
      totalPrice,
      revalidationNotice,
      dismissNotice,
      getItemQty,
      addItem,
      incrementItem,
      decrementItem,
      setItemQty,
      removeItem,
      clearCart,
      revalidateCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart harus digunakan di dalam CartProvider.');
  }
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOptionalCart() {
  return useContext(CartContext);
}

export default CartProvider;

