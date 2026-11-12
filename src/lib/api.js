import { supabase, isDemoMode } from './supabase';
import { withCache, DEFAULT_TTL_MS, invalidateCache } from './cache';
import {
  getDemoSubdistricts,
  createDemoSubdistrict,
  updateDemoSubdistrict,
  getDemoVillages,
  createDemoVillage,
  updateDemoVillage,
  toggleDemoVillageActive,
  getDemoVillageDirectory,
  getDemoVillageById,
  updateDemoVillageById,
  getDemoVillageCatalog,
  getDemoVillageAdmins,
  assignDemoVillageAdmin,
  revokeDemoVillageAdmin,
  findDemoAdminUserById,
  findDemoAuthUserByEmail,
  getDemoAdminByUserId,
  getDemoAdminCategoriesByVillageId,
  setDemoAdminCategoriesByVillageId,
  findDemoCategoryById,
  getDemoAdminProductsByVillageId,
  setDemoAdminProductsByVillageId,
  findDemoProductById,
  putDemoStorageObject,
  deleteDemoStorageObject,
  getDemoStorageObject,
  listDemoStorageObjects,
  resetDemoAdminData,
  getAllDemoCategories,
  getAllDemoAdminProducts,
  getDemoProductUnits,
  createDemoProductUnit,
  updateDemoProductUnit,
  deleteDemoProductUnit,
  moveDemoProductUnit,
  recordDemoOrderLog,
  getDemoVillageStats,
  getDemoOrders,
  getDemoOrderById,
  createDemoOrder,
  updateDemoOrderStatus,
  updateDemoOrder,
  deleteDemoOrder,
  resetDemoOrders,
  ORDER_STATUSES,
  SUPER_ADMIN_USER_ID,
} from './demoData';
import { isReservedSlug } from '../config/reservedSlugs';
import { matchesTextFields } from './search';
import { normalizePhone, isValidPhone } from './whatsapp';
import {
  PRODUCT_IMAGES_BUCKET,
  IMAGE_CACHE_CONTROL,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_SIDE_PX,
  MAX_LOGO_SIDE_PX,
  generateUuid,
  buildProductImagePath,
  extractStorageObjectPath,
  compressImageToWebp,
  driveImageUrl,
} from './image';

export { SUPER_ADMIN_USER_ID };

export const PRODUCT_UNITS = [
  'kg',
  'liter',
  'pcs',
  'karung',
  'botol',
  'ikat',
  'pack',
  'lainnya',
];

export const PRODUCT_STOCK_OPTIONS = [
  { value: 'ready', label: 'Tersedia' },
  { value: 'pre-order', label: 'Pre-Order' },
  { value: 'habis', label: 'Habis' },
];

const DEMO_SESSION_KEY = 'kdkmp:demo_session';
const DEMO_PASSWORDS_KEY = 'kdkmp:demo_passwords';
const DEMO_AUTH_EVENT = 'kdkmp:auth-change';
const DEFAULT_DEMO_PASSWORDS = ['password123', 'admin123', 'kdkmp123'];

function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function readDemoSession() {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.user && parsed.user.id) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeDemoSession(session) {
  const storage = getStorage();
  if (!storage) return;
  try {
    if (session) {
      storage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
    } else {
      storage.removeItem(DEMO_SESSION_KEY);
    }
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(
      new CustomEvent(DEMO_AUTH_EVENT, { detail: { session: session ?? null } })
    );
  }
}

const inMemoryDemoPasswords = {};

function isValidDemoPassword(email, password) {
  const pwd = String(password ?? '');
  if (pwd.length < 6) return false;
  const storage = getStorage();
  if (storage) {
    try {
      const map = JSON.parse(storage.getItem(DEMO_PASSWORDS_KEY) || '{}');
      if (map[email]) {
        return pwd === map[email];
      }
    } catch {
      // ignore
    }
  } else if (inMemoryDemoPasswords[email]) {
    return pwd === inMemoryDemoPasswords[email];
  }
  return DEFAULT_DEMO_PASSWORDS.includes(pwd);
}

function saveDemoPassword(email, newPassword) {
  if (!email) return;
  inMemoryDemoPasswords[email] = newPassword;
  const storage = getStorage();
  if (!storage) return;
  try {
    const map = JSON.parse(storage.getItem(DEMO_PASSWORDS_KEY) || '{}');
    map[email] = newPassword;
    storage.setItem(DEMO_PASSWORDS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function normalizeAdminVillage(row) {
  if (!row) return null;
  const sub = Array.isArray(row.subdistricts)
    ? row.subdistricts[0]
    : row.subdistricts;
  return {
    id: row.id,
    code: row.code,
    subdistrict_id: row.subdistrict_id,
    subdistrict_code: row.subdistrict_code ?? sub?.code ?? '',
    subdistrict_name: row.subdistrict_name ?? sub?.name ?? '',
    subdistrict_slug: row.subdistrict_slug ?? sub?.slug ?? '',
    subdistrict_sort_order: row.subdistrict_sort_order ?? sub?.sort_order ?? 0,
    name: row.name,
    slug: row.slug,
    type: row.type,
    business_name: row.business_name,
    whatsapp_number: row.whatsapp_number,
    address: row.address,
    gmaps_url: row.gmaps_url,
    logo_url: row.logo_url,
    opening_hour: String(row.opening_hour ?? '07:00').slice(0, 5),
    closing_hour: String(row.closing_hour ?? '20:00').slice(0, 5),
    free_delivery_min: Number(row.free_delivery_min ?? 0),
    delivery_note: row.delivery_note,
    is_active: Boolean(row.is_active),
  };
}

export function isDemoActive(explicitDemo = false) {
  if (explicitDemo) return true;
  if (isDemoMode() || !supabase) return true;
  if (typeof window !== 'undefined' && readDemoSession()?.is_demo) return true;
  return false;
}

export function summarizeProductsByStock(products = []) {
  let total = 0;
  let ready = 0;
  let habis = 0;
  let preOrder = 0;

  for (const item of products) {
    if (!item) continue;
    total += 1;
    if (item.stock_status === 'ready') {
      ready += 1;
    } else if (item.stock_status === 'habis') {
      habis += 1;
    } else if (item.stock_status === 'pre-order') {
      preOrder += 1;
    }
  }

  return { total, ready, habis, preOrder };
}


export async function getSubdistricts({
  force = false,
  ttlMs = DEFAULT_TTL_MS,
  demo = false,
} = {}) {
  return withCache(
    'subdistricts:active',
    async () => {
      if (isDemoActive(demo)) {
        return getDemoSubdistricts();
      }

      const { data, error } = await supabase
        .from('subdistricts')
        .select('id, code, name, slug, is_active, sort_order, created_at')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    { force, ttlMs }
  );
}

export async function getVillageDirectory({
  kecamatan = '',
  q = '',
  force = false,
  ttlMs = DEFAULT_TTL_MS,
  demo = false,
} = {}) {
  const kecSlug = String(kecamatan ?? '').trim().toLowerCase();
  const cacheKey = `directory:${kecSlug || 'all'}`;

  const rows = await withCache(
    cacheKey,
    async () => {
      if (isDemoActive(demo)) {
        const activeSubIds = new Set(
          getDemoSubdistricts({ all: false }).map((s) => s.id)
        );
        let allDemo = getDemoVillageDirectory().filter(
          (v) => v.is_active && activeSubIds.has(v.subdistrict_id)
        );
        if (!kecSlug) return allDemo;
        return allDemo.filter((v) => v.subdistrict_slug === kecSlug);
      }

      let query = supabase
        .from('v_village_directory')
        .select('*')
        .order('subdistrict_sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (kecSlug) {
        query = query.eq('subdistrict_slug', kecSlug);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    { force, ttlMs }
  );

  const searchQuery = String(q ?? '').trim();
  if (!searchQuery) {
    return rows;
  }

  return rows.filter((row) =>
    matchesTextFields(
      [
        row.business_name,
        row.name,
        row.type,
        row.subdistrict_name,
        row.address,
      ],
      searchQuery
    )
  );
}

export async function getVillageCatalog(
  kecamatan,
  desa,
  { force = false, ttlMs = DEFAULT_TTL_MS, demo = false } = {}
) {
  const kecSlug = String(kecamatan ?? '').trim().toLowerCase();
  const desaSlug = String(desa ?? '').trim().toLowerCase();
  if (!kecSlug || !desaSlug) return null;

  const cacheKey = `catalog:${kecSlug}:${desaSlug}`;

  return withCache(
    cacheKey,
    async () => {
      if (isDemoActive(demo)) {
        return getDemoVillageCatalog(kecSlug, desaSlug);
      }

      const { data, error } = await supabase.rpc('get_village_catalog', {
        p_kecamatan: kecSlug,
        p_desa: desaSlug,
      });

      if (error) throw error;
      return data ?? null;
    },
    { force, ttlMs }
  );
}

export async function getAdminSession({ demo = false } = {}) {
  const demoSession = readDemoSession();
  if (demo || isDemoMode() || !supabase) {
    return demoSession;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    if (import.meta.env?.DEV && demoSession) return demoSession;
    throw error;
  }
  if (data?.session) {
    return data.session;
  }
  if (import.meta.env?.DEV && demoSession) {
    return demoSession;
  }
  return null;
}

export function onAdminAuthStateChange(callback) {
  const handleDemoEvent = (event) => {
    callback(event?.detail?.session ?? readDemoSession());
  };

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener(DEMO_AUTH_EVENT, handleDemoEvent);
  }

  let authSubscription = null;
  if (!isDemoMode() && supabase) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        callback(session);
      } else {
        callback(readDemoSession());
      }
    });
    authSubscription = data?.subscription ?? null;
  }

  return () => {
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener(DEMO_AUTH_EVENT, handleDemoEvent);
    }
    if (authSubscription && typeof authSubscription.unsubscribe === 'function') {
      authSubscription.unsubscribe();
    }
  };
}

export async function signInAdmin({ email, password, demo = false } = {}) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  const rawPassword = String(password ?? '');

  if (!normalizedEmail || !rawPassword) {
    throw new Error('Email dan kata sandi wajib diisi.');
  }

  if (!demo && !isDemoMode() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: rawPassword,
    });

    if (!error && data?.session) {
      writeDemoSession(null);
      return { session: data.session, user: data.user };
    }

    if (import.meta.env?.DEV) {
      const demoUser = findDemoAuthUserByEmail(normalizedEmail);
      if (demoUser && isValidDemoPassword(normalizedEmail, rawPassword)) {
        const session = {
          access_token: `demo-token-${demoUser.id}`,
          is_demo: true,
          user: {
            id: demoUser.id,
            email: demoUser.email,
          },
        };
        writeDemoSession(session);
        return { session, user: session.user };
      }
    }

    throw new Error('Email atau kata sandi salah.');
  }

  const demoUser = findDemoAuthUserByEmail(normalizedEmail);
  if (!demoUser || !isValidDemoPassword(normalizedEmail, rawPassword)) {
    throw new Error('Email atau kata sandi salah.');
  }

  const session = {
    access_token: `demo-token-${demoUser.id}`,
    is_demo: true,
    user: {
      id: demoUser.id,
      email: demoUser.email,
    },
  };
  writeDemoSession(session);
  return { session, user: session.user };
}

export async function signOutAdmin({ demo = false } = {}) {
  writeDemoSession(null);
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem('kdkmp:admin:selected_village_id');
    } catch {
      // ignore
    }
  }
  if (!demo && !isDemoMode() && supabase) {
    await supabase.auth.signOut();
  }
}

