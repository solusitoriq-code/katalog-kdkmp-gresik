import { useState } from 'react';
import { MapPin, MessageCircle } from 'lucide-react';
import { Badge, Money } from '../../components/ui';
import { getStoreStatus } from '../../lib/storeHours';
import { driveImageUrl } from '../../lib/image';
import { buildWaUrl } from '../../lib/whatsapp';
import {
  formatVillageLocation,
  getVillageInitials,
} from '../../lib/recentVillages';

export function StoreHeader({ village, now }) {
  const [failedCustomLogoUrl, setFailedCustomLogoUrl] = useState(null);
  const [defaultLogoErr, setDefaultLogoErr] = useState(false);

  if (!village) return null;

  const rawCustomLogo = driveImageUrl(village.logo_url);
  const customLogoSrc =
    rawCustomLogo && rawCustomLogo !== failedCustomLogoUrl ? rawCustomLogo : '';
  const logoSrc = customLogoSrc || (!defaultLogoErr ? '/logo-kdkmp.jpg' : '');
  const initials = getVillageInitials(village);
  const locationLabel = formatVillageLocation(village);
  const storeStatus = getStoreStatus(
    village.opening_hour,
    village.closing_hour,
    now
  );

  const freeDeliveryMin = Number(village.free_delivery_min ?? 0);
  const hasFreeDelivery = Number.isFinite(freeDeliveryMin) && freeDeliveryMin > 0;
  const deliveryNote = String(village.delivery_note ?? '').trim();

  const waHref = village.whatsapp_number
    ? buildWaUrl(
      village.whatsapp_number,
      `Halo ${village.business_name}, saya ingin bertanya mengenai produk di katalog.`
    )
    : '';
  const mapsHref = String(village.gmaps_url ?? '').trim();

  const handleLogoError = () => {
    if (customLogoSrc) {
      setFailedCustomLogoUrl(customLogoSrc);
    } else {
      setDefaultLogoErr(true);
    }
  };

  return (
    <header className="flex flex-col gap-3.5 rounded-xl border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between md:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-primary-50 text-base font-bold text-primary-700 md:h-16 md:w-16">
          {logoSrc ? (
            <img
              src={logoSrc.split('#')[0]}
              alt={`Logo ${village.business_name}`}
              width="64"
              height="64"
              decoding="async"
              onError={handleLogoError}
              className="h-full w-full object-contain bg-white"
            />
          ) : (
            <span aria-hidden="true">{initials}</span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <h1 className="truncate font-bold text-text">
            {village.business_name}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs text-text-2">
            {locationLabel && <span>{locationLabel}</span>}
            <Badge variant={storeStatus.isOpen ? 'ok' : 'mute'}>
              {storeStatus.label}
            </Badge>
          </div>

          {(hasFreeDelivery || deliveryNote) && (
            <div className="flex min-w-0 flex-col gap-0.5 text-xs text-text-2 md:flex-row md:flex-wrap md:items-baseline md:gap-x-2 md:gap-y-0.5">
              {hasFreeDelivery && (
                <span className="shrink-0">
                  Gratis ongkir min.{' '}
                  <Money
                    value={freeDeliveryMin}
                    className="font-semibold text-text"
                  />
                </span>
              )}
              {hasFreeDelivery && deliveryNote && (
                <span aria-hidden="true" className="hidden text-text-3 md:inline">
                  ·
                </span>
              )}
              {deliveryNote && (
                <span
                  className="min-w-0 break-words text-text-2"
                  title={deliveryNote}
                >
                  {deliveryNote}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {(waHref || mapsHref) && (
        <div className="flex items-center gap-2 md:shrink-0">
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-text transition-colors hover:bg-surface-3 focus-visible:ring-2 focus-visible:ring-primary-600 outline-none md:flex-initial md:text-sm"
            >
              <MessageCircle
                className="h-4 w-4 shrink-0 text-ok-700"
                aria-hidden="true"
              />
              <span>WhatsApp</span>
            </a>
          )}
          {mapsHref && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-text transition-colors hover:bg-surface-3 focus-visible:ring-2 focus-visible:ring-primary-600 outline-none md:flex-initial md:text-sm"
            >
              <MapPin
                className="h-4 w-4 shrink-0 text-primary-700"
                aria-hidden="true"
              />
              <span>Maps</span>
            </a>
          )}
        </div>
      )}
    </header>
  );
}

export default StoreHeader;

