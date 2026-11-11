-- 0003_api.sql
-- View direktori & RPC katalog publik serta manajemen manager KDKMP (1 Manager = 1 KDKMP)

-- 1. VIEW: V_VILLAGE_DIRECTORY (SECURITY INVOKER)
CREATE OR REPLACE VIEW public.v_village_directory
WITH (security_invoker = true)
AS
SELECT
  v.id,
  v.code,
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
  v.subdistrict_id,
  s.code AS subdistrict_code,
  s.name AS subdistrict_name,
  s.slug AS subdistrict_slug,
  s.sort_order AS subdistrict_sort_order,
  COUNT(p.id)::INTEGER AS product_count,
  COUNT(p.id) FILTER (WHERE p.stock_status <> 'habis')::INTEGER AS ready_product_count,
  v.created_at,
  v.updated_at
FROM public.villages v
JOIN public.subdistricts s ON s.id = v.subdistrict_id
LEFT JOIN public.products p ON p.village_id = v.id
WHERE v.is_active = true
  AND s.is_active = true
GROUP BY
  v.id,
  s.id
ORDER BY
  s.sort_order ASC,
  v.name ASC;

GRANT SELECT ON public.v_village_directory TO anon, authenticated;

-- 2. RPC: GET_VILLAGE_CATALOG(p_kecamatan, p_desa) -> 1 JSONB
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

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'village_id', c.village_id,
        'name', c.name,
        'sort_order', c.sort_order
      )
      ORDER BY c.sort_order ASC, c.name ASC
    ),
    '[]'::jsonb
  )
  INTO v_categories
  FROM public.categories c
  WHERE c.village_id = v_village.id;

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
      'subdistrict_code', v_subdistrict.code,
      'subdistrict_name', v_subdistrict.name,
      'subdistrict_slug', v_subdistrict.slug,
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
      'is_active', v_village.is_active
    ),
    'categories', v_categories,
    'products', v_products
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_village_catalog(TEXT, TEXT) TO anon, authenticated;

-- 3. RPC: ASSIGN_VILLAGE_ADMIN(p_email, p_village) - KHUSUS SUPER ADMIN (1 MANAGER = 1 KDKMP)
CREATE OR REPLACE FUNCTION public.assign_village_admin(
  p_email TEXT,
  p_village UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Akses ditolak. Hanya super admin yang dapat menetapkan manager KDKMP.'
      USING ERRCODE = '42501';
  END IF;

  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'Email wajib diisi.'
      USING ERRCODE = '22023';
  END IF;

  IF p_village IS NULL OR NOT EXISTS (SELECT 1 FROM public.villages WHERE id = p_village) THEN
    RAISE EXCEPTION 'Koperasi tidak ditemukan.'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT u.id, u.email
  INTO v_user_id, v_user_email
  FROM auth.users u
  WHERE lower(u.email) = lower(trim(p_email))
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Email belum terdaftar. Undang via Supabase Dashboard.'
      USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE a.user_id = v_user_id
      AND a.role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Akun super admin tidak dapat ditetapkan sebagai manager KDKMP.'
      USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE a.user_id = v_user_id
      AND a.village_id IS DISTINCT FROM p_village
  ) THEN
    RAISE EXCEPTION 'Akun ini sudah menjadi manager di KDKMP lain (1 manager = 1 KDKMP).'
      USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE a.village_id = p_village
      AND a.user_id IS DISTINCT FROM v_user_id
  ) THEN
    RAISE EXCEPTION 'KDKMP ini sudah memiliki manager aktif (1 KDKMP = 1 manager).'
      USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.admins (user_id, role, village_id)
  VALUES (v_user_id, 'village_admin', p_village)
  ON CONFLICT (user_id) DO UPDATE
    SET role = 'village_admin',
        village_id = EXCLUDED.village_id
    WHERE public.admins.village_id = EXCLUDED.village_id;

  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'email', v_user_email,
    'role', 'village_admin',
    'village_id', p_village
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_village_admin(TEXT, UUID) TO authenticated;

-- 4. RPC: REVOKE_VILLAGE_ADMIN(p_user) - KHUSUS SUPER ADMIN
CREATE OR REPLACE FUNCTION public.revoke_village_admin(
  p_user UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Akses ditolak. Hanya super admin yang dapat mencabut manager KDKMP.'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.admins
  WHERE user_id = p_user
    AND role = 'village_admin';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Manager KDKMP tidak ditemukan.'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_village_admin(UUID) TO authenticated;

-- 5. RPC: LIST_VILLAGE_ADMINS() - KHUSUS SUPER ADMIN (UNTUK S11)
CREATE OR REPLACE FUNCTION public.list_village_admins()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  role VARCHAR(20),
  village_id UUID,
  village_code VARCHAR(15),
  village_name VARCHAR(100),
  business_name VARCHAR(150),
  subdistrict_name VARCHAR(100),
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Akses ditolak. Hanya super admin yang dapat melihat daftar manager.'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    a.user_id,
    u.email::TEXT,
    a.role,
    a.village_id,
    v.code AS village_code,
    v.name AS village_name,
    v.business_name,
    s.name AS subdistrict_name,
    a.created_at
  FROM public.admins a
  JOIN auth.users u ON u.id = a.user_id
  LEFT JOIN public.villages v ON v.id = a.village_id
  LEFT JOIN public.subdistricts s ON s.id = v.subdistrict_id
  WHERE a.role = 'village_admin'
  ORDER BY s.sort_order ASC, v.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_village_admins() TO authenticated;