export async function resetAdminPassword(
  email,
  { redirectTo, demo = false } = {}
) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Masukkan alamat email yang valid.');
  }

  const targetRedirect =
    redirectTo ||
    (typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}/admin/reset`
      : '/admin/reset');

  if (!demo && !isDemoMode() && supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: targetRedirect,
      }
    );
    if (error && !(import.meta.env?.DEV && findDemoAuthUserByEmail(normalizedEmail))) {
      throw new Error(error.message || 'Gagal mengirim tautan reset kata sandi.');
    }
  }

  return {
    ok: true,
    email: normalizedEmail,
    redirectTo: targetRedirect,
  };
}

export async function updateAdminPassword(
  newPassword,
  { demo = false } = {}
) {
  const pwd = String(newPassword ?? '');
  if (pwd.length < 6) {
    throw new Error('Kata sandi minimal 6 karakter.');
  }

  const demoSession = readDemoSession();
  if (demo || isDemoMode() || !supabase || demoSession?.is_demo) {
    const targetEmail = demoSession?.user?.email || 'golokan@kdkmp-gresik.id';
    saveDemoPassword(targetEmail, pwd);
    return { ok: true };
  }

  const { data, error } = await supabase.auth.updateUser({
    password: pwd,
  });

  if (error) {
    if (import.meta.env?.DEV) {
      saveDemoPassword('golokan@kdkmp-gresik.id', pwd);
      return { ok: true };
    }
    throw new Error(error.message || 'Gagal memperbarui kata sandi.');
  }

  return { ok: true, user: data?.user ?? null };
}

export async function getAdminProfile(
  userId,
  { isDemo = false, demo = false } = {}
) {
  const uid = String(userId ?? '').trim();
  if (!uid) {
    return { admin: null, villages: [] };
  }

  if (demo || isDemo || isDemoMode() || !supabase) {
    const admin = getDemoAdminByUserId(uid);
    if (!admin) {
      return { admin: null, villages: [] };
    }
    const allDemoVillages = getDemoVillageDirectory().map(normalizeAdminVillage);
    if (admin.role === 'village_admin') {
      const ownVillage = allDemoVillages.find((v) => v.id === admin.village_id);
      return {
        admin,
        villages: ownVillage ? [ownVillage] : [],
      };
    }
    return {
      admin,
      villages: allDemoVillages,
    };
  }

  const { data: adminRow, error: adminErr } = await supabase
    .from('admins')
    .select('user_id, role, village_id, created_at')
    .eq('user_id', uid)
    .maybeSingle();

  if (adminErr) throw adminErr;
  if (!adminRow) {
    return { admin: null, villages: [] };
  }

  if (adminRow.role === 'village_admin') {
    const { data: villageRow, error: villageErr } = await supabase
      .from('villages')
      .select(
        'id, code, subdistrict_id, name, slug, type, business_name, whatsapp_number, address, gmaps_url, logo_url, opening_hour, closing_hour, free_delivery_min, delivery_note, is_active, subdistricts(id, code, name, slug, is_active, sort_order)'
      )
      .eq('id', adminRow.village_id)
      .maybeSingle();

    if (villageErr) throw villageErr;
    const normalized = normalizeAdminVillage(villageRow);
    return {
      admin: adminRow,
      villages: normalized ? [normalized] : [],
    };
  }

  const { data: activeVillages, error: villagesErr } = await supabase
    .from('villages')
    .select(
      'id, code, subdistrict_id, name, slug, type, business_name, whatsapp_number, address, gmaps_url, logo_url, opening_hour, closing_hour, free_delivery_min, delivery_note, is_active, subdistricts(id, code, name, slug, is_active, sort_order)'
    )
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (villagesErr) throw villagesErr;

  const list = (activeVillages ?? [])
    .map(normalizeAdminVillage)
    .filter(Boolean)
    .sort((a, b) => {
      if (a.subdistrict_sort_order !== b.subdistrict_sort_order) {
        return a.subdistrict_sort_order - b.subdistrict_sort_order;
      }
      return a.name.localeCompare(b.name, 'id');
    });

  return {
    admin: adminRow,
    villages: list,
  };
}

export async function getAdminProductSummary(
  villageId,
  { isDemo = false, demo = false, isSuperAdmin = false, actorUserId } = {}
) {
  const vid = String(villageId ?? '').trim();
  const resolvedUserId =
    actorUserId !== undefined
      ? String(actorUserId ?? '').trim()
      : String(readDemoSession()?.user?.id ?? '').trim();
  const admin = resolvedUserId ? getDemoAdminByUserId(resolvedUserId) : null;
  const effectiveSuperAdmin = isSuperAdmin || admin?.role === 'super_admin';

  if (!vid && !effectiveSuperAdmin) {
    return { total: 0, ready: 0, habis: 0, preOrder: 0 };
  }

  if (demo || isDemo || isDemoMode() || !supabase) {
    if (effectiveSuperAdmin && !vid) {
      const products = getAllDemoAdminProducts();
      return summarizeProductsByStock(products);
    }
    const products = getDemoAdminProductsByVillageId(vid);
    return summarizeProductsByStock(products);
  }

  let query = supabase.from('products').select('id, stock_status');
  if (vid) {
    query = query.eq('village_id', vid);
  }

  const { data, error } = await query;
  if (error) throw error;
  return summarizeProductsByStock(data ?? []);
}

function createRlsError(message) {
  const err = new Error(message);
  err.code = '42501';
  return err;
}

function assertDemoVillageAccess(targetVillageId, actorUserId) {
  const vid = String(targetVillageId ?? '').trim();
  if (!vid) {
    throw new Error('village_id wajib diisi.');
  }

  const resolvedUserId =
    actorUserId !== undefined
      ? String(actorUserId ?? '').trim()
      : String(readDemoSession()?.user?.id ?? '').trim();

  if (!resolvedUserId) return;

  const admin = getDemoAdminByUserId(resolvedUserId);
  if (!admin) {
    throw createRlsError('Akun belum terdaftar sebagai admin.');
  }
  if (admin.role === 'super_admin') {
    return;
  }
  if (admin.role === 'village_admin' && admin.village_id === vid) {
    return;
  }
  throw createRlsError(
    'Akses ditolak: Anda hanya dapat mengelola data KDKMP milik sendiri.'
  );
}

function assertDemoProductMutationAccess(targetVillageId, actorUserId) {
  const resolvedUserId =
    actorUserId !== undefined
      ? String(actorUserId ?? '').trim()
      : String(readDemoSession()?.user?.id ?? '').trim();

  if (resolvedUserId) {
    const admin = getDemoAdminByUserId(resolvedUserId);
    if (admin?.role === 'super_admin') {
      throw createRlsError(
        'Akses ditolak: Tambah, ubah, dan hapus produk hanya dapat dilakukan oleh manager KDKMP (owner).'
      );
    }
  }
  assertDemoVillageAccess(targetVillageId, actorUserId);
}

function assertDemoStorageAccess(objectPath, actorUserId) {
  const cleanPath = String(objectPath ?? '').trim();
  const [folder, file] = cleanPath.split('/');
  if (
    !folder ||
    !file ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      folder
    )
  ) {
    throw createRlsError('Format path storage tidak valid.');
  }
  assertDemoVillageAccess(folder, actorUserId);
}

function invalidateVillageCatalogCache() {
  invalidateCache('catalog:');
  invalidateCache('directory:');
}

function normalizeProductRow(row) {
  if (!row) return null;
  const catObj = Array.isArray(row.categories)
    ? row.categories[0]
    : row.categories;
  const villageObj = Array.isArray(row.villages)
    ? row.villages[0]
    : row.villages;
  return {
    id: row.id,
    village_id: row.village_id,
    category_id: row.category_id ?? null,
    category_name: row.category_name ?? catObj?.name ?? null,
    kdkmp_name:
      row.kdkmp_name ??
      villageObj?.business_name ??
      (villageObj?.name ? `KDKMP Desa ${villageObj.name}` : null),
    village_name: row.village_name ?? villageObj?.name ?? null,
    name: row.name,
    description: row.description ?? null,
    price: Number(row.price ?? 0),
    original_price:
      row.original_price !== null && row.original_price !== undefined
        ? Number(row.original_price)
        : null,
    unit: row.unit || 'pcs',
    stock_status: row.stock_status || 'ready',
    image_url: row.image_url ?? null,
    is_featured: Boolean(row.is_featured),
    sort_order: Number(row.sort_order ?? 0),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

export async function getAdminCategories(
  villageId,
  { isDemo = false, demo = false, actorUserId, isSuperAdmin = false } = {}
) {
  const vid = String(villageId ?? '').trim();
  const resolvedUserId =
    actorUserId !== undefined
      ? String(actorUserId ?? '').trim()
      : String(readDemoSession()?.user?.id ?? '').trim();
  const admin = resolvedUserId ? getDemoAdminByUserId(resolvedUserId) : null;
  const effectiveSuperAdmin = isSuperAdmin || admin?.role === 'super_admin';

  if (!vid && !effectiveSuperAdmin) return [];

  if (demo || isDemo || isDemoMode() || !supabase) {
    if (vid) {
      assertDemoVillageAccess(vid, actorUserId);
    }
    return getAllDemoCategories();
  }

  const { data, error } = await supabase
    .from('categories')
    .select('id, village_id, name, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createAdminCategory(
  { villageId, name },
  { isDemo = false, demo = false, actorUserId } = {}
) {
  const vid = String(villageId ?? '').trim();
  const cleanName = String(name ?? '').trim();

  if (!vid) {
    throw new Error('Koperasi belum dipilih.');
  }
  if (!cleanName) {
    throw new Error('Nama kategori wajib diisi.');
  }
  if (cleanName.length > 50) {
    throw new Error('Nama kategori maksimal 50 karakter.');
  }

  if (demo || isDemo || isDemoMode() || !supabase) {
    assertDemoVillageAccess(vid, actorUserId);
    const existing = getDemoAdminCategoriesByVillageId(vid);
    const allExisting = getAllDemoCategories();
    const duplicate = allExisting.some(
      (c) => c.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicate) {
      throw new Error('Kategori sudah terdaftar.');
    }

    const maxSort = existing.reduce(
      (max, c) => Math.max(max, Number(c.sort_order ?? 0)),
      0
    );
    const created = {
      id: generateUuid(),
      village_id: vid,
      name: cleanName,
      sort_order: maxSort + 1,
      created_at: new Date().toISOString(),
    };
    setDemoAdminCategoriesByVillageId(vid, [...existing, created]);
    invalidateVillageCatalogCache();
    return { ...created };
  }

  const current = await getAdminCategories(vid);
  const duplicate = current.some(
    (c) => c.name.trim().toLowerCase() === cleanName.toLowerCase()
  );
  if (duplicate) {
    throw new Error('Kategori sudah terdaftar.');
  }

  const maxSort = current.reduce(
    (max, c) => Math.max(max, Number(c.sort_order ?? 0)),
    0
  );

  const { data, error } = await supabase
    .from('categories')
    .insert({
      village_id: vid,
      name: cleanName,
      sort_order: maxSort + 1,
    })
    .select('id, village_id, name, sort_order, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Kategori sudah terdaftar.');
    }
    throw error;
  }

  invalidateVillageCatalogCache();
  return data;
}

export async function updateAdminCategory(
  categoryId,
  patch,
  { villageId, isDemo = false, demo = false, actorUserId } = {}
) {
  const cid = String(categoryId ?? '').trim();
  if (!cid) {
    throw new Error('ID kategori wajib diisi.');
  }

  const resolvedUserId =
    actorUserId !== undefined
      ? String(actorUserId ?? '').trim()
      : String(readDemoSession()?.user?.id ?? '').trim();
  const admin = resolvedUserId ? getDemoAdminByUserId(resolvedUserId) : null;
  if (admin && admin.role !== 'super_admin') {
    throw createRlsError(
      'Hanya Super Admin yang dapat mengubah atau menghapus kategori master.'
    );
  }

  if (demo || isDemo || isDemoMode() || !supabase) {
    const found = findDemoCategoryById(cid);
    if (!found) {
      throw createRlsError('Kategori tidak ditemukan atau akses ditolak.');
    }
    if (villageId && String(villageId).trim() !== found.village_id) {
      throw createRlsError(
        'Akses ditolak: Anda hanya dapat mengelola data KDKMP milik sendiri.'
      );
    }
    assertDemoVillageAccess(found.village_id, actorUserId);

    const existing = getDemoAdminCategoriesByVillageId(found.village_id);
    const nextName =
      patch?.name !== undefined ? String(patch.name).trim() : found.name;

    if (!nextName) {
      throw new Error('Nama kategori wajib diisi.');
    }
    if (nextName.length > 50) {
      throw new Error('Nama kategori maksimal 50 karakter.');
    }

    const allExisting = getAllDemoCategories();
    const duplicate = allExisting.some(
      (c) =>
        c.id !== cid && c.name.trim().toLowerCase() === nextName.toLowerCase()
    );
    if (duplicate) {
      throw new Error('Kategori sudah terdaftar.');
    }

    const nextSortOrder =
      patch?.sort_order !== undefined
        ? Number(patch.sort_order)
        : found.sort_order;

    const updated = {
      ...found,
      name: nextName,
      sort_order: Number.isFinite(nextSortOrder) ? nextSortOrder : found.sort_order,
    };

    const nextList = existing.map((c) => (c.id === cid ? updated : c));
    setDemoAdminCategoriesByVillageId(found.village_id, nextList);

    const prods = getDemoAdminProductsByVillageId(found.village_id);
    setDemoAdminProductsByVillageId(
      found.village_id,
      prods.map((p) =>
        p.category_id === cid ? { ...p, category_name: nextName } : p
      )
    );

    invalidateVillageCatalogCache();
    return { ...updated };
  }

  const updateFields = {};
  if (patch?.name !== undefined) {
    const cleanName = String(patch.name).trim();
    if (!cleanName) {
      throw new Error('Nama kategori wajib diisi.');
    }
    if (cleanName.length > 50) {
      throw new Error('Nama kategori maksimal 50 karakter.');
    }
    updateFields.name = cleanName;
  }
  if (patch?.sort_order !== undefined) {
    updateFields.sort_order = Number(patch.sort_order);
  }

  let query = supabase
    .from('categories')
    .update(updateFields)
    .eq('id', cid);

  if (villageId) {
    query = query.eq('village_id', String(villageId).trim());
  }

  const { data, error } = await query
    .select('id, village_id, name, sort_order, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Kategori sudah terdaftar.');
    }
    throw error;
  }

  invalidateVillageCatalogCache();
  return data;
}

export async function reorderAdminCategories(
  villageId,
  orderedCategoryIds,
  { isDemo = false, demo = false, actorUserId } = {}
) {
  const vid = String(villageId ?? '').trim();
  if (!vid) {
    throw new Error('village_id wajib diisi.');
  }
  const idList = Array.isArray(orderedCategoryIds)
    ? orderedCategoryIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  const resolvedUserId =
    actorUserId !== undefined
      ? String(actorUserId ?? '').trim()
      : String(readDemoSession()?.user?.id ?? '').trim();
  const admin = resolvedUserId ? getDemoAdminByUserId(resolvedUserId) : null;
  if (admin && admin.role !== 'super_admin') {
    throw createRlsError(
      'Hanya Super Admin yang dapat mengubah urutan kategori master.'
    );
  }

  if (demo || isDemo || isDemoMode() || !supabase) {
    assertDemoVillageAccess(vid, actorUserId);
    const existing = getDemoAdminCategoriesByVillageId(vid);
    const byId = new Map(existing.map((c) => [c.id, c]));

    for (const id of idList) {
      if (!byId.has(id)) {
        throw createRlsError('Kategori tidak ditemukan pada koperasi ini.');
      }
    }

    const reordered = [];
    idList.forEach((id, idx) => {
      const cat = byId.get(id);
      if (cat) {
        reordered.push({ ...cat, sort_order: idx + 1 });
        byId.delete(id);
      }
    });
    for (const remaining of byId.values()) {
      reordered.push({ ...remaining, sort_order: reordered.length + 1 });
    }

    setDemoAdminCategoriesByVillageId(vid, reordered);
    invalidateVillageCatalogCache();
    return getDemoAdminCategoriesByVillageId(vid);
  }

  for (let i = 0; i < idList.length; i += 1) {
    const { error } = await supabase
      .from('categories')
      .update({ sort_order: i + 1 })
      .eq('id', idList[i])
      .eq('village_id', vid);
    if (error) throw error;
  }

  invalidateVillageCatalogCache();
  return getAdminCategories(vid);
}

export async function moveAdminCategory(
  categoryId,
  direction,
  { villageId, isDemo = false, demo = false, actorUserId } = {}
) {
  const cid = String(categoryId ?? '').trim();
  const dir = String(direction ?? '').trim().toLowerCase();
  if (!cid || (dir !== 'up' && dir !== 'down')) {
    throw new Error('Parameter urutan kategori tidak valid.');
  }

  const resolvedUserId =
    actorUserId !== undefined
      ? String(actorUserId ?? '').trim()
      : String(readDemoSession()?.user?.id ?? '').trim();
  const admin = resolvedUserId ? getDemoAdminByUserId(resolvedUserId) : null;
  if (admin && admin.role !== 'super_admin') {
    throw createRlsError(
      'Hanya Super Admin yang dapat mengubah urutan kategori master.'
    );
  }

  const targetVid =
    String(villageId ?? '').trim() ||
    findDemoCategoryById(cid)?.village_id ||
    '';

  const current = await getAdminCategories(targetVid, {
    isDemo,
    demo,
    actorUserId,
  });

  const idx = current.findIndex((c) => c.id === cid);
  if (idx === -1) {
    throw createRlsError('Kategori tidak ditemukan atau akses ditolak.');
  }

  const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= current.length) {
    return current;
  }

  const nextOrder = current.map((c) => c.id);
  const temp = nextOrder[idx];
  nextOrder[idx] = nextOrder[swapIdx];
  nextOrder[swapIdx] = temp;

  return reorderAdminCategories(targetVid, nextOrder, {
    isDemo,
    demo,
    actorUserId,
  });
}

export async function deleteAdminCategory(
  categoryId,
  { villageId, isDemo = false, demo = false, actorUserId } = {}
) {
  const cid = String(categoryId ?? '').trim();
  if (!cid) {
    throw new Error('ID kategori wajib diisi.');
  }

  const resolvedUserId =
    actorUserId !== undefined
      ? String(actorUserId ?? '').trim()
      : String(readDemoSession()?.user?.id ?? '').trim();
  const admin = resolvedUserId ? getDemoAdminByUserId(resolvedUserId) : null;
  if (admin && admin.role !== 'super_admin') {
    throw createRlsError(
      'Hanya Super Admin yang dapat mengubah atau menghapus kategori master.'
    );
  }

  if (demo || isDemo || isDemoMode() || !supabase) {
    const found = findDemoCategoryById(cid);
    if (!found) {
      throw createRlsError('Kategori tidak ditemukan atau akses ditolak.');
    }
    if (villageId && String(villageId).trim() !== found.village_id) {
      throw createRlsError(
        'Akses ditolak: Anda hanya dapat mengelola data KDKMP milik sendiri.'
      );
    }
    assertDemoVillageAccess(found.village_id, actorUserId);

    const remainingCats = getDemoAdminCategoriesByVillageId(found.village_id)
      .filter((c) => c.id !== cid)
      .map((c, idx) => ({ ...c, sort_order: idx + 1 }));
    setDemoAdminCategoriesByVillageId(found.village_id, remainingCats);

    // ON DELETE SET NULL: produk dalam kategori ini menjadi tanpa kategori
    const prods = getDemoAdminProductsByVillageId(found.village_id);
    setDemoAdminProductsByVillageId(
      found.village_id,
      prods.map((p) =>
        p.category_id === cid
          ? { ...p, category_id: null, category_name: null }
          : p
      )
    );

    invalidateVillageCatalogCache();
    return { deleted: true, id: cid };
  }

  let query = supabase.from('categories').delete().eq('id', cid);
  if (villageId) {
    query = query.eq('village_id', String(villageId).trim());
  }

  const { error } = await query;
  if (error) throw error;

  invalidateVillageCatalogCache();
  return { deleted: true, id: cid };
}

export async function getAdminProducts(
  villageId,
  { isDemo = false, demo = false, actorUserId, isSuperAdmin = false } = {}
) {
  const vid = String(villageId ?? '').trim();
  const resolvedUserId =
    actorUserId !== undefined
      ? String(actorUserId ?? '').trim()
      : String(readDemoSession()?.user?.id ?? '').trim();
  const admin = resolvedUserId ? getDemoAdminByUserId(resolvedUserId) : null;
  const effectiveSuperAdmin = isSuperAdmin || admin?.role === 'super_admin';

  if (!vid && !effectiveSuperAdmin) return [];

  if (demo || isDemo || isDemoMode() || !supabase) {
    if (effectiveSuperAdmin && !vid) {
      return getAllDemoAdminProducts();
    }
    assertDemoVillageAccess(vid, actorUserId);
    return getDemoAdminProductsByVillageId(vid);
  }

  let query = supabase
    .from('products')
    .select(
      'id, village_id, category_id, name, description, price, original_price, unit, stock_status, image_url, is_featured, sort_order, updated_at, categories(id, name), villages(id, name, business_name)'
    );

  if (vid) {
    query = query.eq('village_id', vid);
  }

  const { data, error } = await query
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(normalizeProductRow);
}

export async function uploadProductImage(
  { villageId, file, previousImageUrl = null },
  { isDemo = false, demo = false, actorUserId } = {}
) {
  const vid = String(villageId ?? '').trim();
  if (!vid) {
    throw new Error('village_id wajib diisi untuk mengunggah foto.');
  }

  const compressed = await compressImageToWebp(file, {
    maxSide: MAX_IMAGE_SIDE_PX,
    maxBytes: MAX_IMAGE_BYTES,
  });

  const objectPath = buildProductImagePath(vid);

  if (isDemoActive(demo || isDemo)) {
    assertDemoProductMutationAccess(vid, actorUserId);
    assertDemoStorageAccess(objectPath, actorUserId);
    putDemoStorageObject(objectPath, {
      bucket: PRODUCT_IMAGES_BUCKET,
      villageId: vid,
      mimeType: compressed.mimeType,
      size: compressed.compressedSize,
      width: compressed.width,
      height: compressed.height,
      cacheControl: IMAGE_CACHE_CONTROL,
    });

    if (previousImageUrl) {
      await deleteProductImage(previousImageUrl, {
        villageId: vid,
        isDemo: true,
        demo: true,
        actorUserId,
      }).catch(() => {});
    }

    const basePreview =
      compressed.dataUrl || `demo://${PRODUCT_IMAGES_BUCKET}/${objectPath}`;
    const publicUrl = basePreview.includes('#storage=')
      ? basePreview
      : `${basePreview}#storage=${PRODUCT_IMAGES_BUCKET}/${objectPath}`;

    return {
      publicUrl,
      objectPath,
      width: compressed.width,
      height: compressed.height,
      originalWidth: compressed.originalWidth,
      originalHeight: compressed.originalHeight,
      originalSize: compressed.originalSize,
      compressedSize: compressed.compressedSize,
      mimeType: compressed.mimeType,
      cacheControl: IMAGE_CACHE_CONTROL,
    };
  }

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(objectPath, compressed.blob, {
      contentType: 'image/webp',
      cacheControl: IMAGE_CACHE_CONTROL,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(objectPath);

  if (previousImageUrl) {
    await deleteProductImage(previousImageUrl, {
      villageId: vid,
      isDemo,
      demo,
      actorUserId,
    }).catch(() => {});
  }

  return {
    publicUrl: urlData?.publicUrl || '',
    objectPath,
    width: compressed.width,
    height: compressed.height,
    originalWidth: compressed.originalWidth,
    originalHeight: compressed.originalHeight,
    originalSize: compressed.originalSize,
    compressedSize: compressed.compressedSize,
    mimeType: compressed.mimeType,
    cacheControl: IMAGE_CACHE_CONTROL,
  };
}

export async function deleteProductImage(
  imageUrlOrPath,
  { villageId, isDemo = false, demo = false, actorUserId } = {}
) {
  const raw = String(imageUrlOrPath ?? '').trim();
  if (!raw) {
    return { deleted: false, objectPath: null };
  }

  const extracted =
    extractStorageObjectPath(raw, PRODUCT_IMAGES_BUCKET) ||
    (/^[0-9a-f-]{36}\/[^/]+$/i.test(raw) ? raw : null);

  if (!extracted) {
    return { deleted: false, objectPath: null, reason: 'external' };
  }

  const [folder] = extracted.split('/');
  if (villageId && String(villageId).trim() !== folder) {
    throw createRlsError(
      'Akses ditolak: Anda tidak dapat menghapus file storage KDKMP lain.'
    );
  }

  if (demo || isDemo || isDemoMode() || !supabase) {
    assertDemoStorageAccess(extracted, actorUserId);
    const removed = deleteDemoStorageObject(extracted);
    return { deleted: removed, objectPath: extracted };
  }

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([extracted]);

  if (error) throw error;
  return { deleted: true, objectPath: extracted };
}

function validateAndSanitizeProductInput(payload, { isPartial = false } = {}) {
  const out = {};

  if (!isPartial || payload.name !== undefined) {
    const cleanName = String(payload.name ?? '').trim();
    if (!cleanName) {
      throw new Error('Nama produk wajib diisi.');
    }
    if (cleanName.length > 150) {
      throw new Error('Nama produk maksimal 150 karakter.');
    }
    out.name = cleanName;
  }

  if (!isPartial || payload.price !== undefined) {
    const priceNum = Number(payload.price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      throw new Error('Harga harus berupa angka minimal Rp 0.');
    }
    out.price = Math.round(priceNum);
  }

  if (!isPartial || payload.original_price !== undefined) {
    const rawOrig = payload.original_price;
    if (rawOrig === null || rawOrig === undefined || rawOrig === '') {
      out.original_price = null;
    } else {
      const origNum = Number(rawOrig);
      if (!Number.isFinite(origNum) || origNum <= 0) {
        throw new Error('Harga coret harus lebih besar dari harga jual.');
      }
      out.original_price = Math.round(origNum);
    }
  }

  if (!isPartial || payload.unit !== undefined) {
    const cleanUnit = String(payload.unit ?? 'pcs').trim();
    if (!cleanUnit) {
      throw new Error('Satuan wajib diisi.');
    }
    if (cleanUnit.length > 30) {
      throw new Error('Satuan maksimal 30 karakter.');
    }
    out.unit = cleanUnit;
  }

  if (!isPartial || payload.stock_status !== undefined) {
    const status = String(payload.stock_status ?? 'ready').trim();
    if (!['ready', 'pre-order', 'habis'].includes(status)) {
      throw new Error('Status stok tidak valid.');
    }
    out.stock_status = status;
  }

  if (!isPartial || payload.is_featured !== undefined) {
    out.is_featured = Boolean(payload.is_featured);
  }

  if (!isPartial || payload.category_id !== undefined) {
    const cid = String(payload.category_id ?? '').trim();
    out.category_id = cid || null;
  }

  if (!isPartial || payload.description !== undefined) {
    const desc = String(payload.description ?? '').trim();
    out.description = desc || null;
  }

  if (!isPartial || payload.image_url !== undefined) {
    const rawImg = String(payload.image_url ?? '').trim();
    out.image_url = rawImg ? driveImageUrl(rawImg) : null;
  }

  return out;
}

export async function createAdminProduct(
  payload,
  { isDemo = false, demo = false, actorUserId } = {}
) {
  const vid = String(payload?.village_id ?? payload?.villageId ?? '').trim();
  if (!vid) {
    throw new Error('Koperasi belum dipilih.');
  }

  const sanitized = validateAndSanitizeProductInput(payload, {
    isPartial: false,
  });

  if (
    sanitized.original_price !== null &&
    sanitized.original_price <= sanitized.price
  ) {
    throw new Error('Harga coret harus lebih besar dari harga jual.');
  }

  if (demo || isDemo || isDemoMode() || !supabase) {
    assertDemoProductMutationAccess(vid, actorUserId);

    let categoryName = null;
    if (sanitized.category_id) {
      const cat = findDemoCategoryById(sanitized.category_id);
      if (!cat) {
        throw createRlsError('Kategori tidak valid untuk koperasi ini.');
      }
      categoryName = cat.name;
    }

    const existing = getDemoAdminProductsByVillageId(vid);
    const maxSort = existing.reduce(
      (max, p) => Math.max(max, Number(p.sort_order ?? 0)),
      0
    );

    const created = {
      id: generateUuid(),
      village_id: vid,
      category_id: sanitized.category_id,
      category_name: categoryName,
      name: sanitized.name,
      description: sanitized.description,
      price: sanitized.price,
      original_price: sanitized.original_price,
      unit: sanitized.unit,
      stock_status: sanitized.stock_status,
      image_url: sanitized.image_url,
      is_featured: sanitized.is_featured,
      sort_order: maxSort + 1,
      updated_at: new Date().toISOString(),
    };

    setDemoAdminProductsByVillageId(vid, [...existing, created]);
    invalidateVillageCatalogCache();
    return { ...created };
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      village_id: vid,
      category_id: sanitized.category_id,
      name: sanitized.name,
      description: sanitized.description,
      price: sanitized.price,
      original_price: sanitized.original_price,
      unit: sanitized.unit,
      stock_status: sanitized.stock_status,
      image_url: sanitized.image_url,
      is_featured: sanitized.is_featured,
    })
    .select(
      'id, village_id, category_id, name, description, price, original_price, unit, stock_status, image_url, is_featured, sort_order, updated_at, categories(id, name)'
    )
    .single();

  if (error) throw error;
  invalidateVillageCatalogCache();
  return normalizeProductRow(data);
}

