const VARIANT_CLASSES = {
  primary:
    'bg-primary-700 text-white hover:bg-primary-800 focus-visible:ring-primary-600',
  secondary:
    'border border-border bg-surface text-text hover:bg-surface-3 focus-visible:ring-primary-600',
  ghost:
    'bg-transparent text-text-2 hover:bg-surface-3 hover:text-text focus-visible:ring-primary-600',
};

const SIZE_CLASSES = {
  md: 'min-h-11 px-4 py-2.5 text-sm',
  sm: 'min-h-11 md:min-h-9 px-3 py-2 text-xs',
};

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...props
}) {
  const variantCls = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const sizeCls = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${variantCls} ${sizeCls} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;

