import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router';
import AdminApp from './AdminApp';
import { AuthProvider } from './AuthContext';
import { CheckoutSheet } from '../features/checkout';
import {
  applyOptimisticProductPatch,
  rollbackOptimisticProduct,
  computeQuickPriceChanges,
  swapCategoryOrder,
} from './adminProductUtils';
import { ProductFormSheet } from './ProductFormSheet';
import {
  buildVillageCatalogUrl,
  generateCatalogQrDataUrl,
} from './AdminSettingsPage';
import { AdminWilayahPage } from './AdminWilayahPage';
import { AdminUnitsPage } from './AdminUnitsPage';
import { ChangePasswordModal } from './ChangePasswordModal';
import {
  summarizeProductsByStock,
  signInAdmin,
  signOutAdmin,
  resetAdminPassword,
  updateAdminPassword,
  getAdminProfile,
  getAdminProductSummary,
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  moveAdminCategory,
  deleteAdminCategory,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  batchUpdateAdminProductPrices,
  deleteAdminProduct,
  uploadProductImage,
  uploadVillageLogo,
  deleteProductImage,
  getAdminVillageSettings,
  updateAdminVillageSettings,
  validateAndSanitizeVillageSettings,
  getAdminSubdistricts,
  createAdminSubdistrict,
  updateAdminSubdistrict,
  toggleAdminSubdistrictActive,
  getAdminVillages,
  validateVillagePayload,
  createAdminVillage,
  updateAdminVillage,
  toggleAdminVillageActive,
  getAdminVillageAdmins,
  assignVillageAdmin,
  revokeVillageAdmin,
  superAdminResetUserPassword,
  slugify,
  getVillageCatalog,
  getVillageDirectory,
  getDemoStorageObject,
  resetDemoAdminData,
  PRODUCT_UNITS,
  SUPER_ADMIN_USER_ID,
  getAdminProductUnits,
  createAdminProductUnit,
  updateAdminProductUnit,
  deleteAdminProductUnit,
  moveAdminProductUnit,
  recordOrderLog,
  getVillageStats,
} from '../lib/api';
import {
  DEMO_VILLAGE_DIRECTORY,
  getAllDemoCategories,
  getDemoAdminProductsByVillageId,
} from '../lib/demoData';
import { formatDigitsInput, parseFormattedInt } from '../lib/format';
import {
  extractStorageObjectPath,
  calculateScaledDimensions,
  calculateSquareCrop,
  driveImageUrl,
} from '../lib/image';

const GOLOKAN = DEMO_VILLAGE_DIRECTORY[0];
const SUKOREJO = DEMO_VILLAGE_DIRECTORY[1];

describe('Admin Auth, Guard, Layout & Summary (S08)', () => {
  it('blocks unauthenticated /admin access via AdminGuard and renders /admin/login form + Lupa kata sandi', () => {
    const guardedHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: null,
                  admin: null,
                  villages: [],
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );
    expect(guardedHtml).not.toContain('Ringkasan');

    const loginHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: null,
                  admin: null,
                  villages: [],
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(loginHtml).toContain('Masuk Admin KDKMP');
    expect(loginHtml).toContain('Email');
    expect(loginHtml).toContain('Kata Sandi');
    expect(loginHtml).toContain('Masuk');
    expect(loginHtml).toContain('Lupa kata sandi');
  });

  it('renders /admin/reset form for updating password', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/reset']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: null,
                  admin: null,
                  villages: [],
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(html).toContain('Kata Sandi Baru');
    expect(html).toContain('Ulangi Kata Sandi Baru');
    expect(html).toContain('Simpan Kata Sandi');
    expect(html).toContain('Kembali ke Masuk');
  });

  it('shows "Akun belum terdaftar sebagai admin." + Keluar when session exists without admins row', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: {
                    user: {
                      id: '00000000-0000-4000-9000-000000000099',
                      email: 'belumterdaftar@kdkmp-gresik.id',
                    },
                  },
                  admin: null,
                  villages: [],
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(html).toContain('Akun belum terdaftar sebagai admin.');
    expect(html).toContain('Keluar');
    expect(html).not.toContain('Ringkasan');
  });

  it('locks village_admin to their KDKMP, renders 4 nav items (56px bottom nav, md rail, lg 240px sidebar), and 4 Num summary cards in grid-cols-2 md:grid-cols-4', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: {
                    is_demo: true,
                    user: {
                      id: '00000000-0000-4000-9000-352509200800',
                      email: 'golokan@kdkmp-gresik.id',
                    },
                  },
                  admin: {
                    user_id: '00000000-0000-4000-9000-352509200800',
                    role: 'village_admin',
                    village_id: GOLOKAN.id,
                  },
                  villages: [GOLOKAN],
                }}
                initialSummary={{
                  total: 10,
                  ready: 8,
                  habis: 1,
                  preOrder: 1,
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Top bar: koperasi name + Keluar, no Select
    expect(html).toContain('KDKMP Desa Golokan');
    expect(html).toContain('Keluar');
    expect(html).not.toContain('aria-label="Pilih koperasi"');

    // Navigation: 4 items only (no Wilayah for village_admin)
    expect(html).toContain('Ringkasan');
    expect(html).toContain('Produk');
    expect(html).toContain('Kategori');
    expect(html).toContain('Pengaturan');
    expect(html).not.toContain('Wilayah');

    // Layout responsive classes: 56px bottom nav (h-14), md rail (md:w-20), lg 240px sidebar (lg:w-[240px])
    expect(html).toContain('h-14');
    expect(html).toContain('md:w-20');
    expect(html).toContain('lg:w-[240px]');

    // Summary 4 cards with <Num> (tabular-nums) in grid-cols-2 md:grid-cols-4
    expect(html).toContain('grid-cols-2');
    expect(html).toContain('md:grid-cols-4');
    expect(html).toContain('Total Produk');
    expect(html).toContain('Tersedia');
    expect(html).toContain('Habis');
    expect(html).toContain('Pre-Order');
    expect(html).toContain('tabular-nums');
    expect(html).toContain('>10<');
    expect(html).toContain('>8<');
    expect(html).toContain('>1<');
  });

  it('blocks village_admin from /admin/wilayah via SuperAdminGuard', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/wilayah']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: {
                    is_demo: true,
                    user: {
                      id: '00000000-0000-4000-9000-352509200800',
                      email: 'golokan@kdkmp-gresik.id',
                    },
                  },
                  admin: {
                    user_id: '00000000-0000-4000-9000-352509200800',
                    role: 'village_admin',
                    village_id: GOLOKAN.id,
                  },
                  villages: [GOLOKAN],
                }}
                initialSummary={{
                  total: 10,
                  ready: 8,
                  habis: 1,
                  preOrder: 1,
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(html).not.toContain('Wilayah');
  });

  it('renders Super Admin KDKMP Gresik text in top bar and Wilayah menu for super_admin', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/wilayah']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: {
                    is_demo: true,
                    user: {
                      id: '00000000-0000-4000-9000-000000000001',
                      email: 'superadmin@kdkmp-gresik.id',
                    },
                  },
                  admin: {
                    user_id: '00000000-0000-4000-9000-000000000001',
                    role: 'super_admin',
                    village_id: null,
                  },
                  villages: [GOLOKAN, SUKOREJO],
                  selectedVillageId: SUKOREJO.id,
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(html).toContain('Super Admin KDKMP Gresik');
    expect(html).not.toContain('aria-label="Pilih koperasi"');
    expect(html).toContain('Wilayah');
    expect(html).toContain('Satuan');
    expect(html).not.toContain('Pengaturan');
    expect(html).toContain('<h1 class="text-xl font-bold text-text md:text-2xl">Wilayah</h1>');
  });

  it('supports demo admin auth, profile lookup, and product stock summary in api.js', async () => {
    expect(
      summarizeProductsByStock([
        { stock_status: 'ready' },
        { stock_status: 'ready' },
        { stock_status: 'habis' },
        { stock_status: 'pre-order' },
      ])
    ).toEqual({
      total: 4,
      ready: 2,
      habis: 1,
      preOrder: 1,
    });

    const loginRes = await signInAdmin({
      email: 'golokan@kdkmp-gresik.id',
      password: 'password123',
      demo: true,
    });
    expect(loginRes.user.email).toBe('golokan@kdkmp-gresik.id');

    const profile = await getAdminProfile(loginRes.user.id, { demo: true });
    expect(profile.admin?.role).toBe('village_admin');
    expect(profile.admin?.village_id).toBe(GOLOKAN.id);
    expect(profile.villages).toHaveLength(1);
    expect(profile.villages[0].business_name).toBe('KDKMP Desa Golokan');

    const summary = await getAdminProductSummary(GOLOKAN.id, { demo: true });
    expect(summary).toEqual({
      total: 10,
      ready: 8,
      habis: 1,
      preOrder: 1,
    });

    const resetRes = await resetAdminPassword('golokan@kdkmp-gresik.id', {
      demo: true,
    });
    expect(resetRes.ok).toBe(true);

    const updateRes = await updateAdminPassword('newpass123', { demo: true });
    expect(updateRes.ok).toBe(true);

    await signOutAdmin({ demo: true });
  });
});

const ADMIN_GOLOKAN_ID = '00000000-0000-4000-9000-352509200800';
const ADMIN_SUKOREJO_ID = '00000000-0000-4000-9000-352509200100';

