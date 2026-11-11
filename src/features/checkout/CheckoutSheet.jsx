import { useState, useId } from 'react';
import { MessageCircle } from 'lucide-react';
import {
  Button,
  DateText,
  Input,
  Money,
  Num,
  Sheet,
} from '../../components/ui';
import { getStoreStatus } from '../../lib/storeHours';
import { buildOrderMessage, buildWaUrl } from '../../lib/whatsapp';
import { recordOrderLog } from '../../lib/api';
import { useOptionalCart } from '../cart/CartContext';
import { calculateCartTotals } from '../cart/cartUtils';
import {
  DELIVERY_OPTIONS,
  PAYMENT_OPTIONS,
  normalizeDeliveryOption,
  normalizePaymentOption,
  openWhatsAppUrl,
  readBuyerFromStorage,
  validateCheckoutForm,
  writeBuyerToStorage,
} from './checkoutUtils';

export function CheckoutOrderSummary({ items = [] }) {
  const { totalItems, totalPrice } = calculateCartTotals(items);

  return (
    <section
      aria-label="Ringkasan pesanan"
      className="rounded-xl border border-border bg-surface-3/60 p-3.5"
    >
      <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-text-2">
        Ringkasan Pesanan
      </h3>

      <ul className="divide-y divide-border" aria-label="Item checkout">
        {items.map((item, idx) => {
          const qty = Math.max(1, Math.round(Number(item?.qty) || 1));
          const price = Math.max(0, Math.round(Number(item?.price) || 0));
          const subtotal = qty * price;
          const key = item.productId || item.id || `${item.name}-${idx}`;

          return (
            <li
              key={key}
              className="flex items-baseline justify-between gap-3 py-2 text-xs first:pt-0 last:pb-0"
            >
              <span className="min-w-0 flex-1 text-text">
                <span className="font-medium">{item.name}</span>{' '}
                <span className="text-text-2">
                  (<Num value={qty} />
                  x)
                </span>
              </span>
              <Money
                value={subtotal}
                className="ml-auto shrink-0 text-right font-semibold text-text"
              />
            </li>
          );
        })}
      </ul>

      <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-border pt-2.5">
        <span className="text-sm font-semibold text-text">
          Total (<Num value={totalItems} /> item)
        </span>
        <Money
          value={totalPrice}
          className="ml-auto shrink-0 text-right text-base font-bold text-primary-700"
        />
      </div>
    </section>
  );
}

export function CheckoutClosedNotice({ village, now }) {
  const storeStatus = getStoreStatus(
    village?.opening_hour,
    village?.closing_hour,
    now
  );

  if (storeStatus.isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="truncate rounded-lg border border-warn-700/25 bg-warn-50 px-3 py-2 text-xs font-medium text-warn-700"
    >
      Koperasi tutup. Diproses mulai{' '}
      <DateText value={village?.opening_hour || '07:00'} mode="time" /> WIB.
    </div>
  );
}

