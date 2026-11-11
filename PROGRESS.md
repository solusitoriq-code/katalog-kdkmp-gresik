# PROGRESS: Katalog Online KDKMP Gresik

Aturan: [AGENTS.md](AGENTS.md) · Prompt: [PROMPTS_PENGEMBANGAN.md](PROMPTS_PENGEMBANGAN.md) · Konsep: [KONSEP_MULTI_DESA.md](KONSEP_MULTI_DESA.md)

Status: `TODO` · `WIP` · `DONE` · `BLOCKED` · `SKIP`

## Ringkasan

| ID | Fokus | Bobot | Status | Tanggal selesai |
|---|---|---|---|---|
| S01 | Scaffold & design system | Sedang | DONE | 2026-11-09 |
| S02 | Skema Supabase, RLS, storage, seed | Berat | DONE | 2026-11-09 |
| S03 | Data layer & helper | Sedang | DONE | 2026-11-09 |
| S04 | Direktori koperasi | Sedang | DONE | 2026-11-09 |
| S05 | Katalog koperasi | Berat | DONE | 2026-11-09 |
| S06 | Keranjang | Sedang | DONE | 2026-11-09 |
| S07 | Checkout & WhatsApp | Sedang | DONE | 2026-11-09 |
| S08 | Admin: auth & shell | Sedang | DONE | 2026-11-09 |
| S09 | Admin: produk & kategori | Berat | DONE | 2026-11-09 |
| S10 | Admin: pengaturan koperasi | Ringan | DONE | 2026-11-10 |
| S11 | Super admin: wilayah & admin | Sedang | DONE | 2026-11-10 |
| S11b | Super admin: master satuan & kategori global | Ringan | DONE | 2026-11-10 |
| S12 | Statistik checkout (opsional) | Sedang | DONE | 2026-11-11 |
| S13a | QA, performa & finalisasi kode lokal | Sedang | DONE | 2026-11-11 |
| S13b | Setup Git, Cloudflare Pages & Supabase Cloud | Sedang | TODO | |

## Gerbang Aturan (cek di setiap sesi)

- [x] R1 Zero fluff: tanpa sapaan/tagline/kutipan/sub-teks di bawah judul; istilah "KDKMP"/"Koperasi" (0 kata "BUMDes"/"Toko").
- [x] R2 Plus Jakarta Sans + `tabular-nums` di semua angka (via `<Money>`/`<Num>`/`<DateText>`).
- [x] R3 Dicek di 360 / 768 / 1280 px.
- [x] R4 Grep gradient = 0, semua koperasi memakai primary `#d7262f` dan background `#ffffff`.

---

## Checklist per Sesi

### S01 · Scaffold & Design System
- [x] Vite + React 19 di root, file `.md` tetap ada
- [x] Deps: react-router v7, supabase-js, lucide-react, tailwind v4, vitest
- [x] `index.html` (font, theme-color `#d7262f`, lang id)
- [x] `src/index.css` token AGENTS.md §3
- [x] Komponen UI: Button, Badge, Input, Select, Sheet, Skeleton, EmptyState, Money, Num, DateText
- [x] PublicLayout (logo KDKMP + "Katalog KDKMP Gresik") + router + 404 + admin lazy + reservedSlugs
- [x] `public/_headers` (tanpa `404.html`, tanpa `_redirects`, tanpa `vercel.json`)
- [x] `/dev/ui` dicek 360/768/1280
- [x] build + lint lulus, grep gradient = 0

### S02 · Skema Supabase
- [x] Master wilayah Gresik (`supabase/data/gresik-wilayah.json` & `supabase/seed_wilayah_gresik.sql`: 18 kecamatan, 330 desa, 26 kelurahan; Kec. Sidayu aktif)
- [x] `0001_schema.sql` (`code` Kemendagri, `subdistricts.is_active`, `villages.type` desa/kelurahan, tanpa `primary_color`, `admins` 1 manager = 1 KDKMP via `user_id PK` & `village_id UNIQUE`, CHECK, trigger, index)
- [x] `0002_rls.sql` (admins, helper function, policy publik baca kecamatan & koperasi aktif, policy tulis manager 1 KDKMP)
- [x] `0003_api.sql` (v_village_directory, get_village_catalog, assign/revoke manager 1:1)
- [x] `0004_storage.sql` (bucket product-images + policy folder village_id)
- [x] `seed.sql` (sertakan `seed_wilayah_gresik.sql`, aktifkan `KDKMP Desa Golokan` `/sidayu/golokan` + data produk sembako & desa uji RLS)
- [x] `supabase/README.md`
- [x] Uji anon: koperasi di kecamatan nonaktif = 0 baris, INSERT ditolak
- [x] Uji manager A tidak bisa ubah data KDKMP B

### S03 · Data Layer & Helper
- [x] supabase client + mode demo + `.env.example`
- [x] cache TTL 5 menit
- [x] api.js (subdistricts, directory, catalog)
- [x] useQuery hook
- [x] format.js (Rupiah, angka, %, tanggal, jam, WIB)
- [x] storeHours.js (lewat tengah malam)
- [x] search.js (multi-token + 4 urutan)
- [x] whatsapp.js (normalizePhone, pesan monospace, URL)
- [x] image.js (driveImageUrl)
- [x] Unit test lulus

### S04 · Direktori Koperasi
- [x] `/` cari koperasi + filter kecamatan aktif (chip mobile / wrap md / sidebar lg; sembunyikan jika hanya 1 kecamatan aktif)
- [x] VillageCard (Desa/Kel. X · Kec. Y, grid 1 → md:2 → lg:3)
- [x] Terakhir dikunjungi
- [x] `/:kecamatan` + breadcrumb + 404 (jika kecamatan tidak ada / nonaktif)
- [x] Skeleton / empty / error
- [x] Query param sinkron

### S05 · Katalog Koperasi
- [x] `/:kecamatan/:desa` + 404 + simpan terakhir dikunjungi
- [x] StoreHeader (jam buka WIB, ongkir, WA, Maps)
- [x] Toolbar (sticky mobile, sidebar kategori lg) + 4 urutan
- [x] Section Unggulan
- [x] ProductCard (badge ok/warn/mute, harga coret, diskon %)
- [x] Grid 2 → md:3 → lg:3 → xl:4
- [x] Query param + document.title
- [x] Skeleton / empty / error

### S06 · Keranjang
- [x] CartContext per koperasi + persist
- [x] Revalidasi harga/stok
- [x] Stepper qty 44 px
- [x] FloatingCartBar (mobile/tablet) + Sheet
- [x] Panel samping sticky (lg)
- [x] Progress gratis ongkir (bar solid)

### S07 · Checkout & WhatsApp
- [x] CheckoutSheet (Diantar / Ambil di Koperasi) + validasi
- [x] Ingat data pembeli
- [x] Ringkasan angka rata kanan
- [x] Notifikasi koperasi tutup 1 baris
- [x] Buka wa.me + dialog kosongkan keranjang
- [x] Unit test pesan
- [x] Uji di WhatsApp Android / Web

### S08 · Admin: Auth & Shell
- [x] Login, lupa sandi, reset
- [x] AuthProvider + role
- [x] Guard + pemilih koperasi super admin
- [x] AdminLayout (bottom nav / rail / sidebar)
- [x] Ringkasan 4 kartu angka
- [x] Bundle admin terpisah

