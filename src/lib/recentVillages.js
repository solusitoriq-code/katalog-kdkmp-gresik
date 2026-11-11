export const RECENT_VILLAGES_KEY = 'kdkmp:last_visited';
const MAX_RECENT_VILLAGES = 3;

export function formatVillageLocation(village) {
  if (!village) return '';
  const prefix = village.type === 'kelurahan' ? 'Kel.' : 'Desa';
  const villageName = village.name || '';
  const subdistrictName = village.subdistrict_name || '';

  if (villageName && subdistrictName) {
    return `${prefix} ${villageName} · Kec. ${subdistrictName}`;
  }
  if (villageName) {
    return `${prefix} ${villageName}`;
  }
  return subdistrictName ? `Kec. ${subdistrictName}` : '';
}

export function getVillageInitials(village) {
  if (!village) return 'KD';

  const rawName = String(village.name || village.business_name || '')
    .replace(/\b(kdkmp|koperasi|desa|kelurahan|kel\.?)\b/gi, ' ')
    .trim();

  const words = rawName.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return 'KD';
}

function toVillageSnapshot(village) {
  if (!village || typeof village !== 'object') return null;
  const slug = String(village.slug || '').trim().toLowerCase();
  const subdistrictSlug = String(village.subdistrict_slug || '')
    .trim()
    .toLowerCase();
  if (!slug || !subdistrictSlug) return null;

  return {
    id: village.id || `${subdistrictSlug}/${slug}`,
    code: village.code || '',
    name: village.name || '',
    slug,
    type: village.type === 'kelurahan' ? 'kelurahan' : 'desa',
    business_name:
      village.business_name ||
      `KDKMP ${village.type === 'kelurahan' ? 'Kelurahan' : 'Desa'} ${village.name || ''}`.trim(),
    subdistrict_id: village.subdistrict_id || '',
    subdistrict_name: village.subdistrict_name || '',
    subdistrict_slug: subdistrictSlug,
    logo_url: village.logo_url || null,
    opening_hour: village.opening_hour || '07:00',
    closing_hour: village.closing_hour || '20:00',
    product_count: Number(village.product_count ?? 0),
  };
}

export function getRecentVillages(storage = globalThis?.localStorage) {
  if (!storage) return [];

  try {
    const raw = storage.getItem(RECENT_VILLAGES_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [parsed];

    return items
      .map(toVillageSnapshot)
      .filter(Boolean)
      .slice(0, MAX_RECENT_VILLAGES);
  } catch {
    return [];
  }
}

export function getLastVisitedVillage(storage = globalThis?.localStorage) {
  const list = getRecentVillages(storage);
  return list[0] || null;
}

export function saveLastVisitedVillage(
  village,
  storage = globalThis?.localStorage
) {
  const snapshot = toVillageSnapshot(village);
  if (!snapshot || !storage) return [];

  try {
    const existing = getRecentVillages(storage);
    const key = `${snapshot.subdistrict_slug}/${snapshot.slug}`;
    const next = [
      snapshot,
      ...existing.filter(
        (item) => `${item.subdistrict_slug}/${item.slug}` !== key
      ),
    ].slice(0, MAX_RECENT_VILLAGES);

    storage.setItem(RECENT_VILLAGES_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [snapshot];
  }
}

export function resolveRecentVillages(recentList = [], directoryRows = null) {
  if (!Array.isArray(recentList) || recentList.length === 0) return [];
  if (!Array.isArray(directoryRows) || directoryRows.length === 0) {
    return recentList;
  }

  const byKey = new Map(
    directoryRows.map((row) => [
      `${String(row.subdistrict_slug || '').toLowerCase()}/${String(row.slug || '').toLowerCase()}`,
      row,
    ])
  );

  return recentList
    .map((item) => {
      const key = `${item.subdistrict_slug}/${item.slug}`;
      return byKey.get(key) || item;
    })
    .filter(Boolean);
}

