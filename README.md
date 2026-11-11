# Katalog Online KDKMP Gresik

Platform e-katalog multi-tenant untuk **KDKMP (Koperasi Desa/Kelurahan Merah Putih)** di Kabupaten Gresik.
- **Multi-tenant**: 1 tenant = 1 KDKMP di 1 desa atau kelurahan.
- **1 Manager = 1 KDKMP**: Setiap pengurus mengelola produk, kategori, dan profil koperasi desanya masing-masing.
- **Pemesanan**: Keranjang belanja modular → formulir checkout ringkas → pengiriman draf pesanan WhatsApp otomatis ke nomor pengurus KDKMP tujuan.
- **Wilayah**: 18 kecamatan, 330 desa, dan 26 kelurahan se-Kabupaten Gresik (Kemendagri `35.25`) dengan ekspansi bertahap melalui aktivasi kecamatan. Pilot awal: **Kecamatan Sidayu** (`35.25.09`), **Desa Golokan** (`35.25.09.2008`, `/sidayu/golokan`).

---

## Tech Stack

- **Frontend**: React 19 (JSX) + Vite 8 + Tailwind CSS v4 + react-router v7 + Lucide React.
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Auth, Storage).
- **Hosting**: Cloudflare Pages Free (SPA native tanpa Pages Functions, bandwidth statis tanpa batas).
- **Testing**: Vitest.

---

## Prinsip Desain (AGENTS.md)

1. **R1 · Zero Fluff**: Tampilan bersih tanpa sapaan, kutipan, tagline, atau hero banner besar. Empty state ringkas maksimal 1 baris + 1 tombol aksi.
2. **R2 · Tipografi Angka Presisi**: Font *Plus Jakarta Sans* dengan kelas `tabular-nums` wajib pada semua nominal Rupiah, jam, tanggal, persen, dan jumlah.
3. **R3 · Adaptive, Mobile-First**: Layout adaptif untuk viewport mobile (360–767 px), tablet (768–1023 px), dan desktop (>= 1024 px). Target sentuh minimal 44 px.
4. **R4 · Merah & Putih, Tanpa Gradient**: Warna seragam identitas merah putih (primary `#d7262f`, surface `#ffffff`). Dilarang menggunakan gradient atau warna acak per koperasi.

---

## Struktur Folder

```text
├── docs/
│   └── SOP_ONBOARDING_KDKMP.md      # Panduan operasional onboarding manager KDKMP baru
├── public/
│   ├── _headers                     # Cache-Control immutable untuk Cloudflare Pages
│   ├── logo-kdkmp.jpg               # Logo resmi KDKMP
│   ├── manifest.json                # Web App Manifest
│   └── robots.txt                   # Kebijakan crawler mesin pencari
├── src/
│   ├── admin/                       # Modul Admin & Super Admin (Lazy-loaded chunk)
│   ├── components/
│   │   ├── ui/                      # Komponen primitif (Button, Sheet, Money, Num, dll.)
│   │   └── PublicLayout.jsx         # Layout publik sticky header
│   ├── config/                      # Konfigurasi aplikasi & reserved slugs
│   ├── features/
│   │   ├── cart/                    # Keranjang belanja & CartContext
│   │   ├── catalog/                 # Katalog produk, filter kategori, StoreHeader
│   │   ├── checkout/                # Checkout Sheet & integrasi pesan WhatsApp
│   │   └── directory/               # Direktori wilayah & filter kecamatan
│   ├── lib/                         # API Supabase, kalkulasi jam, format uang, cache
│   └── pages/                       # Halaman publik (Beranda, Kecamatan, Katalog, 404)
└── supabase/
    ├── data/gresik-wilayah.json     # Master data 18 kecamatan & 356 desa/kelurahan
    ├── migrations/                  # File migrasi SQL skema 0001–0008
    ├── seed_wilayah_gresik.sql      # Seed master wilayah Kemendagri 35.25
    ├── seed.sql                     # Seed gabungan master wilayah + data demo pilot
    └── README.md                    # Dokumentasi migrasi dan tata kelola database
```

---

## Memulai Pengembangan Lokal

### 1. Prasyarat
- Node.js versi 18 atau lebih baru.
- Akun Supabase (opsional jika menggunakan mode demo bawaan).

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)
Salin file `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Isi nilai variabel dari Supabase Dashboard:
```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```
*Catatan: Jika variabel di atas dikosongkan, aplikasi otomatis berjalan dalam **Mode Demo Offline** dengan data simulasi yang tersimpan di `src/lib/demoData.js`.*

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Akses di browser: `http://localhost:5173`.

### 5. Menjalankan Pengujian & Linter
```bash
npm test        # Menjalankan 103 unit tests dengan Vitest
npm run lint    # Memeriksa standar kode dengan ESLint
npm run build   # Membangun bundle produksi ke folder dist/
```

---

## Manajemen Database Supabase

Urutan eksekusi file migrasi di SQL Editor Supabase:
1. `supabase/migrations/0001_schema.sql` — Skema tabel master dan index.
2. `supabase/migrations/0002_rls.sql` — Kebijakan Row Level Security (RLS).
3. `supabase/migrations/0003_api.sql` — View direktori & RPC katalog.
4. `supabase/migrations/0004_storage.sql` — Bucket storage foto produk.
5. `supabase/migrations/0005_master_categories_and_units.sql` — Master kategori global & satuan produk.
6. `supabase/migrations/0006_super_admin_products_read_only.sql` — Kebijakan peninjauan produk Super Admin.
7. `supabase/migrations/0007_super_admin_passwords_and_manager.sql` — Reset sandi & registrasi otomatis manager.
8. `supabase/migrations/0008_order_logs.sql` — Analitik checkout WhatsApp & RPC agregasi.
9. `supabase/seed.sql` — Seed master wilayah Gresik dan data awal pilot Sidayu.

Panduan lengkap mengenai akun Super Admin dan penetapan manager KDKMP dapat dibaca di [`supabase/README.md`](supabase/README.md) dan [`docs/SOP_ONBOARDING_KDKMP.md`](docs/SOP_ONBOARDING_KDKMP.md).

---

## Panduan Deployment (Cloudflare Pages)

1. **Framework Preset**: Pilih `Vite` (atau `None`).
2. **Build Command**: `npm run build`
3. **Build Output Directory**: `dist`
4. **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. **SPA Routing**: Cloudflare Pages secara otomatis menyajikan `index.html` untuk route SPA tanpa memerlukan file `404.html` atau aturan redirect khusus.
6. **Supabase Auth Redirect URL**: Tambahkan domain Cloudflare Pages (mis. `https://<proyek>.pages.dev/**`) pada **Supabase Dashboard → Authentication → URL Configuration**.

---

## Batasan Sistem (Known Limitations)

- **Preview Link WhatsApp**: Pratayang tautan WhatsApp (Open Graph tags per tenant) belum bersifat dinamis karena aplikasi merupakan Single Page Application (SPA) murni tanpa Server-Side Rendering (SSR).
- **Statistik Pesanan**: Metrik analitik mencatat penekanan tombol checkout ke WhatsApp (pembeli diarahkan ke nomor pengurus), bukan konfirmasi transaksi selesai oleh gateway pembayaran.