### S09 · Admin: Produk & Kategori
- [x] Daftar produk (kartu mobile / tabel lg) + filter
- [x] Saklar stok & unggulan optimistic
- [x] Ubah Harga Cepat (batch)
- [x] Form produk
- [x] Upload foto (webp ≤ 800 px ≤ 100 KB, cacheControl 1 tahun)
- [x] Hapus produk + objek storage
- [x] Kategori CRUD + urutan
- [x] Uji isolasi 2 akun admin

### S10 · Admin: Pengaturan Koperasi
- [x] Form profil koperasi + validasi WA
- [x] Logo 256 px webp (fallback logo KDKMP)
- [x] Pratinjau StoreHeader
- [x] Bagikan katalog: salin URL + QR PNG

### S11 · Super Admin: Wilayah & Admin
- [x] CRUD kecamatan + saklar aktif (ekspansi pilot → kabupaten)
- [x] CRUD koperasi + tipe Desa/Kelurahan + slug unik per kecamatan + reservedSlugs
- [x] Assign / revoke admin via RPC
- [x] `docs/SOP_ONBOARDING_KDKMP.md`
- [x] village_admin ditolak di /admin/wilayah

### S11b · Super Admin: Master Satuan & Kategori Global
- [x] Migrasi `0005_master_categories_and_units.sql` (Master kategori global & master satuan `product_units`)
- [x] UI CRUD master satuan produk di `/admin/wilayah?tab=satuan` (Super Admin)
- [x] Integrasi dinamis master satuan di `ProductFormSheet.jsx` (fallback ke standar)
- [x] Proteksi UI & API: Ubah, hapus, dan urutan master kategori hanya Super Admin
- [x] Validasi nama kategori & satuan unik case-insensitive (`Kategori sudah terdaftar.`, `Satuan sudah terdaftar.`)
- [x] Unit test S11b (25 tests di `admin.test.jsx`, total 88 tests lolos)

### S12 · Statistik Checkout (opsional)
- [x] `0005_order_logs.sql` (`0008_order_logs.sql`) + RPC stats
- [x] Insert fire-and-forget di checkout
- [x] Dashboard periode + kartu + top 5 + grafik CSS solid
- [x] Tabel per koperasi & per kecamatan (super admin)
- [x] Anon tidak bisa SELECT

### S13a · QA, Performa & Finalisasi Kode Lokal
- [x] Code splitting route publik di `src/App.jsx` (`HomePage`, `SubdistrictPage`, `VillageCatalogPage`, `NotFoundPage` via `React.lazy()`)
- [x] Bundle publik tanpa warning chunk > 500 kB (chunk dasar `index.js` 283.13 KB / gzip 89.71 KB)
- [x] Aset SEO & PWA dasar (`public/robots.txt`, `public/manifest.json`, icon & OG tags di `index.html`)
- [x] Document title dinamis per rute publik (Beranda, Kecamatan, Katalog, 404)
- [x] Cleanup file migrasi database (hapus duplikat `0005_order_logs.sql`, pertahankan `0008_order_logs.sql`)
- [x] Pembaruan dokumentasi urutan migrasi di `supabase/README.md` (`0001`–`0008`)
- [x] Dokumentasi komprehensif `README.md` di root proyek (setup, env, arsitektur, SOP link, deploy)
- [x] Audit E3 (R1-R4) = 0 temuan, ESLint bersih, 103/103 tests lolos

### S13b · Setup Git, Cloudflare Pages & Supabase Cloud
- [ ] Inisialisasi Git & remote repository
- [ ] Hubungkan Cloudflare Pages (build `npm run build`, output `dist`, headers cache)
- [ ] Set environment variables di Cloudflare Pages (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] Konfigurasi Supabase Auth Site URL & Redirect URLs ke domain `*.pages.dev`
- [ ] Uji deep link SPA (refresh di `/sidayu/golokan` tanpa 404)
- [ ] (Opsional) GitHub Actions ping anti-pause Supabase
- [ ] Deploy produksi: URL ___

---

## Log Keputusan

| Tanggal | Sesi | Keputusan | Alasan |
|---|---|---|---|
| 2026-11-09 | — | Entitas = KDKMP (Koperasi Desa/Kelurahan Merah Putih), tambah `villages.type` (`desa`/`kelurahan`) | Konsep proyek KDKMP, bukan BUMDes |
| 2026-11-09 | — | Rollout pilot 1 kecamatan → 1 kabupaten via `subdistricts.is_active` | Ekspansi tanpa ubah skema |
| 2026-11-09 | — | Semua koperasi memakai primary `#d7262f` & background `#ffffff`; kolom `primary_color` dihapus | R4 |
| 2026-11-09 | — | Hosting memakai Cloudflare Pages Free (SPA native tanpa `404.html` & tanpa `_redirects`) | Boleh komersial, bandwidth statis tanpa batas |
| 2026-11-09 | — | Route `/:kecamatan/:desa`, slug unik per kecamatan | Nama desa/kelurahan bisa sama antar kecamatan |
| 2026-11-09 | — | Status: Tersedia hijau (`ok`), Pre-Order kuning (`warn`), Habis abu (`mute`) | Primary merah bentrok dengan status "Habis" |
| 2026-11-09 | — | Jam buka dihitung dalam `Asia/Jakarta` | Konsistensi WIB |
| 2026-11-09 | — | Aturan global dipindahkan ke `AGENTS.md` | Otomatis terbaca di setiap sesi, prompt lebih pendek |
| 2026-11-09 | — | Ekstrak master wilayah Gresik (`35.25`): 18 kecamatan, 330 desa, 26 kelurahan ke JSON & SQL seed | Semua desa/kelurahan di-seed (`is_active=false`); onboarding cukup aktifkan & isi nomor WA |
| 2026-11-09 | — | Pilot: Kec. Sidayu (`35.25.09`), desa awal Desa Golokan (`35.25.09.2008`, `/sidayu/golokan`) | Ditetapkan user sebagai lokasi permulaan pilot |
| 2026-11-09 | — | Relasi 1 Manager = 1 KDKMP (`admins.user_id PK`, `admins.village_id UNIQUE`) | Setiap 1 manager hanya mengelola data produk & profil untuk 1 KDKMP |
| 2026-11-09 | S02 | Helper RLS memakai `LANGUAGE plpgsql SECURITY DEFINER STABLE` + trigger `protect_village_immutable_fields()` | Mencegah inlining fungsi SQL & rekursi RLS lintas `villages` ↔ `subdistricts`, serta memblokir manager mengubah `code`, `slug`, `type`, `subdistrict_id`, `is_active` |
| 2026-11-09 | S02 | `supabase/seed.sql` menyertakan langsung isi `seed_wilayah_gresik.sql` secara idempoten | Dapat dijalankan langsung di Supabase Dashboard SQL Editor (tanpa meta-command `\i`) maupun `psql` |
| 2026-11-09 | S07 | Container `PublicLayout` dilebarkan ke `max-w-7xl`, grid produk desktop maks. 4 kolom (`lg:grid-cols-3 xl:grid-cols-4`), keranjang desktop memakai drawer kanan (`CartSheet` + tombol toolbar & `FloatingCartBar`) tanpa kolom kanan permanen | Mencegah penyempitan `ProductCard` di desktop (lebar kartu naik dari `~117px` menjadi `~235px` di `1280px` dengan 4 kolom) |
| 2026-11-10 | S11 | Dropdown pemilihan wilayah dan penetapan manager memakai `SearchableSelect` dengan pencarian live tanpa prefix "Kec." | Mempermudah seleksi opsi panjang (18 kecamatan dan ratusan koperasi desa/kelurahan) di mobile & desktop |
| 2026-11-10 | S11 | Master Kategori Global: `village_id` nullable, nama unik case-insensitive (`UNIQUE(LOWER(TRIM(name)))`), tambah bisa oleh semua admin, namun **Ubah & Hapus HANYA Super Admin** | Standarisasi kategori sekabupaten, mencegah duplikasi penamaan, dan melindungi kategori bersama dari perubahan sepihak |
| 2026-11-10 | S11 | Master Satuan Produk (`product_units`): CRUD (tambah, ubah, hapus, urutan) HANYA oleh Super Admin; digunakan seragam oleh seluruh manager KDKMP (`village_id`) | Menghilangkan satuan hardcoded statis sehingga mudah diperluas secara terpusat tanpa mengubah kode aplikasi |
| 2026-11-11 | S12 | Skema `order_logs` tanpa data pribadi (hanya `village_id`, `items jsonb`, `items_count`, `total`, `delivery_method`, `payment_method`), RLS anon INSERT koperasi aktif & SELECT hanya admin/super_admin; RPC `get_village_stats(p_village, p_days)` dalam zona `Asia/Jakarta` | Data agregasi analitik checkout WA anonim dan aman (DoD: anon tidak bisa SELECT order_logs) |
| 2026-11-11 | S12 | Insert order_logs dilakukan secara fire-and-forget tepat sebelum membuka tautan WhatsApp (`openWhatsAppUrl`) | Mencegah pemblokiran popup browser mobile saat checkout WA, sekaligus menjamin pencatatan analitik tanpa menghalangi proses pemesanan pembeli |
| 2026-11-11 | S12 | Metrik Ringkasan menggunakan label "Checkout WA" (bukan "Pesanan"), grafik harian memakai CSS murni solid primary (`bg-primary-700`, tanpa gradient), dan Super Admin breakdown menyajikan peringkat Koperasi & Kecamatan terurut nilai secara presisi | Mematuhi konvensi bisnis (katalog menghubungkan ke WA pembeli bukan gateway pesanan) serta aturan R1, R2, R3, R4 |
| 2026-11-11 | S13a | Code-splitting route publik via `React.lazy()` + pemisahan S13 menjadi S13a (QA & finalisasi kode) dan S13b (setup Git, Cloudflare Pages & Supabase Cloud) | Memangkas chunk publik dasar dari 648 kB menjadi 283 kB (89.7 kB gzip) tanpa warning chunk Vite, serta memisahkan koding lokal dari dependensi setup remote/cloud |

