-- Migration 0019: Budget Allocation Engine
-- Provides hierarchical top-down budget allocation with waterfall distribution
-- to customers, channels, products, and regions.

-- Budget allocation plans (top-level container)
CREATE TABLE IF NOT EXISTS budget_allocations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  allocation_method TEXT DEFAULT 'top_down',
  budget_id TEXT,
  source_amount REAL DEFAULT 0,
  allocated_amount REAL DEFAULT 0,
  remaining_amount REAL DEFAULT 0,
  utilized_amount REAL DEFAULT 0,
  utilization_pct REAL DEFAULT 0,
  fiscal_year INTEGER,
  period_type TEXT DEFAULT 'annual',
  start_date TEXT,
  end_date TEXT,
  dimension TEXT DEFAULT 'customer',
  currency TEXT DEFAULT 'ZAR',
  locked INTEGER DEFAULT 0,
  locked_by TEXT,
  locked_at TEXT,
  approved_by TEXT,
  approved_at TEXT,
  notes TEXT,
  created_by TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Budget allocation lines (individual allocations per dimension)
CREATE TABLE IF NOT EXISTS budget_allocation_lines (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  allocation_id TEXT NOT NULL,
  line_number INTEGER DEFAULT 0,
  dimension_type TEXT DEFAULT 'customer',
  dimension_id TEXT,
  dimension_name TEXT,
  parent_line_id TEXT,
  level INTEGER DEFAULT 0,
  source_amount REAL DEFAULT 0,
  allocated_amount REAL DEFAULT 0,
  allocated_pct REAL DEFAULT 0,
  utilized_amount REAL DEFAULT 0,
  committed_amount REAL DEFAULT 0,
  remaining_amount REAL DEFAULT 0,
  utilization_pct REAL DEFAULT 0,
  prior_year_amount REAL DEFAULT 0,
  prior_year_growth_pct REAL DEFAULT 0,
  forecast_amount REAL DEFAULT 0,
  variance_amount REAL DEFAULT 0,
  variance_pct REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_budget_alloc_company ON budget_allocations(company_id);
CREATE INDEX IF NOT EXISTS idx_budget_alloc_status ON budget_allocations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_budget_alloc_budget ON budget_allocations(company_id, budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_alloc_year ON budget_allocations(company_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budget_alloc_lines_alloc ON budget_allocation_lines(allocation_id);
CREATE INDEX IF NOT EXISTS idx_budget_alloc_lines_company ON budget_allocation_lines(company_id);
CREATE INDEX IF NOT EXISTS idx_budget_alloc_lines_dim ON budget_allocation_lines(company_id, dimension_type, dimension_id);
CREATE INDEX IF NOT EXISTS idx_budget_alloc_lines_parent ON budget_allocation_lines(parent_line_id);
