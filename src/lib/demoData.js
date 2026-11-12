import { isReservedSlug } from '../config/reservedSlugs';
import { isValidPhone, normalizePhone } from './whatsapp';

// Struktur data demo sama persis dengan output view v_village_directory dan RPC get_village_catalog di 0003_api.sql

export const INITIAL_SUBDISTRICTS = [
  { id: '00000000-0000-4000-8000-000035250100', code: '35.25.01', name: 'Dukun', slug: 'dukun', is_active: false, sort_order: 1, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035250200', code: '35.25.02', name: 'Balongpanggang', slug: 'balongpanggang', is_active: false, sort_order: 2, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035250300', code: '35.25.03', name: 'Panceng', slug: 'panceng', is_active: false, sort_order: 3, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035250400', code: '35.25.04', name: 'Benjeng', slug: 'benjeng', is_active: false, sort_order: 4, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035250500', code: '35.25.05', name: 'Duduksampeyan', slug: 'duduksampeyan', is_active: false, sort_order: 5, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035250600', code: '35.25.06', name: 'Wringinanom', slug: 'wringinanom', is_active: false, sort_order: 6, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035250700', code: '35.25.07', name: 'Ujungpangkah', slug: 'ujungpangkah', is_active: false, sort_order: 7, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035250800', code: '35.25.08', name: 'Kedamean', slug: 'kedamean', is_active: false, sort_order: 8, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035250900', code: '35.25.09', name: 'Sidayu', slug: 'sidayu', is_active: true, sort_order: 9, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035251000', code: '35.25.10', name: 'Manyar', slug: 'manyar', is_active: false, sort_order: 10, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035251100', code: '35.25.11', name: 'Cerme', slug: 'cerme', is_active: false, sort_order: 11, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035251200', code: '35.25.12', name: 'Bungah', slug: 'bungah', is_active: false, sort_order: 12, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035251300', code: '35.25.13', name: 'Menganti', slug: 'menganti', is_active: false, sort_order: 13, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035251400', code: '35.25.14', name: 'Kebomas', slug: 'kebomas', is_active: false, sort_order: 14, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035251500', code: '35.25.15', name: 'Driyorejo', slug: 'driyorejo', is_active: false, sort_order: 15, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035251600', code: '35.25.16', name: 'Gresik', slug: 'gresik', is_active: false, sort_order: 16, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035251700', code: '35.25.17', name: 'Sangkapura', slug: 'sangkapura', is_active: false, sort_order: 17, created_at: '2026-11-09T00:00:00Z' },
  { id: '00000000-0000-4000-8000-000035251800', code: '35.25.18', name: 'Tambak', slug: 'tambak', is_active: false, sort_order: 18, created_at: '2026-11-09T00:00:00Z' },
];

export const SIDAYU_SUBDISTRICT = INITIAL_SUBDISTRICTS[8];
export const BUNGAH_SUBDISTRICT = INITIAL_SUBDISTRICTS[11];

export const SUPER_ADMIN_USER_ID = '00000000-0000-4000-9000-000000000001';

export const INITIAL_DEMO_PRODUCT_UNITS = [
  { id: 'unit-1', name: 'kg', sort_order: 1, created_at: '2026-11-09T00:00:00Z' },
  { id: 'unit-2', name: 'liter', sort_order: 2, created_at: '2026-11-09T00:00:00Z' },
  { id: 'unit-3', name: 'pcs', sort_order: 3, created_at: '2026-11-09T00:00:00Z' },
  { id: 'unit-4', name: 'karung', sort_order: 4, created_at: '2026-11-09T00:00:00Z' },
  { id: 'unit-5', name: 'botol', sort_order: 5, created_at: '2026-11-09T00:00:00Z' },
  { id: 'unit-6', name: 'ikat', sort_order: 6, created_at: '2026-11-09T00:00:00Z' },
  { id: 'unit-7', name: 'pack', sort_order: 7, created_at: '2026-11-09T00:00:00Z' },
  { id: 'unit-8', name: 'dus', sort_order: 8, created_at: '2026-11-09T00:00:00Z' },
  { id: 'unit-9', name: 'gram', sort_order: 9, created_at: '2026-11-09T00:00:00Z' },
  { id: 'unit-10', name: 'lusin', sort_order: 10, created_at: '2026-11-09T00:00:00Z' },
];

const GOLOKAN_VILLAGE_ID = '00000000-0000-4000-8000-352509200800';
const SUKOREJO_VILLAGE_ID = '00000000-0000-4000-8000-352509200100';
const BUNGAH_SUKOREJO_VILLAGE_ID = '00000000-0000-4000-8000-352512201600';

const GOLOKAN_CATEGORIES = [
  {
    id: '00000000-0000-4000-8001-352509200801',
    village_id: GOLOKAN_VILLAGE_ID,
    name: 'Beras & Pangan Pokok',
    sort_order: 1,
  },
  {
    id: '00000000-0000-4000-8001-352509200802',
    village_id: GOLOKAN_VILLAGE_ID,
    name: 'Minyak & Gula',
    sort_order: 2,
  },
  {
    id: '00000000-0000-4000-8001-352509200803',
    village_id: GOLOKAN_VILLAGE_ID,
    name: 'Bumbu & Dapur',
    sort_order: 3,
  },
  {
    id: '00000000-0000-4000-8001-352509200804',
    village_id: GOLOKAN_VILLAGE_ID,
    name: 'Minuman & Harian',
    sort_order: 4,
  },
];

const SUKOREJO_CATEGORIES = [
  {
    id: '00000000-0000-4000-8001-352509200101',
    village_id: SUKOREJO_VILLAGE_ID,
    name: 'Beras & Pangan Pokok',
    sort_order: 1,
  },
  {
    id: '00000000-0000-4000-8001-352509200102',
    village_id: SUKOREJO_VILLAGE_ID,
    name: 'Minyak & Gula',
    sort_order: 2,
  },
  {
    id: '00000000-0000-4000-8001-352509200103',
    village_id: SUKOREJO_VILLAGE_ID,
    name: 'Bumbu & Dapur',
    sort_order: 3,
  },
  {
    id: '00000000-0000-4000-8001-352509200104',
    village_id: SUKOREJO_VILLAGE_ID,
    name: 'Minuman & Harian',
    sort_order: 4,
  },
];

const GOLOKAN_PRODUCTS = [
  {
    id: '00000000-0000-4000-8002-352509200801',
    village_id: GOLOKAN_VILLAGE_ID,
    category_id: GOLOKAN_CATEGORIES[0].id,
    category_name: 'Beras & Pangan Pokok',
    name: 'Beras Pandan Wangi 5kg',
    barcode: '899100100001',
    description: 'Beras pulen wangi kualitas super hasil panen lokal.',
    price: 72000,
    original_price: 78000,
    unit: 'karung',
    stock_status: 'ready',
    image_url: null,
    is_featured: true,
    sort_order: 1,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200802',
    village_id: GOLOKAN_VILLAGE_ID,
    category_id: GOLOKAN_CATEGORIES[0].id,
    category_name: 'Beras & Pangan Pokok',
    name: 'Beras IR64 Medium 5kg',
    barcode: '899100100002',
    description: 'Beras harian bersih tanpa pemutih.',
    price: 62000,
    original_price: null,
    unit: 'karung',
    stock_status: 'ready',
    image_url: null,
    is_featured: false,
    sort_order: 2,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200803',
    village_id: GOLOKAN_VILLAGE_ID,
    category_id: GOLOKAN_CATEGORIES[0].id,
    category_name: 'Beras & Pangan Pokok',
    name: 'Telur Ayam Negeri 1kg',
    barcode: '899100100003',
    description: 'Telur ayam segar langsung dari peternak lokal.',
    price: 28000,
    original_price: 31000,
    unit: 'kg',
    stock_status: 'ready',
    image_url: null,
    is_featured: true,
    sort_order: 3,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200804',
    village_id: GOLOKAN_VILLAGE_ID,
    category_id: GOLOKAN_CATEGORIES[1].id,
    category_name: 'Minyak & Gula',
    name: 'Minyak Goreng Kemasan 2L',
    barcode: '899100100004',
    description: 'Minyak goreng kelapa sawit jernih kemasan pouch 2 liter.',
    price: 35000,
    original_price: 38000,
    unit: 'pouch',
    stock_status: 'ready',
    image_url: null,
    is_featured: true,
    sort_order: 4,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200805',
    village_id: GOLOKAN_VILLAGE_ID,
    category_id: GOLOKAN_CATEGORIES[1].id,
    category_name: 'Minyak & Gula',
    name: 'Gula Pasir Kristal 1kg',
    barcode: '899100100005',
    description: 'Gula pasir putih bersih manis alami.',
    price: 17500,
    original_price: null,
    unit: 'kg',
    stock_status: 'ready',
    image_url: null,
    is_featured: false,
    sort_order: 5,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200806',
    village_id: GOLOKAN_VILLAGE_ID,
    category_id: GOLOKAN_CATEGORIES[2].id,
    category_name: 'Bumbu & Dapur',
    name: 'Tepung Terigu Serbaguna 1kg',
    barcode: '899100100006',
    description: 'Tepung terigu protein sedang untuk aneka olahan.',
    price: 12500,
    original_price: null,
    unit: 'bungkus',
    stock_status: 'ready',
    image_url: null,
    is_featured: false,
    sort_order: 6,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200807',
    village_id: GOLOKAN_VILLAGE_ID,
    category_id: GOLOKAN_CATEGORIES[2].id,
    category_name: 'Bumbu & Dapur',
    name: 'Kecap Manis Botol 600ml',
    barcode: '899100100007',
    description: 'Kecap manis kedelai hitam pilihan.',
    price: 21500,
    original_price: 24000,
    unit: 'botol',
    stock_status: 'ready',
    image_url: null,
    is_featured: false,
    sort_order: 7,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200808',
    village_id: GOLOKAN_VILLAGE_ID,
    category_id: GOLOKAN_CATEGORIES[2].id,
    category_name: 'Bumbu & Dapur',
    name: 'Bawang Merah Pilihan 500g',
    barcode: '899100100008',
    description: 'Bawang merah kering ukuran sedang siap olah.',
    price: 19500,
    original_price: null,
    unit: 'pack',
    stock_status: 'pre-order',
    image_url: null,
    is_featured: false,
    sort_order: 8,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200809',
    village_id: GOLOKAN_VILLAGE_ID,
    category_id: GOLOKAN_CATEGORIES[3].id,
    category_name: 'Minuman & Harian',
    name: 'Kopi Bubuk Spesial 165g',
    barcode: '899100100009',
    description: 'Kopi hitam bubuk aroma mantap.',
    price: 16500,
    original_price: null,
    unit: 'bungkus',
    stock_status: 'ready',
    image_url: null,
    is_featured: false,
    sort_order: 9,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200810',
    village_id: GOLOKAN_VILLAGE_ID,
    category_id: GOLOKAN_CATEGORIES[3].id,
    category_name: 'Minuman & Harian',
    name: 'Mi Instan Goreng Paket 5 pcs',
    barcode: '899100100010',
    description: 'Paket hemat 5 bungkus mi instan goreng.',
    price: 14500,
    original_price: 16000,
    unit: 'pack',
    stock_status: 'habis',
    image_url: null,
    is_featured: false,
    sort_order: 10,
    updated_at: '2026-11-09T00:00:00Z',
  },
];

