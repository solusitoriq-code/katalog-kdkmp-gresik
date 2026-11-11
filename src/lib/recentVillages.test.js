import { describe, it, expect } from 'vitest';
import {
  RECENT_VILLAGES_KEY,
  formatVillageLocation,
  getVillageInitials,
  getRecentVillages,
  getLastVisitedVillage,
  saveLastVisitedVillage,
  resolveRecentVillages,
} from './recentVillages';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

describe('recentVillages helper', () => {
  it('formats village location for desa and kelurahan', () => {
    expect(
      formatVillageLocation({
        name: 'Golokan',
        type: 'desa',
        subdistrict_name: 'Sidayu',
      })
    ).toBe('Desa Golokan · Kec. Sidayu');

    expect(
      formatVillageLocation({
        name: 'Sidokumpul',
        type: 'kelurahan',
        subdistrict_name: 'Gresik',
      })
    ).toBe('Kel. Sidokumpul · Kec. Gresik');
  });

  it('extracts initials from village name or business name', () => {
    expect(
      getVillageInitials({
        name: 'Golokan',
        business_name: 'KDKMP Desa Golokan',
      })
    ).toBe('GO');

    expect(
      getVillageInitials({
        name: 'Banyu Urip',
        business_name: 'KDKMP Desa Banyu Urip',
      })
    ).toBe('BU');
  });

  it('saves, deduplicates, limits, and resolves recent villages in localStorage', () => {
    const storage = createMemoryStorage();

    expect(getRecentVillages(storage)).toEqual([]);
    expect(getLastVisitedVillage(storage)).toBeNull();

    const golokan = {
      id: 'v1',
      name: 'Golokan',
      slug: 'golokan',
      type: 'desa',
      business_name: 'KDKMP Desa Golokan',
      subdistrict_name: 'Sidayu',
      subdistrict_slug: 'sidayu',
      opening_hour: '07:00',
      closing_hour: '20:00',
      product_count: 10,
    };

    const sukorejo = {
      id: 'v2',
      name: 'Sukorejo',
      slug: 'sukorejo',
      type: 'desa',
      business_name: 'KDKMP Desa Sukorejo',
      subdistrict_name: 'Sidayu',
      subdistrict_slug: 'sidayu',
      opening_hour: '16:00',
      closing_hour: '01:00',
      product_count: 10,
    };

    saveLastVisitedVillage(golokan, storage);
    saveLastVisitedVillage(sukorejo, storage);
    saveLastVisitedVillage(golokan, storage);

    const recent = getRecentVillages(storage);
    expect(recent).toHaveLength(2);
    expect(recent[0].slug).toBe('golokan');
    expect(recent[1].slug).toBe('sukorejo');
    expect(getLastVisitedVillage(storage)?.slug).toBe('golokan');

    const resolved = resolveRecentVillages(recent, [
      { ...golokan, product_count: 15 },
    ]);
    expect(resolved[0].product_count).toBe(15);

    storage.setItem(RECENT_VILLAGES_KEY, '{invalid-json');
    expect(getRecentVillages(storage)).toEqual([]);
  });
});