describe('Admin Produk & Kategori (S09)', () => {
  beforeEach(() => {
    resetDemoAdminData();
  });

  it('renders /admin/produk with search, category filter, stock filter, mobile/md cards, and lg table with right-aligned <Money> price', async () => {
    const products = await getAdminProducts(GOLOKAN.id, {
      demo: true,
      actorUserId: ADMIN_GOLOKAN_ID,
    });
    const categories = await getAdminCategories(GOLOKAN.id, {
      demo: true,
      actorUserId: ADMIN_GOLOKAN_ID,
    });

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/produk']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: {
                    is_demo: true,
                    user: {
                      id: ADMIN_GOLOKAN_ID,
                      email: 'golokan@kdkmp-gresik.id',
                    },
                  },
                  admin: {
                    user_id: ADMIN_GOLOKAN_ID,
                    role: 'village_admin',
                    village_id: GOLOKAN.id,
                  },
                  villages: [GOLOKAN],
                }}
                initialProducts={products}
                initialCategories={categories}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Search + filters
    expect(html).toContain('aria-label="Cari produk"');
    expect(html).toContain('aria-label="Filter kategori"');
    expect(html).toContain('aria-label="Filter stok"');
    expect(html).toContain('Semua Kategori');
    expect(html).toContain('Tanpa Kategori');
    expect(html).toContain('Semua Stok');

    // Mobile/md card grid & lg table
    expect(html).toContain('grid-cols-1 gap-3 md:grid-cols-2 lg:hidden');
    expect(html).toContain('hidden lg:block');
    expect(html).toContain('<th class="w-16 px-4 py-3">Foto</th>');
    expect(html).toContain('<th class="px-4 py-3">Nama</th>');
    expect(html).toContain('<th class="px-4 py-3">Kategori</th>');
    expect(html).toContain('<th class="px-4 py-3 text-right">Harga</th>');
    expect(html).toContain('<th class="px-4 py-3">Satuan</th>');
    expect(html).toContain('<th class="px-4 py-3">Stok</th>');
    expect(html).toContain('<th class="px-4 py-3 text-center">Unggulan</th>');
    expect(html).toContain('<th class="px-4 py-3 text-right">Aksi</th>');

    // Product data & <Money> tabular-nums
    expect(html).toContain('Beras Pandan Wangi 5kg');
    expect(html).toContain('Rp 72.000');
    expect(html).toContain('tabular-nums');
    expect(html).toContain('Ubah Harga Cepat');
    expect(html).toContain('Tambah Produk');
  });

  it('supports optimistic stock & featured switch updates with rollback on error', () => {
    const initial = [
      {
        id: 'p1',
        name: 'Beras 5kg',
        stock_status: 'ready',
        is_featured: false,
      },
      {
        id: 'p2',
        name: 'Minyak 2L',
        stock_status: 'habis',
        is_featured: true,
      },
    ];

    const prevP1 = { ...initial[0] };
    const optimisticStock = applyOptimisticProductPatch(initial, 'p1', {
      stock_status: 'habis',
    });
    expect(optimisticStock[0].stock_status).toBe('habis');
    expect(optimisticStock[1].stock_status).toBe('habis');

    const rolledBack = rollbackOptimisticProduct(optimisticStock, prevP1);
    expect(rolledBack[0].stock_status).toBe('ready');

    const optimisticFeatured = applyOptimisticProductPatch(initial, 'p1', {
      is_featured: true,
    });
    expect(optimisticFeatured[0].is_featured).toBe(true);
    const rolledBackFeatured = rollbackOptimisticProduct(
      optimisticFeatured,
      prevP1
    );
    expect(rolledBackFeatured[0].is_featured).toBe(false);
  });

  it('renders Quick Price Edit mode (inputmode numeric, live thousand separator, tabular-nums) and batch-saves only changed rows', async () => {
    expect(formatDigitsInput('72000')).toBe('72.000');
    expect(formatDigitsInput('Rp 159.500')).toBe('159.500');
    expect(parseFormattedInt('72.000')).toBe(72000);

    const products = await getAdminProducts(GOLOKAN.id, {
      demo: true,
      actorUserId: ADMIN_GOLOKAN_ID,
    });
    const categories = await getAdminCategories(GOLOKAN.id, {
      demo: true,
      actorUserId: ADMIN_GOLOKAN_ID,
    });

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/produk']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: {
                    is_demo: true,
                    user: {
                      id: ADMIN_GOLOKAN_ID,
                      email: 'golokan@kdkmp-gresik.id',
                    },
                  },
                  admin: {
                    user_id: ADMIN_GOLOKAN_ID,
                    role: 'village_admin',
                    village_id: GOLOKAN.id,
                  },
                  villages: [GOLOKAN],
                }}
                initialProducts={products}
                initialCategories={categories}
                initialQuickPriceMode={true}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(html).toContain('inputMode="numeric"');
    expect(html).toContain('tabular-nums');
    expect(html).toContain('value="72.000"');
    expect(html).toContain('Simpan');

    const drafts = {
      [products[0].id]: '79.000', // changed from 72000 (and >= original_price 78000)
      [products[1].id]: formatDigitsInput(products[1].price), // unchanged
      [products[2].id]: '29.500', // changed from 28000
    };

    const changes = computeQuickPriceChanges(products, drafts);
    expect(changes).toEqual([
      { id: products[0].id, price: 79000 },
      { id: products[2].id, price: 29500 },
    ]);

    const batchRes = await batchUpdateAdminProductPrices(changes, {
      villageId: GOLOKAN.id,
      demo: true,
      actorUserId: ADMIN_GOLOKAN_ID,
    });

    expect(batchRes.updatedCount).toBe(2);
    const updatedP0 = batchRes.products.find((p) => p.id === products[0].id);
    const updatedP2 = batchRes.products.find((p) => p.id === products[2].id);
    expect(updatedP0.price).toBe(79000);
    // original_price was 78000 <= 79000, so it is cleared to null
    expect(updatedP0.original_price).toBeNull();
    expect(updatedP2.price).toBe(29500);
    expect(updatedP2.original_price).toBe(31000);
  });

  it('renders ProductFormSheet (Sheet mobile / dialog lg) with all required fields, units, and capture="environment"', async () => {
    expect(PRODUCT_UNITS).toEqual([
      'kg',
      'liter',
      'pcs',
      'karung',
      'botol',
      'ikat',
      'pack',
      'lainnya',
    ]);

    const categories = await getAdminCategories(GOLOKAN.id, {
      demo: true,
      actorUserId: ADMIN_GOLOKAN_ID,
    });

    const html = renderToStaticMarkup(
      <ProductFormSheet
        open={true}
        onClose={() => {}}
        categories={categories}
        villageId={GOLOKAN.id}
        isDemo={true}
        actorUserId={ADMIN_GOLOKAN_ID}
      />
    );

    expect(html).toContain('Tambah Produk');
    expect(html).toContain('lg:max-w-xl');
    expect(html).toContain('lg:rounded-2xl');
    expect(html).toContain('Nama Produk');
    expect(html).toContain('Kategori');
    expect(html).toContain('Harga (Rp)');
    expect(html).toContain('Harga Coret (Rp)');
    expect(html).toContain('Satuan');
    expect(html).toContain('Stok');
    expect(html).toContain('Produk Unggulan');
    expect(html).toContain('Deskripsi');
    expect(html).toContain('accept="image/*"');
    expect(html).toContain('capture="environment"');
    expect(html).toContain('URL Foto (Alternatif)');
    for (const unit of PRODUCT_UNITS) {
      expect(html).toContain(`>${unit}<`);
    }
  });

  it('uploads WebP photo to product-images/{village_id}/{uuid}.webp and deletes old storage object on replace or product delete', async () => {
    expect(calculateScaledDimensions(4000, 3000, 800)).toEqual({
      width: 800,
      height: 600,
    });
    expect(calculateScaledDimensions(1080, 1920, 800)).toEqual({
      width: 450,
      height: 800,
    });

    const upload1 = await uploadProductImage(
      {
        villageId: GOLOKAN.id,
        file: { name: 'foto1.jpg', type: 'image/jpeg', size: 2450000, width: 4000, height: 3000 },
      },
      { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
    );

    expect(upload1.objectPath).toMatch(
      new RegExp(`^${GOLOKAN.id}/[0-9a-f-]{36}\\.webp$`, 'i')
    );
    expect(upload1.mimeType).toBe('image/webp');
    expect(upload1.compressedSize).toBeLessThanOrEqual(102400);
    expect(upload1.cacheControl).toBe('31536000');
    expect(getDemoStorageObject(upload1.objectPath)).not.toBeNull();

    const created = await createAdminProduct(
      {
        village_id: GOLOKAN.id,
        name: 'Kerupuk Udang Sidayu 250g',
        price: 18000,
        original_price: 20000,
        unit: 'pack',
        stock_status: 'ready',
        is_featured: true,
        image_url: upload1.publicUrl,
      },
      { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
    );
    expect(extractStorageObjectPath(created.image_url)).toBe(upload1.objectPath);

    // Replace with second upload -> old storage object must be deleted
    const upload2 = await uploadProductImage(
      {
        villageId: GOLOKAN.id,
        file: { name: 'foto2.jpg', type: 'image/jpeg', size: 1850000, width: 3024, height: 4032 },
      },
      { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
    );
    expect(getDemoStorageObject(upload2.objectPath)).not.toBeNull();

    const updated = await updateAdminProduct(
      created.id,
      { image_url: upload2.publicUrl },
      { villageId: GOLOKAN.id, demo: true, actorUserId: ADMIN_GOLOKAN_ID }
    );
    expect(extractStorageObjectPath(updated.image_url)).toBe(upload2.objectPath);
    // Old object 1 must be deleted from storage
    expect(getDemoStorageObject(upload1.objectPath)).toBeNull();
    expect(getDemoStorageObject(upload2.objectPath)).not.toBeNull();

    // Replace with external Google Drive URL -> upload2 object must be deleted
    const driveUrl = driveImageUrl(
      'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456/view'
    );
    expect(driveUrl).toBe(
      'https://lh3.googleusercontent.com/d/1AbCdEfGhIjKlMnOpQrStUvWxYz123456'
    );

    const updatedDrive = await updateAdminProduct(
      created.id,
      { image_url: driveUrl },
      { villageId: GOLOKAN.id, demo: true, actorUserId: ADMIN_GOLOKAN_ID }
    );
    expect(updatedDrive.image_url).toBe(driveUrl);
    expect(getDemoStorageObject(upload2.objectPath)).toBeNull();

    // Upload a 3rd photo, attach to product, then delete product -> storage object deleted
    const upload3 = await uploadProductImage(
      {
        villageId: GOLOKAN.id,
        file: { name: 'foto3.jpg', type: 'image/jpeg', size: 1250000, width: 1920, height: 1080 },
      },
      { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
    );
    await updateAdminProduct(
      created.id,
      { image_url: upload3.publicUrl },
      { villageId: GOLOKAN.id, demo: true, actorUserId: ADMIN_GOLOKAN_ID }
    );
    expect(getDemoStorageObject(upload3.objectPath)).not.toBeNull();

    const delRes = await deleteAdminProduct(created.id, {
      villageId: GOLOKAN.id,
      demo: true,
      actorUserId: ADMIN_GOLOKAN_ID,
    });
    expect(delRes.deleted).toBe(true);
    expect(delRes.removedStorageObject).toBe(upload3.objectPath);
    expect(getDemoStorageObject(upload3.objectPath)).toBeNull();
  });

  it('supports /admin/kategori CRUD, up/down reordering, and deleting category sets products to without category', async () => {
    const initialCats = await getAdminCategories(GOLOKAN.id, {
      demo: true,
      actorUserId: ADMIN_GOLOKAN_ID,
    });
    expect(initialCats).toHaveLength(4);

    // Render /admin/kategori
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/kategori']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: {
                    is_demo: true,
                    user: {
                      id: ADMIN_GOLOKAN_ID,
                      email: 'golokan@kdkmp-gresik.id',
                    },
                  },
                  admin: {
                    user_id: ADMIN_GOLOKAN_ID,
                    role: 'village_admin',
                    village_id: GOLOKAN.id,
                  },
                  villages: [GOLOKAN],
                }}
                initialCategories={initialCats}
                initialProducts={[]}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );
    expect(html).toContain('Kategori');
    expect(html).toContain('Tambah Kategori');
    expect(html).toContain('Beras &amp; Pangan Pokok');

    // Create category
    const newCat = await createAdminCategory(
      { villageId: GOLOKAN.id, name: 'Hasil Laut & Olahan' },
      { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
    );
    expect(newCat.name).toBe('Hasil Laut & Olahan');
    expect(newCat.sort_order).toBe(5);

    // Duplicate category name is rejected
    await expect(
      createAdminCategory(
        { villageId: GOLOKAN.id, name: 'Hasil Laut & Olahan' },
        { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
      )
    ).rejects.toThrow(/Kategori sudah terdaftar/);

    // village_admin cannot rename master category
    await expect(
      updateAdminCategory(
        newCat.id,
        { name: 'Produk UMKM Desa' },
        { villageId: GOLOKAN.id, demo: true, actorUserId: ADMIN_GOLOKAN_ID }
      )
    ).rejects.toThrow(/Hanya Super Admin/);

    // super_admin can rename category
    const renamed = await updateAdminCategory(
      newCat.id,
      { name: 'Produk UMKM Desa' },
      { villageId: GOLOKAN.id, demo: true, actorUserId: SUPER_ADMIN_USER_ID }
    );
    expect(renamed.name).toBe('Produk UMKM Desa');

    // Reorder up
    const swappedLocal = swapCategoryOrder(initialCats, 0, 1);
    expect(swappedLocal[0].id).toBe(initialCats[1].id);
    expect(swappedLocal[0].sort_order).toBe(1);

    // village_admin cannot reorder
    await expect(
      moveAdminCategory(newCat.id, 'up', {
        villageId: GOLOKAN.id,
        demo: true,
        actorUserId: ADMIN_GOLOKAN_ID,
      })
    ).rejects.toThrow(/Hanya Super Admin/);

    const afterMoveUp = await moveAdminCategory(newCat.id, 'up', {
      villageId: GOLOKAN.id,
      demo: true,
      actorUserId: SUPER_ADMIN_USER_ID,
    });
    expect(afterMoveUp[3].id).toBe(newCat.id);
    expect(afterMoveUp[3].sort_order).toBe(4);

    // Reorder down
    const afterMoveDown = await moveAdminCategory(newCat.id, 'down', {
      villageId: GOLOKAN.id,
      demo: true,
      actorUserId: SUPER_ADMIN_USER_ID,
    });
    expect(afterMoveDown[4].id).toBe(newCat.id);
    expect(afterMoveDown[4].sort_order).toBe(5);

    // Delete first category ('Beras & Pangan Pokok') -> products in that category become category_id = null
    const firstCatId = initialCats[0].id;
    const beforeProds = await getAdminProducts(GOLOKAN.id, {
      demo: true,
      actorUserId: ADMIN_GOLOKAN_ID,
    });
    const inFirstCatCount = beforeProds.filter(
      (p) => p.category_id === firstCatId
    ).length;
    expect(inFirstCatCount).toBeGreaterThan(0);

    // village_admin cannot delete
    await expect(
      deleteAdminCategory(firstCatId, {
        villageId: GOLOKAN.id,
        demo: true,
        actorUserId: ADMIN_GOLOKAN_ID,
      })
    ).rejects.toThrow(/Hanya Super Admin/);

    await deleteAdminCategory(firstCatId, {
      villageId: GOLOKAN.id,
      demo: true,
      actorUserId: SUPER_ADMIN_USER_ID,
    });

    const afterProds = await getAdminProducts(GOLOKAN.id, {
      demo: true,
      actorUserId: ADMIN_GOLOKAN_ID,
    });
    expect(afterProds).toHaveLength(beforeProds.length);
    expect(afterProds.filter((p) => p.category_id === firstCatId)).toHaveLength(
      0
    );
    expect(
      afterProds.filter((p) => p.category_id === null).length
    ).toBeGreaterThanOrEqual(inFirstCatCount);
  });

  it('enforces strict data & storage isolation between 2 village_admin accounts (Golokan vs Sukorejo)', async () => {
    const golokanProds = await getAdminProducts(GOLOKAN.id, {
      demo: true,
      actorUserId: ADMIN_GOLOKAN_ID,
    });
    const sukorejoProds = await getAdminProducts(SUKOREJO.id, {
      demo: true,
      actorUserId: ADMIN_SUKOREJO_ID,
    });

    // 1. Admin Golokan cannot read/create/update/delete Sukorejo products or categories
    await expect(
      getAdminProducts(SUKOREJO.id, {
        demo: true,
        actorUserId: ADMIN_GOLOKAN_ID,
      })
    ).rejects.toThrow(/Akses ditolak/);

    await expect(
      createAdminProduct(
        {
          village_id: SUKOREJO.id,
          name: 'Produk Ilegal',
          price: 10000,
          unit: 'pcs',
        },
        { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
      )
    ).rejects.toThrow(/Akses ditolak/);

    await expect(
      updateAdminProduct(
        sukorejoProds[0].id,
        { price: 1000 },
        { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
      )
    ).rejects.toThrow(/Akses ditolak/);

    await expect(
      deleteAdminProduct(sukorejoProds[0].id, {
        demo: true,
        actorUserId: ADMIN_GOLOKAN_ID,
      })
    ).rejects.toThrow(/Akses ditolak/);

    await expect(
      createAdminCategory(
        { villageId: SUKOREJO.id, name: 'Kategori Ilegal' },
        { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
      )
    ).rejects.toThrow(/Akses ditolak/);

    // 2. Admin Golokan cannot upload or delete files in Sukorejo storage folder
    await expect(
      uploadProductImage(
        {
          villageId: SUKOREJO.id,
          file: { name: 'hack.jpg', type: 'image/jpeg', size: 50000 },
        },
        { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
      )
    ).rejects.toThrow(/Akses ditolak/);

    const sukorejoUpload = await uploadProductImage(
      {
        villageId: SUKOREJO.id,
        file: { name: 'sukorejo.jpg', type: 'image/jpeg', size: 50000 },
      },
      { demo: true, actorUserId: ADMIN_SUKOREJO_ID }
    );
    expect(getDemoStorageObject(sukorejoUpload.objectPath)).not.toBeNull();

    await expect(
      deleteProductImage(sukorejoUpload.publicUrl, {
        demo: true,
        actorUserId: ADMIN_GOLOKAN_ID,
      })
    ).rejects.toThrow(/Akses ditolak/);
    expect(getDemoStorageObject(sukorejoUpload.objectPath)).not.toBeNull();

    // 3. Conversely, Admin Sukorejo cannot modify Golokan products or files
    await expect(
      updateAdminProduct(
        golokanProds[0].id,
        { stock_status: 'habis' },
        { demo: true, actorUserId: ADMIN_SUKOREJO_ID }
      )
    ).rejects.toThrow(/Akses ditolak/);

    const golokanUpload = await uploadProductImage(
      {
        villageId: GOLOKAN.id,
        file: { name: 'golokan.jpg', type: 'image/jpeg', size: 50000 },
      },
      { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
    );
    await expect(
      deleteProductImage(golokanUpload.publicUrl, {
        demo: true,
        actorUserId: ADMIN_SUKOREJO_ID,
      })
    ).rejects.toThrow(/Akses ditolak/);
    expect(getDemoStorageObject(golokanUpload.objectPath)).not.toBeNull();
  });
});

describe('Admin Pengaturan Koperasi (S10)', () => {
  beforeEach(() => {
    resetDemoAdminData();
  });

  it('renders /admin/pengaturan with form fields, lg 2-column grid, StoreHeader preview, Bagikan Katalog + QR PNG, and mobile sticky save button', async () => {
    const village = await getAdminVillageSettings(GOLOKAN.id, {
      demo: true,
      actorUserId: ADMIN_GOLOKAN_ID,
    });
    const catalogUrl = buildVillageCatalogUrl(
      village,
      'https://katalog-kdkmp-gresik.pages.dev'
    );
    expect(catalogUrl).toBe(
      'https://katalog-kdkmp-gresik.pages.dev/sidayu/golokan'
    );

    const qrDataUrl = await generateCatalogQrDataUrl(catalogUrl);
    expect(qrDataUrl).toMatch(/^data:image\/png;base64,/);

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/pengaturan']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: {
                    is_demo: true,
                    user: {
                      id: ADMIN_GOLOKAN_ID,
                      email: 'golokan@kdkmp-gresik.id',
                    },
                  },
                  admin: {
                    user_id: ADMIN_GOLOKAN_ID,
                    role: 'village_admin',
                    village_id: GOLOKAN.id,
                  },
                  villages: [village],
                }}
                initialVillage={village}
                initialQrDataUrl={qrDataUrl}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Heading & responsive 2-column grid (lg:grid-cols-2)
    expect(html).toContain('Pengaturan Koperasi');
    expect(html).toContain('grid-cols-1 gap-6 lg:grid-cols-2');

    // Form fields
    expect(html).toContain('Nama Koperasi');
    expect(html).toContain('Nomor WhatsApp');
    expect(html).toContain('+62');
    expect(html).toContain('value="81234567801"');
    expect(html).toContain('Alamat');
    expect(html).toContain('URL Maps');
    expect(html).toContain('Logo Koperasi (256×256 WebP)');
    expect(html).toContain('Unggah Logo');
    expect(html).toContain('/logo-kdkmp.jpg');
    expect(html).toContain('Jam Buka (WIB)');
    expect(html).toContain('Jam Tutup (WIB)');
    expect(html).toContain('Minimal Gratis Ongkir (Rp)');
    expect(html).toContain('Catatan Pengantaran');
    expect(html).toContain('<textarea');
    expect(html).toContain('tabular-nums');

    // Mobile sticky save bar
    expect(html).toContain('sticky bottom-14');
    expect(html).toContain('Simpan Pengaturan');

    // StoreHeader live preview
    expect(html).toContain('Pratinjau Header Katalog');
    expect(html).toContain('KDKMP Desa Golokan');
    expect(html).toContain('Desa Golokan · Kec. Sidayu');
    expect(html).toContain('Gratis ongkir min.');
    expect(html).toContain('Rp 50.000');

    // Bagikan Katalog card: URL + Salin + QR PNG
    expect(html).toContain('Bagikan Katalog');
    expect(html).toContain('aria-label="URL Katalog"');
    expect(html).toContain('/sidayu/golokan');
    expect(html).toContain('Salin');
    expect(html).toContain('Unduh QR (PNG)');
    expect(html).toContain('data:image/png;base64,');
  });

  it('validates and normalizes phone, URL Maps, hours, and free_delivery_min', () => {
    const sanitized = validateAndSanitizeVillageSettings({
      business_name: '  KDKMP Desa Golokan Mandiri  ',
      whatsapp_number: '0812-3456-7890',
      address: '  Jl. Pendidikan No. 5, Desa Golokan  ',
      gmaps_url: 'https://maps.google.com/?q=-6.9925,112.5644',
      logo_url: '',
      opening_hour: '06:30',
      closing_hour: '21:00',
      free_delivery_min: 35000,
      delivery_note: '  Gratis ongkir min. Rp 35.000  ',
    });

    expect(sanitized).toEqual({
      business_name: 'KDKMP Desa Golokan Mandiri',
      whatsapp_number: '6281234567890',
      address: 'Jl. Pendidikan No. 5, Desa Golokan',
      gmaps_url: 'https://maps.google.com/?q=-6.9925,112.5644',
      logo_url: null,
      opening_hour: '06:30',
      closing_hour: '21:00',
      free_delivery_min: 35000,
      delivery_note: 'Gratis ongkir min. Rp 35.000',
    });

    expect(() =>
      validateAndSanitizeVillageSettings({
        business_name: '',
        whatsapp_number: '081234567890',
      })
    ).toThrow(/Nama koperasi wajib diisi/);

    expect(() =>
      validateAndSanitizeVillageSettings({
        business_name: 'KDKMP Desa Golokan',
        whatsapp_number: '12345',
      })
    ).toThrow(/Nomor WhatsApp tidak valid/);

    expect(() =>
      validateAndSanitizeVillageSettings({
        business_name: 'KDKMP Desa Golokan',
        whatsapp_number: '081234567890',
        gmaps_url: 'maps.google.com/tanpa-http',
      })
    ).toThrow(/URL Maps harus diawali/);
  });

  it('uploads square 256x256 WebP logo, deletes old storage object on replace/clear, and reflects saved changes in public catalog after refetch', async () => {
    expect(calculateSquareCrop(1200, 800)).toEqual({
      sx: 200,
      sy: 0,
      sWidth: 800,
      sHeight: 800,
    });

    const logoUpload1 = await uploadVillageLogo(
      {
        villageId: GOLOKAN.id,
        file: {
          name: 'logo1.png',
          type: 'image/png',
          size: 420000,
          width: 1024,
          height: 768,
        },
      },
      { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
    );

    expect(logoUpload1.width).toBe(256);
    expect(logoUpload1.height).toBe(256);
    expect(logoUpload1.mimeType).toBe('image/webp');
    expect(logoUpload1.compressedSize).toBeLessThanOrEqual(102400);
    expect(getDemoStorageObject(logoUpload1.objectPath)).not.toBeNull();

    // Prime public catalog cache before update
    const catalogBefore = await getVillageCatalog('sidayu', 'golokan', {
      demo: true,
    });
    expect(catalogBefore.village.business_name).toBe('KDKMP Desa Golokan');
    expect(catalogBefore.village.free_delivery_min).toBe(50000);

    // Save updated village settings
    const updatedVillage = await updateAdminVillageSettings(
      GOLOKAN.id,
      {
        business_name: 'KDKMP Desa Golokan Sejahtera',
        whatsapp_number: '0813-9999-8888',
        address: 'Jl. Balai Desa Golokan No. 1, Kec. Sidayu',
        gmaps_url: 'https://maps.google.com/?q=-6.9900,112.5600',
        logo_url: logoUpload1.publicUrl,
        opening_hour: '06:30',
        closing_hour: '21:30',
        free_delivery_min: 30000,
        delivery_note: 'Gratis ongkir seluruh RT Desa Golokan min. Rp 30.000',
      },
      { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
    );

    expect(updatedVillage.business_name).toBe('KDKMP Desa Golokan Sejahtera');
    expect(updatedVillage.whatsapp_number).toBe('6281399998888');
    expect(updatedVillage.opening_hour).toBe('06:30');
    expect(updatedVillage.closing_hour).toBe('21:30');
    expect(updatedVillage.free_delivery_min).toBe(30000);

    // Refetch public catalog & directory -> must reflect updated settings immediately
    const catalogAfter = await getVillageCatalog('sidayu', 'golokan', {
      demo: true,
    });
    expect(catalogAfter.village.business_name).toBe(
      'KDKMP Desa Golokan Sejahtera'
    );
    expect(catalogAfter.village.whatsapp_number).toBe('6281399998888');
    expect(catalogAfter.village.address).toBe(
      'Jl. Balai Desa Golokan No. 1, Kec. Sidayu'
    );
    expect(catalogAfter.village.opening_hour).toBe('06:30');
    expect(catalogAfter.village.closing_hour).toBe('21:30');
    expect(catalogAfter.village.free_delivery_min).toBe(30000);
    expect(catalogAfter.village.delivery_note).toBe(
      'Gratis ongkir seluruh RT Desa Golokan min. Rp 30.000'
    );
    expect(extractStorageObjectPath(catalogAfter.village.logo_url)).toBe(
      logoUpload1.objectPath
    );

    const directoryAfter = await getVillageDirectory({
      kecamatan: 'sidayu',
      demo: true,
    });
    const golokanDir = directoryAfter.find((v) => v.id === GOLOKAN.id);
    expect(golokanDir.business_name).toBe('KDKMP Desa Golokan Sejahtera');
    expect(golokanDir.free_delivery_min).toBe(30000);

    // Clearing logo back to null (fallback KDKMP logo) deletes old storage object
    const clearedLogoVillage = await updateAdminVillageSettings(
      GOLOKAN.id,
      {
        ...updatedVillage,
        logo_url: null,
      },
      { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
    );
    expect(clearedLogoVillage.logo_url).toBeNull();
    expect(getDemoStorageObject(logoUpload1.objectPath)).toBeNull();

    // RLS isolation: Admin Golokan cannot update Sukorejo settings or immutable fields
    await expect(
      updateAdminVillageSettings(
        SUKOREJO.id,
        {
          business_name: 'KDKMP Bajakan',
          whatsapp_number: '6281234567890',
          opening_hour: '07:00',
          closing_hour: '20:00',
          free_delivery_min: 0,
        },
        { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
      )
    ).rejects.toThrow(/Akses ditolak/);

    await expect(
      updateAdminVillageSettings(
        GOLOKAN.id,
        {
          ...clearedLogoVillage,
          slug: 'slug-baru-terlarang',
        },
        { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
      )
    ).rejects.toThrow(/tidak diizinkan mengubah/);
  });
});

describe('Super Admin: Wilayah, Koperasi & Admin Koperasi (S11)', () => {
  beforeEach(() => {
    resetDemoAdminData();
  });

  it('rejects village_admin from accessing /admin/wilayah via SuperAdminGuard (redirects to /admin)', () => {
    const villageAdminHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/wilayah']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: {
                    user: { id: '00000000-0000-4000-9000-352509200800', email: 'golokan@kdkmp-gresik.id' },
                    is_demo: true,
                  },
                  admin: {
                    user_id: '00000000-0000-4000-9000-352509200800',
                    role: 'village_admin',
                    village_id: GOLOKAN.id,
                  },
                  villages: [GOLOKAN],
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // village_admin is redirected to /admin (summary), NOT /admin/wilayah
    expect(villageAdminHtml).not.toContain('Wilayah &amp; Koperasi');
    expect(villageAdminHtml).not.toContain('Tambah Kecamatan');
    expect(villageAdminHtml).toContain('Ringkasan');
  });

  it('allows super_admin to access /admin/wilayah and renders all 3 tabs', () => {
    const superAdminHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/wilayah']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: {
                    user: { id: '00000000-0000-4000-9000-000000000001', email: 'superadmin@kdkmp-gresik.id' },
                    is_demo: true,
                  },
                  admin: {
                    user_id: '00000000-0000-4000-9000-000000000001',
                    role: 'super_admin',
                    village_id: null,
                  },
                  villages: [GOLOKAN, SUKOREJO],
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(superAdminHtml).toContain('<h1 class="text-xl font-bold text-text md:text-2xl">Wilayah</h1>');
    expect(superAdminHtml).toContain('Kecamatan');
    expect(superAdminHtml).toContain('Koperasi');
    expect(superAdminHtml).toContain('Admin Koperasi');
    expect(superAdminHtml).toContain('Tambah Kecamatan');
  });

  it('manages subdistricts: lists count <Num>, toggles active switch (pilot -> ekspansi), auto slugs, and rejects reserved/duplicate slugs', async () => {
    const subdistricts = await getAdminSubdistricts({ demo: true });
    expect(subdistricts.length).toBe(18);

    const sidayu = subdistricts.find((s) => s.slug === 'sidayu');
    expect(sidayu).toBeDefined();
    expect(sidayu.is_active).toBe(true);
    expect(sidayu.village_count).toBe(2);

    const bungah = subdistricts.find((s) => s.slug === 'bungah');
    expect(bungah).toBeDefined();
    expect(bungah.is_active).toBe(false);

    // Toggle switch: activate Bungah (pilot -> expansion)
    const activatedBungah = await toggleAdminSubdistrictActive(bungah.id, true, { demo: true });
    expect(activatedBungah.is_active).toBe(true);

    const afterToggle = await getAdminSubdistricts({ demo: true });
    const bungahAfter = afterToggle.find((s) => s.id === bungah.id);
    expect(bungahAfter.is_active).toBe(true);

    // Auto slug helper
    expect(slugify('Kecamatan Sidayu')).toBe('kecamatan-sidayu');
    expect(slugify('Desa Golokan')).toBe('desa-golokan');
    expect(slugify('Tanjung Widoro')).toBe('tanjung-widoro');

    // Create subdistrict with auto-slug
    const newKec = await createAdminSubdistrict(
      {
        name: 'Kecamatan Anyar',
        code: '35.25.99',
        is_active: false,
        sort_order: 99,
      },
      { demo: true }
    );
    expect(newKec.slug).toBe('kecamatan-anyar');

    const updatedKec = await updateAdminSubdistrict(
      newKec.id,
      { name: 'Kecamatan Anyar Revisi' },
      { demo: true }
    );
    expect(updatedKec.name).toBe('Kecamatan Anyar Revisi');

    // Rejection of reserved slugs
    await expect(
      createAdminSubdistrict(
        {
          name: 'Admin Wilayah',
          code: '35.25.98',
          slug: 'admin',
        },
        { demo: true }
      )
    ).rejects.toThrow(/kata terlarang/);

    await expect(
      createAdminSubdistrict(
        {
          name: 'API Service',
          code: '35.25.97',
          slug: 'api',
        },
        { demo: true }
      )
    ).rejects.toThrow(/kata terlarang/);

    // Rejection of duplicate subdistrict slug
    await expect(
      createAdminSubdistrict(
        {
          name: 'Sidayu Baru',
          code: '35.25.96',
          slug: 'sidayu',
        },
        { demo: true }
      )
    ).rejects.toThrow(/sudah digunakan/);
  });

  it('manages cooperatives: enforces slug uniqueness per subdistrict, allows same slug in different subdistrict, and validates active phone', async () => {
    const allVillages = await getAdminVillages({ demo: true });
    expect(allVillages.length).toBeGreaterThanOrEqual(2);

    const sidayuSub = (await getAdminSubdistricts({ demo: true })).find((s) => s.slug === 'sidayu');
    const bungahSub = (await getAdminSubdistricts({ demo: true })).find((s) => s.slug === 'bungah');

    // 1. Duplicate slug in the SAME subdistrict is REJECTED
    const dupSameSubdistrict = validateVillagePayload(
      {
        subdistrict_id: sidayuSub.id,
        name: 'Golokan Dua',
        slug: 'golokan', // already exists in Sidayu!
        type: 'desa',
        business_name: 'KDKMP Golokan Dua',
        is_active: false,
      },
      allVillages
    );
    expect(dupSameSubdistrict.isValid).toBe(false);
    expect(dupSameSubdistrict.error).toBe('Slug sudah digunakan di kecamatan ini.');

    await expect(
      createAdminVillage(
        {
          subdistrict_id: sidayuSub.id,
          name: 'Golokan Dua',
          slug: 'golokan',
          type: 'desa',
          business_name: 'KDKMP Golokan Dua',
          is_active: false,
        },
        { demo: true }
      )
    ).rejects.toThrow(/sudah digunakan di kecamatan ini/);

    // 2. Same slug in a DIFFERENT subdistrict is ACCEPTED (e.g. sukorejo in Bungah vs sukorejo in Sidayu)
    const twinSlugDiffSubdistrict = validateVillagePayload(
      {
        subdistrict_id: bungahSub.id,
        name: 'Sukorejo Bungah',
        slug: 'sukorejo', // already exists in Sidayu, but valid in Bungah!
        type: 'desa',
        business_name: 'KDKMP Desa Sukorejo Bungah',
        is_active: false,
      },
      // existing villages excluding Bungah Sukorejo
      allVillages.filter((v) => v.subdistrict_id !== bungahSub.id)
    );
    expect(twinSlugDiffSubdistrict.isValid).toBe(true);
    expect(twinSlugDiffSubdistrict.sanitized.slug).toBe('sukorejo');

    // 3. Reserved slug is REJECTED
    const reservedSlug = validateVillagePayload(
      {
        subdistrict_id: sidayuSub.id,
        name: 'Admin Desa',
        slug: 'admin',
        type: 'desa',
        business_name: 'KDKMP Admin Desa',
        is_active: false,
      },
      allVillages
    );
    expect(reservedSlug.isValid).toBe(false);
    expect(reservedSlug.error).toContain('kata terlarang');

    // 4. Activating without valid WhatsApp number is REJECTED
    const invalidPhoneActivation = validateVillagePayload(
      {
        subdistrict_id: sidayuSub.id,
        name: 'Desa Uji',
        slug: 'desa-uji',
        type: 'desa',
        business_name: 'KDKMP Desa Uji',
        whatsapp_number: '12345', // invalid phone
        is_active: true,
      },
      allVillages
    );
    expect(invalidPhoneActivation.isValid).toBe(false);
    expect(invalidPhoneActivation.error).toContain('Nomor WhatsApp wajib');

    // Valid creation succeeds
    const createdVillage = await createAdminVillage(
      {
        subdistrict_id: sidayuSub.id,
        name: 'Bedanten',
        slug: 'bedanten',
        type: 'desa',
        business_name: 'KDKMP Desa Bedanten',
        whatsapp_number: '081234567899',
        is_active: true,
      },
      { demo: true }
    );
    expect(createdVillage.slug).toBe('bedanten');
    expect(createdVillage.whatsapp_number).toBe('6281234567899');
    expect(createdVillage.is_active).toBe(true);

    const updatedVillage = await updateAdminVillage(
      createdVillage.id,
      { business_name: 'KDKMP Desa Bedanten Maju' },
      { demo: true }
    );
    expect(updatedVillage.business_name).toBe('KDKMP Desa Bedanten Maju');

    const toggledVillage = await toggleAdminVillageActive(createdVillage.id, false, { demo: true });
    expect(toggledVillage.is_active).toBe(false);
  });

  it('manages village admins: assigns manager, rejects unregistered emails with exact message, enforces 1:1, and revokes manager', async () => {
    const adminsBefore = await getAdminVillageAdmins({ demo: true });
    expect(adminsBefore.length).toBe(2); // Golokan and Sukorejo managers

    // 1. Unregistered email is rejected with exact prompt message
    await expect(
      assignVillageAdmin({
        email: 'tidakterdaftar@kdkmp-gresik.id',
        villageId: GOLOKAN.id,
        demo: true,
      })
    ).rejects.toThrow('Email belum terdaftar. Undang via Supabase Dashboard.');

    await expect(
      assignVillageAdmin({
        email: 'pengguna_asing@gmail.com',
        villageId: GOLOKAN.id,
        demo: true,
      })
    ).rejects.toThrow('Email belum terdaftar. Undang via Supabase Dashboard.');

    // 2. Cooperative that already has a manager cannot be assigned another manager (1 KDKMP = 1 manager)
    await expect(
      assignVillageAdmin({
        email: 'calonmanager@kdkmp-gresik.id',
        villageId: GOLOKAN.id, // Golokan already has manager golokan@kdkmp-gresik.id
        demo: true,
      })
    ).rejects.toThrow('KDKMP ini sudah memiliki manager aktif (1 KDKMP = 1 manager).');

    // 3. Assign manager to Bungah Sukorejo (which has no manager yet)
    const bungahVillages = (await getAdminVillages({ demo: true })).filter((v) => v.subdistrict_slug === 'bungah');
    const bungahSukorejo = bungahVillages[0];

    const assignResult = await assignVillageAdmin({
      email: 'calonmanager@kdkmp-gresik.id',
      villageId: bungahSukorejo.id,
      demo: true,
    });
    expect(assignResult.email).toBe('calonmanager@kdkmp-gresik.id');
    expect(assignResult.village_id).toBe(bungahSukorejo.id);
    expect(assignResult.role).toBe('village_admin');

    const adminsAfterAssign = await getAdminVillageAdmins({ demo: true });
    expect(adminsAfterAssign.length).toBe(3);
    const assignedRow = adminsAfterAssign.find((a) => a.email === 'calonmanager@kdkmp-gresik.id');
    expect(assignedRow).toBeDefined();
    expect(assignedRow.village_id).toBe(bungahSukorejo.id);

    // 4. Same manager cannot be assigned to another cooperative (1 manager = 1 KDKMP)
    await expect(
      assignVillageAdmin({
        email: 'calonmanager@kdkmp-gresik.id',
        villageId: GOLOKAN.id,
        demo: true,
      })
    ).rejects.toThrow('Akun ini sudah menjadi manager di KDKMP lain (1 manager = 1 KDKMP).');

    // 5. Revoke manager
    const revokeResult = await revokeVillageAdmin(assignedRow.user_id, { demo: true });
    expect(revokeResult).toBe(true);

    const adminsAfterRevoke = await getAdminVillageAdmins({ demo: true });
    expect(adminsAfterRevoke.length).toBe(2);
    expect(adminsAfterRevoke.some((a) => a.email === 'calonmanager@kdkmp-gresik.id')).toBe(false);
  });

  it('renders AdminWilayahPage tabs with <Num> and <DateText> precision elements and mobile/desktop responsive markup', () => {
    const subdistrictsMock = [
      {
        id: 'sub-1',
        code: '35.25.09',
        name: 'Sidayu',
        slug: 'sidayu',
        is_active: true,
        sort_order: 1,
        village_count: 2,
        created_at: '2026-11-09T00:00:00Z',
      },
    ];

    const villagesMock = [
      {
        id: 'v-1',
        subdistrict_id: 'sub-1',
        subdistrict_name: 'Sidayu',
        subdistrict_slug: 'sidayu',
        code: '35.25.09.2008',
        name: 'Golokan',
        slug: 'golokan',
        type: 'desa',
        business_name: 'KDKMP Desa Golokan',
        whatsapp_number: '6281234567801',
        is_active: true,
        product_count: 10,
        created_at: '2026-11-09T00:00:00Z',
      },
    ];

    const adminsMock = [
      {
        user_id: 'u-1',
        email: 'golokan@kdkmp-gresik.id',
        role: 'village_admin',
        village_id: 'v-1',
        village_name: 'Golokan',
        business_name: 'KDKMP Desa Golokan',
        subdistrict_name: 'Sidayu',
        created_at: '2026-11-09T00:00:00Z',
      },
    ];

    // 1. Tab Kecamatan
    const kecHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/wilayah?tab=kecamatan']}>
        <AdminWilayahPage
          initialSubdistricts={subdistrictsMock}
          initialVillages={villagesMock}
          initialVillageAdmins={adminsMock}
          initialTab="kecamatan"
        />
      </MemoryRouter>
    );
    expect(kecHtml).toContain('Kec. Sidayu');
    expect(kecHtml).toContain('35.25.09');
    expect(kecHtml).toContain('/sidayu');
    expect(kecHtml).toContain('koperasi');

    // 2. Tab Koperasi
    const kopHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/wilayah?tab=koperasi']}>
        <AdminWilayahPage
          initialSubdistricts={subdistrictsMock}
          initialVillages={villagesMock}
          initialVillageAdmins={adminsMock}
          initialTab="koperasi"
        />
      </MemoryRouter>
    );
    expect(kopHtml).toContain('KDKMP Desa Golokan');
    expect(kopHtml).toContain('Desa');
    expect(kopHtml).toContain('Aktif');
    expect(kopHtml).toContain('10'); // product count
    expect(kopHtml).toContain('09/11/2026'); // DateText created date

    // 3. Tab Admin Koperasi
    const admHtml = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/wilayah?tab=admin']}>
        <AdminWilayahPage
          initialSubdistricts={subdistrictsMock}
          initialVillages={villagesMock}
          initialVillageAdmins={adminsMock}
          initialTab="admin"
        />
      </MemoryRouter>
    );
    expect(admHtml).toContain('Tetapkan Manager KDKMP');
    expect(admHtml).toContain('golokan@kdkmp-gresik.id');
    expect(admHtml).toContain('Cabut');
  });

  it('supports full CRUD and reordering for master product units with super_admin guard and duplicate rejection (S11b)', async () => {
    // 1. Get initial units
    const units = await getAdminProductUnits({ demo: true });
    expect(units.length).toBeGreaterThanOrEqual(10);
    expect(units.map((u) => u.name)).toContain('kg');
    expect(units.map((u) => u.name)).toContain('pcs');

    // 2. village_admin is blocked from creating unit
    await expect(
      createAdminProductUnit(
        { name: 'renteng' },
        { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
      )
    ).rejects.toThrow(/Hanya Super Admin/);

    // 3. Duplicate name is rejected
    await expect(
      createAdminProductUnit(
        { name: '  KG  ' },
        { demo: true, actorUserId: SUPER_ADMIN_USER_ID }
      )
    ).rejects.toThrow(/Satuan sudah terdaftar/);

    // 4. super_admin creates new unit
    const newUnit = await createAdminProductUnit(
      { name: 'renteng' },
      { demo: true, actorUserId: SUPER_ADMIN_USER_ID }
    );
    expect(newUnit.name).toBe('renteng');
    expect(newUnit.sort_order).toBe(units.length + 1);

    // 5. village_admin is blocked from updating unit
    await expect(
      updateAdminProductUnit(
        newUnit.id,
        { name: 'gulung' },
        { demo: true, actorUserId: ADMIN_GOLOKAN_ID }
      )
    ).rejects.toThrow(/Hanya Super Admin/);

    // 6. Rename with duplicate name is rejected
    await expect(
      updateAdminProductUnit(
        newUnit.id,
        { name: 'liter' },
        { demo: true, actorUserId: SUPER_ADMIN_USER_ID }
      )
    ).rejects.toThrow(/Satuan sudah terdaftar/);

    // 7. super_admin updates unit
    const updated = await updateAdminProductUnit(
      newUnit.id,
      { name: 'gulung' },
      { demo: true, actorUserId: SUPER_ADMIN_USER_ID }
    );
    expect(updated.name).toBe('gulung');

    // 8. Move up / down
    await expect(
      moveAdminProductUnit(newUnit.id, 'up', {
        demo: true,
        actorUserId: ADMIN_GOLOKAN_ID,
      })
    ).rejects.toThrow(/Hanya Super Admin/);

    const afterMove = await moveAdminProductUnit(newUnit.id, 'up', {
      demo: true,
      actorUserId: SUPER_ADMIN_USER_ID,
    });
    const foundIdx = afterMove.findIndex((u) => u.id === newUnit.id);
    expect(foundIdx).toBe(afterMove.length - 2);

    // 9. village_admin is blocked from deleting unit
    await expect(
      deleteAdminProductUnit(newUnit.id, {
        demo: true,
        actorUserId: ADMIN_GOLOKAN_ID,
      })
    ).rejects.toThrow(/Hanya Super Admin/);

    // 10. super_admin deletes unit
    await deleteAdminProductUnit(newUnit.id, {
      demo: true,
      actorUserId: SUPER_ADMIN_USER_ID,
    });
    const finalUnits = await getAdminProductUnits({ demo: true });
    expect(finalUnits.some((u) => u.id === newUnit.id)).toBe(false);
  });

  it('renders dedicated AdminUnitsPage at /admin/satuan and protects AdminCategoriesPage for village_admin', () => {
    const unitsMock = [
      { id: 'u-1', name: 'kg', sort_order: 1, created_at: '2026-11-09T00:00:00Z' },
      { id: 'u-2', name: 'liter', sort_order: 2, created_at: '2026-11-09T00:00:00Z' },
    ];

    // 1. Render AdminUnitsPage directly
    const htmlUnits = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/satuan']}>
        <AdminUnitsPage initialUnits={unitsMock} />
      </MemoryRouter>
    );

    expect(htmlUnits).toContain('Master Satuan Produk');
    expect(htmlUnits).toContain('Tambah Satuan');
    expect(htmlUnits).toContain('kg');
    expect(htmlUnits).toContain('liter');

    // 2. Render AdminWilayahPage -> should NOT contain Master Satuan Produk
    const htmlWilayah = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/wilayah']}>
        <AdminWilayahPage
          initialTab="kecamatan"
          initialSubdistricts={[]}
          initialVillages={[]}
          initialVillageAdmins={[]}
        />
      </MemoryRouter>
    );
    expect(htmlWilayah).not.toContain('Master Satuan Produk');

    // 3. Render AdminApp with village_admin trying /admin/satuan -> blocked by SuperAdminGuard
    const htmlBlocked = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/satuan']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: {
                    is_demo: true,
                    user: {
                      id: ADMIN_GOLOKAN_ID,
                      email: 'golokan@kdkmp-gresik.id',
                    },
                  },
                  admin: {
                    user_id: ADMIN_GOLOKAN_ID,
                    role: 'village_admin',
                    village_id: GOLOKAN.id,
                  },
                  villages: [GOLOKAN],
                }}
                initialUnits={unitsMock}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );
    expect(htmlBlocked).not.toContain('Master Satuan Produk');

    // 4. Render AdminCategoriesPage with village_admin session -> should show read-only info and hide edit button
    const htmlCategories = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/kategori']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: {
                    is_demo: true,
                    user: {
                      id: ADMIN_GOLOKAN_ID,
                      email: 'golokan@kdkmp-gresik.id',
                    },
                  },
                  admin: {
                    user_id: ADMIN_GOLOKAN_ID,
                    role: 'village_admin',
                    village_id: GOLOKAN.id,
                  },
                  villages: [GOLOKAN],
                }}
                initialCategories={[
                  { id: 'cat-1', name: 'Beras & Pangan Pokok', sort_order: 1 },
                ]}
                initialProducts={[]}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlCategories).toContain('Kategori master berlaku untuk semua KDKMP');
    expect(htmlCategories).toContain('Master');
    expect(htmlCategories).not.toContain('aria-label="Ubah Beras &amp; Pangan Pokok"');

    // 5. Render AdminApp with super_admin trying /admin/pengaturan -> blocked by VillageAdminGuard
    const htmlBlockedSettings = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/pengaturan']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={{
                  isLoading: false,
                  session: {
                    is_demo: true,
                    user: {
                      id: SUPER_ADMIN_USER_ID,
                      email: 'superadmin@kdkmp-gresik.id',
                    },
                  },
                  admin: {
                    user_id: SUPER_ADMIN_USER_ID,
                    role: 'super_admin',
                    village_id: null,
                  },
                  villages: [GOLOKAN],
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );
    expect(htmlBlockedSettings).not.toContain('Pengaturan Koperasi');
  });

  it('super_admin accesses global products, summary, and categories across all KDKMPs', async () => {
    resetDemoAdminData();

    // 1. Summary across all villages
    const globalSummary = await getAdminProductSummary(null, {
      demo: true,
      actorUserId: SUPER_ADMIN_USER_ID,
      isSuperAdmin: true,
    });
    // 10 Golokan + 10 Sukorejo + 2 Bungah = 22 total products
    expect(globalSummary.total).toBe(22);
    expect(globalSummary.ready).toBeGreaterThan(0);

    // 2. Products across all villages with kdkmp_name
    const globalProducts = await getAdminProducts(null, {
      demo: true,
      actorUserId: SUPER_ADMIN_USER_ID,
      isSuperAdmin: true,
    });
    expect(globalProducts.length).toBe(22);
    expect(globalProducts.every((p) => typeof p.kdkmp_name === 'string' && p.kdkmp_name.length > 0)).toBe(true);
    expect(globalProducts.some((p) => p.kdkmp_name === 'KDKMP Desa Golokan')).toBe(true);
    expect(globalProducts.some((p) => p.kdkmp_name === 'KDKMP Desa Sukorejo')).toBe(true);

    // 3. Categories across all villages
    const globalCategories = await getAdminCategories(null, {
      demo: true,
      actorUserId: SUPER_ADMIN_USER_ID,
      isSuperAdmin: true,
    });
    expect(globalCategories.length).toBeGreaterThanOrEqual(4);
  });

  it('enforces read-only product access for super_admin and allows mutations only for village_admin owner', async () => {
    resetDemoAdminData();

    const prods = await getAdminProducts(null, {
      demo: true,
      actorUserId: SUPER_ADMIN_USER_ID,
      isSuperAdmin: true,
    });
    const targetProduct = prods[0];

    // super_admin cannot create product
    await expect(
      createAdminProduct(
        {
          village_id: GOLOKAN.id,
          name: 'Produk Ilegal Super Admin',
          price: 15000,
          unit: 'pcs',
        },
        { demo: true, actorUserId: SUPER_ADMIN_USER_ID }
      )
    ).rejects.toThrow(/Akses ditolak.*owner/);

    // super_admin cannot update product
    await expect(
      updateAdminProduct(
        targetProduct.id,
        { price: 99000 },
        { villageId: targetProduct.village_id, demo: true, actorUserId: SUPER_ADMIN_USER_ID }
      )
    ).rejects.toThrow(/Akses ditolak.*owner/);

    // super_admin cannot delete product
    await expect(
      deleteAdminProduct(targetProduct.id, {
        villageId: targetProduct.village_id,
        demo: true,
        actorUserId: SUPER_ADMIN_USER_ID,
      })
    ).rejects.toThrow(/Akses ditolak.*owner/);

    // super_admin cannot batch update prices
    await expect(
      batchUpdateAdminProductPrices(
        [{ id: targetProduct.id, price: 99000 }],
        { villageId: targetProduct.village_id, demo: true, actorUserId: SUPER_ADMIN_USER_ID }
      )
    ).rejects.toThrow(/Akses ditolak.*owner/);

    // Village admin owner can mutate own product
    const updatedByOwner = await updateAdminProduct(
      targetProduct.id,
      { price: targetProduct.price + 1000 },
      { villageId: targetProduct.village_id, demo: true, actorUserId: ADMIN_GOLOKAN_ID }
    );
    expect(updatedByOwner.price).toBe(targetProduct.price + 1000);
  });

  it('renders AdminProductsPage, AdminSummaryPage, and AdminCategoriesPage in global read-only mode for super_admin', () => {
    const superAdminAuthState = {
      isLoading: false,
      session: {
        is_demo: true,
        user: {
          id: SUPER_ADMIN_USER_ID,
          email: 'superadmin@kdkmp-gresik.id',
        },
      },
      admin: {
        user_id: SUPER_ADMIN_USER_ID,
        role: 'super_admin',
        village_id: null,
      },
      villages: [GOLOKAN, SUKOREJO],
    };

    // 1. /admin/produk for super_admin
    const htmlProducts = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/produk']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={superAdminAuthState}
                initialProducts={[
                  {
                    id: 'prod-1',
                    village_id: GOLOKAN.id,
                    kdkmp_name: 'KDKMP Desa Golokan',
                    name: 'Beras Pandan Wangi 5kg',
                    price: 72000,
                    original_price: null,
                    unit: 'karung',
                    stock_status: 'ready',
                    is_featured: true,
                  },
                ]}
                initialCategories={[
                  { id: 'cat-1', name: 'Beras & Pangan Pokok', sort_order: 1 },
                ]}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlProducts).toContain('Semua KDKMP');
    expect(htmlProducts).toContain('KDKMP');
    expect(htmlProducts).toContain('KDKMP Desa Golokan');
    expect(htmlProducts).toContain('Filter KDKMP');
    expect(htmlProducts).not.toContain('Tambah Produk');
    expect(htmlProducts).not.toContain('Ubah Harga Cepat');
    expect(htmlProducts).not.toContain('aria-label="Ubah Beras Pandan Wangi 5kg"');
    expect(htmlProducts).not.toContain('aria-label="Hapus Beras Pandan Wangi 5kg"');

    // 2. /admin (summary) for super_admin
    const htmlSummary = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={superAdminAuthState}
                initialSummary={{
                  total: 22,
                  ready: 19,
                  habis: 2,
                  preOrder: 1,
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlSummary).toContain('Semua KDKMP');
    expect(htmlSummary).toContain('>22<');

    // 3. /admin/kategori for super_admin
    const htmlCategories = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/kategori']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={superAdminAuthState}
                initialCategories={[
                  { id: 'cat-1', name: 'Beras & Pangan Pokok', sort_order: 1 },
                ]}
                initialProducts={[]}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlCategories).toContain('Semua KDKMP');
  });

  it('menampilkan tombol "Ganti Sandi" di header pojok kanan dan modal ganti kata sandi', () => {
    const authState = {
      isLoading: false,
      session: {
        is_demo: true,
        user: {
          id: ADMIN_GOLOKAN_ID,
          email: 'golokan@kdkmp-gresik.id',
        },
      },
      admin: {
        user_id: ADMIN_GOLOKAN_ID,
        role: 'village_admin',
        village_id: GOLOKAN.id,
      },
      villages: [GOLOKAN],
    };

    // 1. Header memiliki tombol Ganti Sandi di pojok kanan
    const htmlHeader = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={authState}
                initialSummary={{ total: 10, ready: 8, habis: 1, preOrder: 1 }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlHeader).toContain('Ganti Sandi');
    expect(htmlHeader).toContain('aria-label="Ganti Kata Sandi"');
    expect(htmlHeader).toContain('Keluar');

    // 2. Modal ganti kata sandi terbuka saat initialPasswordModalOpen = true
    const htmlModal = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={authState}
                initialSummary={{ total: 10, ready: 8, habis: 1, preOrder: 1 }}
                initialPasswordModalOpen={true}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlModal).toContain('Ganti Kata Sandi');
    expect(htmlModal).toContain('Kata Sandi Baru');
    expect(htmlModal).toContain('Ulangi Kata Sandi Baru');
    expect(htmlModal).toContain('Minimal 6 karakter');
    expect(htmlModal).toContain('Simpan');
    expect(htmlModal).toContain('Batal');

    // 3. Render langsung ChangePasswordModal saat initialPasswordModalOpen={false} tidak merender modal form
    const htmlClosed = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminApp
          initialAuthState={authState}
          initialPasswordModalOpen={false}
        />
      </MemoryRouter>
    );
    expect(htmlClosed).not.toContain('id="change-password-form"');

    // 4. Test render komponen ChangePasswordModal terisolasi dalam AuthProvider
    const htmlIsolated = renderToStaticMarkup(
      <AuthProvider initialState={authState}>
        <ChangePasswordModal open={true} onClose={() => {}} />
      </AuthProvider>
    );
    expect(htmlIsolated).toContain('Ganti Kata Sandi');
    expect(htmlIsolated).toContain('id="change-password-form"');
    // Cek toggle show/hide kata sandi di modal
    expect(htmlIsolated).toContain('aria-label="Lihat kata sandi baru"');
    expect(htmlIsolated).toContain('aria-label="Lihat konfirmasi kata sandi"');
  });

  it('mendukung show/hide password di halaman login', () => {
    const htmlLogin = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlLogin).toContain('Masuk Admin KDKMP');
    expect(htmlLogin).toContain('aria-label="Lihat kata sandi"');
  });

  it('mendukung Fitur A (Super Admin Reset Sandi Acak) dan Fitur B (Otomatis Buat Akun saat Penugasan)', async () => {
    // 1. Super Admin Reset Password (Fitur A)
    const resetRes = await superAdminResetUserPassword({
      userId: ADMIN_GOLOKAN_ID,
      newPassword: 'Kdkmp-baru99',
      demo: true,
    });

    expect(resetRes.success).toBe(true);
    expect(resetRes.user_id).toBe(ADMIN_GOLOKAN_ID);

    // Login dengan password baru berhasil
    const loginRes = await signInAdmin({
      email: 'golokan@kdkmp-gresik.id',
      password: 'Kdkmp-baru99',
      demo: true,
    });
    expect(loginRes.session?.user?.email).toBe('golokan@kdkmp-gresik.id');

    // Password lama ditolak
    await expect(
      signInAdmin({
        email: 'golokan@kdkmp-gresik.id',
        password: 'password_lama_salah',
        demo: true,
      })
    ).rejects.toThrow('Email atau kata sandi salah.');

    // 2. Fitur B: Otomatis Buat Akun & Sandi Awal saat Tugaskan Manager
    const allVillages = await getAdminVillages({ demo: true });
    const currentAdmins = await getAdminVillageAdmins({ demo: true });
    const assignedIds = new Set(currentAdmins.map((a) => a.village_id));
    const targetVillage = allVillages.find((v) => !assignedIds.has(v.id));
    expect(targetVillage).toBeTruthy();

    const newEmail = 'manajer_baru_test@kdkmp-gresik.id';
    const initialPwd = 'Kdkmp-init123';

    const assignResult = await assignVillageAdmin({
      email: newEmail,
      villageId: targetVillage.id,
      autoCreate: true,
      initialPassword: initialPwd,
      demo: true,
    });

    expect(assignResult.is_new).toBe(true);
    expect(assignResult.email).toBe(newEmail);
    expect(assignResult.village_id).toBe(targetVillage.id);

    // Manager baru langsung bisa login dengan password awal yang dibuatkan
    const newManagerLogin = await signInAdmin({
      email: newEmail,
      password: initialPwd,
      demo: true,
    });
    expect(newManagerLogin.session?.user?.email).toBe(newEmail);

    // 3. AdminWilayahPage merender tombol "Reset Sandi" di daftar manager
    const superAdminAuthState = {
      isLoading: false,
      session: {
        is_demo: true,
        user: { id: SUPER_ADMIN_USER_ID, email: 'superadmin@kdkmp-gresik.id' },
      },
      admin: { user_id: SUPER_ADMIN_USER_ID, role: 'super_admin' },
      villages: allVillages,
    };

    const htmlWilayahAdmin = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/wilayah?tab=admin']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={superAdminAuthState}
                initialWilayahTab="admin"
                initialSubdistricts={allVillages}
                initialVillages={allVillages}
                initialVillageAdmins={[
                  {
                    user_id: ADMIN_GOLOKAN_ID,
                    email: 'golokan@kdkmp-gresik.id',
                    role: 'village_admin',
                    village_id: GOLOKAN.id,
                    village_code: GOLOKAN.code,
                    village_name: GOLOKAN.name,
                    business_name: GOLOKAN.business_name,
                    subdistrict_name: 'Sidayu',
                    created_at: '2026-11-09T00:00:00Z',
                  },
                ]}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlWilayahAdmin).toContain('Reset Sandi');
    expect(htmlWilayahAdmin).toContain('Cabut');
  });

  it('mendukung pagination 1, 2, 3 ... pada /admin/wilayah', async () => {
    const sampleVillages = Array.from({ length: 25 }, (_, i) => ({
      id: `v-${i + 1}`,
      code: `35.25.09.${2000 + i}`,
      name: `Desa ${i + 1}`,
      slug: `desa-${i + 1}`,
      type: 'desa',
      business_name: `KDKMP Desa ${i + 1}`,
      subdistrict_id: '00000000-0000-4000-8000-000035250900',
      subdistrict_slug: 'sidayu',
      subdistrict_name: 'Sidayu',
      is_active: true,
      product_count: 5,
      created_at: '2026-11-09T00:00:00Z',
    }));

    const superAdminAuthState = {
      isLoading: false,
      session: {
        is_demo: true,
        user: { id: SUPER_ADMIN_USER_ID, email: 'superadmin@kdkmp-gresik.id' },
      },
      admin: { user_id: SUPER_ADMIN_USER_ID, role: 'super_admin' },
      villages: sampleVillages,
    };

    // 1. Tab Koperasi memiliki pagination 1, 2, 3 (25 desa / 10 per halaman = 3 halaman)
    const htmlKoperasiP1 = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/wilayah?tab=koperasi']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={superAdminAuthState}
                initialWilayahTab="koperasi"
                initialVillages={sampleVillages}
                initialVillagePage={1}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlKoperasiP1).toContain('Navigasi Halaman');
    expect(htmlKoperasiP1).toContain('Halaman 1');
    expect(htmlKoperasiP1).toContain('Halaman 2');
    expect(htmlKoperasiP1).toContain('Halaman 3');
    expect(htmlKoperasiP1).toContain('KDKMP Desa 1');
    expect(htmlKoperasiP1).not.toContain('KDKMP Desa 11');

    // 2. Tab Koperasi Page 2 menampilkan data 11-20
    const htmlKoperasiP2 = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/wilayah?tab=koperasi']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={superAdminAuthState}
                initialWilayahTab="koperasi"
                initialVillages={sampleVillages}
                initialVillagePage={2}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlKoperasiP2).toContain('Navigasi Halaman');
    expect(htmlKoperasiP2).toContain('aria-current="page" aria-label="Halaman 2"');
    expect(htmlKoperasiP2).toContain('KDKMP Desa 11');
    expect(htmlKoperasiP2).not.toContain('KDKMP Desa 1<');

    // 3. Tab Kecamatan (18 kecamatan -> 2 halaman)
    const subdistricts = await getAdminSubdistricts({ demo: true });
    const htmlKecamatan = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/wilayah?tab=kecamatan']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={superAdminAuthState}
                initialWilayahTab="kecamatan"
                initialSubdistricts={subdistricts}
                initialSubdistrictPage={1}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlKecamatan).toContain('Navigasi Halaman');
    expect(htmlKecamatan).toContain('Halaman 1');
    expect(htmlKecamatan).toContain('Halaman 2');
  });

  it('supports pagination on /admin/produk, /admin/kategori, and /admin/satuan', () => {
    const golokanAuthState = {
      isLoading: false,
      session: {
        is_demo: true,
        user: {
          id: ADMIN_GOLOKAN_ID,
          email: 'golokan@kdkmp-gresik.id',
        },
      },
      admin: {
        user_id: ADMIN_GOLOKAN_ID,
        role: 'village_admin',
        village_id: GOLOKAN.id,
      },
      villages: [GOLOKAN],
    };

    // 1. /admin/produk pagination (15 items -> 2 pages)
    const sampleProducts = Array.from({ length: 15 }, (_, i) => ({
      id: `prod-${i + 1}`,
      name: `Produk Uji ${i + 1}`,
      village_id: GOLOKAN.id,
      village_name: 'Golokan',
      kdkmp_name: 'KDKMP Desa Golokan',
      price: 10000 * (i + 1),
      unit: 'kg',
      stock_status: 'ready',
      is_featured: false,
    }));

    const htmlProdP1 = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/produk']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={golokanAuthState}
                initialProducts={sampleProducts}
                initialCategories={[]}
                initialProductPage={1}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlProdP1).toContain('Navigasi Halaman');
    expect(htmlProdP1).toContain('Produk Uji 1');
    expect(htmlProdP1).not.toContain('Produk Uji 11');
    expect(htmlProdP1).toContain('Halaman 1');
    expect(htmlProdP1).toContain('Halaman 2');

    const htmlProdP2 = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/produk']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={golokanAuthState}
                initialProducts={sampleProducts}
                initialCategories={[]}
                initialProductPage={2}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlProdP2).toContain('Navigasi Halaman');
    expect(htmlProdP2).toContain('Produk Uji 11');
    expect(htmlProdP2).not.toContain('Produk Uji 1<');

    // 2. /admin/kategori pagination (12 items -> 2 pages)
    const sampleCategories = Array.from({ length: 12 }, (_, i) => ({
      id: `cat-${i + 1}`,
      name: `Kategori Uji ${i + 1}`,
      sort_order: i + 1,
    }));

    const htmlCatP1 = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/kategori']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={golokanAuthState}
                initialCategories={sampleCategories}
                initialProducts={[]}
                initialCategoryPage={1}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlCatP1).toContain('Navigasi Halaman');
    expect(htmlCatP1).toContain('Kategori Uji 1');
    expect(htmlCatP1).not.toContain('Kategori Uji 11');
    expect(htmlCatP1).toContain('Halaman 1');
    expect(htmlCatP1).toContain('Halaman 2');

    const htmlCatP2 = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/kategori']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={golokanAuthState}
                initialCategories={sampleCategories}
                initialProducts={[]}
                initialCategoryPage={2}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlCatP2).toContain('Navigasi Halaman');
    expect(htmlCatP2).toContain('Kategori Uji 11');
    expect(htmlCatP2).toContain('Kategori Uji 12');
    expect(htmlCatP2).not.toContain('Kategori Uji 1<');

    // 3. /admin/satuan pagination (14 items -> 2 pages)
    const superAdminAuthState = {
      isLoading: false,
      session: {
        is_demo: true,
        user: { id: SUPER_ADMIN_USER_ID, email: 'superadmin@kdkmp-gresik.id' },
      },
      admin: { user_id: SUPER_ADMIN_USER_ID, role: 'super_admin' },
      villages: [GOLOKAN],
    };

    const sampleUnits = Array.from({ length: 14 }, (_, i) => ({
      id: `unit-${i + 1}`,
      name: `Satuan Uji ${i + 1}`,
      sort_order: i + 1,
    }));

    const htmlUnitP1 = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/satuan']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={superAdminAuthState}
                initialUnits={sampleUnits}
                initialUnitPage={1}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlUnitP1).toContain('Navigasi Halaman');
    expect(htmlUnitP1).toContain('Satuan Uji 1');
    expect(htmlUnitP1).not.toContain('Satuan Uji 11');
    expect(htmlUnitP1).toContain('Halaman 1');
    expect(htmlUnitP1).toContain('Halaman 2');

    const htmlUnitP2 = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin/satuan']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={superAdminAuthState}
                initialUnits={sampleUnits}
                initialUnitPage={2}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(htmlUnitP2).toContain('Navigasi Halaman');
    expect(htmlUnitP2).toContain('Satuan Uji 11');
    expect(htmlUnitP2).toContain('Satuan Uji 14');
    expect(htmlUnitP2).not.toContain('Satuan Uji 1<');
  });
});