## Log Handoff

Format per sesi:

```text
### SXX · YYYY-MM-DD
Status: DONE/WIP/BLOCKED
File dibuat/diubah:
- path
Verifikasi: build ✓/✗ · lint ✓/✗ · test ✓/✗ · viewport 360/768/1280 ✓/✗ · grep gradient = n
Keputusan baru:
Sisa / blocker:
Catatan untuk sesi berikut:
```

### S01 · 2026-11-09
Status: DONE
File dibuat/diubah:
- `package.json`
- `vite.config.js`
- `eslint.config.js`
- `.gitignore`
- `index.html`
- `public/_headers`
- `public/logo-kdkmp.jpg`
- `src/index.css`
- `src/main.jsx`
- `src/App.jsx`
- `src/config/reservedSlugs.js`
- `src/config/reservedSlugs.test.js`
- `src/components/PublicLayout.jsx`
- `src/components/ui/Button.jsx`
- `src/components/ui/Badge.jsx`
- `src/components/ui/Input.jsx`
- `src/components/ui/Select.jsx`
- `src/components/ui/Sheet.jsx`
- `src/components/ui/Skeleton.jsx`
- `src/components/ui/EmptyState.jsx`
- `src/components/ui/Money.jsx`
- `src/components/ui/Num.jsx`
- `src/components/ui/DateText.jsx`
- `src/components/ui/index.js`
- `src/components/ui/ui.test.jsx`
- `src/pages/HomePage.jsx`
- `src/pages/SubdistrictPage.jsx`
- `src/pages/VillageCatalogPage.jsx`
- `src/pages/NotFoundPage.jsx`
- `src/pages/DevUiPage.jsx`
- `src/admin/AdminApp.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ · lint ✓ · test ✓ (11/11) · viewport 360/768/1280 ✓ · grep gradient = 0
Keputusan baru: —
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S02 dapat dilanjutkan untuk membuat migrasi skema Supabase (`0001`–`0004`), `seed.sql` (menggunakan `seed_wilayah_gresik.sql` + aktivasi `KDKMP Desa Golokan`), serta pengujian RLS.

### S02 · 2026-11-09
Status: DONE
File dibuat/diubah:
- `supabase/migrations/0001_schema.sql`
- `supabase/migrations/0002_rls.sql`
- `supabase/migrations/0003_api.sql`
- `supabase/migrations/0004_storage.sql`
- `supabase/seed.sql`
- `supabase/README.md`
- `PROGRESS.md`
Verifikasi: build ✓ · lint ✓ · test ✓ (11/11) · viewport 360/768/1280 ✓ · grep gradient = 0
Hasil uji PostgreSQL (PGlite):
- Eksekusi berurutan `0001_schema.sql` → `0002_rls.sql` → `0003_api.sql` → `0004_storage.sql` → `seed_wilayah_gresik.sql` → `seed.sql` (termasuk re-run idempoten): 0 error (18 kecamatan, 330 desa, 26 kelurahan).
- Uji `anon`:
  - `SELECT * FROM villages WHERE code = '35.25.12.2016'` (KDKMP Desa Sukorejo di Kec. Bungah nonaktif) = **0 baris**.
  - `get_village_catalog('bungah', 'sukorejo')` = **`NULL`**.
  - `get_village_catalog('sidayu', 'golokan')` = **1 JSON** (`KDKMP Desa Golokan`, 4 kategori, 10 produk).
  - `v_village_directory` = **2 baris** (`Golokan` & `Sukorejo` di Kec. Sidayu, masing-masing `product_count = 10`).
  - `INSERT INTO products` oleh `anon` = **ditolak** (`42501: new row violates row-level security policy for table "products"`).
- Uji isolasi Manager A (`KDKMP Desa Golokan`) terhadap KDKMP B (`KDKMP Desa Sukorejo`):
  - `UPDATE villages`/`products` & `DELETE products` milik KDKMP B = **0 baris terpengaruh**.
  - `INSERT INTO products` ke `village_id` KDKMP B = **ditolak** (`42501`).
  - `UPDATE villages SET slug = ...` pada KDKMP sendiri = **ditolak** (`42501: Manager KDKMP tidak diizinkan mengubah code, slug, type, subdistrict_id, atau is_active.`).
  - Upload ke `storage.objects` `product-images/{golokan_id}/...` = **berhasil**; upload ke `product-images/{sukorejo_id}/...` = **ditolak** (`42501`).
- Uji RPC `assign_village_admin` (1 Manager = 1 KDKMP):
  - Menugaskan manager kedua ke KDKMP yang sudah punya manager = **ditolak** (`23505`).
  - Email belum ada di `auth.users` = **ditolak** (`Email belum terdaftar. Undang via Supabase Dashboard.`).
Keputusan baru:
- Helper RLS memakai `LANGUAGE plpgsql SECURITY DEFINER STABLE` + trigger `protect_village_immutable_fields()`.
- `supabase/seed.sql` menyertakan langsung master wilayah Gresik secara idempoten agar kompatibel dengan Supabase SQL Editor.
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S03 dapat langsung menggunakan struktur output `v_village_directory` dan `get_village_catalog(p_kecamatan, p_desa)` dari `0003_api.sql` untuk `src/lib/api.js` dan `src/lib/demoData.js`.

### S03 · 2026-11-09
Status: DONE
File dibuat/diubah:
- `.env.example`
- `src/lib/supabase.js`
- `src/lib/demoData.js`
- `src/lib/cache.js`
- `src/lib/api.js`
- `src/lib/hooks/useQuery.js`
- `src/hooks/useQuery.js`
- `src/lib/format.js`
- `src/lib/storeHours.js`
- `src/lib/search.js`
- `src/lib/whatsapp.js`
- `src/lib/image.js`
- `src/components/ui/Money.jsx`
- `src/components/ui/Num.jsx`
- `src/components/ui/DateText.jsx`
- `src/lib/format.test.js`
- `src/lib/storeHours.test.js`
- `src/lib/search.test.js`
- `src/lib/whatsapp.test.js`
- `src/lib/dataLayer.test.js`
- `PROGRESS.md`
Verifikasi: build ✓ · lint ✓ · test ✓ (36/36) · viewport 360/768/1280 ✓ · grep gradient = 0
Contoh output `buildOrderMessage`:
````text
Halo KDKMP Desa Golokan, saya ingin memesan:
```
1. Beras Pandan Wangi 5kg (1x)   : Rp 72.000
2. Minyak Goreng Kemasan 2L (2x) : Rp 70.000
3. Gula Pasir Kristal 1kg (1x)   : Rp 17.500
```
Total Belanja : Rp 159.500

*Data Pengiriman:*
- Nama       : Ibu Siti
- Alamat     : RT 03 RW 02 (Samping Posyandu)
- Pengiriman : Diantar ke Rumah
- Pembayaran : Bayar di Tempat (COD)
- Catatan    : Titip di teras jika sedang keluar
- Waktu      : 09/11/2026 09.30 WIB
----------------------------------------
Mohon konfirmasi ketersediaan barang. Terima kasih!
````
Keputusan baru: —
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S04 (Direktori Koperasi) dapat langsung memakai `getSubdistricts`, `getVillageDirectory`, `useQuery`, serta `getStoreStatus`.

### S04 · 2026-11-09
Status: DONE
File dibuat/diubah:
- `src/lib/recentVillages.js`
- `src/lib/recentVillages.test.js`
- `src/lib/hooks/useDebouncedValue.js`
- `src/features/directory/VillageCard.jsx`
- `src/features/directory/SubdistrictFilter.jsx`
- `src/features/directory/VillageGridSkeleton.jsx`
- `src/features/directory/DirectorySearchInput.jsx`
- `src/features/directory/index.js`
- `src/features/directory/directory.test.jsx`
- `src/pages/HomePage.jsx`
- `src/pages/SubdistrictPage.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ · lint ✓ · test ✓ (44/44) · viewport 360/768/1280 ✓ · grep gradient = 0
Keputusan baru: —
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S05 (Katalog Koperasi `/:kecamatan/:desa`) dapat langsung memanggil `saveLastVisitedVillage(village)` dari `src/lib/recentVillages.js` saat katalog koperasi berhasil dimuat.

