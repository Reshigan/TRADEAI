-- Market Feature 2: Dual-Hierarchy Budget Scoping
CREATE TABLE IF NOT EXISTS product_hierarchy (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  level TEXT NOT NULL,
  parent_id TEXT,
  parent_name TEXT,
  status TEXT DEFAULT 'active',
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_product_hier_company ON product_hierarchy(company_id);
CREATE INDEX IF NOT EXISTS idx_product_hier_parent ON product_hierarchy(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_hier_level ON product_hierarchy(company_id, level);

ALTER TABLE budgets ADD COLUMN customer_hierarchy_level TEXT DEFAULT 'national';
ALTER TABLE budgets ADD COLUMN customer_hierarchy_id TEXT;
ALTER TABLE budgets ADD COLUMN customer_hierarchy_name TEXT;
ALTER TABLE budgets ADD COLUMN product_hierarchy_level TEXT DEFAULT 'all';
ALTER TABLE budgets ADD COLUMN product_hierarchy_id TEXT;
ALTER TABLE budgets ADD COLUMN product_hierarchy_name TEXT;
