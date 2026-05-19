-- =========================================
-- CLEMTRIX POS DATABASE SCHEMA
-- SUPABASE / POSTGRESQL
-- PRODUCTION SAFE VERSION
-- =========================================

-- =========================================
-- EXTENSIONS
-- =========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- BUSINESSES
-- =========================================

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  plan TEXT DEFAULT 'basic'
    CHECK (plan IN ('basic', 'medium', 'ai')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- PROFILES
-- =========================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  full_name TEXT,
  whatsapp_number TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'cashier')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- CATEGORIES
-- =========================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, name)
);

-- =========================================
-- PRODUCTS
-- =========================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 10,
  barcode TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, barcode)
);

-- =========================================
-- SALES
-- =========================================

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'momo')),
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- SALE ITEMS
-- =========================================

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

-- =========================================
-- INVENTORY LOGS
-- =========================================

CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  change_amount INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- PAYMENTS
-- =========================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  provider TEXT,
  provider_ref TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- SYNC QUEUE
-- =========================================

CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  type TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- AI LOGS
-- =========================================

CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  query TEXT,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- NOTIFICATIONS
-- =========================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- SUPPLIERS
-- =========================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- EXPENSES
-- =========================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category TEXT,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- SUBSCRIPTIONS
-- =========================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  status TEXT,
  paystack_subscription_code TEXT,
  current_period_end TIMESTAMPTZ,
  plan_tier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- FUNCTIONS (To avoid RLS Recursion)
-- =========================================

CREATE OR REPLACE FUNCTION get_my_business_id()
RETURNS UUID AS $$
DECLARE
  my_b_id UUID;
BEGIN
  SELECT business_id INTO my_b_id FROM public.profiles WHERE id = auth.uid();
  RETURN my_b_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_products_business
  ON products(business_id);

CREATE INDEX IF NOT EXISTS idx_products_barcode
  ON products(barcode);

CREATE INDEX IF NOT EXISTS idx_sales_business
  ON sales(business_id);

CREATE INDEX IF NOT EXISTS idx_sales_created
  ON sales(created_at);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_product
  ON inventory_logs(product_id);

CREATE INDEX IF NOT EXISTS idx_notifications_business
  ON notifications(business_id);

CREATE INDEX IF NOT EXISTS idx_sync_queue_processed
  ON sync_queue(processed);

-- =========================================
-- ENABLE RLS
-- =========================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- =========================================
-- DROP EXISTING POLICIES SAFELY
-- =========================================

DROP POLICY IF EXISTS "Enable insert for everyone" ON businesses;
DROP POLICY IF EXISTS "Users can view their own business" ON businesses;
DROP POLICY IF EXISTS "Admins can update their business" ON businesses;

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in their business" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

DROP POLICY IF EXISTS "Users can access categories" ON categories;
DROP POLICY IF EXISTS "Users can access products" ON products;
DROP POLICY IF EXISTS "Users can access sales" ON sales;
DROP POLICY IF EXISTS "Users can access sale_items" ON sale_items;
DROP POLICY IF EXISTS "Users can access inventory_logs" ON inventory_logs;
DROP POLICY IF EXISTS "Users can access payments" ON payments;
DROP POLICY IF EXISTS "Users can access sync_queue" ON sync_queue;
DROP POLICY IF EXISTS "Users can access ai_logs" ON ai_logs;
DROP POLICY IF EXISTS "Users can access notifications" ON notifications;
DROP POLICY IF EXISTS "Users can access suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can access expenses" ON expenses;
DROP POLICY IF EXISTS "Users can access subscriptions" ON subscriptions;

-- =========================================
-- BUSINESSES POLICIES
-- =========================================

CREATE POLICY "Enable insert for everyone"
ON businesses
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own business"
ON businesses
FOR SELECT
USING (
  id = get_my_business_id()
);

CREATE POLICY "Admins can update their business"
ON businesses
FOR UPDATE
USING (
  id IN (
    SELECT business_id
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
);

-- =========================================
-- PROFILES POLICIES
-- =========================================

CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can view profiles in their business"
ON profiles
FOR SELECT
USING (
  business_id = get_my_business_id()
);

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (id = auth.uid());

-- =========================================
-- SHARED ACCESS POLICIES
-- =========================================

CREATE POLICY "Users can access categories"
ON categories
FOR ALL
USING (
  business_id = get_my_business_id()
);

CREATE POLICY "Users can access products"
ON products
FOR ALL
USING (
  business_id = get_my_business_id()
);

CREATE POLICY "Users can access sales"
ON sales
FOR ALL
USING (
  business_id = get_my_business_id()
);

CREATE POLICY "Users can access sale_items"
ON sale_items
FOR ALL
USING (
  sale_id IN (
    SELECT id
    FROM sales
    WHERE business_id = get_my_business_id()
  )
);

CREATE POLICY "Users can access inventory_logs"
ON inventory_logs
FOR ALL
USING (
  business_id = get_my_business_id()
);

CREATE POLICY "Users can access payments"
ON payments
FOR ALL
USING (
  business_id = get_my_business_id()
);

CREATE POLICY "Users can access sync_queue"
ON sync_queue
FOR ALL
USING (
  business_id = get_my_business_id()
);

CREATE POLICY "Users can access ai_logs"
ON ai_logs
FOR ALL
USING (
  business_id = get_my_business_id()
);

CREATE POLICY "Users can access notifications"
ON notifications
FOR ALL
USING (
  business_id = get_my_business_id()
);

CREATE POLICY "Users can access suppliers"
ON suppliers
FOR ALL
USING (
  business_id = get_my_business_id()
);

CREATE POLICY "Users can access expenses"
ON expenses
FOR ALL
USING (
  business_id = get_my_business_id()
);

CREATE POLICY "Users can access subscriptions"
ON subscriptions
FOR ALL
USING (
  business_id = get_my_business_id()
);