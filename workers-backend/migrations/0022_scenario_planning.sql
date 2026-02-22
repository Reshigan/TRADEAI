-- Migration: 0022_scenario_planning.sql
-- Feature 8: Scenario Planning / What-If Simulator
-- Tables: scenarios, scenario_variables, scenario_results

CREATE TABLE IF NOT EXISTS scenarios (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  scenario_type TEXT DEFAULT 'promotion',
  status TEXT DEFAULT 'draft',
  base_promotion_id TEXT,
  base_promotion_name TEXT,
  base_budget_id TEXT,
  base_budget_name TEXT,
  customer_id TEXT,
  customer_name TEXT,
  product_id TEXT,
  product_name TEXT,
  category TEXT,
  brand TEXT,
  channel TEXT,
  region TEXT,
  start_date TEXT,
  end_date TEXT,
  baseline_revenue REAL DEFAULT 0,
  baseline_units REAL DEFAULT 0,
  baseline_margin_pct REAL DEFAULT 0,
  projected_revenue REAL DEFAULT 0,
  projected_units REAL DEFAULT 0,
  projected_spend REAL DEFAULT 0,
  projected_roi REAL DEFAULT 0,
  projected_lift_pct REAL DEFAULT 0,
  projected_margin_pct REAL DEFAULT 0,
  projected_incremental_revenue REAL DEFAULT 0,
  projected_incremental_units REAL DEFAULT 0,
  projected_net_profit REAL DEFAULT 0,
  confidence_score REAL DEFAULT 0,
  risk_level TEXT DEFAULT 'medium',
  recommendation TEXT,
  comparison_scenario_id TEXT,
  is_favorite INTEGER DEFAULT 0,
  tags TEXT,
  notes TEXT,
  created_by TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scenario_variables (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  variable_name TEXT NOT NULL,
  variable_type TEXT DEFAULT 'numeric',
  category TEXT DEFAULT 'promotion',
  base_value REAL DEFAULT 0,
  adjusted_value REAL DEFAULT 0,
  change_pct REAL DEFAULT 0,
  min_value REAL,
  max_value REAL,
  step_size REAL DEFAULT 1,
  unit TEXT,
  impact_on_revenue REAL DEFAULT 0,
  impact_on_units REAL DEFAULT 0,
  impact_on_roi REAL DEFAULT 0,
  sensitivity REAL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scenario_results (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  result_type TEXT DEFAULT 'simulation',
  period TEXT,
  metric_name TEXT NOT NULL,
  metric_value REAL DEFAULT 0,
  baseline_value REAL DEFAULT 0,
  variance REAL DEFAULT 0,
  variance_pct REAL DEFAULT 0,
  confidence_low REAL,
  confidence_high REAL,
  confidence_pct REAL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scenarios_company ON scenarios(company_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_type ON scenarios(company_id, scenario_type);
CREATE INDEX IF NOT EXISTS idx_scenarios_status ON scenarios(company_id, status);
CREATE INDEX IF NOT EXISTS idx_scenarios_customer ON scenarios(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_product ON scenarios(company_id, product_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_promo ON scenarios(company_id, base_promotion_id);
CREATE INDEX IF NOT EXISTS idx_scenario_vars_scenario ON scenario_variables(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_vars_company ON scenario_variables(company_id);
CREATE INDEX IF NOT EXISTS idx_scenario_results_scenario ON scenario_results(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_results_company ON scenario_results(company_id);
