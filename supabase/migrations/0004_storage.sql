-- 0004_storage.sql
-- Konfigurasi bucket storage product-images & RLS berdasarkan folder village_id

-- 1. BUCKET: PRODUCT-IMAGES (PUBLIK BACA, MAKS 100 KB, WEBP/JPEG/PNG)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  102400,
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. HELPER VALIDASI PATH STORAGE ({village_id}/{filename})
CREATE OR REPLACE FUNCTION public.can_manage_storage_object(p_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_folder TEXT;
  v_file TEXT;
BEGIN
  IF public.is_super_admin() THEN
    RETURN true;
  END IF;

  IF p_name IS NULL THEN
    RETURN false;
  END IF;

  v_folder := split_part(p_name, '/', 1);
  v_file := split_part(p_name, '/', 2);

  IF v_file = '' THEN
    RETURN false;
  END IF;

  IF v_folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;

  RETURN public.is_village_admin(v_folder::UUID);
END;
$$;

-- 3. POLICIES: STORAGE.OBJECTS (BUCKET PRODUCT-IMAGES)
DROP POLICY IF EXISTS "product_images_select_public" ON storage.objects;
CREATE POLICY "product_images_select_public"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_insert_manager" ON storage.objects;
CREATE POLICY "product_images_insert_manager"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.can_manage_storage_object(name)
  );

DROP POLICY IF EXISTS "product_images_update_manager" ON storage.objects;
CREATE POLICY "product_images_update_manager"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.can_manage_storage_object(name)
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.can_manage_storage_object(name)
  );

DROP POLICY IF EXISTS "product_images_delete_manager" ON storage.objects;
CREATE POLICY "product_images_delete_manager"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.can_manage_storage_object(name)
  );

