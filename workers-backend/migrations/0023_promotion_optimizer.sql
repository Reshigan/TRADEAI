-- Migration: 0023_promotion_optimizer.sql
-- Feature 9: Promotion Optimization Engine
-- Tables: promotion_optimizations, optimization_recommendations, optimization_constraints

CREATE TABLE IF NOT EXISTS promotion_optimizations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  optimization_type TEXT DEFAULT 'roi_maximize',
  status TEXT DEFAULT 'draft',
  objective TEXT DEFAULT 'maximize_roi',
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
  budget_limit REAL DEFAULT 0,
  min_roi_threshold REAL DEFAULT 0,
  min_lift_threshold REAL DEFAULT 0,
  max_discount_pct REAL DEFAULT 50,
  baseline_revenue REAL DEFAULT 0,
  baseline_units REAL DEFAULT 0,
  baseline_margin_pct REAL DEFAULT 0,
  optimized_spend REAL DEFAULT 0,
  optimized_revenue REAL DEFAULT 0,
  optimized_roi REAL DEFAULT 0,
  optimized_lift_pct REAL DEFAULT 0,
  optimized_margin_pct REAL DEFAULT 0,
  optimized_incremental_revenue REAL DEFAULT 0,
  optimized_net_profit REAL DEFAULT 0,
  improvement_pct REAL DEFAULT 0,
  confidence_score REAL DEFAULT 0,
  model_version TEXT,
  run_count INTEGER DEFAULT 0,
  last_run_at TEXT,
  created_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS optimization_recommendations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  optimization_id TEXT NOT NULL,
  recommendation_type TEXT DEFAULT 'promotion',
  priority INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  current_value REAL DEFAULT 0,
  recommended_value REAL DEFAULT 0,
  change_pct REAL DEFAULT 0,
  expected_impact_revenue REAL DEFAULT 0,
  expected_impact_roi REAL DEFAULT 0,
  expected_impact_units REAL DEFAULT 0,
  expected_impact_margin REAL DEFAULT 0,
  confidence REAL DEFAULT 0,
  risk_level TEXT DEFAULT 'medium',
  category TEXT,
  metric_name TEXT,
  rationale TEXT,
  action_taken TEXT DEFAULT 'pending',
  applied_at TEXT,
  sort_order INTEGER DEFAULT 0,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (optimization_id) REFERENCES promotion_optimizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS optimization_constraints (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  optimization_id TEXT NOT NULL,
  constraint_name TEXT NOT NULL,
  constraint_type TEXT DEFAULT 'budget',
  operator TEXT DEFAULT 'lte',
  threshold_value REAL DEFAULT 0,
  current_value REAL DEFAULT 0,
  is_violated INTEGER DEFAULT 0,
  severity TEXT DEFAULT 'warning',
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (optimization_id) REFERENCES promotion_optimizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_promo_opt_company ON promotion_optimizations(company_id);
CREATE INDEX IF NOT EXISTS idx_promo_opt_type ON promotion_optimizations(company_id, optimization_type);
CREATE INDEX IF NOT EXISTS idx_promo_opt_status ON promotion_optimizations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_promo_opt_customer ON promotion_optimizations(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_promo_opt_product ON promotion_optimizations(company_id, product_id);
CREATE INDEX IF NOT EXISTS idx_opt_recs_optimization ON optimization_recommendations(optimization_id);
CREATE INDEX IF NOT EXISTS idx_opt_recs_company ON optimization_recommendations(company_id);
CREATE INDEX IF NOT EXISTS idx_opt_recs_action ON optimization_recommendations(action_taken);
CREATE INDEX IF NOT EXISTS idx_opt_constraints_optimization ON optimization_constraints(optimization_id);
CREATE INDEX IF NOT EXISTS idx_opt_constraints_company ON optimization_constraints(company_id);