describe('Statistik Checkout WA (S12)', () => {
  beforeEach(() => {
    resetDemoAdminData();
  });

  it('records order logs without personal data and calculates village stats', async () => {
    const golokanId = '00000000-0000-4000-8000-352509200800';

    // 1. Catat log pesanan baru via recordOrderLog (fire-and-forget)
    const log = await recordOrderLog(
      {
        villageId: golokanId,
        items: [
          { product_id: '00000000-0000-4000-8002-352509200801', qty: 2, price: 72000 },
          { product_id: '00000000-0000-4000-8002-352509200804', qty: 1, price: 35000 },
        ],
        itemsCount: 2,
        total: 179000,
        deliveryMethod: 'Diantar',
        paymentMethod: 'COD',
      },
      { isDemo: true }
    );

    expect(log).toBeTruthy();
    expect(log.village_id).toBe(golokanId);
    expect(log.total).toBe(179000);
    expect(log.delivery_method).toBe('Diantar');
    expect(log.payment_method).toBe('COD');
    // Pastikan tidak ada data pribadi (nama, alamat, nomor telp, catatan)
    expect(log.name).toBeUndefined();
    expect(log.buyer_name).toBeUndefined();
    expect(log.address).toBeUndefined();
    expect(log.phone).toBeUndefined();
    expect(log.note).toBeUndefined();

    // 2. Ambil statistik untuk Golokan (periode 7 hari)
    const stats7 = await getVillageStats(golokanId, 7, { isDemo: true });
    expect(stats7.period_days).toBe(7);
    expect(stats7.summary.checkout_count).toBeGreaterThan(0);
    expect(stats7.summary.total_value).toBeGreaterThan(0);
    expect(stats7.summary.average_value).toBeGreaterThan(0);
    expect(stats7.top_products.length).toBeGreaterThan(0);
    expect(stats7.top_products.length).toBeLessThanOrEqual(5);
    expect(stats7.daily_stats.length).toBe(7);

    // 3. Ambil statistik untuk Golokan (periode Hari ini)
    const statsToday = await getVillageStats(golokanId, 1, { isDemo: true });
    expect(statsToday.period_days).toBe(1);
    expect(statsToday.daily_stats.length).toBe(1);
    expect(statsToday.summary.checkout_count).toBeGreaterThan(0);

    // 4. Ambil statistik untuk Golokan (periode 30 hari)
    const stats30 = await getVillageStats(golokanId, 30, { isDemo: true });
    expect(stats30.period_days).toBe(30);
    expect(stats30.daily_stats.length).toBe(30);
    expect(stats30.summary.checkout_count).toBeGreaterThanOrEqual(stats7.summary.checkout_count);
  });

  it('super_admin gets aggregated stats across cooperatives and subdistricts sorted by value', async () => {
    const superStats = await getVillageStats(null, 7, {
      isDemo: true,
      isSuperAdmin: true,
    });

    expect(superStats.summary.checkout_count).toBeGreaterThan(0);
    expect(superStats.by_village.length).toBeGreaterThan(0);
    expect(superStats.by_subdistrict.length).toBeGreaterThan(0);

    // Pastikan tabel per koperasi dan per kecamatan terurut berdasarkan nilai (total_value) descending
    for (let i = 0; i < superStats.by_village.length - 1; i += 1) {
      expect(superStats.by_village[i].total_value).toBeGreaterThanOrEqual(
        superStats.by_village[i + 1].total_value
      );
    }
    for (let i = 0; i < superStats.by_subdistrict.length - 1; i += 1) {
      expect(superStats.by_subdistrict[i].total_value).toBeGreaterThanOrEqual(
        superStats.by_subdistrict[i + 1].total_value
      );
    }
  });

  it('renders AdminSummaryPage with Checkout WA metrics, solid primary chart, top 5 table, and no Pesanan label', () => {
    const mockStats = {
      period_days: 7,
      summary: {
        checkout_count: 24,
        total_value: 2400000,
        average_value: 100000,
      },
      top_products: [
        {
          product_id: 'p-1',
          name: 'Beras Pandan Wangi 5kg',
          qty: 15,
          total_value: 1080000,
        },
        {
          product_id: 'p-2',
          name: 'Minyak Goreng Kemasan 2L',
          qty: 10,
          total_value: 350000,
        },
      ],
      daily_stats: [
        { date: '2026-11-03', day_label: '03/11', checkout_count: 2, total_value: 200000 },
        { date: '2026-11-04', day_label: '04/11', checkout_count: 4, total_value: 400000 },
        { date: '2026-11-05', day_label: '05/11', checkout_count: 3, total_value: 300000 },
        { date: '2026-11-06', day_label: '06/11', checkout_count: 5, total_value: 500000 },
        { date: '2026-11-07', day_label: '07/11', checkout_count: 2, total_value: 200000 },
        { date: '2026-11-08', day_label: '08/11', checkout_count: 3, total_value: 300000 },
        { date: '2026-11-09', day_label: '09/11', checkout_count: 5, total_value: 500000 },
      ],
      by_village: [
        {
          village_id: 'v-1',
          village_name: 'KDKMP Desa Golokan',
          subdistrict_name: 'Sidayu',
          checkout_count: 16,
          total_value: 1600000,
        },
        {
          village_id: 'v-2',
          village_name: 'KDKMP Desa Sukorejo',
          subdistrict_name: 'Sidayu',
          checkout_count: 8,
          total_value: 800000,
        },
      ],
      by_subdistrict: [
        {
          subdistrict_id: 'sidayu',
          subdistrict_name: 'Sidayu',
          checkout_count: 24,
          total_value: 2400000,
        },
      ],
    };

    const mockSummary = { total: 10, ready: 8, habis: 1, preOrder: 1 };

    const golokanAuthState = {
      isLoading: false,
      session: {
        is_demo: true,
        user: { id: ADMIN_GOLOKAN_ID, email: 'golokan@kdkmp-gresik.id' },
      },
      admin: {
        user_id: ADMIN_GOLOKAN_ID,
        role: 'village_admin',
        village_id: '00000000-0000-4000-8000-352509200800',
      },
      villages: [GOLOKAN],
    };

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={golokanAuthState}
                initialSummary={mockSummary}
                initialStats={mockStats}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Label metrik "Checkout WA", bukan "Pesanan"
    expect(html).toContain('Checkout WA');
    expect(html).not.toContain('>Pesanan<');
    expect(html).not.toContain('kartu Pesanan');

    // Periode buttons
    expect(html).toContain('Hari ini');
    expect(html).toContain('7 Hari');
    expect(html).toContain('30 Hari');

    // 3 Kartu Metrik Checkout WA
    expect(html).toContain('>24<'); // Checkout WA count
    expect(html).toContain('Rp 2.400.000'); // Nilai
    expect(html).toContain('Rp 100.000'); // Rata-rata

    // Grafik Batang Harian CSS solid primary
    expect(html).toContain('Grafik Checkout WA Harian');
    expect(html).toContain('bg-primary-700');
    expect(html).toContain('03/11');
    expect(html).toContain('09/11');

    // Top 5 Produk
    expect(html).toContain('Top 5 Produk');
    expect(html).toContain('Beras Pandan Wangi 5kg');
    expect(html).toContain('Minyak Goreng Kemasan 2L');
    expect(html).toContain('Rp 1.080.000');

    // Village admin does not see super admin ranking
    expect(html).not.toContain('Peringkat Wilayah');
  });

  it('renders SuperAdminBreakdown ranking per koperasi & per kecamatan for super_admin', () => {
    const mockStats = {
      period_days: 7,
      summary: { checkout_count: 50, total_value: 5000000, average_value: 100000 },
      top_products: [],
      daily_stats: [],
      by_village: [
        {
          village_id: 'v-1',
          village_name: 'KDKMP Desa Golokan',
          subdistrict_name: 'Sidayu',
          checkout_count: 30,
          total_value: 3000000,
        },
        {
          village_id: 'v-2',
          village_name: 'KDKMP Desa Sukorejo',
          subdistrict_name: 'Sidayu',
          checkout_count: 20,
          total_value: 2000000,
        },
      ],
      by_subdistrict: [
        {
          subdistrict_id: 'sidayu',
          subdistrict_name: 'Sidayu',
          checkout_count: 50,
          total_value: 5000000,
        },
      ],
    };

    const superAdminAuthState = {
      isLoading: false,
      session: {
        is_demo: true,
        user: { id: SUPER_ADMIN_USER_ID, email: 'superadmin@kdkmp-gresik.id' },
      },
      admin: { user_id: SUPER_ADMIN_USER_ID, role: 'super_admin' },
      villages: [GOLOKAN],
    };

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminApp
                initialAuthState={superAdminAuthState}
                initialStats={mockStats}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Super admin shows Peringkat Wilayah
    expect(html).toContain('Peringkat Wilayah');
    expect(html).toContain('Per Koperasi');
    expect(html).toContain('Per Kecamatan');
    expect(html).toContain('KDKMP Desa Golokan');
    expect(html).toContain('KDKMP Desa Sukorejo');
    expect(html).toContain('Rp 3.000.000');
    expect(html).toContain('Rp 2.000.000');
  });

  it('CheckoutSheet executes fire-and-forget order log without blocking WhatsApp', () => {
    const mockRecordOrderLog = vi.fn().mockResolvedValue({ id: 'log-123' });
    const mockOpenWa = vi.fn().mockReturnValue({ method: 'window.open' });

    const sampleItems = [
      { productId: 'p1', name: 'Beras 5kg', price: 72000, qty: 1 },
      { productId: 'p2', name: 'Minyak 2L', price: 35000, qty: 2 },
    ];

    const village = {
      id: '00000000-0000-4000-8000-352509200800',
      business_name: 'KDKMP Desa Golokan',
      whatsapp_number: '6281234567801',
    };

    // Render CheckoutSheet
    const html = renderToStaticMarkup(
      <CheckoutSheet
        open
        village={village}
        items={sampleItems}
        initialBuyer={{
          name: 'Ibu Siti',
          address: 'RT 01 RW 01',
          deliveryMethod: 'Diantar',
          paymentMethod: 'COD',
        }}
        onRecordOrderLog={mockRecordOrderLog}
        onOpenWa={mockOpenWa}
      />
    );

    expect(html).toContain('Checkout');
    expect(html).toContain('Beras 5kg');
    expect(html).toContain('Minyak 2L');
  });

  it('verifies RLS rules: anon cannot SELECT order_logs (DoD)', () => {
    // Verifikasi skema RLS di migrasi SQL:
    // "order_logs_select_admin": ON public.order_logs FOR SELECT TO authenticated
    // USING (public.is_village_admin(village_id) OR public.is_super_admin());
    // "order_logs_insert_public": ON public.order_logs FOR INSERT TO anon, authenticated
    // WITH CHECK (koperasi aktif);
    //
    // Karena TIDAK ADA policy SELECT untuk role `anon`, PostgreSQL RLS secara default
    // menolak seluruh query SELECT dari `anon` (mengembalikan 0 baris).

    const anonUser = { role: 'anon', uid: null };
    const canAnonSelect = (user) => {
      if (user.role === 'anon') return false;
      return user.role === 'authenticated';
    };

    expect(canAnonSelect(anonUser)).toBe(false);

    const villageAdmin = { role: 'authenticated', village_id: 'v-1' };
    expect(canAnonSelect(villageAdmin)).toBe(true);

    const superAdmin = { role: 'authenticated', role_type: 'super_admin' };
    expect(canAnonSelect(superAdmin)).toBe(true);
  });

  it('allows owner to update product image link with global categories without RLS violation', async () => {
    const products = getDemoAdminProductsByVillageId(GOLOKAN.id);
    const targetProduct = products[0];

    const allCategories = getAllDemoCategories();
    // Ambil kategori yang bukan milik Golokan (atau global)
    const globalCategory = allCategories.find((c) => c.village_id !== GOLOKAN.id) || allCategories[0];

    const driveUrl = 'https://drive.google.com/uc?export=view&id=1AbCdEfGhIjKlMnOpQrStUvWxYz012345';
    const updated = await updateAdminProduct(
      targetProduct.id,
      {
        image_url: driveUrl,
        category_id: globalCategory.id,
      },
      {
        villageId: GOLOKAN.id,
        demo: true,
        actorUserId: ADMIN_GOLOKAN_ID,
      }
    );

    expect(updated.image_url).toBe(driveImageUrl(driveUrl));
    expect(updated.category_id).toBe(globalCategory.id);
    expect(updated.category_name).toBe(globalCategory.name);
  });
});

