-- 0002_rls.sql
-- Row Level Security (RLS) & Helper Functions untuk Katalog Online KDKMP Gresik

-- 1. HELPER FUNCTIONS (SECURITY DEFINER STABLE, search_path = public)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_village_admin(vid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = auth.uid()
      AND role = 'village_admin'
      AND village_id = vid
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_subdistrict_of_village_admin(sid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admins a
    JOIN public.villages v ON v.id = a.village_id
    WHERE a.user_id = auth.uid()
      AND a.role = 'village_admin'
      AND v.subdistrict_id = sid
  );
END;
$$;

-- Helper untuk memastikan manager KDKMP tidak mengubah atribut identitas/status aktif
CREATE OR REPLACE FUNCTION public.village_identity_unchanged(
  p_id UUID,
  p_code VARCHAR,
  p_slug VARCHAR,
  p_type VARCHAR,
  p_subdistrict_id UUID,
  p_is_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.villages v
    WHERE v.id = p_id
      AND v.code = p_code
      AND v.slug = p_slug
      AND v.type = p_type
      AND v.subdistrict_id = p_subdistrict_id
      AND v.is_active = p_is_active
  );
END;
$$;

-- Trigger pertahanan berlapis agar village_admin tidak dapat mengubah kolom terlarang
CREATE OR REPLACE FUNCTION public.protect_village_immutable_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_super_admin() THEN
    IF NEW.code IS DISTINCT FROM OLD.code
       OR NEW.slug IS DISTINCT FROM OLD.slug
       OR NEW.type IS DISTINCT FROM OLD.type
       OR NEW.subdistrict_id IS DISTINCT FROM OLD.subdistrict_id
       OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Manager KDKMP tidak diizinkan mengubah code, slug, type, subdistrict_id, atau is_active.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_villages_protect_immutable ON public.villages;
CREATE TRIGGER trg_villages_protect_immutable
  BEFORE UPDATE ON public.villages
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_village_immutable_fields();

-- 2. AKTIFKAN RLS DI SEMUA TABEL
ALTER TABLE public.subdistricts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES: SUBDISTRICTS
DROP POLICY IF EXISTS "subdistricts_select_public" ON public.subdistricts;
CREATE POLICY "subdistricts_select_public"
  ON public.subdistricts
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "subdistricts_select_village_admin" ON public.subdistricts;
CREATE POLICY "subdistricts_select_village_admin"
  ON public.subdistricts
  FOR SELECT
  TO authenticated
  USING (public.is_subdistrict_of_village_admin(id));

DROP POLICY IF EXISTS "subdistricts_all_super_admin" ON public.subdistricts;
CREATE POLICY "subdistricts_all_super_admin"
  ON public.subdistricts
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 4. POLICIES: VILLAGES
DROP POLICY IF EXISTS "villages_select_public" ON public.villages;
CREATE POLICY "villages_select_public"
  ON public.villages
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.subdistricts s
      WHERE s.id = villages.subdistrict_id
        AND s.is_active = true
    )
  );

DROP POLICY IF EXISTS "villages_select_village_admin" ON public.villages;
CREATE POLICY "villages_select_village_admin"
  ON public.villages
  FOR SELECT
  TO authenticated
  USING (public.is_village_admin(id));

DROP POLICY IF EXISTS "villages_update_village_admin" ON public.villages;
CREATE POLICY "villages_update_village_admin"
  ON public.villages
  FOR UPDATE
  TO authenticated
  USING (public.is_village_admin(id))
  WITH CHECK (
    public.is_village_admin(id)
    AND public.village_identity_unchanged(id, code, slug, type, subdistrict_id, is_active)
  );

DROP POLICY IF EXISTS "villages_all_super_admin" ON public.villages;
CREATE POLICY "villages_all_super_admin"
  ON public.villages
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 5. POLICIES: CATEGORIES
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.villages v
      JOIN public.subdistricts s ON s.id = v.subdistrict_id
      WHERE v.id = categories.village_id
        AND v.is_active = true
        AND s.is_active = true
    )
  );

DROP POLICY IF EXISTS "categories_all_village_admin" ON public.categories;
CREATE POLICY "categories_all_village_admin"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (public.is_village_admin(village_id))
  WITH CHECK (public.is_village_admin(village_id));

DROP POLICY IF EXISTS "categories_all_super_admin" ON public.categories;
CREATE POLICY "categories_all_super_admin"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 6. POLICIES: PRODUCTS
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.villages v
      JOIN public.subdistricts s ON s.id = v.subdistrict_id
      WHERE v.id = products.village_id
        AND v.is_active = true
        AND s.is_active = true
    )
  );

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

DROP POLICY IF EXISTS "products_all_super_admin" ON public.products;
CREATE POLICY "products_all_super_admin"
  ON public.products
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (
    public.is_super_admin()
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.categories c
        WHERE c.id = products.category_id
          AND c.village_id = products.village_id
      )
    )
  );

-- 7. POLICIES: ADMINS
DROP POLICY IF EXISTS "admins_select_own" ON public.admins;
CREATE POLICY "admins_select_own"
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_all_super_admin" ON public.admins;
CREATE POLICY "admins_all_super_admin"
  ON public.admins
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