### S05 · 2026-11-09
Status: DONE
File dibuat/diubah:
- `src/features/catalog/StoreHeader.jsx`
- `src/features/catalog/ProductCard.jsx`
- `src/features/catalog/productUtils.js`
- `src/features/catalog/CatalogToolbar.jsx`
- `src/features/catalog/FeaturedSection.jsx`
- `src/features/catalog/CatalogSkeleton.jsx`
- `src/features/catalog/index.js`
- `src/features/catalog/catalog.test.jsx`
- `src/pages/VillageCatalogPage.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ · lint ✓ · test ✓ (49/49) · viewport 360/768/1024/1280 ✓ (harga & tombol sejajar vertikal, `maxPriceDiffInRow = 0`, `maxBtnDiffInRow = 0`) · grep gradient = 0
Keputusan baru: —
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S06 (Keranjang) dapat langsung menghubungkan `CartContext` ke `onAdd`/`actionSlot` pada `ProductCard` serta `cartPanel` (kolom kanan `lg:w-80`) dan `FloatingCartBar` pada `VillageCatalogPage`.

### S06 · 2026-11-09
Status: DONE
File dibuat/diubah:
- `src/features/cart/cartUtils.js`
- `src/features/cart/CartContext.jsx`
- `src/features/cart/QtyStepper.jsx`
- `src/features/cart/CartContent.jsx`
- `src/features/cart/FloatingCartBar.jsx`
- `src/features/cart/CartSheet.jsx`
- `src/features/cart/CartPanel.jsx`
- `src/features/cart/index.js`
- `src/features/cart/cart.test.jsx`
- `src/features/catalog/ProductCard.jsx`
- `src/features/catalog/CatalogToolbar.jsx`
- `src/pages/VillageCatalogPage.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ · lint ✓ · test ✓ (55/55) · viewport 360/768/1024/1280 ✓ (`horizontalOverflow = false`, `minStepperSize = 44x44`, `maxPriceDiffInRow = 0`, `maxBtnDiffInRow = 0`, `maxRightDiff = 0`, refresh persist ✓, isolasi antar koperasi ✓) · grep gradient = 0
Keputusan baru: —
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S07 (Checkout & WhatsApp) dapat langsung menghubungkan `CheckoutSheet` ke callback `onCheckout` pada `VillageCatalogPage` / `CartPanel` / `CartSheet` menggunakan `buildOrderMessage` dan `buildWaUrl` dari `src/lib/whatsapp.js`.

