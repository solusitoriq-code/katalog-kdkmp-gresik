const VARIANT_CLASSES = {
  ok: 'bg-ok-50 text-ok-700',
  warn: 'bg-warn-50 text-warn-700',
  mute: 'bg-mute-50 text-mute-700',
  primary: 'bg-primary-50 text-primary-700',
};

export function Badge({
  variant = 'mute',
  className = '',
  children,
  ...props
}) {
  const variantCls = VARIANT_CLASSES[variant] || VARIANT_CLASSES.mute;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${variantCls} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;

