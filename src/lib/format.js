const JAKARTA_DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const JAKARTA_TIME_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '0';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('id-ID');
}

export function formatDigitsInput(rawValue) {
  if (rawValue === null || rawValue === undefined || rawValue === '') return '';
  const digits = String(rawValue).replace(/\D+/g, '');
  if (!digits) return '';
  const num = Number(digits);
  if (!Number.isFinite(num)) return '';
  return Math.trunc(num).toLocaleString('id-ID');
}

export function parseFormattedInt(rawValue) {
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;
  const digits = String(rawValue).replace(/\D+/g, '');
  if (!digits) return null;
  const num = Number(digits);
  if (!Number.isFinite(num)) return null;
  return Math.trunc(num);
}

export function formatRupiah(value) {
  if (value === null || value === undefined || value === '') return 'Rp 0';
  const num = Number(value);
  const safeInt = Number.isFinite(num) ? Math.round(num) : 0;
  if (safeInt < 0) {
    return `-Rp ${Math.abs(safeInt).toLocaleString('id-ID')}`;
  }
  return `Rp ${safeInt.toLocaleString('id-ID')}`;
}

export function formatPercent(value) {
  if (value === null || value === undefined || value === '') return '0%';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0%';
  return `${num.toLocaleString('id-ID')}%`;
}

export function calcDiscountPercent(originalPrice, price) {
  const orig = Number(originalPrice);
  const curr = Number(price);
  if (!Number.isFinite(orig) || !Number.isFinite(curr) || orig <= 0 || curr < 0 || orig <= curr) {
    return 0;
  }
  return Math.round(((orig - curr) / orig) * 100);
}

export function formatDate(value) {
  if (value === null || value === undefined || value === '') return '-';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) {
      return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
    }
  }

  const dateObj = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateObj.getTime())) return '-';

  const parts = JAKARTA_DATE_FORMATTER.formatToParts(dateObj);
  const day = parts.find((p) => p.type === 'day')?.value || '01';
  const month = parts.find((p) => p.type === 'month')?.value || '01';
  const year = parts.find((p) => p.type === 'year')?.value || '1970';
  return `${day}/${month}/${year}`;
}

export function formatTime(value) {
  if (value === null || value === undefined || value === '') return '-';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    const timeMatch = trimmed.match(/^(\d{1,2})[:.](\d{1,2})(?::\d{1,2})?$/);
    if (timeMatch) {
      const hh = Number(timeMatch[1]);
      const mm = Number(timeMatch[2]);
      if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
        return `${String(hh).padStart(2, '0')}.${String(mm).padStart(2, '0')}`;
      }
    }
  }

  const dateObj = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateObj.getTime())) return '-';

  const parts = JAKARTA_TIME_FORMATTER.formatToParts(dateObj);
  const rawHour = parts.find((p) => p.type === 'hour')?.value || '00';
  const hour = rawHour === '24' ? '00' : rawHour.padStart(2, '0');
  const minute = (parts.find((p) => p.type === 'minute')?.value || '00').padStart(2, '0');
  return `${hour}.${minute}`;
}

export function formatDateTime(value) {
  if (value === null || value === undefined || value === '') return '-';
  const datePart = formatDate(value);
  const timePart = formatTime(value);
  if (datePart === '-' || timePart === '-') return '-';
  return `${datePart} ${timePart}`;
}

