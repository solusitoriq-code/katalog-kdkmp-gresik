-- 0010_orders_crud.sql
-- Skema Tabel orders dan RLS Policy untuk Fitur CRUD Transaksi KDKMP
-- Mendukung isolasi tenant (1 Manager = 1 KDKMP) dan akses penuh Super Admin.

-- 1. TABEL ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(32) NOT NULL UNIQUE DEFAULT (
    'ORD-' || to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6))
  ),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(25),
  customer_address TEXT,
  delivery_method VARCHAR(50) NOT NULL DEFAULT 'Diantar',
  payment_method VARCHAR(50) NOT NULL DEFAULT 'COD',
  items JSONB NOT NULL,
  items_count INTEGER NOT NULL CHECK (items_count >= 1),
  total INTEGER NOT NULL CHECK (total >= 0),
  note TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_orders_items_is_array CHECK (jsonb_typeof(items) = 'array'),
  CONSTRAINT check_orders_status CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
);

-- Index untuk performa query & filter
CREATE INDEX IF NOT EXISTS idx_orders_village_id ON public.orders(village_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Trigger auto-update updated_at
DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy INSERT: Publik (anon & authenticated) dapat membuat pesanan untuk koperasi aktif di kecamatan aktif
DROP POLICY IF EXISTS "orders_insert_public" ON public.orders;
CREATE POLICY "orders_insert_public"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.villages v
      JOIN public.subdistricts s ON s.id = v.subdistrict_id
      WHERE v.id = orders.village_id
        AND v.is_active = true
        AND s.is_active = true
    )
  );

-- Policy SELECT: village_admin terkait atau super_admin (anon TIDAK BISA SELECT)
DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;
CREATE POLICY "orders_select_admin"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    public.is_village_admin(village_id)
    OR public.is_super_admin()
  );

-- Policy UPDATE: village_admin terkait atau super_admin
DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
CREATE POLICY "orders_update_admin"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    public.is_village_admin(village_id)
    OR public.is_super_admin()
  )
  WITH CHECK (
    public.is_village_admin(village_id)
    OR public.is_super_admin()
  );

-- Policy DELETE: village_admin terkait atau super_admin
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;
CREATE POLICY "orders_delete_admin"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (
    public.is_village_admin(village_id)
    OR public.is_super_admin()
  );

-- 3. MIGRASI DATA LAMA (BACKFILL DARI ORDER_LOGS KE ORDERS)
-- Memindahkan seluruh transaksi checkout WhatsApp terdahulu yang ada di order_logs
-- ke tabel orders agar langsung tampil di Halaman Transaksi Admin.
INSERT INTO public.orders (
  id,
  order_number,
  village_id,
  customer_name,
  customer_phone,
  customer_address,
  delivery_method,
  payment_method,
  items,
  items_count,
  total,
  note,
  status,
  created_at,
  updated_at
)
SELECT
  ol.id,
  'ORD-' || to_char(ol.created_at AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD') || '-' || upper(substr(ol.id::text, 1, 6)),
  ol.village_id,
  'Pelanggan WA',
  NULL,
  CASE WHEN ol.delivery_method = 'Diantar' THEN 'Alamat di WhatsApp' ELSE NULL END,
  COALESCE(ol.delivery_method, 'Diantar'),
  COALESCE(ol.payment_method, 'COD'),
  ol.items,
  COALESCE(ol.items_count, 1),
  COALESCE(ol.total, 0),
  'Riwayat checkout WhatsApp',
  'pending',
  ol.created_at,
  ol.created_at
FROM public.order_logs ol
WHERE NOT EXISTS (
  SELECT 1 FROM public.orders o WHERE o.id = ol.id
);


