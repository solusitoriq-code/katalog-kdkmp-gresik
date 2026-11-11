import { Button } from './Button';

export function EmptyState({
  message = 'Data tidak ditemukan.',
  actionLabel,
  onAction,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-10 text-center ${className}`.trim()}
    >
      <p className="text-sm text-text-2">{message}</p>
      {action ||
        (actionLabel && onAction && (
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        ))}
    </div>
  );
}

export default EmptyState;

