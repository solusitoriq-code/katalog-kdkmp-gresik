import { describe, it, expect } from 'vitest';
import {
  formatRupiah,
  formatNumber,
  formatPercent,
  calcDiscountPercent,
  formatDate,
  formatTime,
  formatDateTime,
} from './format';

describe('format.js', () => {
  describe('formatRupiah', () => {
    it('formats positive integers in Indonesian Rupiah', () => {
      expect(formatRupiah(72000)).toBe('Rp 72.000');
      expect(formatRupiah(157500)).toBe('Rp 157.500');
      expect(formatRupiah(0)).toBe('Rp 0');
    });

    it('rounds decimal values and handles negative or invalid inputs', () => {
      expect(formatRupiah(17499.6)).toBe('Rp 17.500');
      expect(formatRupiah(-5000)).toBe('-Rp 5.000');
      expect(formatRupiah(null)).toBe('Rp 0');
      expect(formatRupiah(undefined)).toBe('Rp 0');
      expect(formatRupiah('bukan-angka')).toBe('Rp 0');
    });
  });

  describe('formatNumber & formatPercent', () => {
    it('formats numbers with Indonesian thousands separator', () => {
      expect(formatNumber(356)).toBe('356');
      expect(formatNumber(12500)).toBe('12.500');
      expect(formatNumber(null)).toBe('0');
    });

    it('formats percentage values and calculates discount percent', () => {
      expect(formatPercent(15)).toBe('15%');
      expect(formatPercent(0)).toBe('0%');
      expect(formatPercent(null)).toBe('0%');
      expect(calcDiscountPercent(78000, 72000)).toBe(8);
      expect(calcDiscountPercent(72000, 72000)).toBe(0);
      expect(calcDiscountPercent(null, 72000)).toBe(0);
    });
  });

  describe('formatDate, formatTime, formatDateTime (Asia/Jakarta)', () => {
    it('formats Date and ISO strings in Asia/Jakarta timezone (DD/MM/YYYY)', () => {
      expect(formatDate('2026-11-09T07:00:00+07:00')).toBe('09/11/2026');
      // 2026-11-08 20:00 UTC = 2026-11-09 03:00 WIB
      expect(formatDate('2026-11-08T20:00:00Z')).toBe('09/11/2026');
      expect(formatDate('2026-11-09')).toBe('09/11/2026');
      expect(formatDate(null)).toBe('-');
    });

    it('formats time strings and timestamps in HH.mm WIB', () => {
      expect(formatTime('07:00')).toBe('07.00');
      expect(formatTime('07:00:00')).toBe('07.00');
      expect(formatTime('7:5')).toBe('07.05');
      // 00:00 UTC = 07.00 WIB
      expect(formatTime('2026-11-09T00:00:00Z')).toBe('07.00');
      // 17:00 UTC = 00.00 WIB
      expect(formatTime('2026-11-09T17:00:00Z')).toBe('00.00');
      expect(formatTime('')).toBe('-');
    });

    it('formats combined date and time in Asia/Jakarta', () => {
      expect(formatDateTime('2026-11-09T07:00:00+07:00')).toBe('09/11/2026 07.00');
    });
  });
});