export async function updateAdminProduct(
  productId,
  patch,
  { villageId, isDemo = false, demo = false, actorUserId } = {}
) {
  const pid = String(productId ?? '').trim();
  if (!pid) {
    throw new Error('ID produk wajib diisi.');
  }

  const sanitized = validateAndSanitizeProductInput(patch, { isPartial: true });

  if (demo || isDemo || isDemoMode() || !supabase) {
    const existing = findDemoProductById(pid);
    if (!existing) {
      throw createRlsError('Produk tidak ditemukan atau akses ditolak.');
    }
    if (villageId && String(villageId).trim() !== existing.village_id) {
      throw createRlsError(
        'Akses ditolak: Anda hanya dapat mengelola data KDKMP milik sendiri.'
      );
    }
    assertDemoProductMutationAccess(existing.village_id, actorUserId);

    const nextPrice =
      sanitized.price !== undefined ? sanitized.price : existing.price;
    let nextOrig =
      sanitized.original_price !== undefined
        ? sanitized.original_price
        : existing.original_price;

    if (
      sanitized.original_price !== undefined &&
      nextOrig !== null &&
      nextOrig <= nextPrice
    ) {
      throw new Error('Harga coret harus lebih besar dari harga jual.');
    }
    if (
      sanitized.original_price === undefined &&
      nextOrig !== null &&
      nextOrig <= nextPrice
    ) {
      nextOrig = null;
    }

    let nextCategoryId =
      sanitized.category_id !== undefined
        ? sanitized.category_id
        : existing.category_id;
    let nextCategoryName = existing.category_name;

    if (sanitized.category_id !== undefined) {
      if (!nextCategoryId) {
        nextCategoryName = null;
      } else {
        const cat = findDemoCategoryById(nextCategoryId);
        if (!cat) {
          throw createRlsError('Kategori tidak valid untuk koperasi ini.');
        }
        nextCategoryName = cat.name;
      }
    }

    const oldImageUrl = existing.image_url;
    const nextImageUrl =
      sanitized.image_url !== undefined ? sanitized.image_url : oldImageUrl;

    const updated = {
      ...existing,
      ...sanitized,
      price: nextPrice,
      original_price: nextOrig,
      category_id: nextCategoryId,
      category_name: nextCategoryName,
      image_url: nextImageUrl,
      updated_at: new Date().toISOString(),
    };

    const allInVillage = getDemoAdminProductsByVillageId(existing.village_id);
    setDemoAdminProductsByVillageId(
      existing.village_id,
      allInVillage.map((p) => (p.id === pid ? updated : p))
    );

    if (
      sanitized.image_url !== undefined &&
      oldImageUrl &&
      oldImageUrl !== nextImageUrl
    ) {
      await deleteProductImage(oldImageUrl, {
        villageId: existing.village_id,
        isDemo: true,
        demo: true,
        actorUserId,
      }).catch(() => {});
    }

    invalidateVillageCatalogCache();
    return { ...updated };
  }

  let previousImageUrl = null;
  if (sanitized.image_url !== undefined) {
    const { data: prevRow } = await supabase
      .from('products')
      .select('id, village_id, image_url')
      .eq('id', pid)
      .maybeSingle();
    previousImageUrl = prevRow?.image_url ?? null;
  }

  if (
    sanitized.price !== undefined &&
    sanitized.original_price !== undefined &&
    sanitized.original_price !== null &&
    sanitized.original_price <= sanitized.price
  ) {
    throw new Error('Harga coret harus lebih besar dari harga jual.');
  }

  let query = supabase.from('products').update(sanitized).eq('id', pid);
  if (villageId) {
    query = query.eq('village_id', String(villageId).trim());
  }

  const { data, error } = await query
    .select(
      'id, village_id, category_id, name, description, price, original_price, unit, stock_status, image_url, is_featured, sort_order, updated_at, categories(id, name)'
    )
    .single();

  if (error) throw error;

  if (
    sanitized.image_url !== undefined &&
    previousImageUrl &&
    previousImageUrl !== sanitized.image_url
  ) {
    await deleteProductImage(previousImageUrl, {
      villageId: data.village_id,
      isDemo,
      demo,
      actorUserId,
    }).catch(() => {});
  }

  invalidateVillageCatalogCache();
  return normalizeProductRow(data);
}

