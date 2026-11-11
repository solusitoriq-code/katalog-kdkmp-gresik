import { formatDate, formatTime, formatDateTime } from '../../lib/format';

function formatDateValue(value, mode) {
  if (mode === 'time') {
    return formatTime(value);
  }
  if (mode === 'datetime') {
    return formatDateTime(value);
  }
  return formatDate(value);
}

export function DateText({
  value,
  mode = 'date',
  as: Component = 'span',
  className = '',
  ...props
}) {
  const formatted = formatDateValue(value, mode);

  return (
    <Component className={`tabular-nums ${className}`.trim()} {...props}>
      {formatted}
    </Component>
  );
}

export default DateText;
