import { ShoppingCart } from 'lucide-react';
import { Button, Money, Num } from '../../components/ui';
import { useOptionalCart } from './CartContext';

export function FloatingCartBar({
  totalItems: propTotalItems,
  totalPrice: propTotalPrice,
  onOpen,
}) {
  const cart = useOptionalCart();

  const totalItems =
    propTotalItems !== undefined ? Number(propTotalItems) : cart?.totalItems ?? 0;
  const totalPrice =
    propTotalPrice !== undefined ? Number(propTotalPrice) : cart?.totalPrice ?? 0;

  if (!Number.isFinite(totalItems) || totalItems <= 0) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Ringkasan keranjang"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg md:px-6 lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-96 lg:rounded-xl lg:border lg:p-3.5 lg:shadow-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="min-w-0 truncate text-sm font-medium text-text">
          <Num value={totalItems} className="font-bold text-text" /> item ·{' '}
          <Money
            value={totalPrice}
            className="font-bold text-primary-700"
          />
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onOpen}
          className="min-h-11 shrink-0"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          <span>Keranjang</span>
        </Button>
      </div>
    </div>
  );
}

export default FloatingCartBar;

