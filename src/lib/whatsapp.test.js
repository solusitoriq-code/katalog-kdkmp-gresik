import { describe, it, expect } from 'vitest';
import {
  normalizePhone,
  isValidPhone,
  buildOrderMessage,
  buildWaUrl,
} from './whatsapp';

describe('whatsapp.js', () => {
  it('normalizes Indonesian phone numbers to 628xxx format', () => {
    expect(normalizePhone('0812-3456-7801')).toBe('6281234567801');
    expect(normalizePhone('+62 812 3456 7801')).toBe('6281234567801');
    expect(normalizePhone('81234567801')).toBe('6281234567801');
    expect(normalizePhone('+62 0812-3456-7801')).toBe('6281234567801');
    expect(isValidPhone('081234567801')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
  });

  it('builds order message with aligned monospace item block (Diantar)', () => {
    const msg = buildOrderMessage({
      village: { business_name: 'KDKMP Desa Golokan' },
      items: [
        { name: 'Beras Pandan Wangi 5kg', qty: 1, price: 72000 },
        { name: 'Minyak Goreng Kemasan 2L', qty: 2, price: 35000 },
        { name: 'Gula Pasir Kristal 1kg', qty: 1, price: 17500 },
      ],
      buyer: {
        name: 'Ibu Siti',
        address: 'RT 03 RW 02 (Samping Posyandu)',
        deliveryMethod: 'Diantar ke Rumah',
        paymentMethod: 'Bayar di Tempat (COD)',
        note: 'Titip di teras jika sedang keluar',
      },
      now: '2026-11-09T09:30:00+07:00',
    });

    expect(msg).toContain('Halo KDKMP Desa Golokan, saya ingin memesan:');
    expect(msg).toContain('```');
    expect(msg).toContain('1. Beras Pandan Wangi 5kg (1x)   : Rp 72.000');
    expect(msg).toContain('2. Minyak Goreng Kemasan 2L (2x) : Rp 70.000');
    expect(msg).toContain('3. Gula Pasir Kristal 1kg (1x)   : Rp 17.500');
    expect(msg).toContain('Total Belanja : Rp 159.500');
    expect(msg).toContain('- Nama       : Ibu Siti');
    expect(msg).toContain('- Alamat     : RT 03 RW 02 (Samping Posyandu)');
    expect(msg).toContain('- Pengiriman : Diantar ke Rumah');
    expect(msg).toContain('- Pembayaran : Bayar di Tempat (COD)');
    expect(msg).toContain('- Catatan    : Titip di teras jika sedang keluar');
    expect(msg).toContain('- Waktu      : 09/11/2026 09.30 WIB');
    expect(msg).toContain('Mohon konfirmasi ketersediaan barang. Terima kasih!');
  });

  it('omits address line when deliveryMethod is Ambil di Koperasi', () => {
    const msg = buildOrderMessage({
      village: { business_name: 'KDKMP Desa Golokan' },
      items: [{ name: 'Beras IR64 Medium 5kg', qty: 1, price: 62000 }],
      buyer: {
        name: 'Pak Budi',
        address: 'Alamat ini tidak perlu tampil saat ambil di koperasi',
        deliveryMethod: 'Ambil di Koperasi',
        paymentMethod: 'Transfer / QRIS',
      },
    });

    expect(msg).toContain('- Pengiriman : Ambil di Koperasi');
    expect(msg).toContain('- Pembayaran : Transfer / QRIS');
    expect(msg).not.toContain('- Alamat');
  });

  it('builds wa.me URL with normalized phone and encoded text', () => {
    const url = buildWaUrl('0812-3456-7801', 'Halo KDKMP');
    expect(url).toBe('https://wa.me/6281234567801?text=Halo%20KDKMP');
  });
});

