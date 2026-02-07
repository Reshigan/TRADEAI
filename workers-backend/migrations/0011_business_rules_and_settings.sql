-- TRADEAI D1 Database Schema Enhancement
-- Migration: Add business_rules_config, allocations, and settings tables

-- Business Rules Config table
CREATE TABLE IF NOT EXISTS business_rules_config (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  category TEXT NOT NULL, -- promotions, budgets, rebates, claims, tradeSpend, allocations
  rules TEXT, -- JSON blob for rule parameters
  updated_by TEXT,
  data TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_business_rules_company_id ON business_rules_config(company_id);
CREATE INDEX IF NOT EXISTS idx_business_rules_category ON business_rules_config(category);

-- Allocations table
CREATE TABLE IF NOT EXISTS allocations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT,
  budget_id TEXT,
  customer_id TEXT,
  product_id TEXT,
  amount REAL DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, approved, active, completed
  allocation_type TEXT, -- customer, product, region, channel
  created_by TEXT,
  data TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (budget_id) REFERENCES budgets(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_allocations_company_id ON allocations(company_id);
CREATE INDEX IF NOT EXISTS idx_allocations_budget_id ON allocations(budget_id);
CREATE INDEX IF NOT EXISTS idx_allocations_status ON allocations(status);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  data TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_settings_company_id ON settings(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_company_key ON settings(company_id, key);