### S07 · 2026-11-09
Status: DONE
File dibuat/diubah:
- `src/components/PublicLayout.jsx`
- `src/components/ui/Sheet.jsx`
- `src/components/ui/Input.jsx`
- `src/features/catalog/CatalogToolbar.jsx`
- `src/features/catalog/FeaturedSection.jsx`
- `src/features/catalog/CatalogSkeleton.jsx`
- `src/features/catalog/catalog.test.jsx`
- `src/features/cart/FloatingCartBar.jsx`
- `src/features/cart/CartSheet.jsx`
- `src/features/cart/cart.test.jsx`
- `src/features/checkout/checkoutUtils.js`
- `src/features/checkout/CheckoutSheet.jsx`
- `src/features/checkout/index.js`
- `src/features/checkout/checkout.test.jsx`
- `src/pages/VillageCatalogPage.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ · lint ✓ · test ✓ (62/62) · viewport 360/768/1024/1280 ✓ (`horizontalOverflow = false`, mobile full bottom sheet `360x800`, sticky `"Kirim via WhatsApp"` `44px`, drawer `md/lg` `420px`, `cardWidth` desktop `243px`–`317px`, `maxRightDiff = 0`, persist `kdkmp:buyer` tanpa catatan ✓, dialog `"Kosongkan keranjang?"` ✓) · grep gradient = 0
Contoh pesan final (`Diantar`):
````text
Halo KDKMP Desa Golokan, saya ingin memesan:
```
1. Beras Pandan Wangi 5kg (1x)   : Rp 72.000
2. Minyak Goreng Kemasan 2L (2x) : Rp 70.000
3. Gula Pasir Kristal 1kg (1x)   : Rp 17.500
```
Total Belanja : Rp 159.500

*Data Pengiriman:*
- Nama       : Ibu Siti
- Alamat     : RT 03 RW 02 (Samping Posyandu)
- Pengiriman : Diantar ke Rumah
- Pembayaran : Bayar di Tempat (COD)
- Catatan    : Titip di teras jika sedang keluar
- Waktu      : 09/11/2026 09.30 WIB
----------------------------------------
Mohon konfirmasi ketersediaan barang. Terima kasih!
````
Contoh pesan final (`Ambil di Koperasi`):
````text
Halo KDKMP Desa Golokan, saya ingin memesan:
```
1. Beras Pandan Wangi 5kg (1x)   : Rp 72.000
2. Minyak Goreng Kemasan 2L (2x) : Rp 70.000
3. Gula Pasir Kristal 1kg (1x)   : Rp 17.500
```
Total Belanja : Rp 159.500

*Data Pengiriman:*
- Nama       : Pak Budi
- Pengiriman : Ambil di Koperasi
- Pembayaran : Transfer / QRIS
- Waktu      : 09/11/2026 09.30 WIB
----------------------------------------
Mohon konfirmasi ketersediaan barang. Terima kasih!
````
Keputusan baru: —
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S08 (Admin: Auth & Shell) dapat mulai membangun autentikasi Supabase (`src/admin/`) secara lazy-loaded tanpa memengaruhi ukuran bundle publik.

### S08 · 2026-11-09
Status: DONE
File dibuat/diubah:
- `src/lib/demoData.js`
- `src/lib/api.js`
- `src/admin/AuthContext.jsx`
- `src/admin/AdminGuard.jsx`
- `src/admin/AdminLayout.jsx`
- `src/admin/AdminLoginPage.jsx`
- `src/admin/AdminResetPage.jsx`
- `src/admin/AdminSummaryPage.jsx`
- `src/admin/AdminApp.jsx`
- `src/admin/admin.test.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ (`dist/assets/AdminApp-*.js` 17.61 KB / gzip 4.82 KB terpisah) · lint ✓ · test ✓ (69/69) · viewport 360/768/1024/1280 ✓ (`horizontalOverflow = false`, bottom nav 56px, rail `md` 80px, sidebar `lg` 240px, `/admin` tanpa login redirect ke `/admin/login` ✓, login/logout/reset jalan ✓, akun tanpa baris `admins` menampilkan `"Akun belum terdaftar sebagai admin."` + `"Keluar"` ✓) · grep gradient = 0
Keputusan baru: —
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S09 (Admin: Produk & Kategori) dapat langsung memakai `useAuth()` (`activeVillageId`, `activeVillage`, `role`, `session`) dari `src/admin/AuthContext.jsx` untuk mengganti placeholder `/admin/produk` dan `/admin/kategori` pada `src/admin/AdminApp.jsx`.

### S09 · 2026-11-09
Status: DONE
File dibuat/diubah:
- `src/components/ui/Sheet.jsx`
- `src/lib/format.js`
- `src/lib/image.js`
- `src/lib/demoData.js`
- `src/lib/api.js`
- `src/admin/adminProductUtils.js`
- `src/admin/ProductFormSheet.jsx`
- `src/admin/AdminProductsPage.jsx`
- `src/admin/AdminCategoriesPage.jsx`
- `src/admin/AdminApp.jsx`
- `src/admin/admin.test.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ (`dist/assets/AdminApp-*.js` 50.24 KB / gzip 11.88 KB terpisah) · lint ✓ · test ✓ (76/76) · viewport 360/768/1024/1280 ✓ (`horizontalOverflow = false`, mobile 1 kolom kartu, `md` 2 kolom kartu, `lg` tabel 8 kolom Harga rata kanan `<Money>`, Form Produk `Sheet` `360px` mobile / `420px` `md` / `dialog` `576px` `lg`) · grep gradient = 0
Hasil kompresi 3 foto HP ke WebP (`compressImageToWebp`, batas sisi ≤ 800 px, ≤ 100 KB, `cacheControl: "31536000"`):
1. `Foto_HP_1_Beras_Pandan_Wangi_5kg.jpg`: `4000×3000 px` (`535,4 KB` JPEG) → `800×600 px` (**`30,5 KB`** / `31.276 B` `image/webp`)
2. `Foto_HP_2_Minyak_Goreng_2L.jpg`: `3024×4032 px` (`487,8 KB` JPEG) → `600×800 px` (**`31,8 KB`** / `32.524 B` `image/webp`)
3. `Foto_HP_3_Telur_Ayam_1kg.jpg`: `3840×2160 px` (`376,4 KB` JPEG) → `800×450 px` (**`24,7 KB`** / `25.324 B` `image/webp`)
Hasil uji isolasi 2 akun admin (`golokan@kdkmp-gresik.id` vs `sukorejo@kdkmp-gresik.id`):
- Admin 1 (`KDKMP Desa Golokan`) ditolak (`42501: Akses ditolak`) saat mencoba baca/tambah/ubah/hapus produk & kategori milik `KDKMP Desa Sukorejo`, serta ditolak saat mencoba unggah/hapus objek di `product-images/{sukorejo_id}/...`.
- Admin 2 (`KDKMP Desa Sukorejo`) ditolak (`42501: Akses ditolak`) saat mencoba ubah/hapus produk, kategori, atau objek storage di `product-images/{golokan_id}/...`.
- Ganti foto / hapus foto / hapus produk otomatis menghapus objek WebP lama dari `product-images/{village_id}/{uuid}.webp`.
Keputusan baru: —
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S10 (Admin: Pengaturan Koperasi) dapat langsung menggunakan `compressImageToWebp` dari `src/lib/image.js` (dengan `maxSide: 256` untuk logo persegi 256 px) serta `StoreHeader` dari `src/features/catalog/StoreHeader.jsx` untuk pratinjau langsung pada `/admin/pengaturan`.

### S10 · 2026-11-10
Status: DONE
File dibuat/diubah:
- `package.json`
- `src/lib/image.js`
- `src/lib/demoData.js`
- `src/lib/api.js`
- `src/features/catalog/StoreHeader.jsx`
- `src/features/directory/VillageCard.jsx`
- `src/admin/AdminSettingsPage.jsx`
- `src/admin/AdminApp.jsx`
- `src/admin/admin.test.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ (`dist/assets/AdminApp-*.js` 87.01 KB / gzip 24.46 KB terpisah) · lint ✓ · test ✓ (79/79) · viewport 360/768/1024/1280 ✓ (`horizontalOverflow = false`, mobile pratinjau di bawah form + tombol simpan sticky bottom 44 px, `lg` grid 2 kolom kiri form kanan pratinjau sticky, URL katalog + Salin + QR PNG `qrcode` download ✓, kompres WebP persegi 256×256 px ≤ 100 KB, perubahan tercermin di katalog publik setelah refetch ✓) · grep gradient = 0
Keputusan baru:
- `compressImageToWebp` mendukung opsi `square: true` (crop tengah persegi `calculateSquareCrop` lalu scale ke 256×256 px).
- `qrcode` dipaketkan untuk pembuatan QR code PNG client-side (512 px) yang dapat diunduh tanpa dependensi API eksternal.
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S11 (Super Admin: Wilayah & Admin) dapat menggunakan `AdminLayout` dan `AdminGuard` (`SuperAdminGuard`) untuk rute `/admin/wilayah` (manajemen kecamatan, koperasi desa/kelurahan, assign admin KDKMP via RPC).