const SUKOREJO_PRODUCTS = [
  {
    id: '00000000-0000-4000-8002-352509200101',
    village_id: SUKOREJO_VILLAGE_ID,
    category_id: SUKOREJO_CATEGORIES[0].id,
    category_name: 'Beras & Pangan Pokok',
    name: 'Beras Rojolele Super 5kg',
    description: 'Beras pilihan pulen dan bersih kemasan 5 kg.',
    price: 71000,
    original_price: 75000,
    unit: 'karung',
    stock_status: 'ready',
    image_url: null,
    is_featured: true,
    sort_order: 1,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200102',
    village_id: SUKOREJO_VILLAGE_ID,
    category_id: SUKOREJO_CATEGORIES[0].id,
    category_name: 'Beras & Pangan Pokok',
    name: 'Beras SPHP Bulog 5kg',
    description: 'Beras stabilisasi pasokan dan harga pangan.',
    price: 57500,
    original_price: null,
    unit: 'karung',
    stock_status: 'ready',
    image_url: null,
    is_featured: true,
    sort_order: 2,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200103',
    village_id: SUKOREJO_VILLAGE_ID,
    category_id: SUKOREJO_CATEGORIES[0].id,
    category_name: 'Beras & Pangan Pokok',
    name: 'Telur Ayam Kampung 10 Butir',
    description: 'Telur ayam kampung asli segar.',
    price: 25000,
    original_price: null,
    unit: 'pack',
    stock_status: 'pre-order',
    image_url: null,
    is_featured: false,
    sort_order: 3,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200104',
    village_id: SUKOREJO_VILLAGE_ID,
    category_id: SUKOREJO_CATEGORIES[1].id,
    category_name: 'Minyak & Gula',
    name: 'Minyak Goreng Kita 1L',
    description: 'Minyak goreng kemasan bantal 1 liter.',
    price: 16000,
    original_price: 17500,
    unit: 'liter',
    stock_status: 'ready',
    image_url: null,
    is_featured: true,
    sort_order: 4,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200105',
    village_id: SUKOREJO_VILLAGE_ID,
    category_id: SUKOREJO_CATEGORIES[1].id,
    category_name: 'Minyak & Gula',
    name: 'Gula Pasir Lokal 1kg',
    description: 'Gula tebu murni produksi Jawa Timur.',
    price: 17000,
    original_price: null,
    unit: 'kg',
    stock_status: 'ready',
    image_url: null,
    is_featured: false,
    sort_order: 5,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200106',
    village_id: SUKOREJO_VILLAGE_ID,
    category_id: SUKOREJO_CATEGORIES[2].id,
    category_name: 'Bumbu & Dapur',
    name: 'Garam Dapur Beryodium 500g',
    description: 'Garam halus beryodium untuk masakan harian.',
    price: 6000,
    original_price: null,
    unit: 'pack',
    stock_status: 'ready',
    image_url: null,
    is_featured: false,
    sort_order: 6,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200107',
    village_id: SUKOREJO_VILLAGE_ID,
    category_id: SUKOREJO_CATEGORIES[2].id,
    category_name: 'Bumbu & Dapur',
    name: 'Saus Sambal Botol 335ml',
    description: 'Saus sambal pedas segar dari cabai pilihan.',
    price: 12500,
    original_price: 14000,
    unit: 'botol',
    stock_status: 'ready',
    image_url: null,
    is_featured: false,
    sort_order: 7,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200108',
    village_id: SUKOREJO_VILLAGE_ID,
    category_id: SUKOREJO_CATEGORIES[2].id,
    category_name: 'Bumbu & Dapur',
    name: 'Bawang Putih Kating 250g',
    description: 'Bawang putih kating siung besar.',
    price: 11000,
    original_price: null,
    unit: 'pack',
    stock_status: 'habis',
    image_url: null,
    is_featured: false,
    sort_order: 8,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200109',
    village_id: SUKOREJO_VILLAGE_ID,
    category_id: SUKOREJO_CATEGORIES[3].id,
    category_name: 'Minuman & Harian',
    name: 'Teh Celup Isi 25 Kantong',
    description: 'Teh hitam celup harum dan pekat.',
    price: 7500,
    original_price: null,
    unit: 'kotak',
    stock_status: 'ready',
    image_url: null,
    is_featured: false,
    sort_order: 9,
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-8002-352509200110',
    village_id: SUKOREJO_VILLAGE_ID,
    category_id: SUKOREJO_CATEGORIES[3].id,
    category_name: 'Minuman & Harian',
    name: 'Sabun Cuci Piring Jeruk Nipis 750ml',
    description: 'Pembersih lemak membandel peralatan dapur.',
    price: 13500,
    original_price: 15500,
    unit: 'pouch',
    stock_status: 'ready',
    image_url: null,
    is_featured: false,
    sort_order: 10,
    updated_at: '2026-11-09T00:00:00Z',
  },
];

export const DEMO_SUBDISTRICTS = INITIAL_SUBDISTRICTS;

export const DEMO_VILLAGE_DIRECTORY = [
  {
    id: GOLOKAN_VILLAGE_ID,
    code: '35.25.09.2008',
    name: 'Golokan',
    slug: 'golokan',
    type: 'desa',
    business_name: 'KDKMP Desa Golokan',
    whatsapp_number: '6281234567801',
    address: 'Jl. Raya Golokan No. 12, Desa Golokan, Kec. Sidayu, Kab. Gresik',
    gmaps_url: 'https://maps.google.com/?q=-6.9925,112.5644',
    logo_url: null,
    opening_hour: '07:00',
    closing_hour: '20:00',
    free_delivery_min: 50000,
    delivery_note: 'Gratis ongkir area Desa Golokan min. belanja Rp 50.000',
    is_active: true,
    subdistrict_id: SIDAYU_SUBDISTRICT.id,
    subdistrict_code: SIDAYU_SUBDISTRICT.code,
    subdistrict_name: SIDAYU_SUBDISTRICT.name,
    subdistrict_slug: SIDAYU_SUBDISTRICT.slug,
    subdistrict_sort_order: SIDAYU_SUBDISTRICT.sort_order,
    product_count: GOLOKAN_PRODUCTS.length,
    ready_product_count: GOLOKAN_PRODUCTS.filter((p) => p.stock_status !== 'habis').length,
    created_at: '2026-11-09T00:00:00Z',
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: SUKOREJO_VILLAGE_ID,
    code: '35.25.09.2001',
    name: 'Sukorejo',
    slug: 'sukorejo',
    type: 'desa',
    business_name: 'KDKMP Desa Sukorejo',
    whatsapp_number: '6281234567802',
    address: 'Jl. Poros Desa Sukorejo RT 02 RW 01, Kec. Sidayu, Kab. Gresik',
    gmaps_url: 'https://maps.google.com/?q=-6.9880,112.5580',
    logo_url: null,
    opening_hour: '16:00',
    closing_hour: '01:00',
    free_delivery_min: 40000,
    delivery_note: 'Gratis ongkir area Desa Sukorejo min. belanja Rp 40.000',
    is_active: true,
    subdistrict_id: SIDAYU_SUBDISTRICT.id,
    subdistrict_code: SIDAYU_SUBDISTRICT.code,
    subdistrict_name: SIDAYU_SUBDISTRICT.name,
    subdistrict_slug: SIDAYU_SUBDISTRICT.slug,
    subdistrict_sort_order: SIDAYU_SUBDISTRICT.sort_order,
    product_count: SUKOREJO_PRODUCTS.length,
    ready_product_count: SUKOREJO_PRODUCTS.filter((p) => p.stock_status !== 'habis').length,
    created_at: '2026-11-09T00:00:00Z',
    updated_at: '2026-11-09T00:00:00Z',
  },
  {
    id: BUNGAH_SUKOREJO_VILLAGE_ID,
    code: '35.25.12.2016',
    name: 'Sukorejo',
    slug: 'sukorejo',
    type: 'desa',
    business_name: 'KDKMP Desa Sukorejo',
    whatsapp_number: '6281234567899',
    address: 'Jl. Raya Sukorejo, Kec. Bungah, Kab. Gresik',
    gmaps_url: 'https://maps.google.com/?q=-7.0345,112.5689',
    logo_url: null,
    opening_hour: '07:00',
    closing_hour: '20:00',
    free_delivery_min: 50000,
    delivery_note: 'Gratis ongkir area Desa Sukorejo Kec. Bungah',
    is_active: false,
    subdistrict_id: BUNGAH_SUBDISTRICT.id,
    subdistrict_code: BUNGAH_SUBDISTRICT.code,
    subdistrict_name: BUNGAH_SUBDISTRICT.name,
    subdistrict_slug: BUNGAH_SUBDISTRICT.slug,
    subdistrict_sort_order: BUNGAH_SUBDISTRICT.sort_order,
    product_count: 2,
    ready_product_count: 2,
    created_at: '2026-11-09T00:00:00Z',
    updated_at: '2026-11-09T00:00:00Z',
  },
];

function toCatalogVillageShape(dirRow) {
  return {
    id: dirRow.id,
    code: dirRow.code,
    subdistrict_id: dirRow.subdistrict_id,
    subdistrict_code: dirRow.subdistrict_code,
    subdistrict_name: dirRow.subdistrict_name,
    subdistrict_slug: dirRow.subdistrict_slug,
    name: dirRow.name,
    slug: dirRow.slug,
    type: dirRow.type,
    business_name: dirRow.business_name,
    whatsapp_number: dirRow.whatsapp_number,
    address: dirRow.address,
    gmaps_url: dirRow.gmaps_url,
    logo_url: dirRow.logo_url,
    opening_hour: dirRow.opening_hour,
    closing_hour: dirRow.closing_hour,
    free_delivery_min: dirRow.free_delivery_min,
    delivery_note: dirRow.delivery_note,
    is_active: dirRow.is_active,
  };
}

const INITIAL_VILLAGE_DIRECTORY = DEMO_VILLAGE_DIRECTORY.map((v) => ({ ...v }));

const INITIAL_CATEGORIES_BY_VILLAGE = {
  [GOLOKAN_VILLAGE_ID]: GOLOKAN_CATEGORIES.map((c) => ({ ...c })),
  [SUKOREJO_VILLAGE_ID]: SUKOREJO_CATEGORIES.map((c) => ({ ...c })),
  [BUNGAH_SUKOREJO_VILLAGE_ID]: [],
};

