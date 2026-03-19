-- Migration 0068: Hierarchy Enhancement
-- Creates customer_hierarchy tree table with materialized paths,
-- enhances product_hierarchy with materialized paths,
-- adds hierarchy scope columns to baselines, promotions, trade_calendar_events.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Customer Hierarchy Tree (5 levels: national > chain > region > district > store)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_hierarchy (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  level TEXT NOT NULL,            -- national | chain | region | district | store
  level_depth INTEGER NOT NULL,   -- 0=national, 1=chain, 2=region, 3=district, 4=store
  parent_id TEXT,
  parent_name TEXT,
  root_id TEXT,                   -- always points to top-level national node
  path TEXT,                      -- materialized path e.g. "/root-id/chain-id/region-id"
  child_count INTEGER DEFAULT 0,
  customer_id TEXT,               -- FK to customers table (only for store-level nodes)
  status TEXT DEFAULT 'active',
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cust_hier_company ON customer_hierarchy(company_id);
CREATE INDEX IF NOT EXISTS idx_cust_hier_parent ON customer_hierarchy(parent_id);
CREATE INDEX IF NOT EXISTS idx_cust_hier_level ON customer_hierarchy(company_id, level);
CREATE INDEX IF NOT EXISTS idx_cust_hier_root ON customer_hierarchy(root_id);
CREATE INDEX IF NOT EXISTS idx_cust_hier_path ON customer_hierarchy(path);
CREATE INDEX IF NOT EXISTS idx_cust_hier_customer ON customer_hierarchy(customer_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Product Hierarchy enhancements (table exists from 0056)
--    Add materialized path columns for efficient tree queries
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE product_hierarchy ADD COLUMN level_depth INTEGER DEFAULT 0;
ALTER TABLE product_hierarchy ADD COLUMN root_id TEXT;
ALTER TABLE product_hierarchy ADD COLUMN path TEXT;
ALTER TABLE product_hierarchy ADD COLUMN child_count INTEGER DEFAULT 0;
ALTER TABLE product_hierarchy ADD COLUMN product_id TEXT;

CREATE INDEX IF NOT EXISTS idx_product_hier_root ON product_hierarchy(root_id);
CREATE INDEX IF NOT EXISTS idx_product_hier_path ON product_hierarchy(path);
CREATE INDEX IF NOT EXISTS idx_product_hier_product ON product_hierarchy(product_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Baselines: add hierarchy scope columns
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE baselines ADD COLUMN customer_hierarchy_level TEXT;
ALTER TABLE baselines ADD COLUMN customer_hierarchy_id TEXT;
ALTER TABLE baselines ADD COLUMN customer_hierarchy_path TEXT;
ALTER TABLE baselines ADD COLUMN product_hierarchy_level TEXT;
ALTER TABLE baselines ADD COLUMN product_hierarchy_id TEXT;
ALTER TABLE baselines ADD COLUMN product_hierarchy_path TEXT;

CREATE INDEX IF NOT EXISTS idx_baselines_cust_hier ON baselines(company_id, customer_hierarchy_level, customer_hierarchy_id);
CREATE INDEX IF NOT EXISTS idx_baselines_prod_hier ON baselines(company_id, product_hierarchy_level, product_hierarchy_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Promotions: add hierarchy scope columns
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE promotions ADD COLUMN customer_hierarchy_level TEXT;
ALTER TABLE promotions ADD COLUMN customer_hierarchy_id TEXT;
ALTER TABLE promotions ADD COLUMN product_hierarchy_level TEXT;
ALTER TABLE promotions ADD COLUMN product_hierarchy_id TEXT;

CREATE INDEX IF NOT EXISTS idx_promo_cust_hier ON promotions(company_id, customer_hierarchy_level, customer_hierarchy_id);
CREATE INDEX IF NOT EXISTS idx_promo_prod_hier ON promotions(company_id, product_hierarchy_level, product_hierarchy_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Trade Calendar Events: add hierarchy scope columns
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE trade_calendar_events ADD COLUMN customer_hierarchy_level TEXT;
ALTER TABLE trade_calendar_events ADD COLUMN customer_hierarchy_id TEXT;
ALTER TABLE trade_calendar_events ADD COLUMN product_hierarchy_level TEXT;
ALTER TABLE trade_calendar_events ADD COLUMN product_hierarchy_id TEXT;

CREATE INDEX IF NOT EXISTS idx_cal_cust_hier ON trade_calendar_events(company_id, customer_hierarchy_level, customer_hierarchy_id);
CREATE INDEX IF NOT EXISTS idx_cal_prod_hier ON trade_calendar_events(company_id, product_hierarchy_level, product_hierarchy_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Baseline Periods: add hierarchy-aware columns
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE baseline_periods ADD COLUMN confidence_lower REAL;
ALTER TABLE baseline_periods ADD COLUMN confidence_upper REAL;
ALTER TABLE baseline_periods ADD COLUMN forecast_volume REAL;
ALTER TABLE baseline_periods ADD COLUMN forecast_revenue REAL;
