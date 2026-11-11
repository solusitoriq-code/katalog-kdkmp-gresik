# Prompt Pengembangan: Katalog Online KDKMP Gresik

Aturan global, token desain, konvensi, protokol sesi: [AGENTS.md](AGENTS.md) (otomatis terbaca). Status: [PROGRESS.md](PROGRESS.md). Konsep: [KONSEP_MULTI_DESA.md](KONSEP_MULTI_DESA.md).

---

## A. Hasil Cek Konsep (koreksi yang dipakai semua prompt)

| # | Temuan | Dampak | Keputusan |
|---|---|---|---|
| 1 | `villages.primary_color` default hijau + warna per tenant | Melanggar R4 | Kolom dihapus. Semua koperasi: primary `#d7262f`, background `#ffffff`. |
| 2 | Ref `body` `#fafaf9` | Melanggar R4 | `--color-surface: #ffffff`. |
| 3 | Ref badge "Tersedia" memakai `primary-100` | Primary merah → "Tersedia" & "Habis" sama-sama merah | Tersedia `ok`, Pre-Order `warn`, Habis `mute`. |
| 4 | Label 🟢/🔴 + kalimat panjang status tutup | Melanggar R1 | Badge `Buka · 07.00–20.00` / `Tutup · Buka 07.00`. |
| 5 | Ref Navbar subtitle, Hero tagline, Footer "Hubungi kami..." | Melanggar R1 | Tanpa hero. Header ringkas: logo + nama + info operasional. |
| 6 | Ref belum memakai `tabular-nums` | Melanggar R2 | `<Money>`, `<Num>`, `<DateText>` wajib. |
| 7 | Grid ref tanpa breakpoint tablet | R3 belum tegas | `base / md / lg / xl` per halaman. |
| 8 | Konsep menyebut BUMDes | Salah entitas | Entitas = **KDKMP** (Koperasi Desa/Kelurahan Merah Putih). Kolom `villages.type` (`desa`/`kelurahan`). |
| 9 | Pilot 1 kecamatan → kabupaten tanpa mekanisme | Kecamatan non-pilot ikut tampil | `subdistricts.is_active`; 18 kecamatan & 356 desa/kelurahan Gresik (`35.25`) di-seed. Pilot: **Kec. Sidayu** (`35.25.09`), desa awal **Desa Golokan** (`35.25.09.2008`). |
| 10 | RLS hanya `SELECT`; tidak ada pemetaan manager ↔ KDKMP | Manager tidak bisa menulis | Tabel `admins (user_id PK, role, village_id UNIQUE)` → **1 Manager = 1 KDKMP** + `is_super_admin()`, `is_village_admin(uuid)` + policy tulis. |
| 11 | Policy `products`/`categories` `USING (true)` | Data koperasi/kecamatan nonaktif terbaca | Policy `EXISTS` desa aktif **dan** kecamatan aktif. |
| 12 | `villages.slug UNIQUE` global, URL `/:desa` | Di Gresik ada 10 nama desa kembar lintas kecamatan (`sukorejo` 3x, `ngampel`, `sukodono`, `kandangan`, `sumengko`, `kramat`, `banyuurip`, `karangrejo`, `banjarsari`, `sidomukti`) | `UNIQUE (subdistrict_id, slug)`, kode Kemendagri `code UNIQUE`, route `/:kecamatan/:desa`, slug terlarang. |
| 13 | `updated_at` tanpa trigger, status tanpa CHECK, `price NUMERIC` | Data tidak konsisten | Trigger, `CHECK`, harga `INTEGER`. |
| 14 | "Storage & Egress 5 GB" | Storage 1 GB, egress 5 GB/bulan. 5 GB ÷ 100 KB ≈ 50.000 tampilan gambar/bulan | Gambar webp ≤ 800 px ≤ 100 KB, cache 1 tahun, katalog 1 RPC + cache klien. |
| 15 | "Selama ada 1 pengunjung, DB tidak sleep" | Pilot trafik rendah tetap bisa pause | Pantau Usage; ping terjadwal opsional (S13). |
| 16 | Hosting Vercel Hobby | ToS non-komersial | **Cloudflare Pages Free** (komersial boleh, bandwidth statis tanpa batas). |
| 17 | Deep link SPA | 404 saat refresh | Pages otomatis SPA jika tidak ada `404.html`. Tanpa `_redirects /* /index.html 200` (ditolak sebagai infinite loop). |
| 18 | Jam buka pakai waktu lokal pembeli | Salah jika zona beda | `Asia/Jakarta`, dukung tutup lewat tengah malam. |
| 19 | Format WA rata kolom dengan spasi | Font WA proporsional | Daftar item dalam blok ```` ``` ```` (monospace). |
| 20 | Link §8 relatif ke `src/utils/helpers.js` | File ada di proyek referensi | Path absolut `C:\Project\solusi.toriq\free\abunawas\src\...`. |
| 21 | Model A vs B | — | Model A (URL path) + "terakhir dikunjungi" di `localStorage`. |
| 22 | Pembuatan akun admin koperasi | Butuh service role | Undang via Supabase Dashboard → super admin assign via RPC. |
| 23 | `react-router-dom` | v7 cukup `react-router` | `react-router` v7. |
| 24 | OG preview link WA per koperasi | SPA murni tanpa meta dinamis | Known limitation Fase 1. |
| 25 | Kategori terikat per `village_id` | Menghambat standarisasi katalog sekabupaten & duplikasi data | **Master Kategori Global**: `village_id` nullable, nama unik case-insensitive (`UNIQUE(LOWER(TRIM(name)))`). Tambah bisa oleh semua admin, namun **Ubah & Hapus HANYA Super Admin**. Filter katalog publik hanya menampilkan kategori yang memiliki produk aktif di desa bersangkutan (`0005_master_categories_and_units.sql`). |
| 26 | Satuan produk statis hardcode | Admin tidak bisa menambah satuan baru (dus, pack, gram, dll.) secara terpusat | **Master Satuan Produk (`product_units`)**: CRUD (tambah, ubah, hapus) HANYA oleh Super Admin, dibaca dan digunakan oleh semua manager KDKMP (`village_id`) saat mengelola produk. |

---

## B. Strategi Pembagian Sesi

**Dasar pembagian**

1. **Dependensi linear**: skema → data layer → UI publik → keranjang → checkout → admin → QA. Sesi berikut menunggu sesi sebelumnya `DONE`.
2. **1 sesi = 1 vertical slice terverifikasi** (build, test, viewport 360/768/1280).
3. **±10 file per sesi** agar konteks tidak penuh.
4. **Chat baru per sesi**. Konteks dibawa oleh `AGENTS.md` (aturan, otomatis) + `PROGRESS.md` (state). Prompt hanya berisi scope sesi.
5. **Bobot**: Ringan/Sedang → langsung eksekusi. Berat → awali `/plan`, model terbesar.
6. **Konteks penuh / DoD belum tercapai** → `/compact` atau chat baru dengan Template E1.

| ID | Fokus | Bobot | Butuh |
|---|---|---|---|
| S01 | Scaffold & design system | Sedang | — |
| S02 | Skema Supabase, RLS, storage, seed | Berat | — |
| S03 | Data layer & helper | Sedang | S01, S02 |
| S04 | Direktori koperasi | Sedang | S03 |
| S05 | Katalog koperasi | Berat | S03 |
| S06 | Keranjang | Sedang | S05 |
| S07 | Checkout & WhatsApp | Sedang | S06 |
| S08 | Admin: auth & shell | Sedang | S02, S03 |
| S09 | Admin: produk & kategori | Berat | S08 |
| S10 | Admin: pengaturan koperasi | Ringan | S08 |
| S11 | Super admin: wilayah & admin | Sedang | S08 |
| S12 | Statistik checkout (opsional) | Sedang | S07, S08 |
| S13 | QA, performa, deploy Cloudflare Pages | Sedang | semua |

---

## C. Prompt per Sesi

> Buka chat baru → salin 1 blok → kirim. Aturan R1–R4, verifikasi standar, dan update PROGRESS.md sudah diatur `AGENTS.md`.

### S01 · Scaffold & Design System · Sedang

````text
Sesi S01 · Scaffold & Design System.
Baca: PROGRESS.md. Referensi: abunawas/index.html, src/index.css, src/components/*, public/logo-kdkmp.jpg.

Tugas:
1. Scaffold Vite + React 19 (JSX) di root workspace, pertahankan file *.md.
   Deps: react-router, @supabase/supabase-js, lucide-react. Dev: tailwindcss v4, @tailwindcss/vite, eslint, vitest.
2. index.html: lang="id", Plus Jakarta Sans 400–800 (preconnect), theme-color #d7262f.
3. src/index.css = token AGENTS.md §3.
4. src/components/ui/: Button (primary/secondary/ghost), Badge (ok/warn/mute/primary), Input, Select, Sheet (bottom sheet mobile, drawer kanan md+), Skeleton, EmptyState, Money, Num, DateText.
5. PublicLayout: top bar putih sticky border-b, logo KDKMP (salin dari referensi) + "Katalog KDKMP Gresik". Container mx-auto max-w-6xl px-4 md:px-6 lg:px-8.
6. Router: "/", "/:kecamatan", "/:kecamatan/:desa", "/admin/*" (lazy), "*" 404. src/config/reservedSlugs.js.
7. public/_headers (cache /assets/*). Tanpa 404.html, tanpa _redirects, tanpa vercel.json.
8. /dev/ui (hanya DEV): semua komponen UI.

DoD: /dev/ui benar di 360/768/1280 (Sheet: bottom sheet mobile, drawer md+). dist/ tidak berisi 404.html.
````

### S02 · Skema Supabase · Berat

````text
Sesi S02 · Skema Supabase, RLS, Storage, Seed.
Baca: PROGRESS.md, KONSEP_MULTI_DESA.md §5, PROMPTS_PENGEMBANGAN.md §A (poin 1, 8–14, 22), supabase/seed_wilayah_gresik.sql.

Buat:
1. supabase/migrations/0001_schema.sql
   - subdistricts: id, code VARCHAR(10) UNIQUE NOT NULL, name, slug UNIQUE, is_active DEFAULT false, sort_order, created_at.
   - villages: konsep §5 + code VARCHAR(15) UNIQUE NOT NULL; type CHECK IN ('desa','kelurahan'); tanpa primary_color; UNIQUE(subdistrict_id, slug); whatsapp_number VARCHAR(20) NULL CHECK (NOT is_active OR whatsapp_number ~ '^62[0-9]{8,13}$'); free_delivery_min INTEGER DEFAULT 0; is_active DEFAULT false.
   - categories: UNIQUE(village_id, name), sort_order.
   - products: price INTEGER >= 0; original_price NULL atau > price; stock_status CHECK IN ('ready','pre-order','habis'); sort_order; updated_at.
   - admins: user_id PK -> auth.users ON DELETE CASCADE, role CHECK IN ('super_admin','village_admin'), village_id UNIQUE NULL -> villages (wajib untuk village_admin; 1 manager = 1 KDKMP).
   - Trigger updated_at; index products(village_id, category_id), products(village_id, stock_status), villages(subdistrict_id).
2. 0002_rls.sql: is_super_admin(), is_village_admin(vid) (SECURITY DEFINER STABLE, search_path=public).
   Publik baca hanya kecamatan aktif → koperasi aktif → kategori/produknya. Manager KDKMP tulis data 1 KDKMP miliknya saja (tidak boleh ubah code, slug, type, subdistrict_id, is_active). Super admin semua.
3. 0003_api.sql: view v_village_directory (security_invoker) + jumlah produk; RPC get_village_catalog(p_kecamatan, p_desa) -> 1 JSON; RPC assign_village_admin(p_email, p_village) & revoke_village_admin(p_user) khusus super admin (enforce 1 manager = 1 KDKMP).
4. 0004_storage.sql: bucket product-images publik baca; tulis/hapus jika folder pertama = village_id milik manager, atau super admin.
5. supabase/seed.sql:
   - Jalankan/sertakan supabase/seed_wilayah_gresik.sql (18 kecamatan + 356 desa/kelurahan Kemendagri 35.25; Kec. Sidayu 35.25.09 aktif).
   - Aktifkan KDKMP Desa Golokan (35.25.09.2008, Kec. Sidayu, route /sidayu/golokan) sebagai koperasi utama pilot + 1 desa pendamping di Sidayu (mis. Sukorejo 35.25.09.2001, jam tutup lewat tengah malam untuk uji storeHours) + isi whatsapp_number, 4 kategori & 10 produk sembako per koperasi (ready/pre-order/habis, ada harga coret). Aktifkan 1 KDKMP di kecamatan nonaktif (mis. Sukorejo di Kec. Bungah 35.25.12.2016) untuk uji isolasi RLS & slug kembar.
6. supabase/README.md: urutan migrasi, cara seed wilayah & demo, cara membuat super admin pertama & manager KDKMP Desa Golokan, env.

DoD: SQL jalan berurutan tanpa error. Uji anon: koperasi di kecamatan nonaktif = 0 baris, INSERT ditolak. Uji admin A tidak bisa ubah data B. Hasil uji dicatat di PROGRESS.md.
````

### S03 · Data Layer & Helper · Sedang

````text
Sesi S03 · Data Layer & Helper.
Baca: PROGRESS.md, supabase/migrations/0003_api.sql. Referensi: abunawas/src/utils/helpers.js, demoData.js.

Tugas (src/lib/):
1. supabase.js + .env.example. Mode demo otomatis jika env kosong (demoData.js, struktur = output RPC).
2. cache.js: memori + sessionStorage, TTL 5 menit.
3. api.js: getSubdistricts(), getVillageDirectory({ kecamatan, q }), getVillageCatalog(kecamatan, desa).
4. hooks/useQuery.js: { data, error, isLoading, refetch }.
5. format.js: formatRupiah, formatNumber, formatPercent, formatDate, formatTime (Asia/Jakarta). Money/Num/DateText memakai ini.
6. storeHours.js: getStoreStatus(opening, closing, now) → { isOpen, label }, dukung lewat tengah malam.
7. search.js: normalize, multi-token match (name+category+description), comparator ready-dulu (default), termurah, termahal, nama-az.
8. whatsapp.js: normalizePhone, buildOrderMessage({ village, items, buyer, now }) format konsep §6.3 dengan daftar item di blok ```, buildWaUrl.
9. image.js: port driveImageUrl.
10. vitest untuk format, storeHours, search, whatsapp.

