-- 0006_super_admin_products_read_only.sql
-- Migrasi Batasan Hak Akses: Super Admin hanya dapat melihat produk (Read-Only).
-- Penambahan, perubahan, dan penghapusan produk hanya dapat dilakukan oleh manager KDKMP (owner).
-- Dapat dijalankan langsung di Supabase SQL Editor

-- 1. Hapus policy ALL untuk super_admin pada tabel products
DROP POLICY IF EXISTS "products_all_super_admin" ON public.products;

-- 2. Buat policy SELECT-only untuk super_admin pada tabel products
DROP POLICY IF EXISTS "products_select_super_admin" ON public.products;
CREATE POLICY "products_select_super_admin"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- Catatan:
-- Policy "products_all_village_admin" tetap berlaku untuk manager desa (village_admin)
-- sehingga hanya village_admin yang berhak melakukan INSERT, UPDATE, dan DELETE pada produk miliknya.

