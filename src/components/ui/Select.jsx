import { useId } from 'react';

export function Select({
  label,
  error,
  id,
  options,
  children,
  className = '',
  containerClassName = '',
  ...props
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-text"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={errorId}
        className={`min-h-11 w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text outline-none transition focus:ring-1 disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-text-3 ${
          error
            ? 'border-primary-700 focus:border-primary-700 focus:ring-primary-700'
            : 'border-border focus:border-primary-700 focus:ring-primary-700'
        } ${className}`.trim()}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-primary-700">
          {error}
        </p>
      )}
    </div>
  );
}

export default Select;