DoD: test lulus. Contoh output buildOrderMessage ditempel di handoff PROGRESS.md.
````

### S04 · Direktori Koperasi · Sedang

````text
Sesi S04 · Direktori Koperasi.
Baca: PROGRESS.md, src/lib/api.js, src/components/ui/.

Tugas:
1. "/": judul "Katalog KDKMP Gresik" + input cari (debounce 200 ms). Tanpa hero.
2. Filter kecamatan aktif: chip scroll horizontal (mobile), chip wrap (md), sidebar kiri lg:grid-cols-[240px_1fr] + jumlah koperasi <Num> (lg). Sembunyikan filter jika hanya 1 kecamatan aktif.
3. VillageCard (seluruh kartu = link): logo / inisial di kotak bg-primary-50 text-primary-700, nama koperasi, "Desa X · Kec. Y" atau "Kel. X · Kec. Y", Badge jam buka, jumlah produk <Num>. Grid 1 → md:2 → lg:3.
4. "Terakhir dikunjungi" dari localStorage di atas daftar.
5. "/:kecamatan": daftar terfilter + breadcrumb. Kecamatan tidak ada / nonaktif → 404.
6. Skeleton, EmptyState "Koperasi tidak ditemukan.", error + "Coba lagi". Query ?q=&kec= sinkron URL.

