import { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { Badge, Button, Money, Num } from '../../components/ui';
import { driveImageUrl } from '../../lib/image';
import { useOptionalCart } from '../cart/CartContext';
import { QtyStepper } from '../cart/QtyStepper';
import {
  resolveStockStatus,
  calculateDiscountPercent,
} from './productUtils';

const STATUS_MAP = {
  ready: { label: 'Tersedia', variant: 'ok' },
  'pre-order': { label: 'Pre-Order', variant: 'warn' },
  habis: { label: 'Habis', variant: 'mute' },
};

export function ProductCard({
  product,
  qty: propQty,
  onAdd,
  onIncrement,
  onDecrement,
  actionSlot,
  className = '',
}) {
  const [imgErr, setImgErr] = useState(false);
  const cart = useOptionalCart();

  if (!product) return null;

  const name = product.name || '';
  const categoryName = product.category_name || product.category || '';
  const price = Number(product.price ?? 0);
  const originalPrice =
    product.original_price !== null && product.original_price !== undefined
      ? Number(product.original_price)
      : null;
  const unit = String(product.unit ?? '').trim();
  const stockKey = resolveStockStatus(product.stock_status);
  const status = STATUS_MAP[stockKey] || STATUS_MAP.ready;
  const soldOut = stockKey === 'habis';
  const imgUrl = !imgErr ? driveImageUrl(product.image_url || product.image) : '';

  const discountPercent = calculateDiscountPercent(price, originalPrice);
  const hasDiscount = discountPercent > 0;

  const rawQty =
    propQty !== undefined
      ? Number(propQty)
      : cart
        ? cart.getItemQty(product.id)
        : 0;
  const qty = !soldOut && Number.isFinite(rawQty) && rawQty > 0 ? Math.floor(rawQty) : 0;

  const handleAdd = () => {
    if (soldOut) return;
    if (onAdd) {
      onAdd(product);
      return;
    }
    cart?.addItem(product, 1);
  };

  const handleIncrement = () => {
    if (soldOut) return;
    if (onIncrement) {
      onIncrement(product);
      return;
    }
    if (onAdd && !cart) {
      onAdd(product);
      return;
    }
    cart?.incrementItem(product);
  };

  const handleDecrement = () => {
    if (onDecrement) {
      onDecrement(product);
      return;
    }
    cart?.decrementItem(product.id);
  };

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors ${
        soldOut ? 'opacity-60' : ''
      } ${className}`.trim()}
    >
      <div className="relative flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden bg-white p-2">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={name}
            width="400"
            height="300"
            loading="lazy"
            decoding="async"
            onError={() => setImgErr(true)}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-3">
            <Package className="h-10 w-10 stroke-[1.25]" aria-hidden="true" />
          </div>
        )}

        <Badge variant={status.variant} className="absolute top-2 right-2">
          {status.label}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-2.5 md:p-3">
        <div className="h-4 truncate text-[11px] leading-4 font-medium uppercase tracking-wide text-text-3">
          {categoryName || '\u00A0'}
        </div>

        <h3
          className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm leading-5 font-semibold text-text"
          title={name}
        >
          {name}
        </h3>

        <div className="mt-2">
          <div className="flex min-w-0 items-baseline gap-1 whitespace-nowrap">
            <Money
              value={price}
              className="shrink-0 text-sm font-bold text-primary-700 md:text-base"
            />
            {unit && (
              <span className="min-w-0 truncate text-xs text-text-3">
                / {unit}
              </span>
            )}
          </div>

          <div className="mt-0.5 flex h-5 items-center gap-1.5">
            {hasDiscount && (
              <>
                <Money
                  value={originalPrice}
                  className="text-xs text-text-3 line-through"
                />
                <Badge variant="primary" className="px-1.5 py-0 text-[11px]">
                  -<Num value={discountPercent} suffix="%" />
                </Badge>
              </>
            )}
          </div>
        </div>

        <div className="mt-auto pt-2.5">
          {actionSlot ? (
            actionSlot
          ) : !soldOut && qty > 0 ? (
            <QtyStepper
              fullWidth
              qty={qty}
              name={name}
              onDecrement={handleDecrement}
              onIncrement={handleIncrement}
            />
          ) : (
            <Button
              variant={soldOut ? 'secondary' : 'primary'}
              size="sm"
              disabled={soldOut}
              onClick={handleAdd}
              className="h-11 min-h-11 w-full md:min-h-11"
              aria-label={`Tambah ${name}`}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Tambah</span>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
