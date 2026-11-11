import { useId } from 'react';

export function Input({
  label,
  error,
  id,
  className = '',
  containerClassName = '',
  prefix,
  suffix,
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const hasWrapper = Boolean(prefix || suffix);

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-text"
        >
          {label}
        </label>
      )}
      {hasWrapper ? (
        <div
          className={`flex min-h-11 items-center rounded-lg border bg-surface transition focus-within:border-primary-700 focus-within:ring-1 focus-within:ring-primary-700 ${
            error ? 'border-primary-700' : 'border-border'
          }`}
        >
          {prefix && (
            <span className="flex select-none items-center border-r border-border bg-surface-3 px-3 py-2.5 text-sm font-semibold tabular-nums text-text-2 rounded-l-lg shrink-0">
              {prefix}
            </span>
          )}
          <input
            id={inputId}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={errorId}
            className={`min-h-11 w-full bg-transparent px-3.5 py-2.5 text-sm text-text placeholder:text-text-3 outline-none disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-text-3 ${className}`.trim()}
            {...props}
          />
          {suffix && (
            <div className="flex items-center pr-2 shrink-0">
              {suffix}
            </div>
          )}
        </div>
      ) : (
        <input
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={errorId}
          className={`min-h-11 w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-3 outline-none transition focus:ring-1 disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-text-3 ${
            error
              ? 'border-primary-700 focus:border-primary-700 focus:ring-primary-700'
              : 'border-border focus:border-primary-700 focus:ring-primary-700'
          } ${className}`.trim()}
          {...props}
        />
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 truncate text-xs text-primary-700">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;

