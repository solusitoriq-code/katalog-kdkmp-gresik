import { useId } from 'react';
import { Search, X } from 'lucide-react';

export function DirectorySearchInput({
  value = '',
  onChange,
  onClear,
  placeholder = 'Cari koperasi atau desa...',
  ariaLabel = 'Cari koperasi',
}) {
  const inputId = useId();

  return (
    <div className="relative w-full">
      <label htmlFor={inputId} className="sr-only">
        {ariaLabel}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3"
      />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="min-h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-11 py-2.5 text-sm text-text placeholder:text-text-3 outline-none transition focus:border-primary-700 focus:ring-1 focus:ring-primary-700"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            if (onClear) {
              onClear();
            } else {
              onChange?.('');
            }
          }}
          aria-label="Hapus pencarian"
          className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-r-lg text-text-3 hover:text-text focus-visible:ring-2 focus-visible:ring-primary-600 outline-none cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default DirectorySearchInput;