DoD: tidak ada scroll horizontal halaman di 360/768/1280.
````

### S05 · Katalog Koperasi · Berat

````text
Sesi S05 · Katalog Koperasi.
Baca: PROGRESS.md, KONSEP_MULTI_DESA.md §6 (poin 4–5). Referensi: abunawas/src/components/ProductCard.jsx, FilterBar.jsx, ProductGrid.jsx, LoadingSkeleton.jsx.

Tugas:
1. "/:kecamatan/:desa" → getVillageCatalog. Tidak ada / nonaktif → 404. Simpan "terakhir dikunjungi".
2. StoreHeader: logo, nama koperasi, "Desa/Kel. X · Kec. Y", Badge jam buka, baris info (gratis ongkir min. <Money>, delivery_note 1 baris truncate), tombol WA + Maps. Mobile vertikal, md+ logo kiri info kanan.
3. Toolbar: mobile/tablet input cari sticky + chip kategori scroll + Select urutan. lg: kategori sidebar kiri, cari + urutan di atas grid, kolom kanan disisakan untuk keranjang (S06).
4. Section "Unggulan" (is_featured): scroll horizontal mobile, grid lg. Sembunyikan jika kosong.
5. ProductCard: gambar aspect-[4/3] object-contain bg-white lazy + width/height; Badge ok/warn/mute; habis opacity-60; nama line-clamp-2; <Money> bold text-primary-700 + "/ satuan"; harga coret <Money> + diskon <Num>%; tombol "Tambah" (wire S06). Grid 2 → md:3 → lg:3 → xl:4.
6. Query ?q=&kat=&sort= sinkron. document.title = "Nama Koperasi – Katalog KDKMP Gresik".
7. Skeleton, EmptyState, error.