const INITIAL_PRODUCTS_BY_VILLAGE = {
  [GOLOKAN_VILLAGE_ID]: GOLOKAN_PRODUCTS.map((p) => ({ ...p })),
  [SUKOREJO_VILLAGE_ID]: SUKOREJO_PRODUCTS.map((p) => ({ ...p })),
  [BUNGAH_SUKOREJO_VILLAGE_ID]: [
    {
      id: '00000000-0000-4000-8002-352512201601',
      village_id: BUNGAH_SUKOREJO_VILLAGE_ID,
      category_id: null,
      category_name: null,
      name: 'Beras Bungah Spesial 5kg',
      description: 'Produk uji isolasi RLS di kecamatan nonaktif.',
      price: 70000,
      original_price: 74000,
      unit: 'karung',
      stock_status: 'ready',
      image_url: null,
      is_featured: true,
      sort_order: 1,
      updated_at: '2026-11-09T00:00:00Z',
    },
    {
      id: '00000000-0000-4000-8002-352512201602',
      village_id: BUNGAH_SUKOREJO_VILLAGE_ID,
      category_id: null,
      category_name: null,
      name: 'Minyak Goreng Bungah 2L',
      description: 'Produk uji isolasi RLS di kecamatan nonaktif.',
      price: 34000,
      original_price: null,
      unit: 'pouch',
      stock_status: 'ready',
      image_url: null,
      is_featured: false,
      sort_order: 2,
      updated_at: '2026-11-09T00:00:00Z',
    },
  ],
};

const DEMO_VILLAGES_STORAGE_KEY = 'kdkmp:demo_villages';
const DEMO_SUBDISTRICTS_STORAGE_KEY = 'kdkmp:demo_subdistricts';
const DEMO_ADMIN_USERS_STORAGE_KEY = 'kdkmp:demo_admin_users';

function readPersistedDemoSubdistricts() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(DEMO_SUBDISTRICTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore storage errors
  }
  return INITIAL_SUBDISTRICTS.map((s) => ({ ...s }));
}

function writePersistedDemoSubdistricts(subdistricts) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (subdistricts) {
        window.localStorage.setItem(
          DEMO_SUBDISTRICTS_STORAGE_KEY,
          JSON.stringify(subdistricts)
        );
      } else {
        window.localStorage.removeItem(DEMO_SUBDISTRICTS_STORAGE_KEY);
      }
    }
  } catch {
    // ignore storage errors
  }
}

function readPersistedDemoVillages() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(DEMO_VILLAGES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore storage errors
  }
  return INITIAL_VILLAGE_DIRECTORY.map((v) => ({ ...v }));
}

function writePersistedDemoVillages(villages) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (villages) {
        window.localStorage.setItem(
          DEMO_VILLAGES_STORAGE_KEY,
          JSON.stringify(villages)
        );
      } else {
        window.localStorage.removeItem(DEMO_VILLAGES_STORAGE_KEY);
      }
    }
  } catch {
    // ignore storage errors
  }
}

export const INITIAL_DEMO_ADMIN_USERS = [
  {
    id: '00000000-0000-4000-9000-352509200800',
    email: 'golokan@kdkmp-gresik.id',
    role: 'village_admin',
    village_id: GOLOKAN_VILLAGE_ID,
    created_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-9000-352509200100',
    email: 'sukorejo@kdkmp-gresik.id',
    role: 'village_admin',
    village_id: SUKOREJO_VILLAGE_ID,
    created_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-9000-000000000001',
    email: 'superadmin@kdkmp-gresik.id',
    role: 'super_admin',
    village_id: null,
    created_at: '2026-11-09T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-9000-000000000002',
    email: 'calonmanager@kdkmp-gresik.id',
    role: null,
    village_id: null,
    created_at: '2026-11-10T00:00:00Z',
  },
  {
    id: '00000000-0000-4000-9000-000000000099',
    email: 'belumterdaftar@kdkmp-gresik.id',
    role: null,
    village_id: null,
    created_at: '2026-11-09T00:00:00Z',
  },
];

function readPersistedDemoAdminUsers() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(DEMO_ADMIN_USERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore storage errors
  }
  return INITIAL_DEMO_ADMIN_USERS.map((u) => ({ ...u }));
}

function writePersistedDemoAdminUsers(users) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (users) {
        window.localStorage.setItem(
          DEMO_ADMIN_USERS_STORAGE_KEY,
          JSON.stringify(users)
        );
      } else {
        window.localStorage.removeItem(DEMO_ADMIN_USERS_STORAGE_KEY);
      }
    }
  } catch {
    // ignore storage errors
  }
}

const DEMO_PRODUCT_UNITS_STORAGE_KEY = 'kdkmp:demo:product_units';

function readPersistedDemoProductUnits() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(DEMO_PRODUCT_UNITS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return INITIAL_DEMO_PRODUCT_UNITS.map((u) => ({ ...u }));
}

function writePersistedDemoProductUnits(units) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (units) {
        window.localStorage.setItem(DEMO_PRODUCT_UNITS_STORAGE_KEY, JSON.stringify(units));
      } else {
        window.localStorage.removeItem(DEMO_PRODUCT_UNITS_STORAGE_KEY);
      }
    }
  } catch {
    // ignore
  }
}

let demoSubdistricts = readPersistedDemoSubdistricts();
let demoVillages = readPersistedDemoVillages();
let demoAdminUsers = readPersistedDemoAdminUsers();
let demoProductUnits = readPersistedDemoProductUnits();

let demoCategoriesByVillage = {
  [GOLOKAN_VILLAGE_ID]: INITIAL_CATEGORIES_BY_VILLAGE[GOLOKAN_VILLAGE_ID].map((c) => ({ ...c })),
  [SUKOREJO_VILLAGE_ID]: INITIAL_CATEGORIES_BY_VILLAGE[SUKOREJO_VILLAGE_ID].map((c) => ({ ...c })),
  [BUNGAH_SUKOREJO_VILLAGE_ID]: [],
};

let demoProductsByVillage = {
  [GOLOKAN_VILLAGE_ID]: INITIAL_PRODUCTS_BY_VILLAGE[GOLOKAN_VILLAGE_ID].map((p) => ({ ...p })),
  [SUKOREJO_VILLAGE_ID]: INITIAL_PRODUCTS_BY_VILLAGE[SUKOREJO_VILLAGE_ID].map((p) => ({ ...p })),
  [BUNGAH_SUKOREJO_VILLAGE_ID]: INITIAL_PRODUCTS_BY_VILLAGE[BUNGAH_SUKOREJO_VILLAGE_ID].map((p) => ({ ...p })),
};

let demoStorageObjects = new Map();

export function resetDemoAdminData() {
  demoSubdistricts = INITIAL_SUBDISTRICTS.map((s) => ({ ...s }));
  writePersistedDemoSubdistricts(null);
  demoVillages = INITIAL_VILLAGE_DIRECTORY.map((v) => ({ ...v }));
  writePersistedDemoVillages(null);
  demoAdminUsers = INITIAL_DEMO_ADMIN_USERS.map((u) => ({ ...u }));
  writePersistedDemoAdminUsers(null);
  demoProductUnits = INITIAL_DEMO_PRODUCT_UNITS.map((u) => ({ ...u }));
  writePersistedDemoProductUnits(null);
  demoCategoriesByVillage = {
    [GOLOKAN_VILLAGE_ID]: INITIAL_CATEGORIES_BY_VILLAGE[GOLOKAN_VILLAGE_ID].map((c) => ({ ...c })),
    [SUKOREJO_VILLAGE_ID]: INITIAL_CATEGORIES_BY_VILLAGE[SUKOREJO_VILLAGE_ID].map((c) => ({ ...c })),
    [BUNGAH_SUKOREJO_VILLAGE_ID]: [],
  };
  demoProductsByVillage = {
    [GOLOKAN_VILLAGE_ID]: INITIAL_PRODUCTS_BY_VILLAGE[GOLOKAN_VILLAGE_ID].map((p) => ({ ...p })),
    [SUKOREJO_VILLAGE_ID]: INITIAL_PRODUCTS_BY_VILLAGE[SUKOREJO_VILLAGE_ID].map((p) => ({ ...p })),
    [BUNGAH_SUKOREJO_VILLAGE_ID]: INITIAL_PRODUCTS_BY_VILLAGE[BUNGAH_SUKOREJO_VILLAGE_ID].map((p) => ({ ...p })),
  };
  demoStorageObjects = new Map();
  resetDemoOrderLogs();
  resetDemoOrders();
}

export const DEMO_CATALOGS = {
  'sidayu/golokan': {
    subdistrict: {
      id: SIDAYU_SUBDISTRICT.id,
      code: SIDAYU_SUBDISTRICT.code,
      name: SIDAYU_SUBDISTRICT.name,
      slug: SIDAYU_SUBDISTRICT.slug,
      sort_order: SIDAYU_SUBDISTRICT.sort_order,
    },
    village: toCatalogVillageShape(DEMO_VILLAGE_DIRECTORY[0]),
    categories: GOLOKAN_CATEGORIES,
    products: GOLOKAN_PRODUCTS,
  },
  'sidayu/sukorejo': {
    subdistrict: {
      id: SIDAYU_SUBDISTRICT.id,
      code: SIDAYU_SUBDISTRICT.code,
      name: SIDAYU_SUBDISTRICT.name,
      slug: SIDAYU_SUBDISTRICT.slug,
      sort_order: SIDAYU_SUBDISTRICT.sort_order,
    },
    village: toCatalogVillageShape(DEMO_VILLAGE_DIRECTORY[1]),
    categories: SUKOREJO_CATEGORIES,
    products: SUKOREJO_PRODUCTS,
  },
};

export function getDemoSubdistricts({ all = false } = {}) {
  const list = demoSubdistricts.map((s) => {
    const vCount = demoVillages.filter((v) => v.subdistrict_id === s.id).length;
    return {
      ...s,
      village_count: vCount,
    };
  });
  if (all) {
    return list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, 'id'));
  }
  return list
    .filter((s) => s.is_active)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, 'id'));
}

export function createDemoSubdistrict(payload = {}) {
  const name = String(payload.name ?? '').trim();
  const code = String(payload.code ?? '').trim();
  const rawSlug = String(payload.slug ?? '').trim().toLowerCase();
  const slug = rawSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  if (!name) throw new Error('Nama kecamatan wajib diisi.');
  if (!code) throw new Error('Kode kecamatan wajib diisi.');
  if (!slug) throw new Error('Slug kecamatan wajib diisi.');

  if (isReservedSlug(slug)) {
    throw new Error('Slug tidak boleh menggunakan kata terlarang (admin, login, api, assets, dev).');
  }

  if (demoSubdistricts.some((s) => s.slug.toLowerCase() === slug)) {
    throw new Error('Slug kecamatan sudah digunakan.');
  }

  if (demoSubdistricts.some((s) => s.code === code)) {
    throw new Error('Kode kecamatan sudah digunakan.');
  }

  const newSub = {
    id: `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0').slice(-12)}`,
    code,
    name,
    slug,
    sort_order: Number(payload.sort_order) || demoSubdistricts.length + 1,
    is_active: Boolean(payload.is_active),
    created_at: new Date().toISOString(),
  };

  demoSubdistricts = [...demoSubdistricts, newSub];
  writePersistedDemoSubdistricts(demoSubdistricts);
  return { ...newSub, village_count: 0 };
}

