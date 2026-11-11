-- 0007_super_admin_passwords_and_manager.sql
-- 1. RPC: super_admin_reset_password(p_target_user_id, p_new_password)
-- 2. Update RPC: assign_village_admin(p_email, p_village, p_auto_create, p_initial_password)

-- 1. SUPER ADMIN RESET USER PASSWORD
CREATE OR REPLACE FUNCTION public.super_admin_reset_password(
  p_target_user_id UUID,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Akses ditolak. Hanya super admin yang dapat mereset kata sandi.'
      USING ERRCODE = '42501';
  END IF;

  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'ID pengguna wajib diisi.'
      USING ERRCODE = '22023';
  END IF;

  IF p_new_password IS NULL OR length(trim(p_new_password)) < 6 THEN
    RAISE EXCEPTION 'Kata sandi minimal 6 karakter.'
      USING ERRCODE = '22023';
  END IF;

  SELECT email INTO v_email
  FROM auth.users
  WHERE id = p_target_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Pengguna tidak ditemukan.'
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE auth.users
  SET
    encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"must_change_password": true}'::jsonb,
    updated_at = now()
  WHERE id = p_target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_target_user_id,
    'email', v_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.super_admin_reset_password(UUID, TEXT) TO authenticated;

-- 2. DROP OLD ASSIGN SIGNATURE TO PREVENT AMBIGUITY
DROP FUNCTION IF EXISTS public.assign_village_admin(TEXT, UUID);

-- RE-CREATE ASSIGN_VILLAGE_ADMIN WITH OPTIONAL AUTO-CREATE & INITIAL PASSWORD
CREATE OR REPLACE FUNCTION public.assign_village_admin(
  p_email TEXT,
  p_village UUID,
  p_auto_create BOOLEAN DEFAULT FALSE,
  p_initial_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_is_new BOOLEAN := FALSE;
  v_password TEXT := p_initial_password;
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
    IF NOT p_auto_create THEN
      RAISE EXCEPTION 'Email belum terdaftar. Undang via Supabase Dashboard.'
        USING ERRCODE = 'P0002';
    END IF;

    -- Otomatis buat akun baru di auth.users
    v_user_id := gen_random_uuid();
    v_user_email := lower(trim(p_email));
    v_is_new := TRUE;

    IF v_password IS NULL OR length(trim(v_password)) < 6 THEN
      v_password := 'Kdkmp-' || substr(md5(random()::text), 1, 6);
    END IF;

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_user_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"must_change_password":true}'::jsonb,
      now(),
      now()
    );
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
      AND a.user_id <> v_user_id
      AND a.role = 'village_admin'
  ) THEN
    RAISE EXCEPTION 'KDKMP ini sudah memiliki manager aktif (1 KDKMP = 1 manager).'
      USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.admins (user_id, role, village_id)
  VALUES (v_user_id, 'village_admin', p_village)
  ON CONFLICT (user_id) DO UPDATE
    SET role = 'village_admin',
        village_id = p_village;

  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'email', v_user_email,
    'role', 'village_admin',
    'village_id', p_village,
    'is_new', v_is_new,
    'initial_password', CASE WHEN v_is_new THEN v_password ELSE NULL END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_village_admin(TEXT, UUID, BOOLEAN, TEXT) TO authenticated;

-- 3. RE-CREATE LIST_VILLAGE_ADMINS WITH WHATSAPP NUMBER
DROP FUNCTION IF EXISTS public.list_village_admins();

CREATE OR REPLACE FUNCTION public.list_village_admins()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  role VARCHAR(20),
  village_id UUID,
  village_code VARCHAR(15),
  village_name VARCHAR(100),
  business_name VARCHAR(150),
  whatsapp_number VARCHAR(20),
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
    v.whatsapp_number,
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

