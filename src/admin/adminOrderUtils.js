import { Clock, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';

export const STATUS_CONFIG = Object.freeze({
  pending: { label: 'Menunggu', badgeVariant: 'warn', icon: Clock },
  processing: { label: 'Diproses', badgeVariant: 'primary', icon: RotateCcw },
  completed: { label: 'Selesai', badgeVariant: 'ok', icon: CheckCircle2 },
  cancelled: { label: 'Dibatalkan', badgeVariant: 'mute', icon: XCircle },
});

export const STATUS_TABS = Object.freeze([
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'processing', label: 'Diproses' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
]);