export function updateDemoSubdistrict(id, patch = {}) {
  const sid = String(id ?? '').trim();
  const idx = demoSubdistricts.findIndex((s) => s.id === sid);
  if (idx === -1) throw new Error('Kecamatan tidak ditemukan.');

  const current = demoSubdistricts[idx];
  const nextSlug = patch.slug !== undefined ? String(patch.slug).trim().toLowerCase() : current.slug;
  const nextCode = patch.code !== undefined ? String(patch.code).trim() : current.code;

  if (nextSlug && isReservedSlug(nextSlug)) {
    throw new Error('Slug tidak boleh menggunakan kata terlarang (admin, login, api, assets, dev).');
  }

  if (nextSlug && demoSubdistricts.some((s) => s.id !== sid && s.slug.toLowerCase() === nextSlug)) {
    throw new Error('Slug kecamatan sudah digunakan.');
  }

  if (nextCode && demoSubdistricts.some((s) => s.id !== sid && s.code === nextCode)) {
    throw new Error('Kode kecamatan sudah digunakan.');
  }

  const updated = {
    ...current,
    ...patch,
    slug: nextSlug,
    code: nextCode,
    is_active: patch.is_active !== undefined ? Boolean(patch.is_active) : current.is_active,
  };

  demoSubdistricts = demoSubdistricts.map((s, i) => (i === idx ? updated : s));
  writePersistedDemoSubdistricts(demoSubdistricts);

  const vCount = demoVillages.filter((v) => v.subdistrict_id === sid).length;
  return { ...updated, village_count: vCount };
}

export function toggleDemoSubdistrictActive(id, isActive) {
  return updateDemoSubdistrict(id, { is_active: Boolean(isActive) });
}

export function getDemoVillages({ all = true, subdistrictId = '' } = {}) {
  let list = demoVillages.map((v) => {
    const prods = demoProductsByVillage[v.id] || [];
    const sub = demoSubdistricts.find((s) => s.id === v.subdistrict_id);
    return {
      ...v,
      subdistrict_name: sub?.name || v.subdistrict_name || '',
      subdistrict_slug: sub?.slug || v.subdistrict_slug || '',
      subdistrict_code: sub?.code || v.subdistrict_code || '',
      product_count: prods.length,
      ready_product_count: prods.filter((p) => p.stock_status !== 'habis').length,
    };
  });

  if (subdistrictId) {
    list = list.filter((v) => v.subdistrict_id === subdistrictId);
  }

  if (!all) {
    list = list.filter((v) => v.is_active);
  }

  return list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id'));
}

export function createDemoVillage(payload = {}) {
  const name = String(payload.name ?? '').trim();
  const subdistrictId = String(payload.subdistrict_id ?? '').trim();
  const type = payload.type === 'kelurahan' ? 'kelurahan' : 'desa';
  const businessName = String(payload.business_name ?? '').trim() || `KDKMP ${type === 'kelurahan' ? 'Kelurahan' : 'Desa'} ${name}`;
  const rawSlug = String(payload.slug ?? '').trim().toLowerCase();
  const slug = rawSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  if (!subdistrictId) throw new Error('Kecamatan wajib dipilih.');
  if (!name) throw new Error('Nama desa/kelurahan wajib diisi.');
  if (!slug) throw new Error('Slug koperasi wajib diisi.');

  if (isReservedSlug(slug)) {
    throw new Error('Slug tidak boleh menggunakan kata terlarang (admin, login, api, assets, dev).');
  }

  const subdistrict = demoSubdistricts.find((s) => s.id === subdistrictId);
  if (!subdistrict) throw new Error('Kecamatan tidak ditemukan.');

  const duplicateInSubdistrict = demoVillages.find(
    (v) => v.subdistrict_id === subdistrictId && v.slug.toLowerCase() === slug
  );
  if (duplicateInSubdistrict) {
    throw new Error('Slug sudah digunakan di kecamatan ini.');
  }

  const rawPhone = payload.whatsapp_number ? normalizePhone(payload.whatsapp_number) : null;
  const isActive = Boolean(payload.is_active);

  if (isActive && (!rawPhone || !isValidPhone(rawPhone))) {
    throw new Error('Nomor WhatsApp wajib dan harus valid (format 628...) untuk mengaktifkan koperasi.');
  }

  const newVillageId = `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0').slice(-12)}`;
  const code = String(payload.code ?? '').trim() || `${subdistrict.code}.${Date.now().toString().slice(-4)}`;

  const newVillage = {
    id: newVillageId,
    code,
    name,
    slug,
    type,
    business_name: businessName,
    whatsapp_number: rawPhone,
    address: String(payload.address ?? '').trim() || null,
    gmaps_url: String(payload.gmaps_url ?? '').trim() || null,
    logo_url: null,
    opening_hour: payload.opening_hour || '07:00',
    closing_hour: payload.closing_hour || '20:00',
    free_delivery_min: Number(payload.free_delivery_min) || 0,
    delivery_note: String(payload.delivery_note ?? '').trim() || null,
    is_active: isActive,
    subdistrict_id: subdistrict.id,
    subdistrict_code: subdistrict.code,
    subdistrict_name: subdistrict.name,
    subdistrict_slug: subdistrict.slug,
    subdistrict_sort_order: subdistrict.sort_order,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  demoVillages = [...demoVillages, newVillage];
  writePersistedDemoVillages(demoVillages);
  return { ...newVillage, product_count: 0, ready_product_count: 0 };
}

export function updateDemoVillage(id, patch = {}) {
  const vid = String(id ?? '').trim();
  const idx = demoVillages.findIndex((v) => v.id === vid);
  if (idx === -1) throw new Error('Koperasi tidak ditemukan.');

  const current = demoVillages[idx];
  const targetSubId = patch.subdistrict_id ? String(patch.subdistrict_id).trim() : current.subdistrict_id;
  const nextSlug = patch.slug !== undefined ? String(patch.slug).trim().toLowerCase() : current.slug;

  if (nextSlug && isReservedSlug(nextSlug)) {
    throw new Error('Slug tidak boleh menggunakan kata terlarang (admin, login, api, assets, dev).');
  }

  if (nextSlug) {
    const duplicateInSubdistrict = demoVillages.find(
      (v) => v.id !== vid && v.subdistrict_id === targetSubId && v.slug.toLowerCase() === nextSlug
    );
    if (duplicateInSubdistrict) {
      throw new Error('Slug sudah digunakan di kecamatan ini.');
    }
  }

  const isActive = patch.is_active !== undefined ? Boolean(patch.is_active) : current.is_active;
  let rawPhone = patch.whatsapp_number !== undefined
    ? (patch.whatsapp_number ? normalizePhone(patch.whatsapp_number) : null)
    : current.whatsapp_number;

  if (isActive && (!rawPhone || !isValidPhone(rawPhone))) {
    throw new Error('Nomor WhatsApp wajib dan harus valid (format 628...) untuk mengaktifkan koperasi.');
  }

  const sub = demoSubdistricts.find((s) => s.id === targetSubId) || current;

  const updated = {
    ...current,
    ...patch,
    subdistrict_id: targetSubId,
    subdistrict_code: sub.code || current.subdistrict_code,
    subdistrict_name: sub.name || current.subdistrict_name,
    subdistrict_slug: sub.slug || current.subdistrict_slug,
    subdistrict_sort_order: sub.sort_order ?? current.subdistrict_sort_order,
    slug: nextSlug,
    whatsapp_number: rawPhone,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  demoVillages = demoVillages.map((v, i) => (i === idx ? updated : v));
  writePersistedDemoVillages(demoVillages);

  const prods = demoProductsByVillage[vid] || [];
  return {
    ...updated,
    product_count: prods.length,
    ready_product_count: prods.filter((p) => p.stock_status !== 'habis').length,
  };
}

export function toggleDemoVillageActive(id, isActive) {
  const vid = String(id ?? '').trim();
  const v = demoVillages.find((x) => x.id === vid);
  if (!v) throw new Error('Koperasi tidak ditemukan.');
  if (isActive && (!v.whatsapp_number || !isValidPhone(v.whatsapp_number))) {
    throw new Error('Nomor WhatsApp wajib diisi dengan format valid sebelum mengaktifkan koperasi.');
  }
  return updateDemoVillage(id, { is_active: Boolean(isActive) });
}

export function getDemoVillageDirectory() {
  return demoVillages.map((v) => {
    const prods = demoProductsByVillage[v.id] || [];
    return {
      ...v,
      product_count: prods.length,
      ready_product_count: prods.filter((p) => p.stock_status !== 'habis').length,
    };
  });
}

export function getDemoVillageById(villageId) {
  const vid = String(villageId ?? '').trim();
  if (!vid) return null;
  const found = demoVillages.find((v) => v.id === vid);
  if (!found) return null;
  const prods = demoProductsByVillage[found.id] || [];
  return {
    ...found,
    product_count: prods.length,
    ready_product_count: prods.filter((p) => p.stock_status !== 'habis').length,
  };
}

export function updateDemoVillageById(villageId, patch = {}) {
  const vid = String(villageId ?? '').trim();
  if (!vid) return null;
  const idx = demoVillages.findIndex((v) => v.id === vid);
  if (idx === -1) return null;
  const updated = {
    ...demoVillages[idx],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  demoVillages = demoVillages.map((v, i) => (i === idx ? updated : v));
  writePersistedDemoVillages(demoVillages);
  return getDemoVillageById(vid);
}

export function getDemoVillageCatalog(kecamatan, desa) {
  const kecSlug = String(kecamatan ?? '').trim().toLowerCase();
  const desaSlug = String(desa ?? '').trim().toLowerCase();
  const key = `${kecSlug}/${desaSlug}`;
  const catalog = DEMO_CATALOGS[key];
  const currentVillage = demoVillages.find(
    (v) => v.subdistrict_slug === kecSlug && v.slug === desaSlug && v.is_active
  );
  if (!catalog && !currentVillage) return null;
  const vid = currentVillage?.id || catalog.village.id;
  const villageObj = currentVillage
    ? toCatalogVillageShape(currentVillage)
    : { ...catalog.village };
  const subdistrictObj = catalog?.subdistrict
    ? { ...catalog.subdistrict }
    : {
        id: currentVillage.subdistrict_id,
        code: currentVillage.subdistrict_code,
        name: currentVillage.subdistrict_name,
        slug: currentVillage.subdistrict_slug,
        sort_order: currentVillage.subdistrict_sort_order,
      };
  const cats = (demoCategoriesByVillage[vid] || catalog?.categories || [])
    .map((c) => ({ ...c }))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, 'id'));
  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  const prods = (demoProductsByVillage[vid] || catalog?.products || []).map((p) => ({
    ...p,
    category_name: p.category_id ? (catMap.get(p.category_id) ?? null) : null,
  }));
  return {
    subdistrict: subdistrictObj,
    village: villageObj,
    categories: cats,
    products: prods,
  };
}

export const DEMO_ADMIN_USERS = INITIAL_DEMO_ADMIN_USERS;

export function getDemoVillageAdmins() {
  return demoAdminUsers
    .filter((u) => u.role === 'village_admin' && u.village_id)
    .map((u) => {
      const village = demoVillages.find((v) => v.id === u.village_id);
      const subdistrict = demoSubdistricts.find((s) => s.id === village?.subdistrict_id);
      return {
        user_id: u.id,
        email: u.email,
        role: u.role,
        village_id: u.village_id,
        village_code: village?.code || '',
        village_name: village?.name || '',
        business_name: village?.business_name || '',
        whatsapp_number: village?.whatsapp_number || '',
        subdistrict_name: subdistrict?.name || village?.subdistrict_name || '',
        created_at: u.created_at || '2026-11-09T00:00:00Z',
      };
    });
}

export function findDemoAdminUserById(userId) {
  const uid = String(userId ?? '').trim();
  return demoAdminUsers.find((u) => u.id === uid) ?? null;
}

export function assignDemoVillageAdmin(
  email,
  villageId,
  { autoCreate = false, initialPassword = null } = {}
) {
  const normEmail = String(email ?? '').trim().toLowerCase();
  const vid = String(villageId ?? '').trim();

  if (!normEmail) {
    const err = new Error('Email wajib diisi.');
    err.code = '22023';
    throw err;
  }

  const village = demoVillages.find((v) => v.id === vid);
  if (!village) {
    const err = new Error('Koperasi tidak ditemukan.');
    err.code = 'P0002';
    throw err;
  }

  let user = demoAdminUsers.find((u) => u.email === normEmail);
  let isNew = false;
  if (!user) {
    if (!autoCreate) {
      const err = new Error('Email belum terdaftar. Undang via Supabase Dashboard.');
      err.code = 'P0002';
      throw err;
    }
    isNew = true;
    user = {
      id: `00000000-0000-4000-9000-${Date.now().toString(16).padStart(12, '0')}`,
      email: normEmail,
      role: 'village_admin',
      village_id: vid,
      created_at: new Date().toISOString(),
    };
    demoAdminUsers.push(user);
  }

  if (user.role === 'super_admin') {
    const err = new Error('Akun super admin tidak dapat ditetapkan sebagai manager KDKMP.');
    err.code = '23505';
    throw err;
  }

  if (user.village_id && user.village_id !== vid) {
    const err = new Error('Akun ini sudah menjadi manager di KDKMP lain (1 manager = 1 KDKMP).');
    err.code = '23505';
    throw err;
  }

  const existingManager = demoAdminUsers.find(
    (u) => u.village_id === vid && u.id !== user.id && u.role === 'village_admin'
  );
  if (existingManager) {
    const err = new Error('KDKMP ini sudah memiliki manager aktif (1 KDKMP = 1 manager).');
    err.code = '23505';
    throw err;
  }

  user.role = 'village_admin';
  user.village_id = vid;
  user.created_at = new Date().toISOString();
  writePersistedDemoAdminUsers(demoAdminUsers);

  return {
    user_id: user.id,
    email: user.email,
    role: 'village_admin',
    village_id: vid,
    is_new: isNew,
    initial_password: isNew ? initialPassword : null,
  };
}

export function revokeDemoVillageAdmin(userId) {
  const uid = String(userId ?? '').trim();
  const user = demoAdminUsers.find((u) => u.id === uid && u.role === 'village_admin');
  if (!user) {
    const err = new Error('Manager KDKMP tidak ditemukan.');
    err.code = 'P0002';
    throw err;
  }

  user.role = null;
  user.village_id = null;
  writePersistedDemoAdminUsers(demoAdminUsers);
  return true;
}

export function findDemoAuthUserByEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase();
  if (!normalized) return null;
  const found = demoAdminUsers.find((u) => u.email === normalized);
  return found ? { ...found } : null;
}