### S11 · 2026-11-10
Status: DONE
File dibuat/diubah:
- `docs/SOP_ONBOARDING_KDKMP.md`
- `src/components/ui/SearchableSelect.jsx`
- `src/components/ui/index.js`
- `src/components/ui/ui.test.jsx`
- `src/lib/demoData.js`
- `src/lib/api.js`
- `src/admin/AdminWilayahPage.jsx`
- `src/admin/AdminApp.jsx`
- `src/admin/admin.test.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ (`dist/assets/AdminApp-*.js` 117.83 KB / gzip 29.82 KB terpisah) · lint ✓ · test ✓ (86/86) · viewport 360/768/1024/1280 ✓ (`horizontalOverflow = false`, mobile kartu min-h-[44px], lg tabel angka rata kanan tabular-nums, RLS & SuperAdminGuard redirect village_admin ✓, validasi slug unik per kecamatan & tolak reservedSlugs ✓, assign manager 1:1 & revoke dengan konfirmasi dialog ✓, dropdown pencarian SearchableSelect tanpa prefix 'Kec.' & filter pencarian koperasi/kecamatan ✓) · grep gradient = 0
Keputusan baru:
- Komponen `SearchableSelect` dibuat di `src/components/ui/` dengan popup keyboard-accessible, click-outside handling, dan dukungan filter label/sublabel untuk dropdown pilihan panjang (seperti 18 kecamatan dan ratusan koperasi desa/kelurahan).
- Pilihan kecamatan di dropdown disajikan bersih tanpa prefix `"Kec."` (`${s.name} (${s.code})`).
- Manajemen wilayah super admin dibagi menjadi 3 tab responsif: `Kecamatan`, `Koperasi`, dan `Admin Koperasi` dengan dukungan filter per kecamatan dan pencarian cepat.
- Master 18 kecamatan Gresik Kemendagri 35.25 diaktifkan pada mode demo untuk pengujian ekspansi pilot → kabupaten.
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S11b mengeksekusi master satuan produk dan kategori global terpusat.

### S11b · 2026-11-10
Status: DONE
File dibuat/diubah:
- `supabase/migrations/0005_master_categories_and_units.sql`
- `src/lib/demoData.js`
- `src/lib/api.js`
- `src/admin/AdminWilayahPage.jsx`
- `src/admin/AdminCategoriesPage.jsx`
- `src/admin/ProductFormSheet.jsx`
- `src/admin/admin.test.jsx`
- `PROGRESS.md`
- `PROMPTS_PENGEMBANGAN.md`
Verifikasi: build ✓ (`dist/assets/AdminApp-*.js` 127.78 KB / gzip 31.38 KB terpisah) · lint ✓ · test ✓ (88/88) · viewport 360/768/1024/1280 ✓ (`horizontalOverflow = false`, tab Satuan di `/admin/wilayah` mobile cards & lg table rata kanan tabular-nums, CRUD satuan & proteksi ubah/hapus kategori khusus super admin, validasi duplikat nama case-insensitive `Kategori sudah terdaftar.` dan `Satuan sudah terdaftar.` ✓, form produk load master satuan dinamis dengan fallback standar ✓) · grep gradient = 0
Keputusan baru:
- Tab baru **"Satuan"** ditambahkan di `/admin/wilayah` bagi Super Admin untuk mengelola master satuan produk (`product_units`) secara terpusat (CRUD: tambah, ubah, hapus konfirmasi, urut naik/turun).
- Formulir produk (`ProductFormSheet.jsx`) memuat opsi satuan dinamis dari master `product_units` (dengan fallback otomatis ke list standar saat offline/demo).
- Halaman `/admin/kategori` bagi `village_admin` diproteksi read-only untuk aksi ubah dan hapus (hanya Super Admin yang berwenang), dengan tetap mengizinkan penambahan kategori master baru bila belum terdaftar.
- Seluruh penamaan kategori dan satuan divalidasi unik secara global (case-insensitive) sehingga mencegah duplikasi data sekabupaten.
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: Super Admin Data Global & Read-Only Produk.

### S11c (Super Admin Data Global & Read-Only Produk) · 2026-11-10
Status: DONE
File dibuat/diubah:
- `supabase/migrations/0006_super_admin_products_read_only.sql`
- `src/lib/demoData.js`
- `src/lib/api.js`
- `src/admin/AdminLayout.jsx`
- `src/admin/AdminApp.jsx`
- `src/admin/AdminUnitsPage.jsx`
- `src/admin/AdminWilayahPage.jsx`
- `src/admin/AdminSummaryPage.jsx`
- `src/admin/AdminCategoriesPage.jsx`
- `src/admin/AdminProductsPage.jsx`
- `src/admin/admin.test.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ (`dist/assets/AdminApp-*.js` 130.45 KB / gzip 31.85 KB terpisah) · lint ✓ · test ✓ (91/91) · viewport 360/768/1024/1280 ✓ (`horizontalOverflow = false`, menu navigasi mandiri /admin/satuan dengan ikon Scale terproteksi SuperAdminGuard, tab wilayah kembali bersih 3 tab: Kecamatan, Koperasi, Admin Koperasi, header top bar menampilkan teks 'Super Admin KDKMP Gresik', mobile cards nama KDKMP di header kartu produk tanpa tombol aksi, lg table kolom KDKMP + badge stok statis + star unggulan non-interaktif tanpa kolom Aksi, filter KDKMP super admin ✓, ringkasan sekabupaten 22 produk ✓, mutasi produk oleh super_admin ditolak RLS error 42501 ✓) · grep gradient = 0
Keputusan baru:
- CRUD Master Satuan Produk dipisahkan dari `/admin/wilayah` menjadi menu dan halaman mandiri di `/admin/satuan` (`AdminUnitsPage.jsx`) dengan ikon `Scale`, hanya dapat diakses oleh Super Admin. Tab di `/admin/wilayah` kembali bersih menjadi 3 tab wilayah: Kecamatan, Koperasi, dan Admin Koperasi.
- Header top bar admin saat login sebagai Super Admin menampilkan teks **"Super Admin KDKMP Gresik"** menggantikan dropdown pemilihan koperasi.
- Super Admin dapat melihat data produk, ringkasan, dan kategori secara agregat global sekabupaten (tanpa dibatasi 1 desa/koperasi tertentu) dengan badge visual "Semua KDKMP".
- Pada halaman `/admin/produk`, ditambahkan kolom **KDKMP** (menampilkan nama KDKMP desa/kelurahan) pada tabel desktop `lg` dan kartu mobile/tablet, serta dropdown filter KDKMP opsional.
- Super Admin berada dalam mode **read-only** untuk produk: tombol "Tambah Produk", "Ubah Harga Cepat", tombol aksi "Ubah" & "Hapus", serta saklar interaktif stok/unggulan ditiadakan.
- Mutasi produk (tambah, ubah, hapus, harga cepat) hanya dapat dilakukan oleh manager KDKMP (owner). Pemanggilan mutasi produk oleh Super Admin ditolak di tingkat API & PostgreSQL RLS (`supabase/migrations/0006_super_admin_products_read_only.sql` dengan policy SELECT-only `products_select_super_admin`).
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S12 (Statistik Checkout - opsional) dapat membangun skema `order_logs` (`0007_order_logs.sql`), fire-and-forget insert saat checkout sebelum buka wa.me, dan dashboard metrik pesanan harian.

