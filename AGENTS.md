# AGENTS.md: Katalog Online KDKMP Gresik

Aturan ini otomatis berlaku di setiap sesi. Prompt sesi ada di [PROMPTS_PENGEMBANGAN.md](PROMPTS_PENGEMBANGAN.md), status di [PROGRESS.md](PROGRESS.md), konsep di [KONSEP_MULTI_DESA.md](KONSEP_MULTI_DESA.md).

## 1. Proyek

- Platform e-katalog multi-tenant untuk **KDKMP (Koperasi Desa/Kelurahan Merah Putih)**. 1 tenant = 1 KDKMP di 1 desa atau kelurahan. **1 Manager = 1 KDKMP** (setiap manager hanya dapat mengelola produk, kategori, dan profil 1 KDKMP; 1 KDKMP dikelola 1 manager).
- Pemesanan: keranjang → checkout → pesan WhatsApp ke manager KDKMP tujuan.
- Rollout: **pilot 1 kecamatan** → **1 Kabupaten Gresik** (18 kecamatan, 330 desa, 26 kelurahan = 356 wilayah). Ekspansi = aktifkan kecamatan (`subdistricts.is_active`), tanpa ubah skema.
- Wilayah pilot awal: **Kecamatan Sidayu** (`35.25.09`, slug `sidayu`) · **Desa Golokan** (`35.25.09.2008`, slug `golokan`, `KDKMP Desa Golokan`, URL `/sidayu/golokan`).
- Master wilayah Gresik (Kemendagri `35.25`): `supabase/data/gresik-wilayah.json` & `supabase/seed_wilayah_gresik.sql`.
- Stack: React 19 (JSX) + Vite + Tailwind CSS v4 + react-router v7 + Supabase (DB, Auth, Storage) + **Cloudflare Pages Free**.
- Referensi kode: `C:\Project\solusi.toriq\free\abunawas\` (ProductCard, FilterBar, helpers.js, index.css, `public/logo-kdkmp.jpg`).

## 2. Aturan Wajib

| Kode | Aturan | Implementasi |
|---|---|---|
| R1 | **Zero Fluff** | Tanpa sapaan, tagline, kutipan motivasi, sub-teks penjelas di bawah judul menu/komponen. Tanpa hero besar. Empty state maks. 1 baris + 1 aksi. Helper text form hanya untuk error validasi. Respons chat: hanya hasil. |
| R2 | **Tipografi angka presisi** | Font `Plus Jakarta Sans` (400–800). `tabular-nums` wajib pada Rp, tanggal, jam, %, qty, angka statistik. Render angka hanya lewat `<Money>`, `<Num>`, `<DateText>`. Kolom angka di tabel rata kanan. |
| R3 | **Adaptive, mobile-first** | Class dasar = mobile (360–767 px) → `md:` tablet (768–1023 px) → `lg:` desktop (≥1024 px) → `xl:` lebar. Target sentuh ≥ 44 px di mobile. |
| R4 | **Merah + putih, tanpa gradient** | Semua koperasi memakai warna sama: primary `#d7262f`, background `#ffffff`. Tidak ada warna per tenant. Dilarang: `bg-gradient-*`, `bg-linear-*`, `bg-radial-*`, `bg-conic-*`, `from-*`/`via-*`/`to-*`, `linear-gradient()`, `radial-gradient()`. Hex warna hanya di `src/index.css`. |

## 3. Token Desain (`src/index.css`)

```css
@import "tailwindcss";

@theme {
  --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;

  --color-primary-50:  color-mix(in oklab, #d7262f 6%, white);
  --color-primary-100: color-mix(in oklab, #d7262f 15%, white);
  --color-primary-600: color-mix(in oklab, #d7262f 85%, white);
  --color-primary-700: #d7262f;
  --color-primary-800: color-mix(in oklab, #d7262f 80%, black);
  --color-primary-900: color-mix(in oklab, #d7262f 65%, black);

  --color-surface:   #ffffff;
  --color-surface-2: #ffffff;
  --color-surface-3: #f5f5f4;
  --color-border:    #e7e5e4;
  --color-text:      #1c1917;
  --color-text-2:    #57534e;
  --color-text-3:    #78716c;

  --color-ok-50:   #f0fdf4;  --color-ok-700:   #15803d;
  --color-warn-50: #fefce8;  --color-warn-700: #a16207;
  --color-mute-50: #f5f5f4;  --color-mute-700: #57534e;
}

@layer base {
  body { @apply bg-surface text-text font-sans antialiased; }
}
```