export function getDemoAdminByUserId(userId) {
  const id = String(userId ?? '').trim();
  if (!id) return null;
  const found = demoAdminUsers.find((u) => u.id === id && u.role !== null);
  if (!found) return null;
  return {
    user_id: found.id,
    role: found.role,
    village_id: found.village_id,
    created_at: '2026-11-09T00:00:00Z',
  };
}

export function getDemoAdminCategoriesByVillageId(villageId) {
  const vid = String(villageId ?? '').trim();
  const list = demoCategoriesByVillage[vid] || [];
  return list
    .map((c) => ({ ...c }))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, 'id'));
}

export function setDemoAdminCategoriesByVillageId(villageId, categories) {
  const vid = String(villageId ?? '').trim();
  if (!vid) return;
  demoCategoriesByVillage[vid] = categories.map((c) => ({ ...c }));
}

export function findDemoCategoryById(categoryId) {
  const cid = String(categoryId ?? '').trim();
  if (!cid) return null;
  for (const vid of Object.keys(demoCategoriesByVillage)) {
    const found = (demoCategoriesByVillage[vid] || []).find((c) => c.id === cid);
    if (found) return { ...found };
  }
  return null;
}

export function getDemoAdminProductsByVillageId(villageId) {
  const vid = String(villageId ?? '').trim();
  const cats = demoCategoriesByVillage[vid] || [];
  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  const village = demoVillages.find((v) => v.id === vid);
  const kdkmpName = village ? (village.business_name || `KDKMP Desa ${village.name}`) : null;
  const villageName = village ? village.name : null;
  const list = demoProductsByVillage[vid] || [];
  return list
    .map((p) => ({
      ...p,
      category_name: p.category_id ? (catMap.get(p.category_id) ?? null) : null,
      kdkmp_name: kdkmpName,
      village_name: villageName,
    }))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, 'id'));
}

export function getAllDemoAdminProducts() {
  const villageMap = new Map(demoVillages.map((v) => [v.id, v]));
  const allCategories = getAllDemoCategories();
  const catMap = new Map(allCategories.map((c) => [c.id, c.name]));

  const allProducts = [];
  for (const [vid, products] of Object.entries(demoProductsByVillage)) {
    const v = villageMap.get(vid);
    const kdkmpName = v ? (v.business_name || `KDKMP Desa ${v.name}`) : 'KDKMP';
    const villageName = v ? v.name : '';
    for (const p of products) {
      allProducts.push({
        ...p,
        category_name: p.category_id ? (catMap.get(p.category_id) ?? p.category_name ?? null) : null,
        kdkmp_name: kdkmpName,
        village_name: villageName,
      });
    }
  }

  return allProducts.sort(
    (a, b) =>
      (a.kdkmp_name || '').localeCompare(b.kdkmp_name || '', 'id') ||
      (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
      a.name.localeCompare(b.name, 'id')
  );
}

export function setDemoAdminProductsByVillageId(villageId, products) {
  const vid = String(villageId ?? '').trim();
  if (!vid) return;
  demoProductsByVillage[vid] = products.map((p) => ({ ...p }));
}

export function findDemoProductById(productId) {
  const pid = String(productId ?? '').trim();
  if (!pid) return null;
  for (const vid of Object.keys(demoProductsByVillage)) {
    const found = (demoProductsByVillage[vid] || []).find((p) => p.id === pid);
    if (found) return { ...found };
  }
  return null;
}

export function putDemoStorageObject(objectPath, meta) {
  const path = String(objectPath ?? '').trim();
  if (!path) return;
  demoStorageObjects.set(path, { ...meta, objectPath: path, createdAt: new Date().toISOString() });
}

export function getDemoStorageObject(objectPath) {
  const path = String(objectPath ?? '').trim();
  if (!path) return null;
  return demoStorageObjects.get(path) ?? null;
}

export function deleteDemoStorageObject(objectPath) {
  const path = String(objectPath ?? '').trim();
  if (!path) return false;
  return demoStorageObjects.delete(path);
}

export function listDemoStorageObjects(prefix = '') {
  const cleanPrefix = String(prefix ?? '').trim();
  const out = [];
  for (const [k, v] of demoStorageObjects.entries()) {
    if (!cleanPrefix || k.startsWith(cleanPrefix)) {
      out.push({ ...v });
    }
  }
  return out;
}

export function getAllDemoCategories() {
  const map = new Map();
  for (const vid of Object.keys(demoCategoriesByVillage)) {
    for (const c of demoCategoriesByVillage[vid] || []) {
      const norm = c.name.trim().toLowerCase();
      if (!map.has(norm)) {
        map.set(norm, { ...c });
      }
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, 'id')
  );
}

export function getDemoProductUnits() {
  return [...demoProductUnits]
    .map((u) => ({ ...u }))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, 'id'));
}

export function setDemoProductUnits(units) {
  demoProductUnits = Array.isArray(units) ? units.map((u) => ({ ...u })) : [];
  writePersistedDemoProductUnits(demoProductUnits);
}

export function findDemoProductUnitById(unitId) {
  const uid = String(unitId ?? '').trim();
  if (!uid) return null;
  const found = demoProductUnits.find((u) => u.id === uid);
  return found ? { ...found } : null;
}