export async function batchUpdateAdminProductPrices(
  changes,
  { villageId, isDemo = false, demo = false, actorUserId } = {}
) {
  const vid = String(villageId ?? '').trim();
  if (!vid) {
    throw new Error('Koperasi belum dipilih.');
  }
  const items = Array.isArray(changes) ? changes : [];
  if (items.length === 0) {
    return { updatedCount: 0, products: await getAdminProducts(vid, { isDemo, demo, actorUserId }) };
  }

  for (const item of items) {
    const priceNum = Number(item?.price);
    if (!item?.id || !Number.isFinite(priceNum) || priceNum < 0) {
      throw new Error('Semua harga harus berupa angka minimal Rp 0.');
    }
  }

  if (demo || isDemo || isDemoMode() || !supabase) {
    assertDemoProductMutationAccess(vid, actorUserId);
    const existing = getDemoAdminProductsByVillageId(vid);
    const byId = new Map(existing.map((p) => [p.id, p]));

    for (const item of items) {
      if (!byId.has(String(item.id).trim())) {
        throw createRlsError(
          'Akses ditolak: Produk tidak ditemukan pada koperasi ini.'
        );
      }
    }

    const changeMap = new Map(
      items.map((item) => [String(item.id).trim(), Math.round(Number(item.price))])
    );

    let updatedCount = 0;
    const nowIso = new Date().toISOString();
    const nextProducts = existing.map((p) => {
      if (!changeMap.has(p.id)) return p;
      const nextPrice = changeMap.get(p.id);
      if (nextPrice === p.price) return p;
      updatedCount += 1;
      const nextOrig =
        p.original_price !== null && p.original_price > nextPrice
          ? p.original_price
          : null;
      return {
        ...p,
        price: nextPrice,
        original_price: nextOrig,
        updated_at: nowIso,
      };
    });

    setDemoAdminProductsByVillageId(vid, nextProducts);
    invalidateVillageCatalogCache();
    return {
      updatedCount,
      products: getDemoAdminProductsByVillageId(vid),
    };
  }

  const currentProducts = await getAdminProducts(vid);
  const currentMap = new Map(currentProducts.map((p) => [p.id, p]));
  let updatedCount = 0;

  for (const item of items) {
    const pid = String(item.id).trim();
    const nextPrice = Math.round(Number(item.price));
    const current = currentMap.get(pid);
    if (current && current.price === nextPrice) continue;

    const patch = { price: nextPrice };
    if (
      current &&
      current.original_price !== null &&
      current.original_price <= nextPrice
    ) {
      patch.original_price = null;
    }

    const { error } = await supabase
      .from('products')
      .update(patch)
      .eq('id', pid)
      .eq('village_id', vid);

    if (error) throw error;
    updatedCount += 1;
  }

  invalidateVillageCatalogCache();
  return {
    updatedCount,
    products: await getAdminProducts(vid),
  };
}

