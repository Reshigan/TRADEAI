-- Migration 0067: Baseline Sales History & Volume Decomposition
-- Adds sales_history table for ML baseline calculation input,
-- volume_decomposition for promo effect breakdown, and
-- baseline_calculation_logs for audit trail.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Sales History (imported data for baseline calculation)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_history (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  import_batch_id TEXT,           -- links rows to a single import job
  customer_id TEXT,
  product_id TEXT,
  period_start TEXT NOT NULL,     -- ISO date: start of the period
  period_end TEXT NOT NULL,       -- ISO date: end of the period
  granularity TEXT DEFAULT 'weekly', -- daily | weekly | monthly
  volume REAL DEFAULT 0,
  revenue REAL DEFAULT 0,
  units REAL DEFAULT 0,
  cost REAL DEFAULT 0,
  is_promoted INTEGER DEFAULT 0, -- 1 if this period had active promotion
  promotion_id TEXT,              -- which promotion was active (if any)
  channel TEXT,
  region TEXT,
  source TEXT DEFAULT 'import',   -- import | sales_transactions | manual
  data TEXT DEFAULT '{}',         -- extra metadata
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sales_hist_company ON sales_history(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_hist_customer ON sales_history(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_hist_product ON sales_history(company_id, product_id);
CREATE INDEX IF NOT EXISTS idx_sales_hist_dates ON sales_history(company_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_sales_hist_batch ON sales_history(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_sales_hist_promo ON sales_history(company_id, is_promoted);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Volume Decomposition enhancements (table already exists from 0015)
--    Add new columns for ML-powered decomposition
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE volume_decomposition ADD COLUMN baseline_period_id TEXT;
ALTER TABLE volume_decomposition ADD COLUMN seasonality_factor REAL DEFAULT 1.0;
ALTER TABLE volume_decomposition ADD COLUMN trend_factor REAL DEFAULT 1.0;
ALTER TABLE volume_decomposition ADD COLUMN confidence_score REAL DEFAULT 0;
ALTER TABLE volume_decomposition ADD COLUMN method TEXT DEFAULT 'calculated';

CREATE INDEX IF NOT EXISTS idx_vol_decomp_product ON volume_decomposition(company_id, product_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Baseline Calculation Logs (audit trail for ML calculations)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS baseline_calculation_logs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  baseline_id TEXT NOT NULL,
  calculation_type TEXT NOT NULL,  -- ml_calculate | rollup | drilldown | recalculate
  status TEXT DEFAULT 'pending',   -- pending | running | completed | failed
  method TEXT,                     -- moving_average | linear_regression | seasonal_decomposition | prophet_like
  input_params TEXT DEFAULT '{}',  -- JSON: hierarchy scope, date range, options
  input_row_count INTEGER DEFAULT 0,
  output_period_count INTEGER DEFAULT 0,
  metrics TEXT DEFAULT '{}',       -- JSON: mape, r_squared, rmse, etc.
  duration_ms INTEGER DEFAULT 0,
  error_message TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_bcl_company ON baseline_calculation_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_bcl_baseline ON baseline_calculation_logs(baseline_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Sales History Import Jobs (track CSV import status)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_history_imports (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  filename TEXT,
  status TEXT DEFAULT 'pending',   -- pending | mapping | validating | importing | completed | failed
  total_rows INTEGER DEFAULT 0,
  imported_rows INTEGER DEFAULT 0,
  skipped_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  column_mapping TEXT DEFAULT '{}', -- JSON: maps CSV columns to sales_history fields
  validation_errors TEXT DEFAULT '[]', -- JSON array of row-level errors
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_shi_company ON sales_history_imports(company_id);
