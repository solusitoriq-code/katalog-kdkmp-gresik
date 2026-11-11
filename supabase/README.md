# Panduan Database Supabase: Katalog Online KDKMP Gresik

## 1. Variabel Environment (`.env`)

Buat file `.env` di root proyek:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

Nilai `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` diambil dari **Supabase Dashboard → Project Settings → API**.

---

## 2. Urutan Migrasi

Jalankan file migrasi secara berurutan di **Supabase Dashboard → SQL Editor** (atau melalui `psql`):

1. [`migrations/0001_schema.sql`](migrations/0001_schema.sql) — Tabel `subdistricts`, `villages`, `categories`, `products`, `admins`, constraint `CHECK`/`UNIQUE`, trigger `updated_at`, dan index.
2. [`migrations/0002_rls.sql`](migrations/0002_rls.sql) — Helper `is_super_admin()`, `is_village_admin(vid)`, trigger proteksi kolom identitas koperasi, dan kebijakan RLS seluruh tabel.
3. [`migrations/0003_api.sql`](migrations/0003_api.sql) — View `v_village_directory` (`security_invoker`), RPC `get_village_catalog(p_kecamatan, p_desa)`, `assign_village_admin(p_email, p_village)`, `revoke_village_admin(p_user)`, dan `list_village_admins()`.
4. [`migrations/0004_storage.sql`](migrations/0004_storage.sql) — Bucket publik `product-images` (maks. 100 KB, `image/webp`, `image/jpeg`, `image/png`) beserta kebijakan RLS folder `{village_id}/{filename}`.
5. [`migrations/0005_master_categories_and_units.sql`](migrations/0005_master_categories_and_units.sql) — Master Kategori Global (`village_id NULL`, unik case-insensitive) dan Master Satuan Produk (`product_units`).
6. [`migrations/0006_super_admin_products_read_only.sql`](migrations/0006_super_admin_products_read_only.sql) — Kebijakan RLS Super Admin untuk meninjau produk (`SELECT`) tanpa batasan tenant.
7. [`migrations/0007_super_admin_passwords_and_manager.sql`](migrations/0007_super_admin_passwords_and_manager.sql) — RPC `super_admin_reset_user_password` dan update `assign_village_admin` dengan pembuatan akun otomatis (`auto_create`).
8. [`migrations/0008_order_logs.sql`](migrations/0008_order_logs.sql) — Tabel analitik checkout WhatsApp `order_logs` (tanpa data pribadi), RLS anon INSERT & SELECT khusus admin, serta RPC `get_village_stats(p_village, p_days)`.

---

## 3. Cara Seed Wilayah & Data Demo Pilot

### Opsi A: Seed Wilayah + Demo Pilot Sekaligus (Disarankan untuk Pengembangan/Pilot)

Jalankan [`seed.sql`](seed.sql) di **SQL Editor**. File ini bersifat idempoten dan mencakup:
- 18 kecamatan & 356 desa/kelurahan Kabupaten Gresik (kode Kemendagri `35.25`), dengan **Kec. Sidayu (`35.25.09`)** aktif.
- Aktivasi **KDKMP Desa Golokan** (`35.25.09.2008`, route `/sidayu/golokan`) beserta 4 kategori & 10 produk sembako.
- Aktivasi **KDKMP Desa Sukorejo** (`35.25.09.2001`, route `/sidayu/sukorejo`, jam operasional `16.00–01.00` lintas tengah malam) beserta 4 kategori & 10 produk sembako.
- Aktivasi 1 koperasi di kecamatan nonaktif (**KDKMP Desa Sukorejo**, Kec. Bungah `35.25.12.2016`) untuk verifikasi isolasi RLS & slug kembar.

### Opsi B: Hanya Seed Master Wilayah Gresik (Produksi Bersih)

Jika hanya ingin mengisi master 18 kecamatan & 356 desa/kelurahan tanpa produk demo, jalankan [`seed_wilayah_gresik.sql`](seed_wilayah_gresik.sql).

---

## 4. Membuat Super Admin Pertama

1. Buka **Supabase Dashboard → Authentication → Users → Add user → Create new user**.
2. Masukkan email (mis. `superadmin@kdkmp-gresik.id`) dan kata sandi, centang **Auto Confirm User**, lalu klik **Create user**.
3. Jalankan SQL berikut di **SQL Editor**:

```sql
INSERT INTO public.admins (user_id, role, village_id)
SELECT id, 'super_admin', NULL
FROM auth.users
WHERE lower(email) = lower('superadmin@kdkmp-gresik.id')
ON CONFLICT (user_id) DO UPDATE
  SET role = 'super_admin',
      village_id = NULL;
```

---

## 5. Membuat Manager KDKMP Desa Golokan (`1 Manager = 1 KDKMP`)

1. Buka **Supabase Dashboard → Authentication → Users → Invite user** (atau **Create new user**).
2. Masukkan email manager (mis. `golokan@kdkmp-gresik.id`).
3. Tetapkan sebagai manager **KDKMP Desa Golokan (`35.25.09.2008`)**:

### Melalui Panel Super Admin (atau RPC saat login sebagai Super Admin)

```sql
SELECT public.assign_village_admin(
  'golokan@kdkmp-gresik.id',
  (SELECT id FROM public.villages WHERE code = '35.25.09.2008')
);
```

### Melalui SQL Editor (sebagai `postgres`)

```sql
INSERT INTO public.admins (user_id, role, village_id)
SELECT
  u.id,
  'village_admin',
  v.id
FROM auth.users u
CROSS JOIN public.villages v
WHERE lower(u.email) = lower('golokan@kdkmp-gresik.id')
  AND v.code = '35.25.09.2008';
```

### Mencabut Akses Manager KDKMP

```sql
SELECT public.revoke_village_admin(
  (SELECT id FROM auth.users WHERE lower(email) = lower('golokan@kdkmp-gresik.id'))
);
```