Semantik status (bukan warna brand):

| Status | Token |
|---|---|
| Tersedia, Buka | `ok` |
| Pre-Order | `warn` |
| Habis, Tutup | `mute` |
| Aksi utama, harga, link aktif | `primary` |

## 4. Konvensi

- **Terminologi UI**: "KDKMP", "Koperasi", "Desa" / "Kelurahan" (dari `villages.type`), "Kec.". Jangan memakai "BUMDes" atau "Toko".
- **Bahasa**: teks UI Bahasa Indonesia, singkat. Nama variabel/fungsi bahasa Inggris.
- **Waktu**: semua hitungan jam & tanggal memakai zona `Asia/Jakarta`. Format tanggal `09/11/2026`, jam `07.00`.
- **Uang**: harga `INTEGER` Rupiah, tampil `Rp 72.000`.
- **Route publik**: `/`, `/:kecamatan`, `/:kecamatan/:desa` (`:desa` mencakup kelurahan). Slug terlarang: `admin`, `login`, `api`, `assets`, `dev`.
- **Struktur**: `src/components/ui/` (primitif), `src/features/<fitur>/`, `src/pages/`, `src/admin/` (lazy-loaded), `src/lib/` (logika murni + test), `supabase/migrations/`.
- **Dependensi**: jangan menambah library UI/state/chart. Library baru hanya jika tercantum di prompt sesi.
- **Data**: akses Supabase hanya lewat `src/lib/api.js`. Halaman katalog = 1 RPC. Cache klien TTL 5 menit.

## 5. Batas Free Tier

- **Supabase**: DB 500 MB, Storage 1 GB, egress 5 GB/bulan (bottleneck utama), pause setelah 7 hari tanpa aktivitas.
  - Gambar produk: webp, sisi terpanjang ≤ 800 px, ≤ 100 KB, nama file UUID, `cacheControl: "31536000"`.
- **Cloudflare Pages**: aset statis tanpa batas bandwidth/request, 500 build/bulan, 1 build bersamaan, 20.000 file/deploy, 25 MiB/file.
  - Tanpa Pages Functions (SPA murni).
  - SPA fallback: jangan membuat `404.html` di root output (Pages otomatis menyajikan `index.html`). Jangan pakai rule `/* /index.html 200`.
  - `public/_headers`: `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`.
  - Env `VITE_*` di-inject saat build: set di Settings → Environment variables (Production & Preview).

## 6. Protokol Sesi

1. Baca `PROGRESS.md` (status, handoff terakhir) sebelum mengubah kode.
2. Kerjakan hanya scope sesi yang diminta. Temuan di luar scope → catat di PROGRESS.md, jangan dikerjakan.
3. Verifikasi standar sebelum selesai:
   - `npm run build`, `npm run lint`, `npm run test` (jika ada test).
   - R4: `Get-ChildItem src -Recurse -Include *.jsx,*.js,*.css | Select-String -Pattern 'gradient|bg-linear|bg-radial|bg-conic|\bfrom-\w|\bvia-\w'` = 0 hasil.
   - R3: halaman yang diubah dicek di 360, 768, 1280 px.
   - R2: angka baru memakai `<Money>`/`<Num>`/`<DateText>`.
4. Update `PROGRESS.md`: centang checklist, status di tabel ringkasan, entri Log Handoff, keputusan baru di Log Keputusan.
5. Respons akhir: daftar file dibuat/diubah, hasil verifikasi, blocker. Tanpa pembuka/penutup.