export function CheckoutSheet({
  open,
  onClose,
  village,
  items: propItems,
  now,
  onClearCart,
  onOpenWa,
  onSubmitOrder,
  onRecordOrderLog,
  initialBuyer,
  initialNote = '',
  initialErrors,
  initialConfirmClear = false,
}) {
  const cart = useOptionalCart();
  const formId = useId();
  const deliveryLabelId = useId();
  const paymentLabelId = useId();

  const items = propItems ?? cart?.items ?? [];
  const { totalItems, totalPrice } = calculateCartTotals(items);

  const [buyer, setBuyer] = useState(() => {
    if (initialBuyer) {
      return {
        name: String(initialBuyer.name ?? ''),
        address: String(initialBuyer.address ?? ''),
        deliveryMethod: normalizeDeliveryOption(
          initialBuyer.deliveryMethod ?? initialBuyer.delivery
        ),
        paymentMethod: normalizePaymentOption(
          initialBuyer.paymentMethod ?? initialBuyer.payment
        ),
      };
    }
    return readBuyerFromStorage();
  });

  const [note, setNote] = useState(initialNote);
  const [errors, setErrors] = useState(() => initialErrors ?? {});
  const [confirmClearOpen, setConfirmClearOpen] = useState(initialConfirmClear);

  const isPickup = buyer.deliveryMethod === 'Ambil di Koperasi';

  const handleFieldChange = (field, rawVal) => {
    const value =
      field === 'deliveryMethod'
        ? normalizeDeliveryOption(rawVal)
        : field === 'paymentMethod'
          ? normalizePaymentOption(rawVal)
          : String(rawVal ?? '');

    setBuyer((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };
      writeBuyerToStorage(next);
      return next;
    });

    setErrors((prev) => {
      if (!prev || Object.keys(prev).length === 0) return prev;
      const nextErrors = { ...prev };
      if (field === 'name') {
        delete nextErrors.name;
      }
      if (field === 'address' || field === 'deliveryMethod') {
        delete nextErrors.address;
      }
      return nextErrors;
    });
  };

  const handleCloseSheet = () => {
    setConfirmClearOpen(false);
    setErrors({});
    onClose?.();
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (items.length === 0) return;

    const validation = validateCheckoutForm(buyer);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    const savedPrefs = writeBuyerToStorage(buyer);

    const orderBuyer = {
      ...savedPrefs,
      note: String(note ?? '').trim(),
    };

    const message = buildOrderMessage({
      village,
      items,
      buyer: orderBuyer,
      now: now ?? new Date(),
    });

    const waUrl = buildWaUrl(village?.whatsapp_number, message);

    // Fire-and-forget order log insert sebelum buka WA (tanpa data pribadi)
    const logRecorder = onRecordOrderLog || recordOrderLog;
    try {
      const recordPromise = logRecorder({
        villageId: village?.id,
        items: items.map((it) => ({
          product_id: it.productId || it.id,
          qty: Math.max(1, Math.round(Number(it.qty) || 1)),
          price: Math.max(0, Math.round(Number(it.price) || 0)),
        })),
        itemsCount: items.length,
        total: totalPrice,
        deliveryMethod: orderBuyer.deliveryMethod,
        paymentMethod: orderBuyer.paymentMethod,
      });
      if (recordPromise && typeof recordPromise.catch === 'function') {
        recordPromise.catch(() => {});
      }
    } catch {
      // Fire-and-forget: kegagalan log tidak boleh menghalangi pembukaan WhatsApp
    }

    const opener = onOpenWa || openWhatsAppUrl;
    const openResult = opener(waUrl);

    onSubmitOrder?.({
      url: waUrl,
      message,
      buyer: orderBuyer,
      items,
      totalItems,
      totalPrice,
      openResult,
    });

    setConfirmClearOpen(true);
  };

  const handleConfirmClearCart = () => {
    if (onClearCart) {
      onClearCart();
    } else {
      cart?.clearCart();
    }
    setNote('');
    setConfirmClearOpen(false);
    onClose?.();
  };

  const handleKeepCart = () => {
    setConfirmClearOpen(false);
    onClose?.();
  };

  return (
    <Sheet
      open={open}
      onClose={handleCloseSheet}
      title="Checkout"
      mobileFull
      footer={
        confirmClearOpen ? (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={handleKeepCart}
              className="min-h-11 flex-1"
            >
              Tidak
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmClearCart}
              className="min-h-11 flex-1"
            >
              Ya, Kosongkan
            </Button>
          </div>
        ) : (
          <Button
            type="submit"
            form={formId}
            variant="primary"
            size="md"
            disabled={items.length === 0}
            className="min-h-11 w-full"
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Kirim via WhatsApp</span>
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <CheckoutClosedNotice village={village} now={now} />

        {confirmClearOpen ? (
          <div
            role="alertdialog"
            aria-label="Kosongkan keranjang?"
            className="rounded-xl border border-border bg-surface-3 p-4 text-center"
          >
            <p className="text-sm font-bold text-text">Kosongkan keranjang?</p>
          </div>
        ) : null}

        <CheckoutOrderSummary items={items} />

        <form
          id={formId}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-3.5"
        >
          <Input
            label="Nama Penerima *"
            name="name"
            autoComplete="name"
            value={buyer.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            error={errors.name}
          />

          <div>
            <span
              id={deliveryLabelId}
              className="mb-1.5 block text-sm font-medium text-text"
            >
              Pengiriman *
            </span>
            <div
              role="radiogroup"
              aria-labelledby={deliveryLabelId}
              className="grid grid-cols-2 gap-2"
            >
              {DELIVERY_OPTIONS.map((opt) => {
                const active = buyer.deliveryMethod === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() =>
                      handleFieldChange('deliveryMethod', opt.value)
                    }
                    className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer ${
                      active
                        ? 'border-primary-700 bg-primary-50 text-primary-700'
                        : 'border-border bg-surface text-text-2 hover:bg-surface-3 hover:text-text'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {errors.deliveryMethod && (
              <p
                role="alert"
                className="mt-1 truncate text-xs text-primary-700"
              >
                {errors.deliveryMethod}
              </p>
            )}
          </div>

          {!isPickup && (
            <Input
              label="Alamat / Patokan RT-RW *"
              name="address"
              autoComplete="street-address"
              value={buyer.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              error={errors.address}
            />
          )}

          <div>
            <span
              id={paymentLabelId}
              className="mb-1.5 block text-sm font-medium text-text"
            >
              Pembayaran *
            </span>
            <div
              role="radiogroup"
              aria-labelledby={paymentLabelId}
              className="grid grid-cols-2 gap-2"
            >
              {PAYMENT_OPTIONS.map((opt) => {
                const active = buyer.paymentMethod === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() =>
                      handleFieldChange('paymentMethod', opt.value)
                    }
                    className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-600 cursor-pointer ${
                      active
                        ? 'border-primary-700 bg-primary-50 text-primary-700'
                        : 'border-border bg-surface text-text-2 hover:bg-surface-3 hover:text-text'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {errors.paymentMethod && (
              <p
                role="alert"
                className="mt-1 truncate text-xs text-primary-700"
              >
                {errors.paymentMethod}
              </p>
            )}
          </div>

          <Input
            label="Catatan"
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </form>
      </div>
    </Sheet>
  );
}

export default CheckoutSheet;

