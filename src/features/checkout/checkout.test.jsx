import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildOrderMessage, buildWaUrl } from '../../lib/whatsapp';
import {
  BUYER_STORAGE_KEY,
  readBuyerFromStorage,
  writeBuyerToStorage,
  validateCheckoutForm,
  openWhatsAppUrl,
  CheckoutSheet,
  CheckoutOrderSummary,
  CheckoutClosedNotice,
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

const SAMPLE_VILLAGE = {
  id: '00000000-0000-4000-8000-352509200800',
  name: 'Golokan',
  slug: 'golokan',
  type: 'desa',
  business_name: 'KDKMP Desa Golokan',
  whatsapp_number: '6281234567801',
  opening_hour: '07:00',
  closing_hour: '20:00',
};

const SAMPLE_ITEMS = [
  {
    productId: 'p1',
    name: 'Beras Pandan Wangi 5kg',
    unit: 'karung',
    price: 72000,
    qty: 1,
  },
  {
    productId: 'p2',
    name: 'Minyak Goreng Kemasan 2L',
    unit: 'pouch',
    price: 35000,
    qty: 2,
  },
  {
    productId: 'p3',
    name: 'Gula Pasir Kristal 1kg',
    unit: 'kg',
    price: 17500,
    qty: 1,
  },
];

describe('Checkout & WhatsApp (S07)', () => {
  beforeEach(() => {
    const storage = createMemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      configurable: true,
      writable: true,
    });
  });

  it('validates Diantar vs Ambil di Koperasi (requires address only when Diantar)', () => {
    const missingBoth = validateCheckoutForm({
      name: '   ',
      address: '',
      deliveryMethod: 'Diantar',
      paymentMethod: 'COD',
    });
    expect(missingBoth.isValid).toBe(false);
    expect(missingBoth.errors.name).toBe('Nama penerima wajib diisi.');
    expect(missingBoth.errors.address).toBe(
      'Alamat / patokan RT-RW wajib diisi.'
    );

    const validDiantar = validateCheckoutForm({
      name: 'Ibu Siti',
      address: 'RT 03 RW 02 (Samping Posyandu)',
      deliveryMethod: 'Diantar',
      paymentMethod: 'COD',
    });
    expect(validDiantar.isValid).toBe(true);
    expect(validDiantar.errors).toEqual({});

    const validPickupWithoutAddress = validateCheckoutForm({
      name: 'Pak Budi',
      address: '',
      deliveryMethod: 'Ambil di Koperasi',
      paymentMethod: 'Transfer-QRIS',
    });
    expect(validPickupWithoutAddress.isValid).toBe(true);
    expect(validPickupWithoutAddress.errors).toEqual({});
  });

  it('builds aligned WhatsApp order message for Diantar vs Ambil di Koperasi', () => {
    const msgDiantar = buildOrderMessage({
      village: SAMPLE_VILLAGE,
      items: SAMPLE_ITEMS,
      buyer: {
        name: 'Ibu Siti',
        address: 'RT 03 RW 02 (Samping Posyandu)',
        deliveryMethod: 'Diantar',
        paymentMethod: 'COD',
        note: 'Titip di teras jika sedang keluar',
      },
      now: '2026-11-09T09:30:00+07:00',
    });

    const msgPickup = buildOrderMessage({
      village: SAMPLE_VILLAGE,
      items: SAMPLE_ITEMS,
      buyer: {
        name: 'Pak Budi',
        address: 'RT 01 RW 01 (tidak boleh tampil saat ambil di koperasi)',
        deliveryMethod: 'Ambil di Koperasi',
        paymentMethod: 'Transfer-QRIS',
      },
      now: '2026-11-09T09:30:00+07:00',
    });

    // Check column alignment inside monospace block ```
    const codeBlockLines = msgDiantar
      .split('```')[1]
      .trim()
      .split('\n');
    expect(codeBlockLines).toHaveLength(3);
    const colonPositions = codeBlockLines.map((line) => line.indexOf(' : Rp '));
    expect(new Set(colonPositions).size).toBe(1);
    expect(colonPositions[0]).toBeGreaterThan(0);

    // Diantar checks
    expect(msgDiantar).toContain('- Nama       : Ibu Siti');
    expect(msgDiantar).toContain(
      '- Alamat     : RT 03 RW 02 (Samping Posyandu)'
    );
    expect(msgDiantar).toContain('- Pengiriman : Diantar ke Rumah');
    expect(msgDiantar).toContain('- Pembayaran : Bayar di Tempat (COD)');
    expect(msgDiantar).toContain(
      '- Catatan    : Titip di teras jika sedang keluar'
    );
    expect(msgDiantar).toContain('- Waktu      : 09/11/2026 09.30 WIB');

    // Ambil di Koperasi checks
    expect(msgPickup).toContain('- Nama       : Pak Budi');
    expect(msgPickup).not.toContain('- Alamat');
    expect(msgPickup).toContain('- Pengiriman : Ambil di Koperasi');
    expect(msgPickup).toContain('- Pembayaran : Transfer / QRIS');
    expect(msgPickup).not.toContain('- Catatan');
    expect(msgPickup).toContain('- Waktu      : 09/11/2026 09.30 WIB');
  });

  it('persists buyer name, address, deliveryMethod, and paymentMethod in localStorage while excluding note', () => {
    writeBuyerToStorage({
      name: 'Ibu Siti',
      address: 'RT 03 RW 02',
      deliveryMethod: 'Ambil di Koperasi',
      paymentMethod: 'Transfer-QRIS',
      note: 'Catatan rahasia tidak boleh disimpan',
    });

    const rawStored = globalThis.localStorage.getItem(BUYER_STORAGE_KEY);
    expect(rawStored).not.toContain('Catatan rahasia');
    expect(JSON.parse(rawStored)).toEqual({
      name: 'Ibu Siti',
      address: 'RT 03 RW 02',
      deliveryMethod: 'Ambil di Koperasi',
      paymentMethod: 'Transfer-QRIS',
    });

    const loaded = readBuyerFromStorage();
    expect(loaded).toEqual({
      name: 'Ibu Siti',
      address: 'RT 03 RW 02',
      deliveryMethod: 'Ambil di Koperasi',
      paymentMethod: 'Transfer-QRIS',
    });
    expect(loaded.note).toBeUndefined();
  });

  it('renders 1-line closed store notice with opening time from village data when closed, and hides when open', () => {
    const openHtml = renderToStaticMarkup(
      <CheckoutClosedNotice village={SAMPLE_VILLAGE} now="10:00" />
    );
    expect(openHtml).toBe('');

    const closedHtml = renderToStaticMarkup(
      <CheckoutClosedNotice village={SAMPLE_VILLAGE} now="21:15" />
    );
    expect(closedHtml).toContain('Koperasi tutup. Diproses mulai');
    expect(closedHtml).toContain('07.00');
    expect(closedHtml).toContain('WIB.');
    expect(closedHtml).toContain('truncate');
    expect(closedHtml).toContain('tabular-nums');

    const overnightVillage = {
      ...SAMPLE_VILLAGE,
      opening_hour: '16:00',
      closing_hour: '01:00',
    };
    const closedOvernightHtml = renderToStaticMarkup(
      <CheckoutClosedNotice village={overnightVillage} now="09:00" />
    );
    expect(closedOvernightHtml).toContain('Koperasi tutup. Diproses mulai');
    expect(closedOvernightHtml).toContain('16.00');
    expect(closedOvernightHtml).toContain('WIB.');
  });

  it('renders CheckoutOrderSummary with item + qty + right-aligned subtotal and total <Money>', () => {
    const html = renderToStaticMarkup(
      <CheckoutOrderSummary items={SAMPLE_ITEMS} />
    );
    expect(html).toContain('Beras Pandan Wangi 5kg');
    expect(html).toContain('Minyak Goreng Kemasan 2L');
    expect(html).toContain('Rp 72.000');
    expect(html).toContain('Rp 70.000');
    expect(html).toContain('Rp 17.500');
    expect(html).toContain('Rp 159.500');
    expect(html).toContain('text-right');
    expect(html).toContain('tabular-nums');
  });

  it('renders CheckoutSheet with full mobile bottom sheet, md/lg 420px drawer, sticky Kirim via WhatsApp button, conditional address field, and Kosongkan keranjang? dialog', () => {
    const diantarHtml = renderToStaticMarkup(
      <CheckoutSheet
        open
        village={SAMPLE_VILLAGE}
        items={SAMPLE_ITEMS}
        now="21:00"
        initialBuyer={{
          name: '',
          address: '',
          deliveryMethod: 'Diantar',
          paymentMethod: 'COD',
        }}
        initialErrors={{
          name: 'Nama penerima wajib diisi.',
          address: 'Alamat / patokan RT-RW wajib diisi.',
        }}
      />
    );

    expect(diantarHtml).toContain('h-dvh');
    expect(diantarHtml).toContain('md:w-[420px]');
    expect(diantarHtml).toContain('sticky bottom-0');
    expect(diantarHtml).toContain('Kirim via WhatsApp');
    expect(diantarHtml).toContain('Nama Penerima *');
    expect(diantarHtml).toContain('Alamat / Patokan RT-RW *');
    expect(diantarHtml).toContain('Nama penerima wajib diisi.');
    expect(diantarHtml).toContain('Alamat / patokan RT-RW wajib diisi.');
    expect(diantarHtml).toContain('Koperasi tutup. Diproses mulai');

    const pickupHtml = renderToStaticMarkup(
      <CheckoutSheet
        open
        village={SAMPLE_VILLAGE}
        items={SAMPLE_ITEMS}
        now="10:00"
        initialBuyer={{
          name: 'Pak Budi',
          address: 'RT 01 RW 01',
          deliveryMethod: 'Ambil di Koperasi',
          paymentMethod: 'Transfer-QRIS',
        }}
      />
    );
    expect(pickupHtml).not.toContain('Alamat / Patokan RT-RW *');
    expect(pickupHtml).not.toContain('Koperasi tutup.');

    const confirmClearHtml = renderToStaticMarkup(
      <CheckoutSheet
        open
        village={SAMPLE_VILLAGE}
        items={SAMPLE_ITEMS}
        now="10:00"
        initialConfirmClear
      />
    );
    expect(confirmClearHtml).toContain('Kosongkan keranjang?');
    expect(confirmClearHtml).toContain('Ya, Kosongkan');
  });

  it('opens wa.me via window.open and falls back to location.href when popup is blocked', () => {
    const waUrl = buildWaUrl(SAMPLE_VILLAGE.whatsapp_number, 'Halo KDKMP');

    const mockPopupWin = {
      open: vi.fn(() => ({ closed: false })),
      location: { href: '' },
    };
    const resOpen = openWhatsAppUrl(waUrl, mockPopupWin);
    expect(resOpen.method).toBe('window.open');
    expect(mockPopupWin.open).toHaveBeenCalledWith(
      waUrl,
      '_blank',
      'noopener,noreferrer'
    );
    expect(mockPopupWin.location.href).toBe('');

    const mockBlockedWin = {
      open: vi.fn(() => null),
      location: { href: '' },
    };
    const resFallback = openWhatsAppUrl(waUrl, mockBlockedWin);
    expect(resFallback.method).toBe('location.href');
    expect(mockBlockedWin.open).toHaveBeenCalledOnce();
    expect(mockBlockedWin.location.href).toBe(waUrl);
  });
});

