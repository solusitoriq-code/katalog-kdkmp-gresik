export const RESERVED_SLUGS = ['admin', 'login', 'api', 'assets', 'dev'];

export function isReservedSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  return RESERVED_SLUGS.includes(slug.trim().toLowerCase());
}

