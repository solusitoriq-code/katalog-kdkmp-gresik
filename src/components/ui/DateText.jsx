import { formatDate, formatTime, formatDateTime, formatLongDateTime } from '../../lib/format';

function formatDateValue(value, mode) {
  if (mode === 'time') {
    return formatTime(value);
  }
  if (mode === 'datetime') {
    return formatDateTime(value);
  }
  if (mode === 'longDateTime' || mode === 'longDatetime' || mode === 'order') {
    return formatLongDateTime(value);
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