export function createDemoProductUnit({ name, sort_order }) {
  const clean = String(name ?? '').trim();
  if (!clean) {
    throw new Error('Nama satuan wajib diisi.');
  }
  if (clean.length > 30) {
    throw new Error('Nama satuan maksimal 30 karakter.');
  }

  const duplicate = demoProductUnits.some(
    (u) => u.name.trim().toLowerCase() === clean.toLowerCase()
  );
  if (duplicate) {
    throw new Error('Satuan sudah terdaftar.');
  }

  const maxSort = demoProductUnits.reduce(
    (max, u) => Math.max(max, Number(u.sort_order ?? 0)),
    0
  );
  const nextSort = Number.isFinite(Number(sort_order)) ? Number(sort_order) : maxSort + 1;

  const created = {
    id: `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: clean,
    sort_order: nextSort,
    created_at: new Date().toISOString(),
  };

  demoProductUnits = [...demoProductUnits, created];
  writePersistedDemoProductUnits(demoProductUnits);
  return { ...created };
}

export function updateDemoProductUnit(unitId, { name, sort_order }) {
  const uid = String(unitId ?? '').trim();
  const found = findDemoProductUnitById(uid);
  if (!found) {
    throw new Error('Satuan tidak ditemukan.');
  }

  const nextName = name !== undefined ? String(name).trim() : found.name;
  if (!nextName) {
    throw new Error('Nama satuan wajib diisi.');
  }
  if (nextName.length > 30) {
    throw new Error('Nama satuan maksimal 30 karakter.');
  }

  const duplicate = demoProductUnits.some(
    (u) => u.id !== uid && u.name.trim().toLowerCase() === nextName.toLowerCase()
  );
  if (duplicate) {
    throw new Error('Satuan sudah terdaftar.');
  }

  const nextSort = sort_order !== undefined ? Number(sort_order) : found.sort_order;

  const updated = {
    ...found,
    name: nextName,
    sort_order: Number.isFinite(nextSort) ? nextSort : found.sort_order,
  };

  demoProductUnits = demoProductUnits.map((u) => (u.id === uid ? updated : u));
  writePersistedDemoProductUnits(demoProductUnits);
  return { ...updated };
}

export function deleteDemoProductUnit(unitId) {
  const uid = String(unitId ?? '').trim();
  const found = findDemoProductUnitById(uid);
  if (!found) {
    throw new Error('Satuan tidak ditemukan.');
  }

  demoProductUnits = demoProductUnits
    .filter((u) => u.id !== uid)
    .map((u, idx) => ({ ...u, sort_order: idx + 1 }));
  writePersistedDemoProductUnits(demoProductUnits);
  return true;
}

export function moveDemoProductUnit(unitId, direction) {
  const uid = String(unitId ?? '').trim();
  const dir = String(direction ?? '').trim().toLowerCase();
  if (!uid || (dir !== 'up' && dir !== 'down')) {
    throw new Error('Parameter urutan tidak valid.');
  }

  const current = getDemoProductUnits();
  const idx = current.findIndex((u) => u.id === uid);
  if (idx === -1) {
    throw new Error('Satuan tidak ditemukan.');
  }

  const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= current.length) {
    return current;
  }

  const next = [...current];
  const temp = next[idx];
  next[idx] = next[swapIdx];
  next[swapIdx] = temp;

  const reordered = next.map((u, i) => ({ ...u, sort_order: i + 1 }));
  demoProductUnits = reordered;
  writePersistedDemoProductUnits(demoProductUnits);
  return reordered;
}

// -------------------------------------------------------------
// S12: STATISTIK CHECKOUT WA & ORDER LOGS (DEMO DATA)
// -------------------------------------------------------------

export const DEMO_ORDER_LOGS_KEY = 'kdkmp:demo_order_logs';

export function getJakartaDateParts(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value || '2026';
  const month = parts.find((p) => p.type === 'month')?.value || '11';
  const day = parts.find((p) => p.type === 'day')?.value || '09';
  return {
    dateString: `${year}-${month}-${day}`,
    dayLabel: `${day}/${month}`,
  };
}

export function generateInitialDemoOrderLogs(baseDate = new Date()) {
  const nowMs = baseDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  // Golokan products
  const pBerasPandan = GOLOKAN_PRODUCTS[0]; // 72000
  const pBerasIR64 = GOLOKAN_PRODUCTS[1];   // 62000
  const pTelurAyam = GOLOKAN_PRODUCTS[2];   // 28000
  const pMinyak2L = GOLOKAN_PRODUCTS[3];    // 35000
  const pGula1kg = GOLOKAN_PRODUCTS[4];     // 17500
  const pTepung = GOLOKAN_PRODUCTS[5];      // 12500

  // Sukorejo products
  const pRojolele = SUKOREJO_PRODUCTS[0];   // 71000
  const pMinyakKita = SUKOREJO_PRODUCTS[3]; // 16000

  const templates = [
    // Hari ini (0 days ago)
    { daysAgo: 0, hoursAgo: 2, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pBerasPandan.id, qty: 1, price: 72000 }, { product_id: pMinyak2L.id, qty: 1, price: 35000 }], delivery: 'Diantar', payment: 'COD' },
    { daysAgo: 0, hoursAgo: 4, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pTelurAyam.id, qty: 2, price: 28000 }, { product_id: pGula1kg.id, qty: 1, price: 17500 }], delivery: 'Ambil di Koperasi', payment: 'Transfer-QRIS' },
    { daysAgo: 0, hoursAgo: 6, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pBerasPandan.id, qty: 1, price: 72000 }], delivery: 'Diantar', payment: 'COD' },
    { daysAgo: 0, hoursAgo: 5, villageId: SUKOREJO_VILLAGE_ID, items: [{ product_id: pRojolele.id, qty: 1, price: 71000 }, { product_id: pMinyakKita.id, qty: 2, price: 16000 }], delivery: 'Diantar', payment: 'COD' },

    // 1 hari lalu
    { daysAgo: 1, hoursAgo: 3, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pBerasPandan.id, qty: 2, price: 72000 }], delivery: 'Diantar', payment: 'Transfer-QRIS' },
    { daysAgo: 1, hoursAgo: 7, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pMinyak2L.id, qty: 2, price: 35000 }, { product_id: pGula1kg.id, qty: 2, price: 17500 }], delivery: 'Diantar', payment: 'COD' },
    { daysAgo: 1, hoursAgo: 9, villageId: SUKOREJO_VILLAGE_ID, items: [{ product_id: pRojolele.id, qty: 1, price: 71000 }], delivery: 'Ambil di Koperasi', payment: 'COD' },

    // 2 hari lalu
    { daysAgo: 2, hoursAgo: 2, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pBerasIR64.id, qty: 1, price: 62000 }, { product_id: pTelurAyam.id, qty: 1, price: 28000 }], delivery: 'Diantar', payment: 'COD' },
    { daysAgo: 2, hoursAgo: 6, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pTepung.id, qty: 4, price: 12500 }], delivery: 'Ambil di Koperasi', payment: 'Transfer-QRIS' },
    { daysAgo: 2, hoursAgo: 8, villageId: SUKOREJO_VILLAGE_ID, items: [{ product_id: pMinyakKita.id, qty: 3, price: 16000 }], delivery: 'Diantar', payment: 'COD' },

    // 3 hari lalu
    { daysAgo: 3, hoursAgo: 4, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pBerasPandan.id, qty: 1, price: 72000 }, { product_id: pTelurAyam.id, qty: 2, price: 28000 }], delivery: 'Diantar', payment: 'COD' },
    { daysAgo: 3, hoursAgo: 8, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pMinyak2L.id, qty: 3, price: 35000 }], delivery: 'Diantar', payment: 'Transfer-QRIS' },

    // 4 hari lalu
    { daysAgo: 4, hoursAgo: 1, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pBerasPandan.id, qty: 1, price: 72000 }, { product_id: pGula1kg.id, qty: 2, price: 17500 }], delivery: 'Diantar', payment: 'COD' },
    { daysAgo: 4, hoursAgo: 5, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pBerasIR64.id, qty: 2, price: 62000 }], delivery: 'Diantar', payment: 'Transfer-QRIS' },
    { daysAgo: 4, hoursAgo: 9, villageId: SUKOREJO_VILLAGE_ID, items: [{ product_id: pRojolele.id, qty: 2, price: 71000 }], delivery: 'Diantar', payment: 'COD' },

    // 5 hari lalu
    { daysAgo: 5, hoursAgo: 3, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pTelurAyam.id, qty: 3, price: 28000 }], delivery: 'Ambil di Koperasi', payment: 'COD' },
    { daysAgo: 5, hoursAgo: 7, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pMinyak2L.id, qty: 1, price: 35000 }, { product_id: pTepung.id, qty: 2, price: 12500 }], delivery: 'Diantar', payment: 'COD' },

    // 6 hari lalu
    { daysAgo: 6, hoursAgo: 2, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pBerasPandan.id, qty: 1, price: 72000 }, { product_id: pMinyak2L.id, qty: 2, price: 35000 }], delivery: 'Diantar', payment: 'Transfer-QRIS' },
    { daysAgo: 6, hoursAgo: 6, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pGula1kg.id, qty: 3, price: 17500 }], delivery: 'Ambil di Koperasi', payment: 'COD' },
    { daysAgo: 6, hoursAgo: 8, villageId: SUKOREJO_VILLAGE_ID, items: [{ product_id: pRojolele.id, qty: 1, price: 71000 }, { product_id: pMinyakKita.id, qty: 1, price: 16000 }], delivery: 'Diantar', payment: 'COD' },

    // 8 - 28 hari lalu
    { daysAgo: 8, hoursAgo: 3, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pBerasPandan.id, qty: 2, price: 72000 }], delivery: 'Diantar', payment: 'COD' },
    { daysAgo: 10, hoursAgo: 5, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pMinyak2L.id, qty: 2, price: 35000 }, { product_id: pTelurAyam.id, qty: 2, price: 28000 }], delivery: 'Diantar', payment: 'Transfer-QRIS' },
    { daysAgo: 12, hoursAgo: 4, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pBerasIR64.id, qty: 1, price: 62000 }], delivery: 'Ambil di Koperasi', payment: 'COD' },
    { daysAgo: 14, hoursAgo: 6, villageId: SUKOREJO_VILLAGE_ID, items: [{ product_id: pRojolele.id, qty: 2, price: 71000 }], delivery: 'Diantar', payment: 'COD' },
    { daysAgo: 16, hoursAgo: 2, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pBerasPandan.id, qty: 1, price: 72000 }, { product_id: pGula1kg.id, qty: 1, price: 17500 }], delivery: 'Diantar', payment: 'COD' },
    { daysAgo: 18, hoursAgo: 7, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pTelurAyam.id, qty: 4, price: 28000 }], delivery: 'Diantar', payment: 'Transfer-QRIS' },
    { daysAgo: 20, hoursAgo: 3, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pMinyak2L.id, qty: 3, price: 35000 }], delivery: 'Diantar', payment: 'COD' },
    { daysAgo: 22, hoursAgo: 5, villageId: SUKOREJO_VILLAGE_ID, items: [{ product_id: pRojolele.id, qty: 1, price: 71000 }, { product_id: pMinyakKita.id, qty: 2, price: 16000 }], delivery: 'Diantar', payment: 'Transfer-QRIS' },
    { daysAgo: 25, hoursAgo: 4, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pBerasPandan.id, qty: 2, price: 72000 }], delivery: 'Diantar', payment: 'COD' },
    { daysAgo: 27, hoursAgo: 6, villageId: GOLOKAN_VILLAGE_ID, items: [{ product_id: pTepung.id, qty: 5, price: 12500 }], delivery: 'Ambil di Koperasi', payment: 'COD' },
    { daysAgo: 28, hoursAgo: 8, villageId: SUKOREJO_VILLAGE_ID, items: [{ product_id: pRojolele.id, qty: 1, price: 71000 }], delivery: 'Diantar', payment: 'COD' },
  ];

  return templates.map((t, idx) => {
    const timestamp = new Date(nowMs - t.daysAgo * dayMs - t.hoursAgo * 3600 * 1000).toISOString();
    const total = t.items.reduce((sum, it) => sum + it.qty * it.price, 0);
    return {
      id: `order-demo-${idx + 1}`,
      village_id: t.villageId,
      items: t.items,
      items_count: t.items.length,
      total,
      delivery_method: t.delivery,
      payment_method: t.payment,
      created_at: timestamp,
    };
  });
}

let demoOrderLogs = null;

function readPersistedDemoOrderLogs() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(DEMO_ORDER_LOGS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function writePersistedDemoOrderLogs(logs) {
  demoOrderLogs = logs;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (logs) {
        window.localStorage.setItem(DEMO_ORDER_LOGS_KEY, JSON.stringify(logs));
      } else {
        window.localStorage.removeItem(DEMO_ORDER_LOGS_KEY);
      }
    }
  } catch {
    // ignore
  }
}

export function getDemoOrderLogs() {
  if (demoOrderLogs) return demoOrderLogs;
  const persisted = readPersistedDemoOrderLogs();
  if (persisted) {
    demoOrderLogs = persisted;
    return demoOrderLogs;
  }
  demoOrderLogs = generateInitialDemoOrderLogs();
  return demoOrderLogs;
}

export function resetDemoOrderLogs() {
  writePersistedDemoOrderLogs(null);
  demoOrderLogs = generateInitialDemoOrderLogs();
  return demoOrderLogs;
}

export function recordDemoOrderLog({
  villageId,
  items,
  itemsCount,
  total,
  deliveryMethod,
  paymentMethod,
}) {
  const safeItems = Array.isArray(items)
    ? items.map((it) => ({
        product_id: String(it.product_id ?? it.productId ?? it.id ?? '').trim(),
        qty: Math.max(1, Math.round(Number(it.qty) || 1)),
        price: Math.max(0, Math.round(Number(it.price) || 0)),
      }))
    : [];

  const newLog = {
    id: `order-demo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    village_id: String(villageId).trim(),
    items: safeItems,
    items_count: Math.min(100, Math.max(1, Number(itemsCount) || safeItems.length || 1)),
    total: Math.max(0, Math.round(Number(total) || 0)),
    delivery_method: String(deliveryMethod || 'Diantar').trim(),
    payment_method: String(paymentMethod || 'COD').trim(),
    created_at: new Date().toISOString(),
  };

  const current = getDemoOrderLogs();
  const next = [newLog, ...current];
  writePersistedDemoOrderLogs(next);
  return newLog;
}

