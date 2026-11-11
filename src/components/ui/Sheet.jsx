import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

export function Sheet({
  open,
  onClose,
  title,
  footer,
  mobileFull = false,
  dialogOnLg = false,
  className = '',
  children,
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const mobileSizeCls = mobileFull
    ? 'top-0 h-dvh max-h-dvh rounded-none border-t-0'
    : 'max-h-[90dvh] rounded-t-2xl border-t';

  const lgDialogCls = dialogOnLg
    ? 'lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:h-auto lg:max-h-[90dvh] lg:w-full lg:max-w-xl lg:rounded-2xl lg:border'
    : '';

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-text/40"
        onClick={() => onClose?.()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`fixed inset-x-0 bottom-0 z-50 flex w-full flex-col overflow-hidden border-border bg-surface shadow-xl md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[420px] md:rounded-none md:border-t-0 md:border-l ${mobileSizeCls} ${lgDialogCls} ${className}`.trim()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 md:px-5">
          <h2 id={titleId} className="text-base font-bold text-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Tutup"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-2 transition-colors hover:bg-surface-3 hover:text-text focus-visible:ring-2 focus-visible:ring-primary-600 outline-none cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">{children}</div>

        {footer && (
          <div className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-5 lg:static">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Sheet;

