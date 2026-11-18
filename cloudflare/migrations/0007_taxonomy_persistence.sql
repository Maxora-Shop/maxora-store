CREATE TABLE IF NOT EXISTS subcategories (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  display_order INTEGER NOT NULL DEFAULT 999,
  meta_title TEXT,
  meta_description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category_order
ON subcategories(category_id, active, display_order);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subcategories_category_slug
ON subcategories(category_id, slug);

CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  display_order INTEGER NOT NULL DEFAULT 999,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_brands_active_order
ON brands(active, display_order);