export async function deleteAdminProduct(
  productId,
  { villageId, isDemo = false, demo = false, actorUserId } = {}
) {
  const pid = String(productId ?? '').trim();
  if (!pid) {
    throw new Error('ID produk wajib diisi.');
  }

  if (demo || isDemo || isDemoMode() || !supabase) {
    const existing = findDemoProductById(pid);
    if (!existing) {
      throw createRlsError('Produk tidak ditemukan atau akses ditolak.');
    }
    if (villageId && String(villageId).trim() !== existing.village_id) {
      throw createRlsError(
        'Akses ditolak: Anda hanya dapat mengelola data KDKMP milik sendiri.'
      );
    }
    assertDemoProductMutationAccess(existing.village_id, actorUserId);

    const allInVillage = getDemoAdminProductsByVillageId(existing.village_id);
    setDemoAdminProductsByVillageId(
      existing.village_id,
      allInVillage.filter((p) => p.id !== pid)
    );

    let removedStorageObject = null;
    if (existing.image_url) {
      const delRes = await deleteProductImage(existing.image_url, {
        villageId: existing.village_id,
        isDemo: true,
        demo: true,
        actorUserId,
      }).catch(() => ({ deleted: false }));
      if (delRes?.deleted) {
        removedStorageObject = delRes.objectPath;
      }
    }

    invalidateVillageCatalogCache();
    return {
      deleted: true,
      id: pid,
      removedStorageObject,
    };
  }

  const { data: existingRow } = await supabase
    .from('products')
    .select('id, village_id, image_url')
    .eq('id', pid)
    .maybeSingle();

  let query = supabase.from('products').delete().eq('id', pid);
  if (villageId) {
    query = query.eq('village_id', String(villageId).trim());
  }

  const { error } = await query;
  if (error) throw error;

  let removedStorageObject = null;
  if (existingRow?.image_url) {
    const delRes = await deleteProductImage(existingRow.image_url, {
      villageId: existingRow.village_id,
      isDemo,
      demo,
      actorUserId,
    }).catch(() => ({ deleted: false }));
    if (delRes?.deleted) {
      removedStorageObject = delRes.objectPath;
    }
  }

  invalidateVillageCatalogCache();
  return {
    deleted: true,
    id: pid,
    removedStorageObject,
  };
}

function normalizeTimeString(rawTime, fallback = '07:00') {
  const str = String(rawTime ?? '').trim();
  if (!str) return fallback;
  const normalized = str.replace('.', ':');
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return normalized;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return normalized;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function validateAndSanitizeVillageSettings(payload = {}) {
  const cleanBusinessName = String(payload.business_name ?? '').trim();
  if (!cleanBusinessName) {
    throw new Error('Nama koperasi wajib diisi.');
  }
  if (cleanBusinessName.length > 150) {
    throw new Error('Nama koperasi maksimal 150 karakter.');
  }

  const normalizedPhone = normalizePhone(payload.whatsapp_number);
  if (!normalizedPhone) {
    throw new Error('Nomor WhatsApp wajib diisi.');
  }
  if (!isValidPhone(normalizedPhone)) {
    throw new Error('Nomor WhatsApp tidak valid (contoh: 6281234567890).');
  }

  const cleanAddress = String(payload.address ?? '').trim() || null;

  const rawMaps = String(payload.gmaps_url ?? '').trim();
  if (rawMaps && !/^https?:\/\/.+/i.test(rawMaps)) {
    throw new Error('URL Maps harus diawali http:// atau https://.');
  }
  const cleanMapsUrl = rawMaps || null;

  const rawLogo = String(payload.logo_url ?? '').trim();
  const cleanLogoUrl = rawLogo ? driveImageUrl(rawLogo) : null;

  const openingHour = normalizeTimeString(payload.opening_hour, '07:00');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(openingHour)) {
    throw new Error('Format jam buka tidak valid (gunakan HH:MM).');
  }

  const closingHour = normalizeTimeString(payload.closing_hour, '20:00');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(closingHour)) {
    throw new Error('Format jam tutup tidak valid (gunakan HH:MM).');
  }

  const rawFreeDelivery =
    payload.free_delivery_min === '' ||
    payload.free_delivery_min === null ||
    payload.free_delivery_min === undefined
      ? 0
      : Number(payload.free_delivery_min);
  if (!Number.isFinite(rawFreeDelivery) || rawFreeDelivery < 0) {
    throw new Error('Minimal gratis ongkir harus berupa angka minimal Rp 0.');
  }
  const freeDeliveryMin = Math.round(rawFreeDelivery);

  const cleanDeliveryNote = String(payload.delivery_note ?? '').trim() || null;

  return {
    business_name: cleanBusinessName,
    whatsapp_number: normalizedPhone,
    address: cleanAddress,
    gmaps_url: cleanMapsUrl,
    logo_url: cleanLogoUrl,
    opening_hour: openingHour,
    closing_hour: closingHour,
    free_delivery_min: freeDeliveryMin,
    delivery_note: cleanDeliveryNote,
  };
}

export async function getAdminVillageSettings(
  villageId,
  { isDemo = false, demo = false, actorUserId } = {}
) {
  const vid = String(villageId ?? '').trim();
  if (!vid) return null;

  if (isDemoActive(demo || isDemo)) {
    assertDemoVillageAccess(vid, actorUserId);
    const found = getDemoVillageById(vid);
    return normalizeAdminVillage(found);
  }

  const { data, error } = await supabase
    .from('villages')
    .select(
      'id, code, subdistrict_id, name, slug, type, business_name, whatsapp_number, address, gmaps_url, logo_url, opening_hour, closing_hour, free_delivery_min, delivery_note, is_active, subdistricts(id, code, name, slug, is_active, sort_order)'
    )
    .eq('id', vid)
    .maybeSingle();

  if (error) throw error;
  return normalizeAdminVillage(data);
}

