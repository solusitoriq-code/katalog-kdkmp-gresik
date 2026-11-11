import { describe, it, expect } from 'vitest';
import { getStoreStatus } from './storeHours';

describe('storeHours.js', () => {
  it('handles normal same-day store hours (07:00 - 20:00 WIB)', () => {
    const openStatus = getStoreStatus(
      '07:00',
      '20:00',
      '2026-11-09T08:30:00+07:00'
    );
    expect(openStatus.isOpen).toBe(true);
    expect(openStatus.label).toBe('Buka · 07.00–20.00');

    const atOpenBoundary = getStoreStatus(
      '07:00',
      '20:00',
      '2026-11-09T07:00:00+07:00'
    );
    expect(atOpenBoundary.isOpen).toBe(true);

    const atCloseBoundary = getStoreStatus(
      '07:00',
      '20:00',
      '2026-11-09T20:00:00+07:00'
    );
    expect(atCloseBoundary.isOpen).toBe(false);
    expect(atCloseBoundary.label).toBe('Tutup · Buka 07.00');

    const beforeOpen = getStoreStatus(
      '07:00',
      '20:00',
      '2026-11-09T06:59:00+07:00'
    );
    expect(beforeOpen.isOpen).toBe(false);
    expect(beforeOpen.label).toBe('Tutup · Buka 07.00');
  });

  it('supports overnight store hours crossing midnight (16:00 - 01:00 WIB)', () => {
    const eveningOpen = getStoreStatus(
      '16:00',
      '01:00',
      '2026-11-09T22:15:00+07:00'
    );
    expect(eveningOpen.isOpen).toBe(true);
    expect(eveningOpen.label).toBe('Buka · 16.00–01.00');

    const afterMidnightOpen = getStoreStatus(
      '16:00',
      '01:00',
      '2026-11-10T00:30:00+07:00'
    );
    expect(afterMidnightOpen.isOpen).toBe(true);
    expect(afterMidnightOpen.label).toBe('Buka · 16.00–01.00');

    const atClosingMidnight = getStoreStatus(
      '16:00',
      '01:00',
      '2026-11-10T01:00:00+07:00'
    );
    expect(atClosingMidnight.isOpen).toBe(false);
    expect(atClosingMidnight.label).toBe('Tutup · Buka 16.00');

    const middayClosed = getStoreStatus(
      '16:00',
      '01:00',
      '2026-11-09T12:00:00+07:00'
    );
    expect(middayClosed.isOpen).toBe(false);
    expect(middayClosed.label).toBe('Tutup · Buka 16.00');
  });

  it('converts UTC timestamps to Asia/Jakarta before checking hours', () => {
    // 01:00 UTC = 08:00 WIB -> Open for 07:00-20:00
    const status = getStoreStatus('07:00', '20:00', '2026-11-09T01:00:00Z');
    expect(status.isOpen).toBe(true);
  });
});

