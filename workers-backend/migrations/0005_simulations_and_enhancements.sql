-- TRADEAI D1 Database Schema Enhancement
-- Migration: Add simulations table and enhance existing tables

-- Simulations table for persisting simulation runs
CREATE TABLE IF NOT EXISTS simulations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  simulation_type TEXT DEFAULT 'promotion', -- promotion, budget, scenario
  status TEXT DEFAULT 'draft', -- draft, saved, applied
  config TEXT, -- JSON blob for simulation configuration
  results TEXT, -- JSON blob for simulation results
  scenarios TEXT, -- JSON blob for multiple scenarios
  constraints TEXT, -- JSON blob for constraints
  created_by TEXT,
  applied_to TEXT, -- ID of promotion/budget created from this simulation
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_simulations_company_id ON simulations(company_id);
CREATE INDEX idx_simulations_status ON simulations(status);
CREATE INDEX idx_simulations_created_by ON simulations(created_by);
CREATE INDEX idx_simulations_created_at ON simulations(created_at);

-- Saved Views table for user-specific saved filters/views
CREATE TABLE IF NOT EXISTS saved_views (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- promotions, budgets, trade_spends, customers, products
  filters TEXT, -- JSON blob for filter configuration
  columns TEXT, -- JSON blob for visible columns
  sort_by TEXT,
  sort_order TEXT DEFAULT 'desc',
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_saved_views_company_id ON saved_views(company_id);
CREATE INDEX idx_saved_views_user_id ON saved_views(user_id);
CREATE INDEX idx_saved_views_entity_type ON saved_views(entity_type);

-- Data Quality Issues table for tracking completeness
CREATE TABLE IF NOT EXISTS data_quality_issues (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  issue_type TEXT NOT NULL, -- missing, invalid, inconsistent
  severity TEXT DEFAULT 'warning', -- info, warning, error
  message TEXT,
  resolved INTEGER DEFAULT 0,
  resolved_at TEXT,
  resolved_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX idx_data_quality_company_id ON data_quality_issues(company_id);
CREATE INDEX idx_data_quality_entity_type ON data_quality_issues(entity_type);
CREATE INDEX idx_data_quality_resolved ON data_quality_issues(resolved);
