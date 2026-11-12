-- 0011_products_barcode.sql
-- Menambahkan kolom barcode pada tabel products untuk pencarian cepat & scanner di kasir/admin KDKMP

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(village_id, barcode);

-- Update get_village_catalog agar mengembalikan field barcode produk (parameter tetap p_kecamatan, p_desa)
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
        'barcode', p.barcode,
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
