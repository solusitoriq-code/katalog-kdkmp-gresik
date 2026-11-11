-- 0005_master_categories_and_units.sql
-- Migrasi Master Kategori Global & Master Satuan Produk (Product Units)
-- Dapat dijalankan langsung di Supabase SQL Editor

-- ============================================================================
-- 1. MASTER SATUAN PRODUK (PRODUCT_UNITS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(30) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index unik case-insensitive untuk nama satuan
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_units_unique_name
  ON public.product_units (LOWER(TRIM(name)));

-- Enable Row Level Security (RLS)
ALTER TABLE public.product_units ENABLE ROW LEVEL SECURITY;

-- Policy RLS:
-- 1. Publik & semua admin dapat membaca daftar satuan
DROP POLICY IF EXISTS "product_units_select_public" ON public.product_units;
CREATE POLICY "product_units_select_public"
  ON public.product_units
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. HANYA Super Admin yang boleh INSERT, UPDATE, DELETE satuan produk
DROP POLICY IF EXISTS "product_units_all_super_admin" ON public.product_units;
CREATE POLICY "product_units_all_super_admin"
  ON public.product_units
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Seed data awal satuan standar (idempoten dengan ON CONFLICT DO NOTHING)
INSERT INTO public.product_units (name, sort_order)
VALUES
  ('kg', 1),
  ('liter', 2),
  ('pcs', 3),
  ('karung', 4),
  ('botol', 5),
  ('ikat', 6),
  ('pack', 7),
  ('dus', 8),
  ('gram', 9),
  ('lusin', 10)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.product_units TO anon, authenticated;
GRANT ALL ON public.product_units TO authenticated;


-- ============================================================================
-- 2. MASTER KATEGORI GLOBAL (GLOBAL CATEGORIES)
-- ============================================================================

-- A. Ubah village_id menjadi NULLABLE pada public.categories
ALTER TABLE public.categories ALTER COLUMN village_id DROP NOT NULL;

-- B. Deduplikasi nama kategori yang sama (jika ada data lama lintas desa)
-- Mengarahkan produk ke ID kategori tertua/kanonikal lalu menghapus duplikat
DO $$
DECLARE
  rec RECORD;
  canonical_id UUID;
BEGIN
  FOR rec IN
    SELECT LOWER(TRIM(name)) AS norm_name
    FROM public.categories
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
  LOOP
    -- Pilih 1 ID tertua sebagai ID kanonikal
    SELECT id INTO canonical_id
    FROM public.categories
    WHERE LOWER(TRIM(name)) = rec.norm_name
    ORDER BY created_at ASC, id ASC
    LIMIT 1;

    -- Arahkan produk yang memakai ID kembar ke ID kanonikal
    UPDATE public.products
    SET category_id = canonical_id
    WHERE category_id IN (
      SELECT id FROM public.categories
      WHERE LOWER(TRIM(name)) = rec.norm_name
        AND id <> canonical_id
    );

    -- Hapus entri kategori kembar sisanya
    DELETE FROM public.categories
    WHERE LOWER(TRIM(name)) = rec.norm_name
      AND id <> canonical_id;
  END LOOP;
END;
$$;

-- C. Hapus constraint lama per (village_id, name) jika masih ada
ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_village_name_unique;

-- D. Buat index unik global case-insensitive pada nama kategori
DROP INDEX IF EXISTS idx_categories_unique_name;
CREATE UNIQUE INDEX idx_categories_unique_name
  ON public.categories (LOWER(TRIM(name)));

-- E. Perbarui RLS Policy pada public.categories:
-- 1. SELECT: Semua pihak (anon, authenticated) dapat melihat master kategori
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. INSERT: Semua admin yang terautentikasi (village_admin & super_admin) boleh menambah kategori baru.
-- Jika nama sudah ada (case-insensitive), database otomatis menolak via index unik.
DROP POLICY IF EXISTS "categories_insert_authenticated" ON public.categories;
CREATE POLICY "categories_insert_authenticated"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. UPDATE & DELETE: HANYA Super Admin.
-- Village Admin dilarang mengubah nama atau menghapus kategori master karena dipakai bersama.
DROP POLICY IF EXISTS "categories_all_village_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_all_super_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_update_super_admin" ON public.categories;
CREATE POLICY "categories_update_super_admin"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "categories_delete_super_admin" ON public.categories;
CREATE POLICY "categories_delete_super_admin"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (public.is_super_admin());


-- ============================================================================
-- 3. PERBARUI RPC GET_VILLAGE_CATALOG
-- Agar toolbar katalog suatu desa HANYA menampilkan kategori yang memiliki produk
-- aktif di desa tersebut (bukan puluhan kategori kosong)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_village_catalog(
  p_kecamatan TEXT,
  p_desa TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_subdistrict RECORD;
  v_village RECORD;
  v_categories JSONB;
  v_products JSONB;
BEGIN
  IF p_kecamatan IS NULL OR p_desa IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT
    s.id,
    s.code,
    s.name,
    s.slug,
    s.sort_order
  INTO v_subdistrict
  FROM public.subdistricts s
  WHERE s.slug = lower(trim(p_kecamatan))
    AND s.is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT
    v.id,
    v.code,
    v.subdistrict_id,
    v.name,
    v.slug,
    v.type,
    v.business_name,
    v.whatsapp_number,
    v.address,
    v.gmaps_url,
    v.logo_url,
    to_char(v.opening_hour, 'HH24:MI') AS opening_hour,
    to_char(v.closing_hour, 'HH24:MI') AS closing_hour,
    v.free_delivery_min,
    v.delivery_note,
    v.is_active,
    v.created_at,
    v.updated_at
  INTO v_village
  FROM public.villages v
  WHERE v.subdistrict_id = v_subdistrict.id
    AND v.slug = lower(trim(p_desa))
    AND v.is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Kategori yang tampil di toolbar katalog adalah kategori master yang
  -- memiliki produk di desa ini
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'sort_order', c.sort_order
      )
      ORDER BY c.sort_order ASC, c.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_categories
  FROM public.categories c
  WHERE EXISTS (
    SELECT 1
    FROM public.products p
    WHERE p.village_id = v_village.id
      AND p.category_id = c.id
  );

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'village_id', p.village_id,
        'category_id', p.category_id,
        'category_name', c.name,
        'name', p.name,
        'description', p.description,
        'price', p.price,
        'original_price', p.original_price,
        'unit', p.unit,
        'stock_status', p.stock_status,
        'image_url', p.image_url,
        'is_featured', p.is_featured,
        'sort_order', p.sort_order,
        'updated_at', p.updated_at
      )
      ORDER BY p.sort_order ASC, p.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_products
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.village_id = v_village.id;

  RETURN jsonb_build_object(
    'subdistrict', jsonb_build_object(
      'id', v_subdistrict.id,
      'code', v_subdistrict.code,
      'name', v_subdistrict.name,
      'slug', v_subdistrict.slug,
      'sort_order', v_subdistrict.sort_order
    ),
    'village', jsonb_build_object(
      'id', v_village.id,
      'code', v_village.code,
      'subdistrict_id', v_village.subdistrict_id,
      'name', v_village.name,
      'slug', v_village.slug,
      'type', v_village.type,
      'business_name', v_village.business_name,
      'whatsapp_number', v_village.whatsapp_number,
      'address', v_village.address,
      'gmaps_url', v_village.gmaps_url,
      'logo_url', v_village.logo_url,
      'opening_hour', v_village.opening_hour,
      'closing_hour', v_village.closing_hour,
      'free_delivery_min', v_village.free_delivery_min,
      'delivery_note', v_village.delivery_note,
      'is_active', v_village.is_active,
      'created_at', v_village.created_at,
      'updated_at', v_village.updated_at
    ),
    'categories', v_categories,
    'products', v_products
  );
END;
$$;