export async function uploadVillageLogo(
  { villageId, file, previousLogoUrl = null },
  { isDemo = false, demo = false, actorUserId } = {}
) {
  const vid = String(villageId ?? '').trim();
  if (!vid) {
    throw new Error('village_id wajib diisi untuk mengunggah logo.');
  }

  const compressed = await compressImageToWebp(file, {
    maxSide: MAX_LOGO_SIDE_PX,
    maxBytes: MAX_IMAGE_BYTES,
    square: true,
  });

  const objectPath = buildProductImagePath(vid);

  if (isDemoActive(demo || isDemo)) {
    assertDemoStorageAccess(objectPath, actorUserId);
    putDemoStorageObject(objectPath, {
      bucket: PRODUCT_IMAGES_BUCKET,
      villageId: vid,
      mimeType: compressed.mimeType,
      size: compressed.compressedSize,
      width: compressed.width,
      height: compressed.height,
      cacheControl: IMAGE_CACHE_CONTROL,
    });

    if (previousLogoUrl) {
      await deleteProductImage(previousLogoUrl, {
        villageId: vid,
        isDemo: true,
        demo: true,
        actorUserId,
      }).catch(() => {});
    }

    const basePreview =
      compressed.dataUrl || `demo://${PRODUCT_IMAGES_BUCKET}/${objectPath}`;
    const publicUrl = basePreview.includes('#storage=')
      ? basePreview
      : `${basePreview}#storage=${PRODUCT_IMAGES_BUCKET}/${objectPath}`;

    return {
      publicUrl,
      objectPath,
      width: compressed.width,
      height: compressed.height,
      originalWidth: compressed.originalWidth,
      originalHeight: compressed.originalHeight,
      originalSize: compressed.originalSize,
      compressedSize: compressed.compressedSize,
      mimeType: compressed.mimeType,
      cacheControl: IMAGE_CACHE_CONTROL,
    };
  }

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(objectPath, compressed.blob, {
      contentType: 'image/webp',
      cacheControl: IMAGE_CACHE_CONTROL,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(objectPath);

  if (previousLogoUrl) {
    await deleteProductImage(previousLogoUrl, {
      villageId: vid,
      isDemo,
      demo,
      actorUserId,
    }).catch(() => {});
  }

  return {
    publicUrl: urlData?.publicUrl || '',
    objectPath,
    width: compressed.width,
    height: compressed.height,
    originalWidth: compressed.originalWidth,
    originalHeight: compressed.originalHeight,
    originalSize: compressed.originalSize,
    compressedSize: compressed.compressedSize,
    mimeType: compressed.mimeType,
    cacheControl: IMAGE_CACHE_CONTROL,
  };
}

export async function updateAdminVillageSettings(
  villageId,
  payload,
  { isDemo = false, demo = false, actorUserId } = {}
) {
  const vid = String(villageId ?? '').trim();
  if (!vid) {
    throw new Error('Koperasi belum dipilih.');
  }

  const sanitized = validateAndSanitizeVillageSettings(payload);

  if (isDemoActive(demo || isDemo)) {
    assertDemoVillageAccess(vid, actorUserId);
    const existing = getDemoVillageById(vid);
    if (!existing) {
      throw createRlsError('Koperasi tidak ditemukan atau akses ditolak.');
    }

    const resolvedUserId =
      actorUserId !== undefined
        ? String(actorUserId ?? '').trim()
        : String(readDemoSession()?.user?.id ?? '').trim();
    const admin = resolvedUserId ? getDemoAdminByUserId(resolvedUserId) : null;

    if (admin && admin.role !== 'super_admin') {
      const immutableKeys = ['code', 'slug', 'type', 'subdistrict_id', 'is_active'];
      for (const key of immutableKeys) {
        if (payload?.[key] !== undefined && payload[key] !== existing[key]) {
          throw createRlsError(
            'Manager KDKMP tidak diizinkan mengubah code, slug, type, subdistrict_id, atau is_active.'
          );
        }
      }
    }

    const oldLogoUrl = existing.logo_url;
    const updatedRow = updateDemoVillageById(vid, sanitized);

    if (oldLogoUrl && oldLogoUrl !== sanitized.logo_url) {
      await deleteProductImage(oldLogoUrl, {
        villageId: vid,
        isDemo: true,
        demo: true,
        actorUserId,
      }).catch(() => {});
    }

    invalidateVillageCatalogCache();
    return normalizeAdminVillage(updatedRow);
  }

  const { data: prevRow } = await supabase
    .from('villages')
    .select('id, logo_url')
    .eq('id', vid)
    .maybeSingle();

  const previousLogoUrl = prevRow?.logo_url ?? null;

  const { data, error } = await supabase
    .from('villages')
    .update(sanitized)
    .eq('id', vid)
    .select(
      'id, code, subdistrict_id, name, slug, type, business_name, whatsapp_number, address, gmaps_url, logo_url, opening_hour, closing_hour, free_delivery_min, delivery_note, is_active, subdistricts(id, code, name, slug, is_active, sort_order)'
    )
    .single();

  if (error) throw error;

  if (previousLogoUrl && previousLogoUrl !== sanitized.logo_url) {
    await deleteProductImage(previousLogoUrl, {
      villageId: vid,
      isDemo,
      demo,
      actorUserId,
    }).catch(() => {});
  }

  invalidateVillageCatalogCache();
  return normalizeAdminVillage(data);
}

// -------------------------------------------------------------
// SUPER ADMIN: WILAYAH (SUBDISTRICTS) & KOPERASI (VILLAGES)
// -------------------------------------------------------------

export function slugify(text) {
  return String(text ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getAdminSubdistricts({ force = false, demo = false } = {}) {
  const cacheKey = 'admin:subdistricts:all';
  return withCache(
    cacheKey,
    async () => {
      if (isDemoActive(demo)) {
        return getDemoSubdistricts({ all: true });
      }

      const { data, error } = await supabase
        .from('subdistricts')
        .select('id, code, name, slug, is_active, sort_order, created_at, villages(count)')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((s) => {
        const vCount =
          Array.isArray(s.villages) && s.villages[0] && typeof s.villages[0].count === 'number'
            ? s.villages[0].count
            : Array.isArray(s.villages)
            ? s.villages.length
            : 0;

        return {
          id: s.id,
          code: s.code,
          name: s.name,
          slug: s.slug,
          is_active: Boolean(s.is_active),
          sort_order: s.sort_order ?? 0,
          created_at: s.created_at,
          village_count: vCount,
        };
      });
    },
    { force, ttlMs: DEFAULT_TTL_MS }
  );
}

export async function createAdminSubdistrict(payload, { demo = false } = {}) {
  const isDemo = isDemoActive(demo);
  const name = String(payload.name ?? '').trim();
  const code = String(payload.code ?? '').trim();
  const rawSlug = String(payload.slug ?? '').trim().toLowerCase();
  const slug = rawSlug || slugify(name);

  if (!name) throw new Error('Nama kecamatan wajib diisi.');
  if (!code) throw new Error('Kode kecamatan wajib diisi.');
  if (!slug) throw new Error('Slug kecamatan wajib diisi.');

  if (isReservedSlug(slug)) {
    throw new Error('Slug tidak boleh menggunakan kata terlarang (admin, login, api, assets, dev).');
  }

  if (isDemo) {
    const res = createDemoSubdistrict({ ...payload, name, code, slug });
    invalidateCache('subdistricts:');
    invalidateCache('admin:subdistricts:all');
    return res;
  }

  const { data, error } = await supabase
    .from('subdistricts')
    .insert([
      {
        name,
        code,
        slug,
        sort_order: Number(payload.sort_order) || 0,
        is_active: Boolean(payload.is_active),
      },
    ])
    .select('id, code, name, slug, is_active, sort_order, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      if (error.message?.includes('slug')) throw new Error('Slug kecamatan sudah digunakan.');
      if (error.message?.includes('code')) throw new Error('Kode kecamatan sudah digunakan.');
    }
    throw error;
  }

  invalidateCache('subdistricts:');
  invalidateCache('admin:subdistricts:all');
  return { ...data, village_count: 0 };
}

export async function updateAdminSubdistrict(id, payload, { demo = false } = {}) {
  const isDemo = isDemoActive(demo);
  const sid = String(id ?? '').trim();
  if (!sid) throw new Error('ID kecamatan wajib.');

  if (payload.slug && isReservedSlug(payload.slug)) {
    throw new Error('Slug tidak boleh menggunakan kata terlarang (admin, login, api, assets, dev).');
  }

  if (isDemo) {
    const res = updateDemoSubdistrict(sid, payload);
    invalidateCache('subdistricts:');
    invalidateCache('admin:subdistricts:all');
    return res;
  }

  const updateBody = {};
  if (payload.name !== undefined) updateBody.name = String(payload.name).trim();
  if (payload.code !== undefined) updateBody.code = String(payload.code).trim();
  if (payload.slug !== undefined) updateBody.slug = String(payload.slug).trim().toLowerCase();
  if (payload.sort_order !== undefined) updateBody.sort_order = Number(payload.sort_order) || 0;
  if (payload.is_active !== undefined) updateBody.is_active = Boolean(payload.is_active);

  const { data, error } = await supabase
    .from('subdistricts')
    .update(updateBody)
    .eq('id', sid)
    .select('id, code, name, slug, is_active, sort_order, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      if (error.message?.includes('slug')) throw new Error('Slug kecamatan sudah digunakan.');
      if (error.message?.includes('code')) throw new Error('Kode kecamatan sudah digunakan.');
    }
    throw error;
  }

  invalidateCache('subdistricts:');
  invalidateCache('admin:subdistricts:all');
  return data;
}

export async function toggleAdminSubdistrictActive(id, isActive, { demo = false } = {}) {
  return updateAdminSubdistrict(id, { is_active: Boolean(isActive) }, { demo });
}

export function validateVillagePayload(payload = {}, existingVillages = [], currentId = null) {
  const name = String(payload.name ?? '').trim();
  const subdistrictId = String(payload.subdistrict_id ?? '').trim();
  const type = payload.type === 'kelurahan' ? 'kelurahan' : 'desa';
  const rawSlug = String(payload.slug ?? '').trim().toLowerCase();
  const slug = rawSlug || slugify(name);
  const businessName = String(payload.business_name ?? '').trim();

  if (!subdistrictId) {
    return { isValid: false, error: 'Kecamatan wajib dipilih.' };
  }
  if (!name) {
    return { isValid: false, error: 'Nama desa/kelurahan wajib diisi.' };
  }
  if (!slug) {
    return { isValid: false, error: 'Slug koperasi wajib diisi.' };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { isValid: false, error: 'Format slug tidak valid. Gunakan huruf kecil, angka, dan tanda hubung.' };
  }
  if (isReservedSlug(slug)) {
    return { isValid: false, error: 'Slug tidak boleh menggunakan kata terlarang (admin, login, api, assets, dev).' };
  }

  // Check unique slug within the same subdistrict
  const isDuplicate = existingVillages.some(
    (v) =>
      v.id !== currentId &&
      v.subdistrict_id === subdistrictId &&
      v.slug.toLowerCase() === slug
  );
  if (isDuplicate) {
    return { isValid: false, error: 'Slug sudah digunakan di kecamatan ini.' };
  }

  const rawPhone = payload.whatsapp_number ? normalizePhone(payload.whatsapp_number) : '';
  const isActive = Boolean(payload.is_active);

  if (isActive && (!rawPhone || !isValidPhone(rawPhone))) {
    return { isValid: false, error: 'Nomor WhatsApp wajib dan harus valid (format 628...) untuk mengaktifkan koperasi.' };
  }

  return {
    isValid: true,
    error: null,
    sanitized: {
      name,
      subdistrict_id: subdistrictId,
      type,
      slug,
      business_name: businessName || `KDKMP ${type === 'kelurahan' ? 'Kelurahan' : 'Desa'} ${name}`,
      code: String(payload.code ?? '').trim(),
      whatsapp_number: rawPhone || null,
      is_active: isActive,
      address: String(payload.address ?? '').trim() || null,
      gmaps_url: String(payload.gmaps_url ?? '').trim() || null,
      free_delivery_min: Number(payload.free_delivery_min) || 0,
      delivery_note: String(payload.delivery_note ?? '').trim() || null,
      opening_hour: payload.opening_hour || '07:00',
      closing_hour: payload.closing_hour || '20:00',
    },
  };
}

export async function getAdminVillages({ subdistrictId = '', force = false, demo = false } = {}) {
  const cacheKey = `admin:villages:${subdistrictId || 'all'}`;
  return withCache(
    cacheKey,
    async () => {
      if (isDemoActive(demo)) {
        return getDemoVillages({ all: true, subdistrictId });
      }

      let query = supabase
        .from('villages')
        .select(`
          id,
          code,
          subdistrict_id,
          name,
          slug,
          type,
          business_name,
          whatsapp_number,
          address,
          gmaps_url,
          logo_url,
          opening_hour,
          closing_hour,
          free_delivery_min,
          delivery_note,
          is_active,
          created_at,
          updated_at,
          subdistricts:subdistrict_id (
            id,
            code,
            name,
            slug
          ),
          products (count)
        `)
        .order('name', { ascending: true });

      if (subdistrictId) {
        query = query.eq('subdistrict_id', subdistrictId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((v) => {
        const pCount =
          Array.isArray(v.products) && v.products[0] && typeof v.products[0].count === 'number'
            ? v.products[0].count
            : Array.isArray(v.products)
            ? v.products.length
            : 0;

        return {
          id: v.id,
          code: v.code,
          subdistrict_id: v.subdistrict_id,
          subdistrict_code: v.subdistricts?.code || '',
          subdistrict_name: v.subdistricts?.name || '',
          subdistrict_slug: v.subdistricts?.slug || '',
          name: v.name,
          slug: v.slug,
          type: v.type,
          business_name: v.business_name,
          whatsapp_number: v.whatsapp_number,
          address: v.address,
          gmaps_url: v.gmaps_url,
          logo_url: v.logo_url,
          opening_hour: v.opening_hour,
          closing_hour: v.closing_hour,
          free_delivery_min: v.free_delivery_min,
          delivery_note: v.delivery_note,
          is_active: Boolean(v.is_active),
          created_at: v.created_at,
          updated_at: v.updated_at,
          product_count: pCount,
        };
      });
    },
    { force, ttlMs: DEFAULT_TTL_MS }
  );
}

export async function createAdminVillage(payload, { demo = false } = {}) {
  const isDemo = isDemoActive(demo);
  if (isDemo) {
    const res = createDemoVillage(payload);
    invalidateCache('directory:');
    invalidateCache('admin:villages:');
    invalidateCache('catalog:');
    return res;
  }

  const { data, error } = await supabase
    .from('villages')
    .insert([payload])
    .select(`
      id,
      code,
      subdistrict_id,
      name,
      slug,
      type,
      business_name,
      whatsapp_number,
      address,
      gmaps_url,
      logo_url,
      opening_hour,
      closing_hour,
      free_delivery_min,
      delivery_note,
      is_active,
      created_at,
      updated_at,
      subdistricts:subdistrict_id (id, code, name, slug)
    `)
    .single();

  if (error) {
    if (error.code === '23505') {
      if (error.message?.includes('villages_subdistrict_slug_unique')) {
        throw new Error('Slug sudah digunakan di kecamatan ini.');
      }
      if (error.message?.includes('code')) {
        throw new Error('Kode Kemendagri desa sudah digunakan.');
      }
    }
    throw error;
  }

  invalidateCache('directory:');
  invalidateCache('admin:villages:');
  invalidateCache('catalog:');
  return {
    ...data,
    subdistrict_code: data.subdistricts?.code || '',
    subdistrict_name: data.subdistricts?.name || '',
    subdistrict_slug: data.subdistricts?.slug || '',
    product_count: 0,
  };
}

export async function updateAdminVillage(id, payload, { demo = false } = {}) {
  const isDemo = isDemoActive(demo);
  const vid = String(id ?? '').trim();
  if (!vid) throw new Error('ID koperasi wajib.');

  if (isDemo) {
    const res = updateDemoVillage(vid, payload);
    invalidateCache('directory:');
    invalidateCache('admin:villages:');
    invalidateCache('catalog:');
    return res;
  }

  const { data, error } = await supabase
    .from('villages')
    .update(payload)
    .eq('id', vid)
    .select(`
      id,
      code,
      subdistrict_id,
      name,
      slug,
      type,
      business_name,
      whatsapp_number,
      address,
      gmaps_url,
      logo_url,
      opening_hour,
      closing_hour,
      free_delivery_min,
      delivery_note,
      is_active,
      created_at,
      updated_at,
      subdistricts:subdistrict_id (id, code, name, slug)
    `)
    .single();

  if (error) {
    if (error.code === '23505') {
      if (error.message?.includes('villages_subdistrict_slug_unique')) {
        throw new Error('Slug sudah digunakan di kecamatan ini.');
      }
      if (error.message?.includes('code')) {
        throw new Error('Kode Kemendagri desa sudah digunakan.');
      }
    }
    throw error;
  }

  invalidateCache('directory:');
  invalidateCache('admin:villages:');
  invalidateCache('catalog:');
  return {
    ...data,
    subdistrict_code: data.subdistricts?.code || '',
    subdistrict_name: data.subdistricts?.name || '',
    subdistrict_slug: data.subdistricts?.slug || '',
  };
}

export async function toggleAdminVillageActive(id, isActive, { demo = false } = {}) {
  const isDemo = isDemoActive(demo);
  if (isDemo) {
    const res = toggleDemoVillageActive(id, isActive);
    invalidateCache('directory:');
    invalidateCache('admin:villages:');
    invalidateCache('catalog:');
    return res;
  }

  return updateAdminVillage(id, { is_active: Boolean(isActive) }, { demo });
}

export async function getAdminVillageAdmins({ force = false, demo = false } = {}) {
  const cacheKey = 'admin:village_admins:all';
  return withCache(
    cacheKey,
    async () => {
      if (isDemoActive(demo)) {
        return getDemoVillageAdmins();
      }

      const { data, error } = await supabase.rpc('list_village_admins');
      if (error) throw error;
      return data ?? [];
    },
    { force, ttlMs: DEFAULT_TTL_MS }
  );
}

export async function assignVillageAdmin({
  email,
  villageId,
  autoCreate = false,
  initialPassword = null,
  demo = false,
} = {}) {
  const isDemo = isDemoActive(demo);
  const normEmail = String(email ?? '').trim().toLowerCase();
  const vid = String(villageId ?? '').trim();

  if (!normEmail) {
    throw new Error('Email wajib diisi.');
  }
  if (!vid) {
    throw new Error('Koperasi tujuan wajib dipilih.');
  }

  if (isDemo) {
    const res = assignDemoVillageAdmin(normEmail, vid, {
      autoCreate,
      initialPassword,
    });
    if (res.is_new && initialPassword) {
      saveDemoPassword(normEmail, initialPassword);
    }
    invalidateCache('admin:village_admins:');
    return res;
  }

  let data;
  let error;

  if (autoCreate || initialPassword) {
    const rpcRes = await supabase.rpc('assign_village_admin', {
      p_email: normEmail,
      p_village: vid,
      p_auto_create: Boolean(autoCreate),
      p_initial_password: initialPassword ? String(initialPassword) : null,
    });
    data = rpcRes.data;
    error = rpcRes.error;
  }

  // Fallback to 2-arg RPC if not auto-creating or if 4-arg RPC is unavailable
  if (!data && (error || !autoCreate)) {
    const fallbackRes = await supabase.rpc('assign_village_admin', {
      p_email: normEmail,
      p_village: vid,
    });
    data = fallbackRes.data;
    error = fallbackRes.error;
  }

  if (error) {
    throw new Error(error.message || 'Gagal menetapkan manager KDKMP.');
  }

  invalidateCache('admin:village_admins:');
  return data;
}

export async function superAdminResetUserPassword({
  userId,
  newPassword,
  demo = false,
} = {}) {
  const isDemo = isDemoActive(demo);
  const uid = String(userId ?? '').trim();
  const pwd = String(newPassword ?? '').trim();

  if (!uid) {
    throw new Error('User ID wajib diisi.');
  }
  if (pwd.length < 6) {
    throw new Error('Kata sandi minimal 6 karakter.');
  }

  if (isDemo) {
    const user = findDemoAdminUserById(uid);
    if (!user) {
      const err = new Error('Pengguna tidak ditemukan.');
      err.code = 'P0002';
      throw err;
    }
    saveDemoPassword(user.email, pwd);
    return {
      success: true,
      user_id: uid,
      email: user.email,
      new_password: pwd,
    };
  }

  const { data, error } = await supabase.rpc('super_admin_reset_password', {
    p_target_user_id: uid,
    p_new_password: pwd,
  });

  if (error) {
    throw new Error(error.message || 'Gagal mereset kata sandi pengguna.');
  }

  return data;
}

export async function revokeVillageAdmin(userId, { demo = false } = {}) {
  const isDemo = isDemoActive(demo);
  const uid = String(userId ?? '').trim();
  if (!uid) throw new Error('User ID wajib diisi.');

  if (isDemo) {
    const res = revokeDemoVillageAdmin(uid);
    invalidateCache('admin:village_admins:');
    return res;
  }

  const { data, error } = await supabase.rpc('revoke_village_admin', {
    p_user: uid,
  });

  if (error) {
    throw new Error(error.message || 'Gagal mencabut manager KDKMP.');
  }

  invalidateCache('admin:village_admins:');
  return data;
}

// -------------------------------------------------------------
// MASTER SATUAN PRODUK (PRODUCT_UNITS)
// -------------------------------------------------------------

export async function getAdminProductUnits({
  isDemo = false,
  demo = false,
} = {}) {
  if (demo || isDemo || isDemoMode() || !supabase) {
    return getDemoProductUnits();
  }

  const { data, error } = await supabase
    .from('product_units')
    .select('id, name, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    return getDemoProductUnits();
  }
  return data ?? [];
}

export async function createAdminProductUnit(
  { name, sort_order },
  { isDemo = false, demo = false, actorUserId } = {}
) {
  const cleanName = String(name ?? '').trim();
  if (!cleanName) {
    throw new Error('Nama satuan wajib diisi.');
  }
  if (cleanName.length > 30) {
    throw new Error('Nama satuan maksimal 30 karakter.');
  }

  const resolvedUserId =
    actorUserId !== undefined
      ? String(actorUserId ?? '').trim()
      : String(readDemoSession()?.user?.id ?? '').trim();
  const admin = resolvedUserId ? getDemoAdminByUserId(resolvedUserId) : null;
  if (admin && admin.role !== 'super_admin') {
    throw createRlsError(
      'Hanya Super Admin yang dapat menambah satuan produk.'
    );
  }

  if (demo || isDemo || isDemoMode() || !supabase) {
    return createDemoProductUnit({ name: cleanName, sort_order });
  }

  const existing = await getAdminProductUnits({ isDemo, demo });
  if (existing.some((u) => u.name.trim().toLowerCase() === cleanName.toLowerCase())) {
    throw new Error('Satuan sudah terdaftar.');
  }

  const maxSort = existing.reduce((max, u) => Math.max(max, Number(u.sort_order ?? 0)), 0);
  const nextSort = Number.isFinite(Number(sort_order)) ? Number(sort_order) : maxSort + 1;

  const { data, error } = await supabase
    .from('product_units')
    .insert({ name: cleanName, sort_order: nextSort })
    .select('id, name, sort_order, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Satuan sudah terdaftar.');
    }
    throw error;
  }
  return data;
}

export async function updateAdminProductUnit(
  unitId,
  { name, sort_order },
  { isDemo = false, demo = false, actorUserId } = {}
) {
  const uid = String(unitId ?? '').trim();
  if (!uid) {
    throw new Error('ID satuan wajib diisi.');
  }

  const resolvedUserId =
    actorUserId !== undefined
      ? String(actorUserId ?? '').trim()
      : String(readDemoSession()?.user?.id ?? '').trim();
  const admin = resolvedUserId ? getDemoAdminByUserId(resolvedUserId) : null;
  if (admin && admin.role !== 'super_admin') {
    throw createRlsError(
      'Hanya Super Admin yang dapat mengubah satuan produk.'
    );
  }

  if (demo || isDemo || isDemoMode() || !supabase) {
    return updateDemoProductUnit(uid, { name, sort_order });
  }

  const cleanName = name !== undefined ? String(name).trim() : undefined;
  if (cleanName !== undefined && !cleanName) {
    throw new Error('Nama satuan wajib diisi.');
  }
  if (cleanName !== undefined && cleanName.length > 30) {
    throw new Error('Nama satuan maksimal 30 karakter.');
  }

  const patch = {};
  if (cleanName !== undefined) patch.name = cleanName;
  if (sort_order !== undefined) patch.sort_order = Number(sort_order);

  const { data, error } = await supabase
    .from('product_units')
    .update(patch)
    .eq('id', uid)
    .select('id, name, sort_order, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Satuan sudah terdaftar.');
    }
    throw error;
  }
  return data;
}

