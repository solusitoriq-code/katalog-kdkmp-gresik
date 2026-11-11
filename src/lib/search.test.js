import { describe, it, expect } from 'vitest';
import {
  normalize,
  matchesProduct,
  sortProducts,
  searchProducts,
} from './search';

const SAMPLE_PRODUCTS = [
  {
    id: 'p1',
    name: 'Mi Instan Goreng Paket 5 pcs',
    category_name: 'Minuman & Harian',
    description: 'Paket hemat 5 bungkus mi instan goreng.',
    price: 14500,
    stock_status: 'habis',
    sort_order: 10,
  },
  {
    id: 'p2',
    name: 'Bawang Merah Pilihan 500g',
    category_name: 'Bumbu & Dapur',
    description: 'Bawang merah kering ukuran sedang siap olah.',
    price: 19500,
    stock_status: 'pre-order',
    sort_order: 8,
  },
  {
    id: 'p3',
    name: 'Beras Pandan Wangi 5kg',
    category_name: 'Beras & Pangan Pokok',
    description: 'Beras pulen wangi kualitas super hasil panen lokal.',
    price: 72000,
    stock_status: 'ready',
    sort_order: 1,
  },
  {
    id: 'p4',
    name: 'Gula Pasir Kristal 1kg',
    category_name: 'Minyak & Gula',
    description: 'Gula pasir putih bersih manis alami.',
    price: 17500,
    stock_status: 'ready',
    sort_order: 5,
  },
];

describe('search.js', () => {
  it('normalizes text by lowercasing, stripping punctuation, and collapsing spaces', () => {
    expect(normalize('  Beras Pandan-Wangi 5kg!  ')).toBe(
      'beras pandan wangi 5kg'
    );
    expect(normalize(null)).toBe('');
  });

  it('matches multi-token queries across name, category, and description', () => {
    // "beras" (name) + "pangan" (category) + "lokal" (description)
    expect(matchesProduct(SAMPLE_PRODUCTS[2], 'beras pangan lokal')).toBe(true);
    expect(matchesProduct(SAMPLE_PRODUCTS[2], 'wangi 5kg')).toBe(true);
    expect(matchesProduct(SAMPLE_PRODUCTS[2], 'beras minyak')).toBe(false);
    expect(matchesProduct(SAMPLE_PRODUCTS[2], '')).toBe(true);
  });

  it('sorts products by ready-dulu (default): ready -> pre-order -> habis', () => {
    const sorted = sortProducts(SAMPLE_PRODUCTS, 'ready');
    expect(sorted.map((p) => p.id)).toEqual(['p3', 'p4', 'p2', 'p1']);
  });

  it('sorts products by termurah (price ascending)', () => {
    const sorted = sortProducts(SAMPLE_PRODUCTS, 'termurah');
    expect(sorted.map((p) => p.id)).toEqual(['p1', 'p4', 'p2', 'p3']);
  });

  it('sorts products by termahal (price descending)', () => {
    const sorted = sortProducts(SAMPLE_PRODUCTS, 'termahal');
    expect(sorted.map((p) => p.id)).toEqual(['p3', 'p2', 'p4', 'p1']);
  });

  it('sorts products by nama-az (alphabetical A-Z)', () => {
    const sorted = sortProducts(SAMPLE_PRODUCTS, 'nama-az');
    expect(sorted.map((p) => p.id)).toEqual(['p2', 'p3', 'p4', 'p1']);
  });

  it('combines search query, category filter, and sorting in searchProducts', () => {
    const result = searchProducts(SAMPLE_PRODUCTS, {
      q: '1kg putih',
      sortBy: 'termurah',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p4');
  });
});

