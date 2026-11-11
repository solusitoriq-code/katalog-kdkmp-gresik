import { ShoppingCart } from 'lucide-react';
import { CartContent } from './CartContent';

export function CartPanel({ village, onCheckout, ...rest }) {
  return (
    <div className="sticky top-20 rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
        <ShoppingCart
          className="h-4 w-4 shrink-0 text-primary-700"
          aria-hidden="true"
        />
        <h2 className="text-base font-bold text-text">Keranjang</h2>
      </div>

      <CartContent
        village={village}
        onCheckout={onCheckout}
        showFooter
        {...rest}
      />
    </div>
  );
}

export default CartPanel;