### S11d (Penyesuaian Form Master Satuan seperti Form Kategori) · 2026-11-10
Status: DONE
File dibuat/diubah:
- `src/admin/AdminUnitsPage.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ (`dist/assets/AdminApp-*.js` 130.22 KB / gzip 31.85 KB) · lint ✓ · test ✓ (91/91) · viewport 360/768/1024/1280 ✓ (form tambah satuan selaras dengan form kategori: input full-width + containerClassName flex-1 + button shrink-0, counter satuan dipindahkan ke header) · grep gradient = 0
Keputusan baru:
- Form penambahan master satuan pada `AdminUnitsPage.jsx` diselaraskan 1:1 dengan struktur `AdminCategoriesPage.jsx` (form flex flex-col md:flex-row p-3.5 tanpa wrapper card h2, indikator jumlah satuan ditampilkan di header samping judul).
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: Penyelarasan style list/tabel satuan.

### S11e (Penyelarasan Style List Master Satuan seperti Kategori) · 2026-11-10
Status: DONE
File dibuat/diubah:
- `src/admin/AdminUnitsPage.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ (`dist/assets/AdminApp-*.js` 127.36 KB / gzip 31.69 kB) · lint ✓ · test ✓ (91/91) · viewport 360/768/1024/1280 ✓ (header judul, badge 'Semua KDKMP', counter jumlah satuan, container divide-y divide-border rounded-xl, nomor urut badge h-8 w-8 text-xs font-bold, typography nama text-sm font-semibold, ukuran icon ArrowUp/ArrowDown h-4 w-4, Pencil h-3.5 w-3.5 + teks 'Ubah', Trash2 h-4 w-4, Check/X h-4 w-4 + teks 'Simpan'/'Batal' selaras penuh dengan AdminCategoriesPage.jsx) · grep gradient = 0
Keputusan baru:
- Tampilan daftar satuan pada `AdminUnitsPage.jsx` diganti dari format ganda (mobile cards vs desktop table) menjadi format responsif tunggal terpadu `divide-y divide-border rounded-xl border border-border bg-surface` yang identik dengan `AdminCategoriesPage.jsx`, menyelaraskan seluruh hierarki teks, ukuran badge, tombol, dan ukuran icon.
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S12 (Statistik Checkout - opsional).

### S11f (Sembunyikan Menu Pengaturan untuk Super Admin · Opsi B) · 2026-11-10
Status: DONE
File dibuat/diubah:
- `src/admin/AdminLayout.jsx`
- `src/admin/AdminGuard.jsx`
- `src/admin/AdminApp.jsx`
- `src/admin/AdminUnitsPage.jsx`
- `src/admin/admin.test.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ (`dist/assets/AdminApp-*.js` 127.51 KB / gzip 31.70 kB) · lint ✓ · test ✓ (91/91) · viewport 360/768/1024/1280 ✓ (menu sidebar dan mobile bottom nav super_admin bersih 5 item: Ringkasan, Produk, Kategori, Satuan, Wilayah; rute /admin/pengaturan diproteksi VillageAdminGuard sehingga super_admin otomatis dialihkan ke /admin) · grep gradient = 0
Keputusan baru:
- Sesuai Opsi B, menu Pengaturan Koperasi ditiadakan dari sidebar dan navigasi mobile untuk peran `super_admin`.
- Rute `/admin/pengaturan` dibatasi hanya untuk `village_admin` melalui `VillageAdminGuard` (redirect ke `/admin` jika diakses langsung oleh peran non-village-admin).
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S12 (Statistik Checkout - opsional).

### S11g (Modal Ganti Kata Sandi di Header Admin) · 2026-11-10
Status: DONE
File dibuat/diubah:
- `src/admin/ChangePasswordModal.jsx`
- `src/admin/AdminLayout.jsx`
- `src/admin/AdminApp.jsx`
- `src/admin/admin.test.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ (`dist/assets/AdminApp-*.js` 130.19 KB / gzip 32.16 kB) · lint ✓ · test ✓ (92/92) · viewport 360/768/1024/1280 ✓ (tombol Ganti Sandi di samping Keluar pada header pojok kanan, ikon KeyRound + min-h-11 touch target di mobile 360px tanpa overflow, modal Sheet dialogOnLg judul 'Ganti Kata Sandi', input 'Kata Sandi Baru' + 'Ulangi Kata Sandi Baru', validasi minimal 6 karakter & konfirmasi cocok, tombol Batal + Simpan, feedback sukses 'Kata sandi berhasil diperbarui.' + tombol Tutup) · grep gradient = 0
Keputusan baru:
- Tombol "Ganti Sandi" diletakkan di header pojok kanan `AdminLayout` di samping tombol "Keluar", dapat diakses oleh semua peran admin (`village_admin` maupun `super_admin`).
- Form ganti kata sandi berjalan di dalam modal Sheet khusus (`ChangePasswordModal.jsx`) dengan mode `dialogOnLg` (bottom sheet di mobile, centered dialog di desktop) dengan validasi langsung (Kata Sandi Baru + Konfirmasi) tanpa perlu input password lama.
- Alur lupa password disepakati melalui koordinasi Super Admin (reset manual / acak oleh Super Admin + mekanisme ganti password saat login).
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S12 (Statistik Checkout - opsional) atau implementasi alur Reset Sandi Acak oleh Super Admin di tab Admin Koperasi.

### S11h (Reset Sandi Acak Super Admin · Fitur A & Pembuatan Akun Otomatis · Fitur B & Show/Hide Password) · 2026-11-10
Status: DONE
File dibuat/diubah:
- `src/components/ui/Input.jsx`
- `src/admin/AdminLoginPage.jsx`
- `src/admin/ChangePasswordModal.jsx`
- `src/lib/password.js`
- `src/lib/demoData.js`
- `src/lib/api.js`
- `supabase/migrations/0007_super_admin_passwords_and_manager.sql`
- `src/admin/AdminWilayahPage.jsx`
- `src/admin/admin.test.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ (`dist/assets/AdminApp-*.js` 139.83 KB / gzip 34.27 kB) · lint ✓ · test ✓ (94/94) · viewport 360/768/1024/1280 ✓ (toggle intip kata sandi dengan tombol Eye/EyeOff di halaman login & modal ganti kata sandi; tombol Reset Sandi di tab Admin Koperasi dengan modal generate acak awalan Kdkmp-, tombol Salin Sandi, dan tautan Kirim via WhatsApp; penugasan manager baru otomatis membuat akun auth dan menampilkan kata sandi awal) · grep gradient = 0
Keputusan baru:
- Input kata sandi pada `AdminLoginPage` dan `ChangePasswordModal` dilengkapi tombol aksi toggle intip sandi (`Eye`/`EyeOff`) melalui prop `suffix` pada primitif `Input.jsx`.
- Super Admin dapat mereset kata sandi akun manager KDKMP secara mandiri via tombol "Reset Sandi" di `/admin/wilayah?tab=admin` (`superAdminResetUserPassword`). Sandi baru di-generate secara acak (awalan `Kdkmp-`), dapat disalin langsung, atau dikirimkan draf pesannya via tautan WhatsApp.
- Penugasan manager baru (`handleAssignAdmin` di `AdminWilayahPage.jsx`) kini otomatis membuat akun pengguna (`autoCreate: true`) bila email belum terdaftar, menghasilkan kata sandi acak awal dan menampilkan modal kredensial untuk diteruskan ke pengurus koperasi.
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S12 (Statistik Checkout - opsional).

### S11i (Pagination 1, 2, 3 ... pada /admin/wilayah) · 2026-11-10
Status: DONE
File dibuat/diubah:
- `src/components/ui/Pagination.jsx`
- `src/components/ui/index.js`
- `src/components/ui/ui.test.jsx`
- `src/admin/AdminWilayahPage.jsx`
- `src/admin/AdminApp.jsx`
- `src/admin/admin.test.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ (`dist/assets/AdminApp-*.js` 140.81 KB / gzip 34.56 kB) · lint ✓ · test ✓ (96/96) · viewport 360/768/1024/1280 ✓ (navigasi pagination 1, 2, 3 ... dengan ellipsis, tombol Sebelumnya/Berikutnya, info 'Menampilkan X–Y dari Z data' ber-Num tabular-nums, touch target min-h-11, adaptif tanpa horizontal overflow pada mobile 360px; diterapkan pada Tab Koperasi (356 data), Tab Kecamatan, dan Tab Admin Koperasi) · grep gradient = 0
Keputusan baru:
- Membuat komponen primitif baru `Pagination.jsx` di `src/components/ui/` dengan nomor halaman dinamis `1, 2, 3 ...`, ellipsis, tombol Sebelumnya/Berikutnya, dan ringkasan jumlah data.
- Mengintegrasikan pagination di `/admin/wilayah` untuk seluruh tab (Kecamatan, Koperasi, dan Admin Koperasi) dengan batas 10 data per halaman (`PAGE_SIZE = 10`), membagi 356 KDKMP menjadi 36 halaman.
- Halaman otomatis kembali ke 1 (`page = 1`) saat pengguna mengubah filter kecamatan atau memasukkan kata kunci pencarian.
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S11j (Pagination pada Produk, Kategori, Satuan).

