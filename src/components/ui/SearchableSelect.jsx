import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export function SearchableSelect({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  error,
  required = false,
  className = '',
  disabled = false,
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = error ? `${selectId}-error` : undefined;

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value) && opt.value !== ''
  );

  const filteredOptions = options.filter((opt) => {
    if (opt.value === '' && !opt.label) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const labelMatch = (opt.label || '').toLowerCase().includes(q);
    const subMatch = (opt.sublabel || '').toLowerCase().includes(q);
    return labelMatch || subMatch;
  });

  const handleSelect = (val) => {
    onChange?.({ target: { value: val } });
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1 block text-xs font-semibold text-text-2"
        >
          {label}
        </label>
      )}

      {/* Hidden input to support form validation & accessibility */}
      <input
        type="hidden"
        id={`${selectId}-hidden`}
        name={selectId}
        value={value || ''}
        required={required}
      />

      <button
        id={selectId}
        type="button"
        role="combobox"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={errorId}
        className={`flex min-h-11 w-full items-center justify-between rounded-lg border bg-surface px-3.5 py-2.5 text-left text-sm transition outline-none focus:ring-1 ${
          error
            ? 'border-primary-700 focus:border-primary-700 focus:ring-primary-700'
            : 'border-border focus:border-primary-700 focus:ring-primary-700'
        } ${disabled ? 'cursor-not-allowed bg-surface-3 text-text-3' : 'cursor-pointer'} ${className}`.trim()}
      >
        <span
          className={`truncate ${selectedOption ? 'font-medium text-text' : 'text-text-3'}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-text-3 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary-700' : ''
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-text-3" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-surface py-1.5 pr-8 pl-8 text-xs text-text outline-none focus:border-primary-700 focus:ring-1 focus:ring-primary-700"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-text-3 hover:text-text"
                aria-label="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div
            role="listbox"
            tabIndex={-1}
            className="max-h-52 overflow-y-auto divide-y divide-border/40 p-1"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-text-3">
                Tidak ada hasil pencarian.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex min-h-[40px] w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-primary-50 font-semibold text-primary-700'
                        : 'text-text hover:bg-surface-3'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="truncate text-[11px] text-text-3">
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-primary-700" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1 text-xs font-medium text-primary-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default SearchableSelect;
