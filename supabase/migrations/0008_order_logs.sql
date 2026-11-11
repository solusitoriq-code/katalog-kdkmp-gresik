-- 0008_order_logs.sql
-- Skema Tabel order_logs dan RPC get_village_stats untuk Statistik Checkout WA
-- Tanpa data pribadi (pembeli), anon INSERT hanya untuk koperasi aktif, SELECT admin & super admin.

-- 1. TABEL ORDER_LOGS
CREATE TABLE IF NOT EXISTS public.order_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  items_count INTEGER NOT NULL CHECK (items_count >= 1 AND items_count <= 100),
  total INTEGER NOT NULL CHECK (total >= 0),
  delivery_method VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_order_logs_items_is_array CHECK (jsonb_typeof(items) = 'array')
);

-- Index untuk performa agregasi statistik
CREATE INDEX IF NOT EXISTS idx_order_logs_village_created ON public.order_logs(village_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_logs_created_at ON public.order_logs(created_at DESC);

-- 2. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.order_logs ENABLE ROW LEVEL SECURITY;

-- Policy INSERT: anon & authenticated hanya untuk koperasi aktif di kecamatan aktif
DROP POLICY IF EXISTS "order_logs_insert_public" ON public.order_logs;
CREATE POLICY "order_logs_insert_public"
  ON public.order_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.villages v
      JOIN public.subdistricts s ON s.id = v.subdistrict_id
      WHERE v.id = order_logs.village_id
        AND v.is_active = true
        AND s.is_active = true
    )
  );

-- Policy SELECT: hanya village_admin terkait atau super_admin. Anon TIDAK BISA SELECT.
DROP POLICY IF EXISTS "order_logs_select_admin" ON public.order_logs;
CREATE POLICY "order_logs_select_admin"
  ON public.order_logs
  FOR SELECT
  TO authenticated
  USING (
    public.is_village_admin(village_id)
    OR public.is_super_admin()
  );