### S11j (Pagination pada /admin/produk, /admin/kategori, dan /admin/satuan) · 2026-11-10
Status: DONE
File dibuat/diubah:
- `src/admin/AdminProductsPage.jsx`
- `src/admin/AdminCategoriesPage.jsx`
- `src/admin/AdminUnitsPage.jsx`
- `src/admin/AdminApp.jsx`
- `src/admin/admin.test.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ (`dist/assets/AdminApp-*.js` 141.97 KB / gzip 34.94 kB) · lint ✓ · test ✓ (97/97) · viewport 360/768/1024/1280 ✓ (Pagination 10 data/halaman pada daftar produk mobile cards & desktop table serta mode Ubah Harga Cepat; pagination kategori dengan penyesuaian nomor urut dan reordering naik/turun berbasis absolute index; pagination master satuan produk dengan penyesuaian nomor urut dan reordering naik/turun berbasis absolute index; reset otomatis ke halaman 1 saat pencarian/filter diubah) · grep gradient = 0
Keputusan baru:
- Menerapkan komponen `Pagination` dengan `PAGE_SIZE = 10` pada `/admin/produk`, `/admin/kategori`, dan `/admin/satuan`.
- Pada `AdminProductsPage.jsx`, pagination membungkus daftar produk (tampilan mobile card list & desktop table) dan form `quickPriceMode` ("Ubah Harga Cepat"). Halaman otomatis reset ke 1 saat filter KDKMP, filter kategori, filter stok, atau pencarian diubah.
- Pada `AdminCategoriesPage.jsx` dan `AdminUnitsPage.jsx`, penomoran urut (`<Num value={absoluteIndex + 1} />`) dan batas tombol urut naik/turun dihitung menggunakan indeks absolut `(page - 1) * PAGE_SIZE + idx` sehingga konsisten lintas halaman.
- `AdminApp.jsx` menambahkan prop `initialProductPage`, `initialCategoryPage`, dan `initialUnitPage` untuk memudahkan inisialisasi dan pengujian otomatis.
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S12 (Statistik Checkout - opsional).

### S12 · 2026-11-11
Status: DONE
File dibuat/diubah:
- `supabase/migrations/0005_order_logs.sql`
- `supabase/migrations/0008_order_logs.sql`
- `src/lib/demoData.js`
- `src/lib/api.js`
- `src/features/checkout/CheckoutSheet.jsx`
- `src/admin/AdminSummaryPage.jsx`
- `src/admin/AdminApp.jsx`
- `src/admin/admin.test.jsx`
- `PROGRESS.md`
Verifikasi: build ✓ (`dist/assets/AdminApp-*.js` 152.59 KB / gzip 36.53 kB) · lint ✓ · test ✓ (103/103) · viewport 360/768/1024/1280 ✓ (periode Hari ini / 7 Hari / 30 Hari; 3 kartu metrik Checkout WA <Num>, Nilai <Money>, Rata-rata <Money>; grafik batang harian CSS solid primary bg-primary-700 tanpa gradient; tabel Top 5 Produk angka rata kanan; tabel peringkat Super Admin per koperasi & per kecamatan urut nilai; fire-and-forget order log sebelum buka WhatsApp tanpa data pribadi; DoD anon tidak bisa SELECT order_logs ✓) · grep gradient = 0
Keputusan baru:
- Skema `order_logs` tanpa data pribadi (hanya `village_id`, `items jsonb`, `items_count`, `total`, `delivery_method`, `payment_method`), RLS anon INSERT koperasi aktif & SELECT hanya admin/super_admin; RPC `get_village_stats(p_village, p_days)` dalam zona `Asia/Jakarta`.
- Insert `order_logs` dilakukan secara fire-and-forget tepat sebelum membuka tautan WhatsApp (`openWhatsAppUrl`) agar tidak memicu popup blocker browser mobile dan tidak menghalangi checkout pengguna.
- Label metrik konsisten menggunakan "Checkout WA" (bukan "Pesanan").
- Grafik checkout WA harian menggunakan CSS solid primary (`bg-primary-700`) tanpa gradient untuk kepatuhan penuh aturan R4.
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S13a (QA, Performa & Finalisasi Kode Lokal) dilanjutkan S13b (Setup Git, Cloudflare Pages & Supabase Cloud).

### S13a · 2026-11-11
Status: DONE
File dibuat/diubah:
- `src/App.jsx`
- `src/pages/HomePage.jsx`
- `src/pages/SubdistrictPage.jsx`
- `src/pages/NotFoundPage.jsx`
- `public/robots.txt`
- `public/manifest.json`
- `index.html`
- `supabase/migrations/0005_order_logs.sql` (dihapus)
- `supabase/migrations/0008_order_logs.sql`
- `supabase/README.md`
- `README.md`
- `PROGRESS.md`
Verifikasi: build ✓ (`dist/assets/index-*.js` 283.13 KB / gzip 89.71 kB, `AdminApp-*.js` 152.62 KB / gzip 36.55 kB, 0 warning chunk > 500 kB) · lint ✓ · test ✓ (103/103) · viewport 360/768/1024/1280 ✓ · grep gradient = 0 · E3 = 0 temuan
Keputusan baru:
- Code-splitting route publik via `React.lazy()` memangkas bundle awal `index.js` dari 648.55 kB ke 283.13 kB (gzip 89.71 kB).
- Pemisahan file SEO dan PWA dasar (`robots.txt`, `manifest.json`, icon, OG tags) dan eliminasi file migrasi ganda `0005_order_logs.sql`.
- Penambahan dokumentasi root `README.md` lengkap beserta SOP dan panduan setup Supabase.
Sisa / blocker: Tidak ada
Catatan untuk sesi berikut: S13b (Setup Git remote, Cloudflare Pages Free, konfigurasi Supabase Auth URL, dan verifikasi deep link SPA produksi).

## Log Bug

| Tanggal | Route | Gejala | Akar masalah | Status |
|---|---|---|---|---|
| 2026-11-09 | `/admin/produk` | Tombol `Batal` & `Simpan Produk` pada modal Tambah/Ubah Produk di desktop (`lg`) melayang di tengah modal dan menutupi form | Class `sticky bottom-0` pada footer `Sheet` melekat ke koordinat viewport sebelum transform `lg:-translate-y-1/2` karena kontainer dialog belum `overflow-hidden` | DONE (`shrink-0` pada header/footer + `min-h-0 flex-1 overflow-y-auto` pada body + `overflow-hidden` pada dialog) |

## Known Limitation

- Preview link WhatsApp (OG) per koperasi belum dinamis (SPA murni).
- Statistik = klik "Checkout WA", bukan pesanan terkonfirmasi.