DoD: dicek juga di 1024 px; harga sejajar vertikal antar kartu; koperasi seed tutup-lewat-tengah-malam tampil benar.
````

### S06 · Keranjang · Sedang

````text
Sesi S06 · Keranjang.
Baca: PROGRESS.md, KONSEP_MULTI_DESA.md §6.1, halaman katalog S05.

Tugas:
1. src/features/cart/CartContext.jsx: per village_id, localStorage "cart:{villageId}", snapshot {productId, name, unit, price, qty}.
2. Revalidasi saat katalog dimuat (hapus terhapus/habis, update harga) + notifikasi 1 baris.
3. ProductCard: "Tambah" → stepper [−] qty [+] 44 px. Habis tidak bisa ditambah.
4. Mobile/tablet: FloatingCartBar fixed bawah (safe-area) "<Num> item · <Money>" + "Keranjang" → Sheet. lg: panel sticky kanan w-80, floating bar disembunyikan.
5. Isi: nama, harga satuan, stepper, subtotal rata kanan, total, "Kurang <Money> untuk gratis ongkir" + bar solid primary, "Kosongkan" (konfirmasi), "Checkout" (wire S07).
6. Padding bawah konten agar tidak tertutup floating bar.

DoD: refresh → keranjang tetap; pindah koperasi → keranjang terpisah; angka rata kanan sejajar.
````

