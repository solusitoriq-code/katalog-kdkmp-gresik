import { describe, it, expect } from 'vitest';
import { RESERVED_SLUGS, isReservedSlug } from './reservedSlugs';

describe('reservedSlugs', () => {
  it('contains all mandatory reserved slugs', () => {
    expect(RESERVED_SLUGS).toEqual(['admin', 'login', 'api', 'assets', 'dev']);
  });

  it('matches reserved slugs case-insensitively', () => {
    expect(isReservedSlug('admin')).toBe(true);
    expect(isReservedSlug('ADMIN')).toBe(true);
    expect(isReservedSlug('login')).toBe(true);
    expect(isReservedSlug('api')).toBe(true);
    expect(isReservedSlug('assets')).toBe(true);
    expect(isReservedSlug('dev')).toBe(true);
  });

  it('returns false for valid subdistrict/village slugs', () => {
    expect(isReservedSlug('sidayu')).toBe(false);
    expect(isReservedSlug('golokan')).toBe(false);
    expect(isReservedSlug('')).toBe(false);
    expect(isReservedSlug(null)).toBe(false);
  });
});

