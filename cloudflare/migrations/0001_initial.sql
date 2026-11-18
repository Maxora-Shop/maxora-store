-- Maxora Shop BD: Cloudflare D1 initial schema
-- Legacy source remains unchanged until migration approval.
-- Preserve complete legacy fields in data_json.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT,
  slug TEXT,
  name TEXT NOT NULL,
  category_id TEXT,
  category_slug TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  status TEXT,
  selling_price REAL,
  regular_price REAL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  data_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_products_active_created
  ON products(active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_category_active
  ON products(category_slug, active);

CREATE INDEX IF NOT EXISTS idx_products_sku
  ON products(sku);

CREATE INDEX IF NOT EXISTS idx_products_slug
  ON products(slug);

CREATE INDEX IF NOT EXISTS idx_products_name
  ON products(name);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  icon TEXT,
  image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  data_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_categories_active_order
  ON categories(active, display_order);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  alt_phone TEXT,
  email TEXT,
  password_hash TEXT,
  district TEXT,
  area TEXT,
  address TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent REAL NOT NULL DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  data_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_customers_phone
  ON customers(phone);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  alt_phone TEXT,
  email TEXT,
  district TEXT,
  area TEXT,
  address TEXT,
  delivery_area TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  payment_status TEXT DEFAULT 'Pending',
  payment_gateway TEXT,
  payment_method TEXT,
  transaction_id TEXT,
  subtotal REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  delivery_charge REAL DEFAULT 0,
  total REAL DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  note TEXT,
  data_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number
  ON orders(order_number);

CREATE INDEX IF NOT EXISTS idx_orders_customer
  ON orders(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON orders(payment_status);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL DEFAULT 0,
  buying_price REAL,
  image_url TEXT,
  selected_color TEXT,
  slug TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product
  ON order_items(product_id);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  product_id TEXT NOT NULL,
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE(order_id, product_id, movement_type)
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product
  ON stock_movements(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  idempotency_key TEXT PRIMARY KEY,
  operation TEXT NOT NULL,
  result_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deleted_products (
  product_id TEXT PRIMARY KEY,
  deleted_at TEXT NOT NULL,
  reason TEXT
);

CREATE TABLE IF NOT EXISTS store_settings (
  setting_key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS catalog_meta (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO catalog_meta (id, version, updated_at)
VALUES ('catalog', 1, CURRENT_TIMESTAMP);
