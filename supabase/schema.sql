-- ============================================================
-- Sri Vijaya Durga Kadi Emporium — Supabase Database Schema
-- Run this SQL in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  phone         TEXT,
  role          TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  referral_code TEXT UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  referred_by   UUID REFERENCES public.profiles(id),
  reward_points INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  icon        TEXT,
  image_url   TEXT,
  is_active   BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  brand           TEXT,
  category_id     UUID REFERENCES public.categories(id),
  description     TEXT,
  short_desc      TEXT,
  price           NUMERIC(10,2) NOT NULL,
  discount_price  NUMERIC(10,2),
  stock_count     INTEGER DEFAULT 0,
  sku             TEXT UNIQUE,
  images          TEXT[] DEFAULT '{}',
  tags            TEXT[] DEFAULT '{}',
  is_active       BOOLEAN DEFAULT true,
  is_featured     BOOLEAN DEFAULT false,
  is_flash_sale   BOOLEAN DEFAULT false,
  flash_sale_ends TIMESTAMPTZ,
  avg_rating      NUMERIC(3,2) DEFAULT 0,
  review_count    INTEGER DEFAULT 0,
  sold_count      INTEGER DEFAULT 0,
  weight_grams    INTEGER,
  fabric          TEXT,
  color           TEXT,
  size_options    TEXT[] DEFAULT '{}',
  points_reward   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  pincode       TEXT NOT NULL,
  country       TEXT DEFAULT 'India',
  is_default    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. CARTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.carts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity   INTEGER DEFAULT 1,
  size       TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id, size)
);

-- ============================================================
-- 6. WISHLISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- 7. COUPONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL,
  type            TEXT CHECK (type IN ('percentage', 'flat')) DEFAULT 'percentage',
  value           NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_discount    NUMERIC(10,2),
  usage_limit     INTEGER DEFAULT 100,
  used_count      INTEGER DEFAULT 0,
  user_id         UUID REFERENCES public.profiles(id),
  is_active       BOOLEAN DEFAULT true,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES public.profiles(id),
  order_number     TEXT UNIQUE NOT NULL DEFAULT 'SVD-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  payment_status   TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_method   TEXT DEFAULT 'cod',
  subtotal         NUMERIC(10,2) NOT NULL,
  discount_amount  NUMERIC(10,2) DEFAULT 0,
  points_used      INTEGER DEFAULT 0,
  points_value     NUMERIC(10,2) DEFAULT 0,
  shipping_charge  NUMERIC(10,2) DEFAULT 0,
  total_amount     NUMERIC(10,2) NOT NULL,
  coupon_id        UUID REFERENCES public.coupons(id),
  address_id       UUID REFERENCES public.addresses(id),
  address_snapshot JSONB,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id),
  product_snapshot JSONB,
  quantity    INTEGER NOT NULL,
  size        TEXT,
  unit_price  NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  title       TEXT,
  body        TEXT,
  images      TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- ============================================================
-- 11. REFERRALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES public.profiles(id),
  referred_id UUID REFERENCES public.profiles(id),
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','rewarded')),
  points_awarded INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 12. REWARD POINTS LEDGER
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reward_points (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  points      INTEGER NOT NULL,
  type        TEXT CHECK (type IN ('earned','redeemed','bonus','referral','checkin','spin')) NOT NULL,
  description TEXT,
  order_id    UUID REFERENCES public.orders(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 13. REDEEMED PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.redeemed_products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id),
  product_id      UUID REFERENCES public.products(id),
  points_used     INTEGER NOT NULL,
  cash_paid       NUMERIC(10,2) DEFAULT 0,
  status          TEXT DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 14. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'info' CHECK (type IN ('info','order','reward','promotion','alert')),
  is_read     BOOLEAN DEFAULT false,
  link        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 15. DAILY CHECK-INS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  checkin_date DATE DEFAULT CURRENT_DATE,
  points_earned INTEGER DEFAULT 5,
  streak_days   INTEGER DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

-- ============================================================
-- 16. SPIN WHEEL HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.spin_wheel_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  spin_date   DATE DEFAULT CURRENT_DATE,
  reward_type TEXT CHECK (reward_type IN ('points','coupon','discount','nothing')),
  reward_value TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, spin_date)
);

-- ============================================================
-- 17. RECENTLY VIEWED
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recently_viewed (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.addresses         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.carts             ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.wishlists         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.order_items       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reward_points     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.daily_checkins    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.spin_wheel_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.recently_viewed   ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.referrals         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.redeemed_products ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);

-- ADDRESSES policies
CREATE POLICY "Users manage own addresses" ON public.addresses USING (auth.uid() = user_id);

-- CARTS policies
CREATE POLICY "Users manage own cart" ON public.carts USING (auth.uid() = user_id);

-- WISHLISTS policies
CREATE POLICY "Users manage own wishlist" ON public.wishlists USING (auth.uid() = user_id);

-- ORDERS policies
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ORDER_ITEMS policies
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- REVIEWS policies
CREATE POLICY "Reviews are public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- REWARD POINTS policies
CREATE POLICY "Users view own points" ON public.reward_points FOR SELECT USING (auth.uid() = user_id);

-- DAILY CHECKINS policies
CREATE POLICY "Users manage own checkins" ON public.daily_checkins USING (auth.uid() = user_id);

-- SPIN WHEEL policies
CREATE POLICY "Users manage own spins" ON public.spin_wheel_history USING (auth.uid() = user_id);

-- NOTIFICATIONS policies
CREATE POLICY "Users view own notifications" ON public.notifications USING (auth.uid() = user_id);

-- RECENTLY VIEWED policies
CREATE POLICY "Users manage own history" ON public.recently_viewed USING (auth.uid() = user_id);

-- REFERRALS policies
CREATE POLICY "Users view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update product avg_rating on review insert/update
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET avg_rating = (SELECT AVG(rating) FROM public.reviews WHERE product_id = NEW.product_id),
      review_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER after_review_change
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Decrement product stock count
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock_count = GREATEST(0, stock_count - p_quantity)
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment user reward points
CREATE OR REPLACE FUNCTION public.increment_points(p_user_id uuid, p_points integer)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET reward_points = GREATEST(0, reward_points + p_points)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment coupon usage count
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_coupon_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================

-- SEED DATA — Categories
-- ============================================================
INSERT INTO public.categories (name, slug, description, icon, sort_order) VALUES
  ('Sarees',         'sarees',         'Traditional and designer sarees',           '🥻', 1),
  ('Kadi Fabrics',   'kadi-fabrics',   'Handspun khadi and kadi textiles',          '🧵', 2),
  ('Dress Materials','dress-materials', 'Unstitched and semi-stitched dress sets',   '👗', 3),
  ('Dupattas',       'dupattas',       'Cotton, silk and embroidered dupattas',     '🧣', 4),
  ('Kurtas & Sets',  'kurtas-sets',    'Mens and womens ethnic kurtas',             '👔', 5),
  ('Bedsheets',      'bedsheets',      'Pure cotton handloom bedsheets',            '🛏️', 6),
  ('Towels',         'towels',         'Khadi and cotton towels',                   '🧺', 7),
  ('Accessories',    'accessories',    'Belts, scarves and textile accessories',    '👜', 8)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED DATA — Sample Admin User (update with real auth user id after signup)
-- ============================================================
-- After creating admin account via Auth, run:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@svdke.com';

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category     ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active    ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured  ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_flash     ON public.products(is_flash_sale);
CREATE INDEX IF NOT EXISTS idx_orders_user           ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order     ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product       ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_user             ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user         ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_points_user    ON public.reward_points(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user    ON public.notifications(user_id);
