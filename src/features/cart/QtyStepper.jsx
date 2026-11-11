import { Num } from '../../components/ui';

export function QtyStepper({
  qty = 0,
  name = 'produk',
  onDecrement,
  onIncrement,
  disabled = false,
  fullWidth = false,
  className = '',
}) {
  return (
    <div
      className={`inline-flex h-11 min-h-11 items-center justify-between overflow-hidden rounded-lg border border-border bg-surface ${
        fullWidth ? 'w-full' : ''
      } ${className}`.trim()}
      role="group"
      aria-label={`Jumlah ${name}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onDecrement}
        aria-label={`Kurangi ${name}`}
        className="inline-flex h-11 min-h-11 w-11 min-w-11 shrink-0 items-center justify-center text-base font-bold text-text transition-colors hover:bg-surface-3 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600 outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none"
      >
        −
      </button>

      <Num
        value={qty}
        className="min-w-6 flex-1 px-1 text-center text-sm font-bold text-text"
      />

      <button
        type="button"
        disabled={disabled}
        onClick={onIncrement}
        aria-label={`Tambah ${name}`}
        className="inline-flex h-11 min-h-11 w-11 min-w-11 shrink-0 items-center justify-center text-base font-bold text-primary-700 transition-colors hover:bg-primary-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600 outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none"
      >
        +
      </button>
    </div>
  );
}

export default QtyStepper;