### S07 · Checkout & WhatsApp · Sedang

````text
Sesi S07 · Checkout & WhatsApp.
Baca: PROGRESS.md, KONSEP_MULTI_DESA.md §6.2–6.3, src/lib/whatsapp.js, src/lib/storeHours.js.

Tugas:
1. CheckoutSheet: Nama Penerima*, Pengiriman* (Diantar / Ambil di Koperasi), Alamat / Patokan RT-RW* (jika Diantar), Pembayaran* (COD / Transfer-QRIS), Catatan. Label saja, error inline 1 baris.
2. Ingat nama/alamat/pilihan di localStorage (bukan catatan).
3. Ringkasan item + qty + subtotal rata kanan, total <Money>.
4. Koperasi tutup → 1 baris: "Koperasi tutup. Diproses mulai 07.00 WIB." (jam dari data).
5. Kirim → buildOrderMessage → wa.me (window.open, fallback location.href) → dialog "Kosongkan keranjang?".
6. Mobile: bottom sheet penuh, tombol "Kirim via WhatsApp" sticky bawah. md/lg: drawer kanan 420 px.
7. Unit test: Diantar vs Ambil di Koperasi.

DoD: pesan tampil rapi (kolom rata) di WhatsApp Android / Web. Contoh pesan final di handoff.
````

### S08 · Admin: Auth & Shell · Sedang

````text
Sesi S08 · Admin Auth & Layout.
Baca: PROGRESS.md, KONSEP_MULTI_DESA.md §7, supabase/migrations/0001–0002.

