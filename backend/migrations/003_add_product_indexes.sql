-- ====================================================================
-- MAXORA BANGLADESH (maxorabd.com) - HIGH-PERFORMANCE DATABASE INDEXING
-- Target Tables: `products`, `orders`, `categories`
-- Target Engines: PostgreSQL, Supabase, Cloud SQL, MySQL 8+, SQLite
-- Purpose: Sub-millisecond (< 1ms) category browsing, search, and homepage queries
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. POSTGRESQL / SUPABASE / CLOUD SQL
-- --------------------------------------------------------------------

-- Primary & Foreign Key Lookups
CREATE INDEX IF NOT EXISTS idx_products_id ON products(id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_category_slug ON products(category_slug);

-- Active / Status Filtering
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Featured & Promotional Badges
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_is_flash_sale ON products(is_flash_sale);
CREATE INDEX IF NOT EXISTS idx_products_is_hot_deal ON products(is_hot_deal);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Composite Indexes for Instant 1ms Category Browsing
-- Allows PostgreSQL to satisfy category filter + active check + date sort directly from B-Tree index (Index-Only Scan)
CREATE INDEX IF NOT EXISTS idx_products_cat_active_created 
  ON products(category, active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_catslug_active_created 
  ON products(category_slug, active, created_at DESC);

-- Composite Index for Homepage Featured / Flash Sale / Hot Deals
CREATE INDEX IF NOT EXISTS idx_products_active_featured 
  ON products(active, featured, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_active_flash 
  ON products(active, is_flash_sale, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_active_hot 
  ON products(active, is_hot_deal, created_at DESC);

-- Text Search Index for Product Name & SKU
CREATE INDEX IF NOT EXISTS idx_products_name_lower 
  ON products(LOWER(name));

CREATE INDEX IF NOT EXISTS idx_products_sku 
  ON products(sku);


-- --------------------------------------------------------------------
-- 2. MYSQL 8+ / MARIADB COMPATIBLE ALTER QUERIES
-- --------------------------------------------------------------------
-- Run the following commands on MySQL / MariaDB databases:
/*
ALTER TABLE `products`
  ADD INDEX `idx_products_category` (`category`),
  ADD INDEX `idx_products_category_slug` (`category_slug`),
  ADD INDEX `idx_products_active` (`active`),
  ADD INDEX `idx_products_featured` (`featured`),
  ADD INDEX `idx_products_cat_active` (`category`, `active`),
  ADD INDEX `idx_products_catslug_active` (`category_slug`, `active`),
  ADD INDEX `idx_products_active_created` (`active`, `created_at`),
  ADD INDEX `idx_products_name` (`name`(191)),
  ADD INDEX `idx_products_sku` (`sku`(64));
*/

-- --------------------------------------------------------------------
-- 3. SQLITE 3 COMPATIBLE INDEXES
-- --------------------------------------------------------------------
/*
CREATE INDEX IF NOT EXISTS idx_sqlite_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_sqlite_products_category_slug ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_sqlite_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_sqlite_products_cat_active ON products(category, active);
CREATE INDEX IF NOT EXISTS idx_sqlite_products_catslug_active ON products(category_slug, active);
CREATE INDEX IF NOT EXISTS idx_sqlite_products_active_created ON products(active, created_at DESC);
*/