-- 3. RPC GET_VILLAGE_STATS
CREATE OR REPLACE FUNCTION public.get_village_stats(
  p_village UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_days INTEGER;
  v_start_time TIMESTAMPTZ;
  v_checkout_count BIGINT := 0;
  v_total_value BIGINT := 0;
  v_average_value BIGINT := 0;
  v_top_products JSONB := '[]'::jsonb;
  v_daily_stats JSONB := '[]'::jsonb;
  v_by_village JSONB := '[]'::jsonb;
  v_by_subdistrict JSONB := '[]'::jsonb;
BEGIN
  -- Pemeriksaan otorisasi: caller harus super admin atau village admin untuk p_village
  IF p_village IS NOT NULL THEN
    IF NOT (public.is_super_admin() OR public.is_village_admin(p_village)) THEN
      RAISE EXCEPTION 'Akses ditolak.' USING ERRCODE = '42501';
    END IF;
  ELSE
    IF NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'Akses ditolak. Agregat seluruh koperasi hanya untuk super admin.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  v_days := GREATEST(COALESCE(p_days, 7), 1);
  -- Hitung batas waktu mulai dalam zona Asia/Jakarta
  v_start_time := (date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') - ((v_days - 1) || ' days')::interval) AT TIME ZONE 'Asia/Jakarta';

  -- Ringkasan metrik
  SELECT
    COUNT(*)::bigint,
    COALESCE(SUM(total), 0)::bigint
  INTO
    v_checkout_count,
    v_total_value
  FROM public.order_logs
  WHERE (p_village IS NULL OR village_id = p_village)
    AND created_at >= v_start_time;

  IF v_checkout_count > 0 THEN
    v_average_value := ROUND(v_total_value::numeric / v_checkout_count)::bigint;
  ELSE
    v_average_value := 0;
  END IF;

  -- Top 5 Produk
  WITH unnested_items AS (
    SELECT
      (item->>'product_id') AS product_id_str,
      COALESCE((item->>'qty')::numeric, 0) AS qty,
      COALESCE((item->>'price')::numeric, 0) AS price
    FROM public.order_logs ol,
    jsonb_array_elements(ol.items) AS item
    WHERE (p_village IS NULL OR ol.village_id = p_village)
      AND ol.created_at >= v_start_time
  ),
  aggregated_products AS (
    SELECT
      ui.product_id_str AS product_id,
      COALESCE(p.name, 'Produk Tidak Diketahui') AS name,
      SUM(ui.qty)::bigint AS qty,
      SUM(ui.qty * ui.price)::bigint AS total_value
    FROM unnested_items ui
    LEFT JOIN public.products p ON p.id::text = ui.product_id_str
    GROUP BY ui.product_id_str, p.name
    ORDER BY qty DESC, total_value DESC
    LIMIT 5
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'product_id', ap.product_id,
        'name', ap.name,
        'qty', ap.qty,
        'total_value', ap.total_value
      )
    ),
    '[]'::jsonb
  )
  INTO v_top_products
  FROM aggregated_products ap;

  -- Statistik Harian (CSS solid primary bar chart)
  WITH day_series AS (
    SELECT (date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') - (n || ' days')::interval)::date AS day_date
    FROM generate_series(v_days - 1, 0, -1) AS n
  ),
  daily_agg AS (
    SELECT
      (ol.created_at AT TIME ZONE 'Asia/Jakarta')::date AS order_date,
      COUNT(*)::bigint AS checkout_count,
      COALESCE(SUM(ol.total), 0)::bigint AS total_value
    FROM public.order_logs ol
    WHERE (p_village IS NULL OR ol.village_id = p_village)
      AND ol.created_at >= v_start_time
    GROUP BY (ol.created_at AT TIME ZONE 'Asia/Jakarta')::date
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', to_char(ds.day_date, 'YYYY-MM-DD'),
        'day_label', to_char(ds.day_date, 'DD/MM'),
        'checkout_count', COALESCE(da.checkout_count, 0),
        'total_value', COALESCE(da.total_value, 0)
      )
      ORDER BY ds.day_date ASC
    ),
    '[]'::jsonb
  )
  INTO v_daily_stats
  FROM day_series ds
  LEFT JOIN daily_agg da ON da.order_date = ds.day_date;

  -- Agregasi per Koperasi (khusus super admin)
  IF p_village IS NULL THEN
    WITH village_orders AS (
      SELECT
        ol.village_id,
        COUNT(*)::bigint AS checkout_count,
        COALESCE(SUM(ol.total), 0)::bigint AS total_value
      FROM public.order_logs ol
      WHERE ol.created_at >= v_start_time
      GROUP BY ol.village_id
    )
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'village_id', v.id,
          'village_name', v.business_name,
          'village_type', v.type,
          'village_slug', v.slug,
          'subdistrict_name', s.name,
          'subdistrict_slug', s.slug,
          'checkout_count', COALESCE(vo.checkout_count, 0),
          'total_value', COALESCE(vo.total_value, 0)
        )
        ORDER BY COALESCE(vo.total_value, 0) DESC, COALESCE(vo.checkout_count, 0) DESC, v.name ASC
      ),
      '[]'::jsonb
    )
    INTO v_by_village
    FROM public.villages v
    JOIN public.subdistricts s ON s.id = v.subdistrict_id
    LEFT JOIN village_orders vo ON vo.village_id = v.id
    WHERE v.is_active = true OR vo.checkout_count > 0;

    -- Agregasi per Kecamatan (khusus super admin)
    WITH subdistrict_orders AS (
      SELECT
        v.subdistrict_id,
        COUNT(*)::bigint AS checkout_count,
        COALESCE(SUM(ol.total), 0)::bigint AS total_value
      FROM public.order_logs ol
      JOIN public.villages v ON v.id = ol.village_id
      WHERE ol.created_at >= v_start_time
      GROUP BY v.subdistrict_id
    )
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'subdistrict_id', s.id,
          'subdistrict_name', s.name,
          'subdistrict_slug', s.slug,
          'checkout_count', COALESCE(so.checkout_count, 0),
          'total_value', COALESCE(so.total_value, 0)
        )
        ORDER BY COALESCE(so.total_value, 0) DESC, COALESCE(so.checkout_count, 0) DESC, s.name ASC
      ),
      '[]'::jsonb
    )
    INTO v_by_subdistrict
    FROM public.subdistricts s
    LEFT JOIN subdistrict_orders so ON so.subdistrict_id = s.id
    WHERE s.is_active = true OR so.checkout_count > 0;
  END IF;

  RETURN jsonb_build_object(
    'period_days', v_days,
    'summary', jsonb_build_object(
      'checkout_count', v_checkout_count,
      'total_value', v_total_value,
      'average_value', v_average_value
    ),
    'top_products', v_top_products,
    'daily_stats', v_daily_stats,
    'by_village', v_by_village,
    'by_subdistrict', v_by_subdistrict
  );
END;
$$;

-- Izin fungsi: anon dilarang, hanya authenticated
REVOKE ALL ON FUNCTION public.get_village_stats(UUID, INTEGER) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_village_stats(UUID, INTEGER) TO authenticated;

