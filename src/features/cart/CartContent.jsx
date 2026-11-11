import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { Button, Money, Num } from '../../components/ui';
import { useOptionalCart } from './CartContext';
import { QtyStepper } from './QtyStepper';
import {
  calculateCartTotals,
  calculateFreeDeliveryProgress,
} from './cartUtils';

export function CartFreeDeliveryBar({ totalPrice = 0, freeDeliveryMin = 0 }) {
  const progress = calculateFreeDeliveryProgress(totalPrice, freeDeliveryMin);
  if (!progress.hasFreeDelivery) return null;

  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-surface-3/60 p-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        {progress.remaining > 0 ? (
          <span className="text-text-2">
            Kurang{' '}
            <Money
              value={progress.remaining}
              className="font-semibold text-text"
            />{' '}
            untuk gratis ongkir
          </span>
        ) : (
          <span className="font-semibold text-ok-700">
            Gratis ongkir terpenuhi
          </span>
        )}
        <span className="shrink-0 text-text-3">
          <Num value={progress.progressPercent} suffix="%" />
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Progress gratis ongkir"
        aria-valuenow={progress.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-border"
      >
        <div
          className="h-full bg-primary-700 transition-all"
          style={{ width: `${progress.progressPercent}%` }}
        />
      </div>
    </div>
  );
}

export function CartRevalidationBanner({ notice, onDismiss }) {
  if (!notice) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-warn-700/25 bg-warn-50 px-3 py-2 text-xs font-medium text-warn-700"
    >
      <span className="min-w-0 truncate">{notice}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup notifikasi"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-warn-700/10 focus-visible:ring-2 focus-visible:ring-primary-600 outline-none cursor-pointer"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function CartSummaryFooter({
  totalPrice = 0,
  disabled = false,
  onCheckout,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-text">Total</span>
        <Money
          value={totalPrice}
          className="ml-auto text-right text-base font-bold text-primary-700"
        />
      </div>

      <Button
        variant="primary"
        size="md"
        disabled={disabled}
        onClick={onCheckout}
        className="min-h-11 w-full"
      >
        Checkout
      </Button>
    </div>
  );
}

export function CartContent({
  village,
  items: propItems,
  revalidationNotice: propNotice,
  onDismissNotice,
  onIncrement,
  onDecrement,
  onClear,
  onCheckout,
  showFooter = true,
}) {
  const cart = useOptionalCart();
  const [confirmingClear, setConfirmingClear] = useState(false);

  const items = propItems ?? cart?.items ?? [];
  const notice =
    propNotice !== undefined ? propNotice : cart?.revalidationNotice ?? null;
  const dismissNotice = onDismissNotice ?? cart?.dismissNotice;

  const { totalItems, totalPrice } = calculateCartTotals(items);
  const freeDeliveryMin = Number(village?.free_delivery_min ?? 0);

  const handleIncrement = (item) => {
    if (onIncrement) {
      onIncrement(item);
      return;
    }
    cart?.incrementItem(item.productId);
  };

  const handleDecrement = (item) => {
    if (onDecrement) {
      onDecrement(item);
      return;
    }
    cart?.decrementItem(item.productId);
  };

  const handleConfirmClear = () => {
    if (onClear) {
      onClear();
    } else {
      cart?.clearCart();
    }
    setConfirmingClear(false);
  };

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
    <div className="space-y-4">
      <CartRevalidationBanner notice={notice} onDismiss={dismissNotice} />

      <CartFreeDeliveryBar
        totalPrice={totalPrice}
        freeDeliveryMin={freeDeliveryMin}
      />

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-3">
          Keranjang masih kosong.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-text-2">
              <Num value={totalItems} className="font-semibold text-text" /> item
            </span>

            {!confirmingClear && (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50 focus-visible:ring-2 focus-visible:ring-primary-600 outline-none cursor-pointer md:min-h-8"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Kosongkan</span>
              </button>
            )}
          </div>

          {confirmingClear && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-3 p-2.5 text-xs"
            >
              <span className="font-medium text-text">
                Kosongkan keranjang?
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmingClear(false)}
                >
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmClear}
                >
                  Ya, Kosongkan
                </Button>
              </div>
            </div>
          )}

          <ul className="divide-y divide-border" aria-label="Item keranjang">
            {items.map((item) => {
              const subtotal = item.price * item.qty;
              return (
                <li key={item.productId} className="py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs text-text-2">
                      <Money value={item.price} />
                      {item.unit ? (
                        <span className="text-text-3"> / {item.unit}</span>
                      ) : null}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <QtyStepper
                      qty={item.qty}
                      name={item.name}
                      onDecrement={() => handleDecrement(item)}
                      onIncrement={() => handleIncrement(item)}
                    />

                    <Money
                      value={subtotal}
                      className="ml-auto shrink-0 text-right text-sm font-bold text-text"
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {showFooter && (
            <div className="border-t border-border pt-3">
              <CartSummaryFooter
                totalPrice={totalPrice}
                disabled={items.length === 0}
                onCheckout={handleCheckout}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CartContent;

