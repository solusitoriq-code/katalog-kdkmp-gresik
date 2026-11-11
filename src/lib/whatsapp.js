import { formatRupiah, formatDateTime } from './format';

export function normalizePhone(rawPhone) {
  if (rawPhone === null || rawPhone === undefined) return '';
  let digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('620')) {
    digits = '62' + digits.slice(3);
  } else if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  }

  return digits;
}

export function isValidPhone(rawPhone) {
  const normalized = normalizePhone(rawPhone);
  return /^62[0-9]{8,13}$/.test(normalized);
}

function resolveDeliveryInfo(buyer = {}) {
  const rawMethod = String(buyer.deliveryMethod || buyer.delivery || 'Diantar ke Rumah').trim();
  const lower = rawMethod.toLowerCase();

  const isPickup =
    lower === 'pickup' ||
    lower === 'ambil' ||
    lower.includes('ambil di koperasi') ||
    lower.includes('ambil sendiri');

  if (isPickup) {
    return {
      isPickup: true,
      label: 'Ambil di Koperasi',
    };
  }

  if (lower === 'delivery' || lower === 'diantar' || lower === 'diantar ke rumah') {
    return {
      isPickup: false,
      label: 'Diantar ke Rumah',
    };
  }

  return {
    isPickup: false,
    label: rawMethod,
  };
}

function resolvePaymentLabel(buyer = {}) {
  const rawPayment = String(buyer.paymentMethod || buyer.payment || 'Bayar di Tempat (COD)').trim();
  const lower = rawPayment.toLowerCase();

  if (lower === 'cod' || lower === 'tunai' || lower.includes('bayar di tempat')) {
    return 'Bayar di Tempat (COD)';
  }
  if (lower === 'transfer' || lower === 'qris' || lower === 'transfer-qris' || lower === 'transfer / qris') {
    return 'Transfer / QRIS';
  }
  return rawPayment;
}

export function buildOrderMessage({ village, items = [], buyer = {}, now } = {}) {
  const businessName =
    typeof village === 'string' && village.trim()
      ? village.trim()
      : village?.business_name || village?.name || 'KDKMP';

  const safeItems = Array.isArray(items) ? items : [];
  let total = 0;

  const formattedRows = safeItems.map((item, idx) => {
    const qty = Math.max(1, Math.round(Number(item?.qty) || 1));
    const price = Math.max(0, Math.round(Number(item?.price) || 0));
    const subtotal = qty * price;
    total += subtotal;

    const name = String(item?.name || 'Produk').trim();
    const left = `${idx + 1}. ${name} (${qty}x)`;
    return {
      left,
      subtotal,
    };
  });

  const maxLeftLen = formattedRows.reduce(
    (max, row) => Math.max(max, row.left.length),
    0
  );

  const itemLines = formattedRows.map(
    (row) => `${row.left.padEnd(maxLeftLen, ' ')} : ${formatRupiah(row.subtotal)}`
  );

  const buyerName = String(buyer?.name || '-').trim() || '-';
  const buyerAddress = String(buyer?.address || '').trim();
  const buyerNote = String(buyer?.note ?? buyer?.notes ?? buyer?.catatan ?? '').trim();
  const { isPickup, label: deliveryLabel } = resolveDeliveryInfo(buyer);
  const paymentLabel = resolvePaymentLabel(buyer);

  const shippingLines = [`- Nama       : ${buyerName}`];
  if (!isPickup && buyerAddress) {
    shippingLines.push(`- Alamat     : ${buyerAddress}`);
  }
  shippingLines.push(`- Pengiriman : ${deliveryLabel}`);
  shippingLines.push(`- Pembayaran : ${paymentLabel}`);
  if (buyerNote) {
    shippingLines.push(`- Catatan    : ${buyerNote}`);
  }
  if (now !== undefined && now !== null && now !== '') {
    const formattedNow = formatDateTime(now);
    if (formattedNow !== '-') {
      shippingLines.push(`- Waktu      : ${formattedNow} WIB`);
    }
  }

  return [
    `Halo ${businessName}, saya ingin memesan:`,
    '```',
    ...itemLines,
    '```',
    `Total Belanja : ${formatRupiah(total)}`,
    '',
    '*Data Pengiriman:*',
    ...shippingLines,
    '----------------------------------------',
    'Mohon konfirmasi ketersediaan barang. Terima kasih!',
  ].join('\n');
}

export function buildWaUrl(phone, message = '') {
  const cleanPhone = normalizePhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(String(message))}`;
}

