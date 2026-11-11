import { describe, it, expect, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProductCard } from '../catalog/ProductCard';
import {
  CartProvider,
  useCart,
  FloatingCartBar,
  CartPanel,
  CartSheet,
  getCartStorageKey,
  readCartFromStorage,
  writeCartToStorage,
  revalidateCartItems,
  calculateCartTotals,
  calculateFreeDeliveryProgress,
} from './index';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, val) => map.set(key, String(val)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
  };
}

describe('Cart utilities & CartContext (S06)', () => {
  beforeEach(() => {
    const storage = createMemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      configurable: true,
      writable: true,
    });
  });

  it('stores per-village cart snapshots under "cart:{villageId}" with {productId, name, unit, price, qty} and isolates different villages', () => {
    const golokanId = '00000000-0000-4000-8000-352509200800';
    const sukorejoId = '00000000-0000-4000-8000-352509200100';

    expect(getCartStorageKey(golokanId)).toBe(`cart:${golokanId}`);
    expect(getCartStorageKey(sukorejoId)).toBe(`cart:${sukorejoId}`);

    writeCartToStorage(golokanId, [
      {
        id: 'p-beras',
        name: 'Beras Pandan Wangi 5kg',
        unit: 'karung',
        price: 72000,
        qty: 2,
      },
    ]);

    writeCartToStorage(sukorejoId, [
      {
        productId: 'p-minyak',
        name: 'Minyak Goreng Kita 1L',
        unit: 'liter',
        price: 16000,
        qty: 3,
      },
    ]);

    const golokanCart = readCartFromStorage(golokanId);
    const sukorejoCart = readCartFromStorage(sukorejoId);

    expect(golokanCart).toEqual([
      {
        productId: 'p-beras',
        name: 'Beras Pandan Wangi 5kg',
        unit: 'karung',
        price: 72000,
        qty: 2,
      },
    ]);

    expect(sukorejoCart).toEqual([
      {
        productId: 'p-minyak',
        name: 'Minyak Goreng Kita 1L',
        unit: 'liter',
        price: 16000,
        qty: 3,
      },
    ]);

    expect(calculateCartTotals(golokanCart)).toEqual({
      totalItems: 2,
      totalPrice: 144000,
    });
    expect(calculateCartTotals(sukorejoCart)).toEqual({
      totalItems: 3,
      totalPrice: 48000,
    });
  });

  it('revalidates cart against loaded catalog (removes deleted/habis, updates price) and generates 1-line notice', () => {
    const savedCart = [
      {
        productId: 'p1',
        name: 'Beras Pandan Wangi 5kg',
        unit: 'karung',
        price: 70000,
        qty: 2,
      },
      {
        productId: 'p2',
        name: 'Mi Instan Goreng Paket 5 pcs',
        unit: 'pack',
        price: 14500,
        qty: 1,
      },
      {
        productId: 'p-deleted',
        name: 'Produk Lama',
        unit: 'pcs',
        price: 10000,
        qty: 1,
      },
    ];

    const catalogProducts = [
      {
        id: 'p1',
        name: 'Beras Pandan Wangi 5kg',
        unit: 'karung',
        price: 72000, // price updated from 70000 -> 72000
        stock_status: 'ready',
      },
      {
        id: 'p2',
        name: 'Mi Instan Goreng Paket 5 pcs',
        unit: 'pack',
        price: 14500,
        stock_status: 'habis', // now out of stock
      },
    ];

    const res = revalidateCartItems(savedCart, catalogProducts);

    expect(res.changed).toBe(true);
    expect(res.removedCount).toBe(2);
    expect(res.priceChangedCount).toBe(1);
    expect(res.items).toEqual([
      {
        productId: 'p1',
        name: 'Beras Pandan Wangi 5kg',
        unit: 'karung',
        price: 72000,
        qty: 2,
      },
    ]);
    expect(res.notice).toBe(
      'Keranjang diperbarui: produk habis dihapus dan harga disesuaikan.'
    );
  });

  it('renders ProductCard with 44px QtyStepper [−] qty [+] when item is in cart, and keeps habis disabled', () => {
    const product = {
      id: 'p1',
      name: 'Beras Pandan Wangi 5kg',
      category_name: 'Beras & Pangan Pokok',
      price: 72000,
      unit: 'karung',
      stock_status: 'ready',
    };

    const htmlWithQty = renderToStaticMarkup(
      <ProductCard product={product} qty={3} />
    );

    expect(htmlWithQty).toContain('Kurangi Beras Pandan Wangi 5kg');
    expect(htmlWithQty).toContain('Tambah Beras Pandan Wangi 5kg');
    expect(htmlWithQty).toContain('min-h-11');
    expect(htmlWithQty).toContain('min-w-11');
    expect(htmlWithQty).toContain('3');

    const habisProduct = {
      ...product,
      id: 'p-habis',
      stock_status: 'habis',
    };

    const htmlHabisWithQty = renderToStaticMarkup(
      <ProductCard product={habisProduct} qty={2} />
    );
    expect(htmlHabisWithQty).toContain('disabled=""');
    expect(htmlHabisWithQty).not.toContain('Kurangi Beras Pandan Wangi 5kg');
  });

  it('renders FloatingCartBar with "<Num> item · <Money>" + "Keranjang" button and hides when empty', () => {
    expect(
      renderToStaticMarkup(<FloatingCartBar totalItems={0} totalPrice={0} />)
    ).toBe('');

    const htmlBar = renderToStaticMarkup(
      <FloatingCartBar totalItems={3} totalPrice={107000} />
    );
    expect(htmlBar).toContain('3');
    expect(htmlBar).toContain('item ·');
    expect(htmlBar).toContain('Rp 107.000');
    expect(htmlBar).toContain('Keranjang');
    expect(htmlBar).toContain('lg:w-96');
  });

  it('renders CartPanel & CartContent with item details, right-aligned subtotals, free delivery solid bar, Kosongkan, and Checkout', () => {
    const village = {
      id: 'v-golokan',
      business_name: 'KDKMP Desa Golokan',
      free_delivery_min: 50000,
    };

    const progressPartial = calculateFreeDeliveryProgress(35000, 50000);
    expect(progressPartial).toEqual({
      hasFreeDelivery: true,
      freeDeliveryMin: 50000,
      remaining: 15000,
      progressPercent: 70,
      isReached: false,
    });

    const items = [
      {
        productId: 'p1',
        name: 'Minyak Goreng Kemasan 2L',
        unit: 'pouch',
        price: 35000,
        qty: 1,
      },
    ];

    const panelHtml = renderToStaticMarkup(
      <CartPanel
        village={village}
        items={items}
        revalidationNotice="Keranjang diperbarui: harga produk disesuaikan dengan katalog terbaru."
      />
    );

    expect(panelHtml).toContain('Keranjang');
    expect(panelHtml).toContain('Minyak Goreng Kemasan 2L');
    expect(panelHtml).toContain('Rp 35.000');
    expect(panelHtml).toContain('/ pouch');
    expect(panelHtml).toContain('Kurang');
    expect(panelHtml).toContain('Rp 15.000');
    expect(panelHtml).toContain('untuk gratis ongkir');
    expect(panelHtml).toContain('bg-primary-700');
    expect(panelHtml).toContain('width:70%');
    expect(panelHtml).toContain('Kosongkan');
    expect(panelHtml).toContain('Total');
    expect(panelHtml).toContain('Checkout');
    expect(panelHtml).toContain('text-right');
    expect(panelHtml).toContain(
      'Keranjang diperbarui: harga produk disesuaikan dengan katalog terbaru.'
    );
  });

  it('hydrates CartProvider from localStorage, revalidates against catalog products, and renders CartSheet', () => {
    const villageId = 'v-golokan';
    writeCartToStorage(villageId, [
      {
        productId: 'p1',
        name: 'Beras Pandan Wangi 5kg',
        unit: 'karung',
        price: 70000,
        qty: 2,
      },
    ]);

    const catalogProducts = [
      {
        id: 'p1',
        name: 'Beras Pandan Wangi 5kg',
        unit: 'karung',
        price: 72000,
        stock_status: 'ready',
      },
    ];

    function Probe() {
      const { totalItems, totalPrice, revalidationNotice } = useCart();
      return (
        <div>
          <span>items:{totalItems}</span>
          <span>total:{totalPrice}</span>
          <span>notice:{revalidationNotice}</span>
        </div>
      );
    }

    const html = renderToStaticMarkup(
      <CartProvider villageId={villageId} products={catalogProducts}>
        <Probe />
        <CartSheet
          open
          village={{ id: villageId, free_delivery_min: 50000 }}
        />
      </CartProvider>
    );

    expect(html).toContain('items:2');
    expect(html).toContain('total:144000');
    expect(html).toContain(
      'notice:Keranjang diperbarui: harga produk disesuaikan dengan katalog terbaru.'
    );
    expect(html).toContain('Gratis ongkir terpenuhi');
    expect(html).toContain('Rp 144.000');
  });
});
