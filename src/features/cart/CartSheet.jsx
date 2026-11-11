import { Sheet } from '../../components/ui';
import { useOptionalCart } from './CartContext';
import { CartContent, CartSummaryFooter } from './CartContent';
import { calculateCartTotals } from './cartUtils';

export function CartSheet({
  open,
  onClose,
  village,
  items: propItems,
  onCheckout,
  ...rest
}) {
  const cart = useOptionalCart();
  const items = propItems ?? cart?.items ?? [];
  const { totalItems, totalPrice } = calculateCartTotals(items);

  const handleCheckout = () => {
    if (items.length === 0) return;
    onCheckout?.({
      village,
      items,
      totalItems,
      totalPrice,
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Keranjang"
      footer={
        items.length > 0 ? (
          <CartSummaryFooter
            totalPrice={totalPrice}
            disabled={items.length === 0}
            onCheckout={handleCheckout}
          />
        ) : null
      }
    >
      <CartContent
        village={village}
        items={items}
        onCheckout={onCheckout}
        showFooter={false}
        {...rest}
      />
    </Sheet>
  );
}

export default CartSheet;

