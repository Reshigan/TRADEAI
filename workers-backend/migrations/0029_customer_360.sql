-- Feature 15: Customer 360 Dashboard (Phase 4)
-- Comprehensive customer profiles with AI insights, performance metrics, and interaction history

CREATE TABLE IF NOT EXISTS customer_360_profiles (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  customer_code TEXT,
  channel TEXT,
  sub_channel TEXT,
  tier TEXT,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  total_revenue REAL DEFAULT 0,
  total_spend REAL DEFAULT 0,
  total_claims REAL DEFAULT 0,
  total_deductions REAL DEFAULT 0,
  net_revenue REAL DEFAULT 0,
  gross_margin_pct REAL DEFAULT 0,
  trade_spend_pct REAL DEFAULT 0,
  revenue_growth_pct REAL DEFAULT 0,
  avg_order_value REAL DEFAULT 0,
  order_frequency INTEGER DEFAULT 0,
  last_order_date TEXT,
  active_promotions INTEGER DEFAULT 0,
  completed_promotions INTEGER DEFAULT 0,
  active_claims INTEGER DEFAULT 0,
  pending_deductions INTEGER DEFAULT 0,
  ltv_score REAL DEFAULT 0,
  churn_risk REAL DEFAULT 0,
  churn_reason TEXT,
  segment TEXT,
  price_sensitivity REAL DEFAULT 0,
  promo_responsiveness REAL DEFAULT 0,
  next_best_action TEXT,
  health_score REAL DEFAULT 0,
  satisfaction_score REAL DEFAULT 0,
  engagement_score REAL DEFAULT 0,
  payment_reliability REAL DEFAULT 0,
  top_products TEXT DEFAULT '[]',
  top_categories TEXT DEFAULT '[]',
  monthly_revenue TEXT DEFAULT '[]',
  monthly_spend TEXT DEFAULT '[]',
  last_calculated_at TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customer_360_insights (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT,
  metric_name TEXT,
  metric_value REAL,
  metric_unit TEXT,
  benchmark_value REAL,
  variance_pct REAL,
  trend_direction TEXT,
  recommendation TEXT,
  action_taken INTEGER DEFAULT 0,
  action_date TEXT,
  action_by TEXT,
  valid_from TEXT,
  valid_until TEXT,
  confidence REAL DEFAULT 0,
  source TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_c360_profiles_company ON customer_360_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_c360_profiles_customer ON customer_360_profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_c360_profiles_tier ON customer_360_profiles(company_id, tier);
CREATE INDEX IF NOT EXISTS idx_c360_profiles_segment ON customer_360_profiles(company_id, segment);
CREATE INDEX IF NOT EXISTS idx_c360_profiles_health ON customer_360_profiles(company_id, health_score);
CREATE INDEX IF NOT EXISTS idx_c360_insights_company ON customer_360_insights(company_id);
CREATE INDEX IF NOT EXISTS idx_c360_insights_customer ON customer_360_insights(customer_id);
CREATE INDEX IF NOT EXISTS idx_c360_insights_type ON customer_360_insights(company_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_c360_insights_severity ON customer_360_insights(company_id, severity);