Tugas (src/admin/, lazy-loaded):
1. /admin/login (email + password), "Lupa kata sandi" → resetPasswordForEmail, /admin/reset.
2. AuthProvider: session + role dari admins. Tanpa baris admins → "Akun belum terdaftar sebagai admin." + Keluar.
3. Guard /admin/*. village_admin terkunci ke koperasinya. super_admin: Select koperasi di top bar.
4. AdminLayout: mobile bottom nav 4 item (Ringkasan, Produk, Kategori, Pengaturan) 56 px; md rail kiri; lg sidebar 240 px. Super admin + menu "Wilayah". Top bar: nama koperasi + Keluar.
5. /admin Ringkasan: kartu <Num> total produk, tersedia, habis, pre-order. Grid 2 → md:4.

DoD: bundle admin terpisah (cek output build); /admin tanpa login → redirect; login/logout/reset jalan.
````

### S09 · Admin: Produk & Kategori · Berat

````text
Sesi S09 · Admin Produk & Kategori.
Baca: PROGRESS.md, KONSEP_MULTI_DESA.md §7, supabase/migrations/0004_storage.sql.

Tugas:
1. /admin/produk: cari + filter kategori + filter stok. Mobile list kartu (foto, nama, <Money>, saklar stok); md 2 kolom; lg tabel (Foto, Nama, Kategori, Harga kanan, Satuan, Stok, Unggulan, Aksi).
2. Saklar stok & unggulan: optimistic + rollback.
3. Mode "Ubah Harga Cepat": nama + input harga (inputmode numeric, pemisah ribuan live, tabular-nums), 1 Simpan (batch baris berubah).
4. Form produk (Sheet mobile / dialog lg): nama, kategori (pilih dari master global / tambah baru), harga, harga coret, satuan (dinamis dari master product_units, fallback satuan standar), stok, unggulan, deskripsi, foto.
5. Foto: accept="image/*" capture="environment", kompres klien sesuai AGENTS.md §5, upload product-images/{village_id}/{uuid}.webp. Alternatif tempel URL (driveImageUrl). Ganti/hapus → hapus objek lama.
6. Hapus produk: konfirmasi 1 baris.
7. /admin/kategori: lihat master kategori & tambah kategori baru (duplikasi nama ditolak otomatis); ubah & hapus dibatasi khusus super admin.

DoD: uji 2 akun admin (isolasi data & file); ukuran 3 foto HP hasil kompres dicatat.
````

### S10 · Admin: Pengaturan Koperasi · Ringan

````text
Sesi S10 · Pengaturan Koperasi.
Baca: PROGRESS.md, skema villages, komponen upload S09.

Tugas (/admin/pengaturan):
1. Form: nama koperasi, WA (normalizePhone + validasi), alamat, URL Maps, logo (webp persegi 256 px, fallback logo KDKMP), jam buka/tutup, minimal gratis ongkir, catatan pengantaran.
2. Pratinjau StoreHeader: di bawah form (mobile), kolom kanan (lg grid 2 kolom).
3. Kartu "Bagikan Katalog": URL + Salin + QR code (lib qrcode) unduh PNG.
4. Simpan sticky bawah di mobile; toast "Tersimpan.".

DoD: perubahan tercermin di katalog publik setelah refetch.
````

### S11 · Super Admin: Wilayah, Kategori, Satuan & Admin · Sedang

````text
Sesi S11 · Super Admin Wilayah, Kategori & Satuan.
Baca: PROGRESS.md, PROMPTS_PENGEMBANGAN.md §A (poin 9, 12, 22, 25, 26), supabase/migrations/0003_api.sql, supabase/migrations/0005_master_categories_and_units.sql.

Tugas (/admin/wilayah, super_admin):
1. Kecamatan: daftar + jumlah koperasi <Num> + saklar aktif (pilot → ekspansi), tambah/ubah (slug otomatis).
2. Koperasi: daftar per kecamatan + tipe (Desa/Kelurahan) + aktif + jumlah produk <Num> + tanggal dibuat <DateText>. Tambah/ubah: nama desa/kelurahan, tipe, slug (unik per kecamatan, cek reservedSlugs), nama koperasi, WA. Mobile kartu, lg tabel.
3. Admin koperasi: email → assign_village_admin; error "Email belum terdaftar. Undang via Supabase Dashboard."; daftar admin + Cabut (konfirmasi).
4. Master Kategori & Satuan: CRUD master satuan produk (product_units: tambah, ubah, hapus, urutan) dan manajemen master kategori (ubah nama, hapus dengan konfirmasi jika produk terkait jadi tanpa kategori).
5. docs/SOP_ONBOARDING_KDKMP.md: langkah bernomor (undang user → buat koperasi → assign → isi produk → bagikan QR).

DoD: village_admin ditolak di /admin/wilayah (UI + RLS); slug duplikat 1 kecamatan ditolak, beda kecamatan diterima; CRUD satuan & ubah/hapus kategori hanya super admin.
````

### S12 · Statistik Checkout (Opsional) · Sedang

````text
Sesi S12 · Statistik Checkout.
Baca: PROGRESS.md, alur checkout S07, dashboard S08.

Tugas:
1. supabase/migrations/0005_order_logs.sql: order_logs (village_id, items jsonb [{product_id, qty, price}], items_count 1..100, total >= 0, delivery_method, payment_method, created_at). Tanpa data pribadi. RLS: anon INSERT (koperasi aktif); SELECT admin terkait & super admin. RPC get_village_stats(p_village, p_days).
2. Checkout: insert fire-and-forget sebelum buka WA.
3. /admin Ringkasan: periode Hari ini / 7 / 30 hari; kartu Checkout WA <Num>, Nilai <Money>, Rata-rata <Money>; top 5 produk (tabel kanan); grafik batang harian CSS solid primary.
4. Super admin: tabel per koperasi & per kecamatan, urut nilai.
Label metrik "Checkout WA", bukan "Pesanan".

DoD: anon tidak bisa SELECT order_logs.
````

### S13 · QA, Performa, Deploy Cloudflare Pages · Sedang

````text
Sesi S13 · QA, Performa, Deploy.
Baca: PROGRESS.md (handoff, known limitation), PROMPTS_PENGEMBANGAN.md §A (poin 15, 17, 24).

Tugas:
1. Template E3 di seluruh src/, perbaiki semua temuan.
2. Audit responsif semua halaman di 360/768/1024/1280.
3. Aksesibilitas: kontras ≥ 4.5:1, focus ring, label input, aria-label tombol ikon.
4. Performa: split per route, gambar lazy + dimensi, preconnect Supabase. Budget bundle publik ≤ 200 KB gzip, Lighthouse mobile katalog ≥ 90 (Perf & A11y).
5. SEO dasar: title/meta per halaman, robots.txt, manifest (ikon KDKMP).
6. Cloudflare Pages: Git integration, build "npm run build", output "dist", NODE_VERSION, env VITE_* (Production & Preview), verifikasi deep link refresh & header cache. Tunggu konfirmasi user sebelum deploy produksi.
7. Supabase Auth: Site URL & Redirect URLs (domain *.pages.dev + custom domain).
8. Opsional: ping terjadwal anti-pause Supabase (GitHub Actions, mingguan).
9. README.md: setup, env, migrasi, deploy, onboarding (link SOP), known limitation.

DoD: E3 = 0 temuan; skor Lighthouse, ukuran bundle, URL produksi dicatat di PROGRESS.md.
````

---

## D. Template Pendukung

### E1 · Lanjutan

````text
Lanjutkan sesi {SXX}.
Baca: PROGRESS.md bagian {SXX} (checklist & handoff terakhir), PROMPTS_PENGEMBANGAN.md §C prompt {SXX}.
Kerjakan hanya item {SXX} yang belum tercentang.
````

### E2 · Perbaikan Bug

````text
Perbaikan bug.
Gejala: {singkat}. Route: {route}. Viewport: {360/768/1280}. Reproduksi: {1..n}.
Baca: PROGRESS.md, {file terkait}.
Perbaiki akar masalah secara minimal, tambah test bila logika di src/lib/. Catat di Log Bug PROGRESS.md.
Respons: akar masalah (1 kalimat) + file diubah + verifikasi.
````

### E3 · Audit Aturan R1–R4

````text
Audit kepatuhan AGENTS.md §2 di src/.
R4: Get-ChildItem src -Recurse -Include *.jsx,*.js,*.css | Select-String -Pattern 'gradient|bg-linear|bg-radial|bg-conic|\bfrom-\w|\bvia-\w'
R4: Get-ChildItem src -Recurse -Include *.jsx,*.js | Select-String -Pattern '#[0-9a-fA-F]{3,6}\b'
R2: Get-ChildItem src -Recurse -Include *.jsx | Select-String -Pattern 'formatRupiah\(|formatDate\(|formatPercent\(|toLocaleString' (hanya boleh di Money/Num/DateText & src/lib)
R1: tinjau setiap judul h1–h3 & menu: tanpa <p> penjelas, sapaan, tagline, kutipan. Cari kata "BUMDes"/"Toko" (harus 0).
R3: tinjau class sm:/md:/lg: tanpa base mobile; cek 360/768/1280.
Output: tabel (Aturan | File:baris | Temuan | Perbaikan). Perbaiki, ulangi sampai 0 temuan.
````
