-- 0009_fix_products_rls_global_categories.sql
-- Perbaikan RLS Policy products_all_village_admin agar selaras dengan Master Kategori Global
-- Dapat dijalankan langsung di Supabase SQL Editor

-- ============================================================================
-- 1. PERBARUI POLICY PRODUCTS_ALL_VILLAGE_ADMIN PADA TABEL PRODUCTS
-- ============================================================================
-- Pada migrasi 0005, kategori telah diubah menjadi Master Kategori Global
-- (village_id nullable, dipakai bersama seluruh KDKMP se-Kabupaten Gresik).
-- Policy lama di 0002_rls.sql masih mensyaratkan `c.village_id = products.village_id`,
-- sehingga setiap penambahan/perubahan produk dengan kategori master memicu error:
-- "new row violates row-level security policy for table 'products'".
--
-- Policy baru ini menghapus batasan `c.village_id = products.village_id` sehingga
-- manager koperasi (village_admin) bebas memilih kategori dari Master Kategori Global,
-- namun tetap terisolasi hanya dapat mengelola produk milik koperasinya sendiri.

DROP POLICY IF EXISTS "products_all_village_admin" ON public.products;
CREATE POLICY "products_all_village_admin"
  ON public.products
  FOR ALL
  TO authenticated
  USING (public.is_village_admin(village_id))
  WITH CHECK (
    public.is_village_admin(village_id)
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.categories c
        WHERE c.id = products.category_id
      )
    )
  );

-- ============================================================================
-- 2. NORMALISASI VILLAGE_ID PADA TABEL CATEGORIES
-- ============================================================================
-- Pastikan seluruh kategori master memiliki village_id = NULL agar konsisten
-- sebagai kategori global terpusat se-Kabupaten Gresik.

UPDATE public.categories
SET village_id = NULL
WHERE village_id IS NOT NULL;