export async function deleteAdminProductUnit(
  unitId,
  { isDemo = false, demo = false, actorUserId } = {}
) {
  const uid = String(unitId ?? '').trim();
  if (!uid) {
    throw new Error('ID satuan wajib diisi.');
  }

  const resolvedUserId =
    actorUserId !== undefined
      ? String(actorUserId ?? '').trim()
      : String(readDemoSession()?.user?.id ?? '').trim();
  const admin = resolvedUserId ? getDemoAdminByUserId(resolvedUserId) : null;
  if (admin && admin.role !== 'super_admin') {
    throw createRlsError(
      'Hanya Super Admin yang dapat menghapus satuan produk.'
    );
  }

  if (demo || isDemo || isDemoMode() || !supabase) {
    return deleteDemoProductUnit(uid);
  }

  const { error } = await supabase.from('product_units').delete().eq('id', uid);
  if (error) throw error;
  return true;
}

export async function moveAdminProductUnit(
  unitId,
  direction,
  { isDemo = false, demo = false, actorUserId } = {}
) {
  const uid = String(unitId ?? '').trim();
  const dir = String(direction ?? '').trim().toLowerCase();
  if (!uid || (dir !== 'up' && dir !== 'down')) {
    throw new Error('Parameter urutan tidak valid.');
  }

  const resolvedUserId =
    actorUserId !== undefined
      ? String(actorUserId ?? '').trim()
      : String(readDemoSession()?.user?.id ?? '').trim();
  const admin = resolvedUserId ? getDemoAdminByUserId(resolvedUserId) : null;
  if (admin && admin.role !== 'super_admin') {
    throw createRlsError(
      'Hanya Super Admin yang dapat mengubah urutan satuan produk.'
    );
  }

  if (demo || isDemo || isDemoMode() || !supabase) {
    return moveDemoProductUnit(uid, dir);
  }

  const current = await getAdminProductUnits({ isDemo, demo });
  const idx = current.findIndex((u) => u.id === uid);
  if (idx === -1) {
    throw new Error('Satuan tidak ditemukan.');
  }

  const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= current.length) {
    return current;
  }

  const nextList = [...current];
  const temp = nextList[idx];
  nextList[idx] = nextList[swapIdx];
  nextList[swapIdx] = temp;

  for (let i = 0; i < nextList.length; i += 1) {
    const { error } = await supabase
      .from('product_units')
      .update({ sort_order: i + 1 })
      .eq('id', nextList[i].id);
    if (error) throw error;
  }

  return getAdminProductUnits({ isDemo, demo });
}

