import { formatNumber, formatPercent } from '../../lib/format';

export function Num({
  value = 0,
  prefix = '',
  suffix = '',
  as: Component = 'span',
  className = '',
  ...props
}) {
  const formatted =
    suffix === '%'
      ? `${prefix}${formatPercent(value)}`
      : `${prefix}${formatNumber(value)}${suffix}`;

  return (
    <Component className={`tabular-nums ${className}`.trim()} {...props}>
      {formatted}
    </Component>
  );
}

export default Num;
