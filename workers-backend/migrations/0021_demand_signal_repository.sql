-- Migration: 0021_demand_signal_repository.sql
-- Feature 7: Demand Signal Repository
-- Tables: demand_signals, demand_signal_sources

CREATE TABLE IF NOT EXISTS demand_signal_sources (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT DEFAULT 'pos',
  provider TEXT,
  frequency TEXT DEFAULT 'weekly',
  status TEXT DEFAULT 'active',
  last_sync_at TEXT,
  next_sync_at TEXT,
  record_count INTEGER DEFAULT 0,
  config TEXT DEFAULT '{}',
  credentials TEXT DEFAULT '{}',
  created_by TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS demand_signals (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  source_id TEXT,
  source_name TEXT,
  signal_type TEXT DEFAULT 'pos_sales',
  signal_date TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  granularity TEXT DEFAULT 'weekly',
  customer_id TEXT,
  customer_name TEXT,
  product_id TEXT,
  product_name TEXT,
  category TEXT,
  brand TEXT,
  channel TEXT,
  region TEXT,
  store_id TEXT,
  store_name TEXT,
  units_sold REAL DEFAULT 0,
  revenue REAL DEFAULT 0,
  volume REAL DEFAULT 0,
  avg_price REAL DEFAULT 0,
  baseline_units REAL DEFAULT 0,
  baseline_revenue REAL DEFAULT 0,
  incremental_units REAL DEFAULT 0,
  incremental_revenue REAL DEFAULT 0,
  lift_pct REAL DEFAULT 0,
  promo_flag INTEGER DEFAULT 0,
  promotion_id TEXT,
  inventory_level REAL DEFAULT 0,
  out_of_stock_flag INTEGER DEFAULT 0,
  distribution_pct REAL DEFAULT 0,
  price_index REAL DEFAULT 0,
  competitor_price REAL DEFAULT 0,
  market_share_pct REAL DEFAULT 0,
  weather_condition TEXT,
  temperature REAL,
  sentiment_score REAL,
  trend_direction TEXT,
  confidence REAL DEFAULT 0,
  anomaly_flag INTEGER DEFAULT 0,
  anomaly_type TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ds_sources_company ON demand_signal_sources(company_id);
CREATE INDEX IF NOT EXISTS idx_ds_sources_type ON demand_signal_sources(company_id, source_type);
CREATE INDEX IF NOT EXISTS idx_ds_signals_company ON demand_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_ds_signals_source ON demand_signals(company_id, source_id);
CREATE INDEX IF NOT EXISTS idx_ds_signals_type ON demand_signals(company_id, signal_type);
CREATE INDEX IF NOT EXISTS idx_ds_signals_date ON demand_signals(company_id, signal_date);
CREATE INDEX IF NOT EXISTS idx_ds_signals_customer ON demand_signals(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_ds_signals_product ON demand_signals(company_id, product_id);
CREATE INDEX IF NOT EXISTS idx_ds_signals_category ON demand_signals(company_id, category);
CREATE INDEX IF NOT EXISTS idx_ds_signals_promo ON demand_signals(company_id, promotion_id);
CREATE INDEX IF NOT EXISTS idx_ds_signals_anomaly ON demand_signals(company_id, anomaly_flag);
