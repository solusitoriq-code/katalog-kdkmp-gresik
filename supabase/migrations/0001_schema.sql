-- 0001_schema.sql
-- Skema utama Katalog Online KDKMP Kabupaten Gresik (Kemendagri 35.25)

-- 1. TABEL KECAMATAN (SUBDISTRICTS)
CREATE TABLE IF NOT EXISTS public.subdistricts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subdistricts_slug_reserved_check CHECK (
    slug NOT IN ('admin', 'login', 'api', 'assets', 'dev')
  )
);

-- 2. TABEL KOPERASI DESA / KELURAHAN MERAH PUTIH (VILLAGES)
CREATE TABLE IF NOT EXISTS public.villages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(15) UNIQUE NOT NULL,
  subdistrict_id UUID NOT NULL REFERENCES public.subdistricts(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'desa' CHECK (type IN ('desa', 'kelurahan')),
  business_name VARCHAR(150) NOT NULL,
  whatsapp_number VARCHAR(20) NULL,
  address TEXT,
  gmaps_url TEXT,
  logo_url TEXT,
  opening_hour TIME NOT NULL DEFAULT '07:00',
  closing_hour TIME NOT NULL DEFAULT '20:00',
  free_delivery_min INTEGER NOT NULL DEFAULT 0 CHECK (free_delivery_min >= 0),
  delivery_note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT villages_subdistrict_slug_unique UNIQUE (subdistrict_id, slug),
  CONSTRAINT villages_slug_reserved_check CHECK (
    slug NOT IN ('admin', 'login', 'api', 'assets', 'dev')
  ),
  CONSTRAINT villages_whatsapp_check CHECK (
    (NOT is_active OR (whatsapp_number IS NOT NULL AND whatsapp_number ~ '^62[0-9]{8,13}$'))
    AND (whatsapp_number IS NULL OR whatsapp_number ~ '^62[0-9]{8,13}$')
  )
);

-- 3. TABEL KATEGORI PRODUK (CATEGORIES)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categories_village_name_unique UNIQUE (village_id, name)
);

-- 4. TABEL PRODUK (PRODUCTS)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  category_id UUID NULL REFERENCES public.categories(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  original_price INTEGER NULL CHECK (original_price IS NULL OR original_price > price),
  unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
  stock_status VARCHAR(20) NOT NULL DEFAULT 'ready' CHECK (stock_status IN ('ready', 'pre-order', 'habis')),
  image_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABEL ADMIN / MANAGER KDKMP (ADMINS)
-- Relasi 1 Manager = 1 KDKMP (user_id PK, village_id UNIQUE)
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'village_admin')),
  village_id UUID UNIQUE NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admins_role_village_check CHECK (
    (role = 'super_admin' AND village_id IS NULL)
    OR (role = 'village_admin' AND village_id IS NOT NULL)
  )
);

-- 6. TRIGGER UPDATED_AT
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_villages_updated_at ON public.villages;
CREATE TRIGGER trg_villages_updated_at
  BEFORE UPDATE ON public.villages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 7. INDEXES
CREATE INDEX IF NOT EXISTS idx_villages_subdistrict
  ON public.villages(subdistrict_id);

CREATE INDEX IF NOT EXISTS idx_categories_village_sort
  ON public.categories(village_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_products_village_category
  ON public.products(village_id, category_id);

CREATE INDEX IF NOT EXISTS idx_products_village_stock
  ON public.products(village_id, stock_status);

