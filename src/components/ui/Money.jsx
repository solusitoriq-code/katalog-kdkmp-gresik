import { formatRupiah } from '../../lib/format';

export function Money({
  value = 0,
  as: Component = 'span',
  className = '',
  ...props
}) {
  const formatted = formatRupiah(value);

  return (
    <Component className={`tabular-nums ${className}`.trim()} {...props}>
      {formatted}
    </Component>
  );
}

export default Money;
