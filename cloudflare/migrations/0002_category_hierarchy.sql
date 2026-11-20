CREATE TABLE IF NOT EXISTS product_types (
  id TEXT PRIMARY KEY,
  category_id TEXT,
  category_slug TEXT,
  subcategory_id TEXT,
  subcategory_slug TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  display_order INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  updated_at TEXT,
  data_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_product_types_category
ON product_types(category_id);

CREATE INDEX IF NOT EXISTS idx_product_types_subcategory
ON product_types(subcategory_id);

CREATE INDEX IF NOT EXISTS idx_product_types_active_order
ON product_types(active, display_order);

CREATE TABLE IF NOT EXISTS child_categories (
  id TEXT PRIMARY KEY,
  category_id TEXT,
  category_slug TEXT,
  subcategory_id TEXT,
  subcategory_slug TEXT,
  product_type_id TEXT,
  product_type_slug TEXT,
  product_type_name TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  display_order INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  updated_at TEXT,
  data_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_child_categories_category
ON child_categories(category_id);

CREATE INDEX IF NOT EXISTS idx_child_categories_product_type
ON child_categories(product_type_id);

CREATE INDEX IF NOT EXISTS idx_child_categories_active_order
ON child_categories(active, display_order);