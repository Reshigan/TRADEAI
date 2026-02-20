-- Migration 0014: Add regions and districts tables for hierarchy persistence

CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  status TEXT DEFAULT 'active',
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_regions_company ON regions(company_id);

CREATE TABLE IF NOT EXISTS districts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  region_id TEXT,
  region_name TEXT,
  code TEXT,
  status TEXT DEFAULT 'active',
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_districts_company ON districts(company_id);
CREATE INDEX IF NOT EXISTS idx_districts_region ON districts(company_id, region_id);
