import { describe, it, expect, beforeEach } from 'vitest';
import { driveImageUrl } from './image';
import { getCache, setCache, clearCache, invalidateCache, withCache } from './cache';
import { isSupabaseConfigured, isDemoMode } from './supabase';
import {
  getSubdistricts,
  getVillageDirectory,
  getVillageCatalog,
} from './api';

describe('image.js, cache.js, supabase.js & api.js (demo mode)', () => {
  beforeEach(() => {
    clearCache();
  });

  it('converts Google Drive URLs to direct lh3 image URLs', () => {
    expect(
      driveImageUrl('https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing')
    ).toBe('https://lh3.googleusercontent.com/d/1ABC123xyz');

    expect(
      driveImageUrl('https://drive.google.com/uc?export=view&id=1ABC123xyz')
    ).toBe('https://lh3.googleusercontent.com/d/1ABC123xyz');

    expect(driveImageUrl('https://example.com/produk.webp')).toBe(
      'https://example.com/produk.webp'
    );
    expect(driveImageUrl('')).toBe('');
  });

  it('stores, retrieves, expires, and invalidates cache with 5-minute default TTL', async () => {
    const t0 = 1_000_000;
    setCache('test:key', { hello: 'world' }, 300_000, t0);

    expect(getCache('test:key', t0 + 100_000)).toEqual({ hello: 'world' });
    expect(getCache('test:key', t0 + 300_001)).toBeUndefined();

    let calls = 0;
    const fn = async () => {
      calls += 1;
      return { count: calls };
    };

    const first = await withCache('counter:1', fn);
    const second = await withCache('counter:1', fn);
    expect(first).toEqual({ count: 1 });
    expect(second).toEqual({ count: 1 });

    invalidateCache('counter:');
    const third = await withCache('counter:1', fn);
    expect(third).toEqual({ count: 2 });
  });

  it('detects demo mode when env variables are empty or placeholder', () => {
    expect(isSupabaseConfigured('', '')).toBe(false);
    expect(
      isSupabaseConfigured(
        'https://xxxxxxxxxxxxxx.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      )
    ).toBe(false);
    expect(
      isSupabaseConfigured('https://abcxyz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid')
    ).toBe(true);
    expect(isDemoMode('', '')).toBe(true);
  });

  it('fetches subdistricts, village directory, and village catalog in demo mode', async () => {
    const subdistricts = await getSubdistricts({ force: true, demo: true });
    expect(subdistricts.length).toBeGreaterThanOrEqual(1);
    expect(subdistricts[0].slug).toBe('sidayu');

    const directory = await getVillageDirectory({
      kecamatan: 'sidayu',
      force: true,
      demo: true,
    });
    expect(directory).toHaveLength(2);
    expect(directory[0].slug).toBe('golokan');
    expect(directory[1].slug).toBe('sukorejo');

    const filteredDir = await getVillageDirectory({
      kecamatan: 'sidayu',
      q: 'golokan',
      demo: true,
    });
    expect(filteredDir).toHaveLength(1);
    expect(filteredDir[0].business_name).toBe('KDKMP Desa Golokan');

    const catalog = await getVillageCatalog('sidayu', 'golokan', {
      force: true,
      demo: true,
    });
    expect(catalog).not.toBeNull();
    expect(catalog.village.business_name).toBe('KDKMP Desa Golokan');
    expect(catalog.categories).toHaveLength(4);
    expect(catalog.products).toHaveLength(10);

    const notFoundCatalog = await getVillageCatalog('bungah', 'sukorejo', {
      force: true,
      demo: true,
    });
    expect(notFoundCatalog).toBeNull();
  });
});
