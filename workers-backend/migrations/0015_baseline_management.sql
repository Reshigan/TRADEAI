-- Migration 0015: Baseline Management tables
-- Baselines are the foundation of all promotion analytics.
-- They represent "what sales would have been WITHOUT a promotion"
-- using historical shipment/POS data to model base volume per product/customer/period.

CREATE TABLE IF NOT EXISTS baselines (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  baseline_type TEXT DEFAULT 'volume',
  calculation_method TEXT DEFAULT 'historical_average',
  granularity TEXT DEFAULT 'weekly',
  customer_id TEXT,
  product_id TEXT,
  category TEXT,
  brand TEXT,
  channel TEXT,
  region TEXT,
  start_date TEXT,
  end_date TEXT,
  base_year INTEGER,
  periods_used INTEGER DEFAULT 52,
  seasonality_enabled INTEGER DEFAULT 1,
  trend_enabled INTEGER DEFAULT 1,
  outlier_removal_enabled INTEGER DEFAULT 1,
  outlier_threshold REAL DEFAULT 2.0,
  confidence_level REAL DEFAULT 0.85,
  total_base_volume REAL DEFAULT 0,
  total_base_revenue REAL DEFAULT 0,
  avg_weekly_volume REAL DEFAULT 0,
  avg_weekly_revenue REAL DEFAULT 0,
  seasonality_index TEXT DEFAULT '{}',
  trend_coefficient REAL DEFAULT 0,
  r_squared REAL DEFAULT 0,
  mape REAL DEFAULT 0,
  created_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_baselines_company ON baselines(company_id);
CREATE INDEX IF NOT EXISTS idx_baselines_status ON baselines(company_id, status);
CREATE INDEX IF NOT EXISTS idx_baselines_customer ON baselines(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_baselines_product ON baselines(company_id, product_id);

-- Baseline periods store the per-period (week/month) baseline values
CREATE TABLE IF NOT EXISTS baseline_periods (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  baseline_id TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  period_number INTEGER,
  period_label TEXT,
  base_volume REAL DEFAULT 0,
  base_revenue REAL DEFAULT 0,
  base_units REAL DEFAULT 0,
  seasonality_factor REAL DEFAULT 1.0,
  trend_adjustment REAL DEFAULT 0,
  actual_volume REAL,
  actual_revenue REAL,
  variance_volume REAL,
  variance_revenue REAL,
  variance_pct REAL,
  is_promoted INTEGER DEFAULT 0,
  promotion_id TEXT,
  incremental_volume REAL DEFAULT 0,
  incremental_revenue REAL DEFAULT 0,
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (baseline_id) REFERENCES baselines(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_baseline_periods_baseline ON baseline_periods(baseline_id);
CREATE INDEX IF NOT EXISTS idx_baseline_periods_company ON baseline_periods(company_id);
CREATE INDEX IF NOT EXISTS idx_baseline_periods_dates ON baseline_periods(company_id, period_start, period_end);

-- Volume decomposition stores the breakdown of actual sales into components
CREATE TABLE IF NOT EXISTS volume_decomposition (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  baseline_id TEXT,
  promotion_id TEXT,
  customer_id TEXT,
  product_id TEXT,
  period_start TEXT,
  period_end TEXT,
  total_volume REAL DEFAULT 0,
  base_volume REAL DEFAULT 0,
  incremental_volume REAL DEFAULT 0,
  cannibalization_volume REAL DEFAULT 0,
  pantry_loading_volume REAL DEFAULT 0,
  halo_volume REAL DEFAULT 0,
  pull_forward_volume REAL DEFAULT 0,
  post_promo_dip_volume REAL DEFAULT 0,
  total_revenue REAL DEFAULT 0,
  base_revenue REAL DEFAULT 0,
  incremental_revenue REAL DEFAULT 0,
  trade_spend REAL DEFAULT 0,
  incremental_profit REAL DEFAULT 0,
  roi REAL DEFAULT 0,
  lift_pct REAL DEFAULT 0,
  efficiency_score REAL DEFAULT 0,
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_vol_decomp_company ON volume_decomposition(company_id);
CREATE INDEX IF NOT EXISTS idx_vol_decomp_baseline ON volume_decomposition(baseline_id);
CREATE INDEX IF NOT EXISTS idx_vol_decomp_promotion ON volume_decomposition(company_id, promotion_id);
CREATE INDEX IF NOT EXISTS idx_vol_decomp_customer ON volume_decomposition(company_id, customer_id);