export function getDemoVillageStats(
  villageId,
  days = 7,
  { isSuperAdmin = false, now = new Date() } = {}
) {
  const vDays = Math.max(1, Number(days) || 7);
  const nowMs = now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const todayParts = getJakartaDateParts(now);
  const startParts = getJakartaDateParts(new Date(nowMs - (vDays - 1) * dayMs));
  const startDateStr = startParts.dateString;

  const allLogs = getDemoOrderLogs();
  const matchingLogs = allLogs.filter((log) => {
    if (!isSuperAdmin && villageId && log.village_id !== villageId) {
      return false;
    }
    const logDateParts = getJakartaDateParts(new Date(log.created_at));
    return logDateParts.dateString >= startDateStr && logDateParts.dateString <= todayParts.dateString;
  });

  const checkoutCount = matchingLogs.length;
  const totalValue = matchingLogs.reduce((sum, log) => sum + Number(log.total || 0), 0);
  const averageValue = checkoutCount > 0 ? Math.round(totalValue / checkoutCount) : 0;

  // Top 5 Produk
  const productTotals = new Map();
  const allProducts = getAllDemoAdminProducts();
  for (const log of matchingLogs) {
    if (Array.isArray(log.items)) {
      for (const it of log.items) {
        const pid = String(it.product_id ?? it.productId ?? '');
        const qty = Number(it.qty) || 0;
        const price = Number(it.price) || 0;
        const cur = productTotals.get(pid) || {
          product_id: pid,
          qty: 0,
          total_value: 0,
        };
        cur.qty += qty;
        cur.total_value += qty * price;
        productTotals.set(pid, cur);
      }
    }
  }

  const topProducts = Array.from(productTotals.values())
    .map((item) => {
      const found = allProducts.find((p) => p.id === item.product_id);
      return {
        ...item,
        name: found ? found.name : 'Produk Tidak Diketahui',
      };
    })
    .sort((a, b) => b.qty - a.qty || b.total_value - a.total_value)
    .slice(0, 5);

  // Daily stats untuk grafik batang solid primary
  const dailyMap = new Map();
  for (let i = vDays - 1; i >= 0; i--) {
    const d = new Date(nowMs - i * dayMs);
    const parts = getJakartaDateParts(d);
    dailyMap.set(parts.dateString, {
      date: parts.dateString,
      day_label: parts.dayLabel,
      checkout_count: 0,
      total_value: 0,
    });
  }

  for (const log of matchingLogs) {
    const parts = getJakartaDateParts(new Date(log.created_at));
    const entry = dailyMap.get(parts.dateString);
    if (entry) {
      entry.checkout_count += 1;
      entry.total_value += Number(log.total || 0);
    }
  }

  const dailyStats = Array.from(dailyMap.values());

  // Agregat per Koperasi & per Kecamatan (super admin)
  const byVillageMap = new Map();
  const villages = getDemoVillages();
  const subdistricts = getDemoSubdistricts();

  for (const log of matchingLogs) {
    const vid = log.village_id;
    const cur = byVillageMap.get(vid) || { checkout_count: 0, total_value: 0 };
    cur.checkout_count += 1;
    cur.total_value += Number(log.total || 0);
    byVillageMap.set(vid, cur);
  }

  const byVillage = villages
    .filter((v) => (isSuperAdmin ? v.is_active || byVillageMap.has(v.id) : v.id === villageId))
    .map((v) => {
      const stats = byVillageMap.get(v.id) || { checkout_count: 0, total_value: 0 };
      const sub = subdistricts.find((s) => s.id === v.subdistrict_id);
      return {
        village_id: v.id,
        village_name: v.business_name || v.name,
        village_type: v.type,
        village_slug: v.slug,
        subdistrict_name: sub ? sub.name : '',
        subdistrict_slug: sub ? sub.slug : '',
        checkout_count: stats.checkout_count,
        total_value: stats.total_value,
      };
    })
    .sort(
      (a, b) =>
        b.total_value - a.total_value ||
        b.checkout_count - a.checkout_count ||
        a.village_name.localeCompare(b.village_name)
    );

  const bySubdistrictMap = new Map();
  for (const item of byVillage) {
    const subName = item.subdistrict_name;
    if (!subName) continue;
    const cur = bySubdistrictMap.get(subName) || {
      subdistrict_id: item.subdistrict_slug,
      subdistrict_name: subName,
      subdistrict_slug: item.subdistrict_slug,
      checkout_count: 0,
      total_value: 0,
    };
    cur.checkout_count += item.checkout_count;
    cur.total_value += item.total_value;
    bySubdistrictMap.set(subName, cur);
  }

  const bySubdistrict = Array.from(bySubdistrictMap.values()).sort(
    (a, b) =>
      b.total_value - a.total_value ||
      b.checkout_count - a.checkout_count ||
      a.subdistrict_name.localeCompare(b.subdistrict_name)
  );

  return {
    period_days: vDays,
    summary: {
      checkout_count: checkoutCount,
      total_value: totalValue,
      average_value: averageValue,
    },
    top_products: topProducts,
    daily_stats: dailyStats,
    by_village: byVillage,
    by_subdistrict: bySubdistrict,
  };
}

// -------------------------------------------------------------
// S14: CRUD TRANSAKSI / ORDERS (DEMO DATA)
// -------------------------------------------------------------

export const DEMO_ORDERS_KEY = 'kdkmp:demo_orders';
export const ORDER_STATUSES = ['pending', 'processing', 'completed', 'cancelled'];

export function generateInitialDemoOrders(baseDate = new Date()) {
  const nowMs = baseDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const pBerasPandan = GOLOKAN_PRODUCTS[0];
  const pBerasIR64 = GOLOKAN_PRODUCTS[1];
  const pTelurAyam = GOLOKAN_PRODUCTS[2];
  const pMinyak2L = GOLOKAN_PRODUCTS[3];
  const pGula1kg = GOLOKAN_PRODUCTS[4];

  const pRojolele = SUKOREJO_PRODUCTS[0];
  const pMinyakKita = SUKOREJO_PRODUCTS[3];

  const rawOrders = [
    {
      id: 'order-demo-1',
      order_number: 'ORD-20261111-001',
      village_id: GOLOKAN_VILLAGE_ID,
      customer_name: 'Ibu Siti Aminah',
      customer_phone: '081234567890',
      customer_address: 'RT 03 RW 02 No. 15, Dusun Krajan',
      delivery_method: 'Diantar',
      payment_method: 'COD',
      items: [
        { product_id: pBerasPandan.id, name: pBerasPandan.name, qty: 1, price: pBerasPandan.price, unit: pBerasPandan.unit },
        { product_id: pMinyak2L.id, name: pMinyak2L.name, qty: 1, price: pMinyak2L.price, unit: pMinyak2L.unit },
      ],
      note: 'Tolong diantar sebelum jam 12 siang',
      status: 'pending',
      daysAgo: 0,
      hoursAgo: 1,
    },
    {
      id: 'order-demo-2',
      order_number: 'ORD-20261111-002',
      village_id: GOLOKAN_VILLAGE_ID,
      customer_name: 'Pak Budi Santoso',
      customer_phone: '081398765432',
      customer_address: 'RT 01 RW 01 Depan Masjid Jami',
      delivery_method: 'Ambil di Koperasi',
      payment_method: 'Transfer-QRIS',
      items: [
        { product_id: pTelurAyam.id, name: pTelurAyam.name, qty: 2, price: pTelurAyam.price, unit: pTelurAyam.unit },
        { product_id: pGula1kg.id, name: pGula1kg.name, qty: 1, price: pGula1kg.price, unit: pGula1kg.unit },
      ],
      note: '',
      status: 'processing',
      daysAgo: 0,
      hoursAgo: 3,
    },
    {
      id: 'order-demo-3',
      order_number: 'ORD-20261110-003',
      village_id: GOLOKAN_VILLAGE_ID,
      customer_name: 'Ibu Rahmawati',
      customer_phone: '082155554321',
      customer_address: 'Dusun Golokan Krajan Gang 2 No. 8',
      delivery_method: 'Diantar',
      payment_method: 'COD',
      items: [
        { product_id: pMinyak2L.id, name: pMinyak2L.name, qty: 2, price: pMinyak2L.price, unit: pMinyak2L.unit },
      ],
      note: 'Titip di teras jika belum ada orang',
      status: 'completed',
      daysAgo: 1,
      hoursAgo: 4,
    },
    {
      id: 'order-demo-4',
      order_number: 'ORD-20261109-004',
      village_id: GOLOKAN_VILLAGE_ID,
      customer_name: 'Pak Joko Susilo',
      customer_phone: '085611223344',
      customer_address: 'RT 04 RW 02 Gang Mawar',
      delivery_method: 'Diantar',
      payment_method: 'COD',
      items: [
        { product_id: pBerasIR64.id, name: pBerasIR64.name, qty: 1, price: pBerasIR64.price, unit: pBerasIR64.unit },
      ],
      note: 'Dibatalkan pembeli via konfirmasi WhatsApp',
      status: 'cancelled',
      daysAgo: 2,
      hoursAgo: 6,
    },
    {
      id: 'order-demo-5',
      order_number: 'ORD-20261111-005',
      village_id: SUKOREJO_VILLAGE_ID,
      customer_name: 'Ibu Dewi Sartika',
      customer_phone: '081288997766',
      customer_address: 'Dusun Sukorejo Timur RT 02 RW 01',
      delivery_method: 'Diantar',
      payment_method: 'COD',
      items: [
        { product_id: pRojolele.id, name: pRojolele.name, qty: 1, price: pRojolele.price, unit: pRojolele.unit },
      ],
      note: '',
      status: 'pending',
      daysAgo: 0,
      hoursAgo: 2,
    },
    {
      id: 'order-demo-6',
      order_number: 'ORD-20261110-006',
      village_id: SUKOREJO_VILLAGE_ID,
      customer_name: 'Pak Agus Setiawan',
      customer_phone: '081344556677',
      customer_address: 'RT 05 RW 01 Barat Lapangan',
      delivery_method: 'Ambil di Koperasi',
      payment_method: 'Transfer-QRIS',
      items: [
        { product_id: pMinyakKita.id, name: pMinyakKita.name, qty: 3, price: pMinyakKita.price, unit: pMinyakKita.unit },
      ],
      note: 'Diambil sore hari jam 5',
      status: 'completed',
      daysAgo: 1,
      hoursAgo: 5,
    },
    {
      id: 'order-demo-7',
      order_number: 'ORD-20261108-007',
      village_id: GOLOKAN_VILLAGE_ID,
      customer_name: 'Ibu Nurul Hidayah',
      customer_phone: '085799881122',
      customer_address: 'RT 02 RW 03 Dekat Balai Desa',
      delivery_method: 'Diantar',
      payment_method: 'COD',
      items: [
        { product_id: pBerasPandan.id, name: pBerasPandan.name, qty: 2, price: pBerasPandan.price, unit: pBerasPandan.unit },
      ],
      note: '',
      status: 'completed',
      daysAgo: 3,
      hoursAgo: 7,
    },
    {
      id: 'order-demo-8',
      order_number: 'ORD-20261107-008',
      village_id: GOLOKAN_VILLAGE_ID,
      customer_name: 'Pak Slamet Riyadi',
      customer_phone: '082233445566',
      customer_address: 'RT 01 RW 02 Depan Kantor Pos',
      delivery_method: 'Diantar',
      payment_method: 'Transfer-QRIS',
      items: [
        { product_id: pTelurAyam.id, name: pTelurAyam.name, qty: 3, price: pTelurAyam.price, unit: pTelurAyam.unit },
      ],
      note: '',
      status: 'completed',
      daysAgo: 4,
      hoursAgo: 2,
    },
  ];

  return rawOrders.map((o) => {
    const timestamp = new Date(nowMs - o.daysAgo * dayMs - o.hoursAgo * 3600 * 1000).toISOString();
    const total = o.items.reduce((sum, it) => sum + it.qty * it.price, 0);
    return {
      id: o.id,
      order_number: o.order_number,
      village_id: o.village_id,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      customer_address: o.customer_address,
      delivery_method: o.delivery_method,
      payment_method: o.payment_method,
      items: o.items,
      items_count: o.items.length,
      total,
      note: o.note,
      status: o.status,
      created_at: timestamp,
      updated_at: timestamp,
    };
  });
}

