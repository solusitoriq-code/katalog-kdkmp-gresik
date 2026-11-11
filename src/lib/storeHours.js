import { formatTime } from './format';

const JAKARTA_HOUR_MINUTE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function parseTimeToMinutes(timeStr, fallbackMinutes = 0) {
  if (typeof timeStr !== 'string') return fallbackMinutes;
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2})[:.](\d{1,2})(?::\d{1,2})?$/);
  if (!match) return fallbackMinutes;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return fallbackMinutes;
  }

  return hours * 60 + minutes;
}

export function getJakartaMinutes(now = new Date()) {
  if (typeof now === 'string') {
    const trimmed = now.trim();
    if (/^\d{1,2}[:.]\d{1,2}(?::\d{1,2})?$/.test(trimmed)) {
      return parseTimeToMinutes(trimmed, 0);
    }
  }

  const dateObj = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(dateObj.getTime())) {
    return getJakartaMinutes(new Date());
  }

  const parts = JAKARTA_HOUR_MINUTE_FORMATTER.formatToParts(dateObj);
  const rawHour = parts.find((p) => p.type === 'hour')?.value || '00';
  const hour = rawHour === '24' ? 0 : Number(rawHour);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || '00');
  return hour * 60 + minute;
}

export function getStoreStatus(opening = '07:00', closing = '20:00', now = new Date()) {
  const safeOpening = opening || '07:00';
  const safeClosing = closing || '20:00';

  const openMinutes = parseTimeToMinutes(safeOpening, 7 * 60);
  const closeMinutes = parseTimeToMinutes(safeClosing, 20 * 60);
  const currentMinutes = getJakartaMinutes(now);

  let isOpen;
  if (openMinutes === closeMinutes) {
    isOpen = true;
  } else if (openMinutes < closeMinutes) {
    isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else {
    // Jam operasional melewati tengah malam (contoh: 16:00 s/d 01:00)
    isOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  const openingTime = formatTime(safeOpening);
  const closingTime = formatTime(safeClosing);

  const label = isOpen
    ? `Buka · ${openingTime}–${closingTime}`
    : `Tutup · Buka ${openingTime}`;

  return {
    isOpen,
    label,
    openingTime,
    closingTime,
  };
}
