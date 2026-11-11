import { useState } from 'react';
import { Link } from 'react-router';
import { Badge, Num } from '../../components/ui';
import { getStoreStatus } from '../../lib/storeHours';
import { driveImageUrl } from '../../lib/image';
import {
  formatVillageLocation,
  getVillageInitials,
  saveLastVisitedVillage,
} from '../../lib/recentVillages';

export function VillageCard({ village, now, onSelect, className = '' }) {
  const [imgError, setImgError] = useState(false);

  if (!village) return null;

  const href = `/${village.subdistrict_slug}/${village.slug}`;
  const logoSrc = !imgError ? driveImageUrl(village.logo_url) : '';
  const initials = getVillageInitials(village);
  const locationLabel = formatVillageLocation(village);
  const storeStatus = getStoreStatus(
    village.opening_hour,
    village.closing_hour,
    now
  );
  const productCount = Number(village.product_count ?? 0);

  const handleClick = () => {
    saveLastVisitedVillage(village);
    if (onSelect) {
      onSelect(village);
    }
  };

  return (
    <Link
      to={href}
      onClick={handleClick}
      className={`group flex min-w-0 flex-col justify-between gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary-700 focus-visible:ring-2 focus-visible:ring-primary-600 outline-none ${className}`.trim()}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary-50 text-sm font-bold text-primary-700">
          {logoSrc ? (
            <img
              src={logoSrc.split('#')[0]}
              alt={village.business_name}
              width="48"
              height="48"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span aria-hidden="true">{initials}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-text transition-colors group-hover:text-primary-700">
            {village.business_name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-text-2">{locationLabel}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <Badge variant={storeStatus.isOpen ? 'ok' : 'mute'}>
          {storeStatus.label}
        </Badge>
        <span className="shrink-0 text-xs font-medium text-text-2">
          <Num value={productCount} /> produk
        </span>
      </div>
    </Link>
  );
}

export default VillageCard;