let demoOrders = null;

function readPersistedDemoOrders() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(DEMO_ORDERS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function writePersistedDemoOrders(orders) {
  demoOrders = orders;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (orders) {
        window.localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(orders));
      } else {
        window.localStorage.removeItem(DEMO_ORDERS_KEY);
      }
    }
  } catch {
    // ignore
  }
}

export function getDemoOrders({
  villageId = null,
  status = 'all',
  search = '',
  isSuperAdmin = false,
} = {}) {
  if (!demoOrders) {
    const persisted = readPersistedDemoOrders();
    demoOrders = persisted || generateInitialDemoOrders();

    // Sinkronisasi data awal transaksi terdahulu dari order_logs (yang muncul di Ringkasan)
    const logs = getDemoOrderLogs();
    const existingOrderIds = new Set(demoOrders.map((o) => o.id));
    let hasNew = false;
    for (const log of logs) {
      if (!existingOrderIds.has(log.id)) {
        const dt = log.created_at ? new Date(log.created_at) : new Date();
        const dateStr = dt.toISOString().slice(0, 10).replace(/-/g, '');
        const code = String(log.id).slice(-4).toUpperCase();
        demoOrders.push({
          id: log.id,
          order_number: `ORD-${dateStr}-${code}`,
          village_id: log.village_id,
          customer_name: 'Pelanggan WA',
          customer_phone: '',
          customer_address: log.delivery_method === 'Diantar' ? 'Alamat via WhatsApp' : '',
          delivery_method: log.delivery_method || 'Diantar',
          payment_method: log.payment_method || 'COD',
          items: log.items || [],
          items_count: log.items_count || 1,
          total: log.total || 0,
          note: 'Riwayat checkout WhatsApp',
          status: 'pending',
          created_at: log.created_at,
          updated_at: log.created_at,
        });
        existingOrderIds.add(log.id);
        hasNew = true;
      }
    }
    if (hasNew) {
      writePersistedDemoOrders(demoOrders);
    }
  }

  let list = [...demoOrders];

  // Isolasi Koperasi: Jika bukan Super Admin atau jika villageId ditentukan
  if (!isSuperAdmin) {
    if (!villageId) return [];
    list = list.filter((o) => o.village_id === villageId);
  } else if (villageId) {
    list = list.filter((o) => o.village_id === villageId);
  }

  // Filter status
  if (status && status !== 'all') {
    list = list.filter((o) => o.status === status);
  }

  // Filter search
  if (search && String(search).trim()) {
    const q = String(search).trim().toLowerCase();
    list = list.filter(
      (o) =>
        o.customer_name.toLowerCase().includes(q) ||
        o.order_number.toLowerCase().includes(q) ||
        (o.customer_phone && o.customer_phone.includes(q))
    );
  }

  // Urutkan tanggal terbaru
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function createDemoOrder({
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
  orderNumber,
}) {
  if (!villageId) {
    throw new Error('ID Koperasi wajib diisi.');
  }
  if (!customerName || !String(customerName).trim()) {
    throw new Error('Nama pemesan wajib diisi.');
  }

  const safeItems = Array.isArray(items)
    ? items.map((it) => ({
        product_id: String(it.product_id ?? it.productId ?? it.id ?? '').trim(),
        name: String(it.name || 'Produk').trim(),
        qty: Math.max(1, Math.round(Number(it.qty) || 1)),
        price: Math.max(0, Math.round(Number(it.price) || 0)),
        unit: String(it.unit || 'pcs').trim(),
      }))
    : [];

  const computedTotal = total !== undefined
    ? Math.max(0, Math.round(Number(total) || 0))
    : safeItems.reduce((sum, it) => sum + it.qty * it.price, 0);

  const safeCount = itemsCount || safeItems.length || 1;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  const num = orderNumber || `ORD-${dateStr}-${randCode}`;

  const newOrder = {
    id: `order-demo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    order_number: num,
    village_id: String(villageId).trim(),
    customer_name: String(customerName).trim(),
    customer_phone: String(customerPhone || '').trim(),
    customer_address: String(customerAddress || '').trim(),
    delivery_method: String(deliveryMethod || 'Diantar').trim(),
    payment_method: String(paymentMethod || 'COD').trim(),
    items: safeItems,
    items_count: safeCount,
    total: computedTotal,
    note: String(note || '').trim(),
    status: ORDER_STATUSES.includes(status) ? status : 'pending',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const current = getDemoOrders({ isSuperAdmin: true });
  const next = [newOrder, ...current];
  writePersistedDemoOrders(next);
  return newOrder;
}

export function getDemoOrderById(
  orderId,
  { isSuperAdmin = false, villageId = null } = {}
) {
  if (!orderId) return null;
  const all = getDemoOrders({ isSuperAdmin: true });
  const found = all.find((o) => o.id === orderId);
  if (!found) return null;
  if (!isSuperAdmin && villageId && found.village_id !== villageId) {
    return null;
  }
  return found;
}

export function updateDemoOrderStatus(
  orderId,
  status,
  { isSuperAdmin = false, villageId = null } = {}
) {
  if (!ORDER_STATUSES.includes(status)) {
    throw new Error(`Status transaksi tidak valid: ${status}`);
  }

  const all = getDemoOrders({ isSuperAdmin: true });
  const index = all.findIndex((o) => o.id === orderId);
  if (index === -1) {
    throw new Error('Transaksi tidak ditemukan.');
  }

  const existing = all[index];
  if (!isSuperAdmin && villageId && existing.village_id !== villageId) {
    throw new Error('Akses ditolak. Manager hanya dapat mengelola transaksi koperasinya.');
  }

  const updated = {
    ...existing,
    status,
    updated_at: new Date().toISOString(),
  };

  const next = [...all];
  next[index] = updated;
  writePersistedDemoOrders(next);
  return updated;
}

export function updateDemoOrder(
  orderId,
  patch = {},
  { isSuperAdmin = false, villageId = null } = {}
) {
  const all = getDemoOrders({ isSuperAdmin: true });
  const index = all.findIndex((o) => o.id === orderId);
  if (index === -1) {
    throw new Error('Transaksi tidak ditemukan.');
  }

  const existing = all[index];
  if (!isSuperAdmin && villageId && existing.village_id !== villageId) {
    throw new Error('Akses ditolak. Manager hanya dapat mengelola transaksi koperasinya.');
  }

  const updated = {
    ...existing,
    ...patch,
    updated_at: new Date().toISOString(),
  };

  const next = [...all];
  next[index] = updated;
  writePersistedDemoOrders(next);
  return updated;
}

export function deleteDemoOrder(
  orderId,
  { isSuperAdmin = false, villageId = null } = {}
) {
  const all = getDemoOrders({ isSuperAdmin: true });
  const existing = all.find((o) => o.id === orderId);
  if (!existing) {
    throw new Error('Transaksi tidak ditemukan.');
  }

  if (!isSuperAdmin && villageId && existing.village_id !== villageId) {
    throw new Error('Akses ditolak. Manager hanya dapat menghapus transaksi koperasinya.');
  }

  const next = all.filter((o) => o.id !== orderId);
  writePersistedDemoOrders(next);

  // Jika order berasal dari order_logs, hapus juga dari demoOrderLogs agar tidak ter-resinkronisasi
  const allLogs = getDemoOrderLogs();
  if (allLogs.some((l) => l.id === orderId)) {
    const nextLogs = allLogs.filter((l) => l.id !== orderId);
    writePersistedDemoOrderLogs(nextLogs);
  }

  return { success: true };
}

export function resetDemoOrders() {
  writePersistedDemoOrders(null);
  demoOrders = generateInitialDemoOrders();
  return demoOrders;
}