export async function recordOrderLog(
  {
    villageId,
    items,
    itemsCount,
    total,
    deliveryMethod,
    paymentMethod,
  },
  options = {}
) {
  const isDemo = options.isDemo ?? isDemoMode();
  if (!villageId) return null;

  const safeItems = Array.isArray(items)
    ? items.map((it) => ({
        product_id: String(it.product_id ?? it.productId ?? it.id ?? '').trim(),
        qty: Math.max(1, Math.round(Number(it.qty) || 1)),
        price: Math.max(0, Math.round(Number(it.price) || 0)),
      }))
    : [];

  const safeCount = Math.min(100, Math.max(1, Number(itemsCount) || safeItems.length || 1));
  const safeTotal = Math.max(0, Math.round(Number(total) || 0));
  const safeDelivery = String(deliveryMethod || 'Diantar').trim();
  const safePayment = String(paymentMethod || 'COD').trim();

  if (isDemo) {
    return recordDemoOrderLog({
      villageId,
      items: safeItems,
      itemsCount: safeCount,
      total: safeTotal,
      deliveryMethod: safeDelivery,
      paymentMethod: safePayment,
    });
  }

  try {
    const { data, error } = await supabase
      .from('order_logs')
      .insert({
        village_id: villageId,
        items: safeItems,
        items_count: safeCount,
        total: safeTotal,
        delivery_method: safeDelivery,
        payment_method: safePayment,
      })
      .select('id')
      .single();

    if (error) {
      console.warn('Gagal mencatat statistik checkout:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Gagal mencatat statistik checkout:', err?.message || err);
    return null;
  }
}

export async function getVillageStats(villageId, days = 7, options = {}) {
  const isDemo = options.isDemo ?? isDemoMode();
  const isSuperAdmin = Boolean(options.isSuperAdmin);

  if (isDemo) {
    return getDemoVillageStats(villageId, days, { isSuperAdmin });
  }

  const { data, error } = await supabase.rpc('get_village_stats', {
    p_village: villageId || null,
    p_days: Number(days) || 7,
  });

  if (error) {
    throw new Error(error.message || 'Gagal memuat statistik checkout.');
  }

  return data;
}

// -------------------------------------------------------------
// S14: CRUD TRANSAKSI / ORDERS API
// -------------------------------------------------------------

export async function createOrder(
  {
    villageId,
    customerName,
    customerPhone = '',
    customerAddress = '',
    deliveryMethod = 'Diantar',
    paymentMethod = 'COD',
    items = [],
    itemsCount,
    total,
    note = '',
    status = 'pending',
  },
  options = {}
) {
  const isDemo = options.isDemo ?? isDemoMode();
  if (!villageId) return null;

  const safeItems = Array.isArray(items)
    ? items.map((it) => ({
        product_id: String(it.product_id ?? it.productId ?? it.id ?? '').trim(),
        name: String(it.name || 'Produk').trim(),
        qty: Math.max(1, Math.round(Number(it.qty) || 1)),
        price: Math.max(0, Math.round(Number(it.price) || 0)),
        unit: String(it.unit || 'pcs').trim(),
      }))
    : [];

  const safeTotal = total !== undefined
    ? Math.max(0, Math.round(Number(total) || 0))
    : safeItems.reduce((sum, it) => sum + it.qty * it.price, 0);

  const safeCount = Math.min(100, Math.max(1, Number(itemsCount) || safeItems.length || 1));
  const safeDelivery = String(deliveryMethod || 'Diantar').trim();
  const safePayment = String(paymentMethod || 'COD').trim();
  const safeName = String(customerName || '').trim();
  const safePhone = String(customerPhone || '').trim();
  const safeAddress = String(customerAddress || '').trim();
  const safeNote = String(note || '').trim();

  // Sinkronisasi fire-and-forget ke order_logs untuk analitik S12
  try {
    recordOrderLog(
      {
        villageId,
        items: safeItems,
        itemsCount: safeCount,
        total: safeTotal,
        deliveryMethod: safeDelivery,
        paymentMethod: safePayment,
      },
      { isDemo }
    ).catch(() => {});
  } catch {
    // ignore
  }

  if (isDemo) {
    const created = createDemoOrder({
      villageId,
      customerName: safeName,
      customerPhone: safePhone,
      customerAddress: safeAddress,
      deliveryMethod: safeDelivery,
      paymentMethod: safePayment,
      items: safeItems,
      itemsCount: safeCount,
      total: safeTotal,
      note: safeNote,
      status,
    });
    invalidateCache();
    return created;
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        village_id: villageId,
        customer_name: safeName,
        customer_phone: safePhone || null,
        customer_address: safeAddress || null,
        delivery_method: safeDelivery,
        payment_method: safePayment,
        items: safeItems,
        items_count: safeCount,
        total: safeTotal,
        note: safeNote || null,
        status: ORDER_STATUSES.includes(status) ? status : 'pending',
      })
      .select()
      .single();

    if (error) {
      console.warn('Gagal menyimpan pesanan:', error.message);
      return null;
    }
    invalidateCache();
    return data;
  } catch (err) {
    console.warn('Gagal menyimpan pesanan:', err?.message || err);
    return null;
  }
}

export async function getAdminOrders(
  {
    villageId = null,
    status = 'all',
    search = '',
    page = 1,
    pageSize = 10,
    isSuperAdmin = false,
  } = {},
  options = {}
) {
  const isDemo = options.isDemo ?? isDemoMode();
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || 10));

  if (isDemo) {
    const all = getDemoOrders({
      villageId,
      status,
      search,
      isSuperAdmin,
    });
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const start = (safePage - 1) * safePageSize;
    const paginated = all.slice(start, start + safePageSize);

    return {
      orders: paginated,
      total,
      page: safePage,
      totalPages,
    };
  }

  let query = supabase
    .from('orders')
    .select('*, villages(id, name, business_name)', { count: 'exact' });

  if (!isSuperAdmin && villageId) {
    query = query.eq('village_id', villageId);
  } else if (villageId) {
    query = query.eq('village_id', villageId);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search && String(search).trim()) {
    const term = `%${String(search).trim()}%`;
    query = query.or(`customer_name.ilike.${term},order_number.ilike.${term},customer_phone.ilike.${term}`);
  }

  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize - 1;

  query = query.order('created_at', { ascending: false }).range(start, end);

  const { data, count, error } = await query;
  if (error) {
    throw new Error(error.message || 'Gagal memuat daftar transaksi.');
  }

  let total = count || 0;
  let finalOrders = data || [];

  // Sinkronisasi otomatis data transaksi terdahulu dari order_logs jika tabel orders masih kosong
  if (total === 0 && !search && status === 'all') {
    try {
      let logQuery = supabase.from('order_logs').select('*');
      if (!isSuperAdmin && villageId) {
        logQuery = logQuery.eq('village_id', villageId);
      }
      const { data: oldLogs } = await logQuery;
      if (oldLogs && oldLogs.length > 0) {
        const backfillRows = oldLogs.map((ol) => ({
          id: ol.id,
          order_number: `ORD-${(ol.created_at || new Date().toISOString()).slice(0, 10).replace(/-/g, '')}-${String(ol.id).slice(-4).toUpperCase()}`,
          village_id: ol.village_id,
          customer_name: 'Pelanggan WA',
          customer_phone: null,
          customer_address: ol.delivery_method === 'Diantar' ? 'Alamat via WhatsApp' : null,
          delivery_method: ol.delivery_method || 'Diantar',
          payment_method: ol.payment_method || 'COD',
          items: ol.items || [],
          items_count: ol.items_count || 1,
          total: ol.total || 0,
          note: 'Riwayat checkout WhatsApp',
          status: 'pending',
          created_at: ol.created_at,
          updated_at: ol.created_at,
        }));

        await supabase.from('orders').upsert(backfillRows, { onConflict: 'id', ignoreDuplicates: true });

        const recheck = await query;
        if (recheck.data && recheck.data.length > 0) {
          finalOrders = recheck.data;
          total = recheck.count || recheck.data.length;
        }
      }
    } catch {
      // Abaikan jika order_logs tidak dapat diakses atau gagal sinkronisasi otomatis
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / safePageSize));

  return {
    orders: finalOrders,
    total,
    page: safePage,
    totalPages,
  };
}

export async function getAdminOrderById(orderId, options = {}) {
  const isDemo = options.isDemo ?? isDemoMode();
  const isSuperAdmin = Boolean(options.isSuperAdmin);
  const villageId = options.villageId || null;

  if (!orderId) return null;

  if (isDemo) {
    return getDemoOrderById(orderId, { isSuperAdmin, villageId });
  }

  let query = supabase
    .from('orders')
    .select('*, villages(id, name, business_name)')
    .eq('id', orderId);

  if (!isSuperAdmin && villageId) {
    query = query.eq('village_id', villageId);
  }

  const { data, error } = await query.single();
  if (error || !data) return null;

  return {
    ...data,
    village_name: data.villages?.business_name || data.villages?.name || '',
  };
}

export async function updateAdminOrderStatus(
  orderId,
  status,
  options = {}
) {
  const isDemo = options.isDemo ?? isDemoMode();
  const isSuperAdmin = Boolean(options.isSuperAdmin);
  const villageId = options.villageId || null;

  if (!orderId) {
    throw new Error('ID transaksi wajib diisi.');
  }

  if (isDemo) {
    const updated = updateDemoOrderStatus(orderId, status, {
      isSuperAdmin,
      villageId,
    });
    invalidateCache();
    return updated;
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Gagal memperbarui status transaksi.');
  }

  invalidateCache();
  return data;
}

export async function updateAdminOrder(
  orderId,
  patch = {},
  options = {}
) {
  const isDemo = options.isDemo ?? isDemoMode();
  const isSuperAdmin = Boolean(options.isSuperAdmin);
  const villageId = options.villageId || null;

  if (!orderId) {
    throw new Error('ID transaksi wajib diisi.');
  }

  if (isDemo) {
    const updated = updateDemoOrder(orderId, patch, {
      isSuperAdmin,
      villageId,
    });
    invalidateCache();
    return updated;
  }

  const { data, error } = await supabase
    .from('orders')
    .update(patch)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Gagal memperbarui transaksi.');
  }

  invalidateCache();
  return data;
}

export async function deleteAdminOrder(
  orderId,
  options = {}
) {
  const isDemo = options.isDemo ?? isDemoMode();
  const isSuperAdmin = Boolean(options.isSuperAdmin);
  const villageId = options.villageId || null;

  if (!orderId) {
    throw new Error('ID transaksi wajib diisi.');
  }

  if (isDemo) {
    const res = deleteDemoOrder(orderId, {
      isSuperAdmin,
      villageId,
    });
    invalidateCache();
    return res;
  }

  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) {
    throw new Error(error.message || 'Gagal menghapus transaksi.');
  }

  invalidateCache();
  return { success: true };
}

export {
  invalidateCache,
  getDemoStorageObject,
  listDemoStorageObjects,
  resetDemoAdminData,
  resetDemoOrders,
  ORDER_STATUSES,
};

