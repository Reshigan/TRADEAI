-- Migration: 0020_trade_calendar.sql
-- Feature 6: Trade Calendar & Constraint Planning
-- Tables: trade_calendar_events, trade_calendar_constraints

CREATE TABLE IF NOT EXISTS trade_calendar_events (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'promotion',
  status TEXT DEFAULT 'draft',
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  all_day INTEGER DEFAULT 1,
  recurrence TEXT,
  color TEXT DEFAULT '#7C3AED',
  customer_id TEXT,
  customer_name TEXT,
  product_id TEXT,
  product_name TEXT,
  promotion_id TEXT,
  budget_id TEXT,
  channel TEXT,
  region TEXT,
  category TEXT,
  brand TEXT,
  planned_spend REAL DEFAULT 0,
  actual_spend REAL DEFAULT 0,
  planned_volume REAL DEFAULT 0,
  actual_volume REAL DEFAULT 0,
  planned_revenue REAL DEFAULT 0,
  actual_revenue REAL DEFAULT 0,
  roi REAL DEFAULT 0,
  lift_pct REAL DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  tags TEXT,
  notes TEXT,
  created_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trade_calendar_constraints (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  constraint_type TEXT DEFAULT 'blackout',
  status TEXT DEFAULT 'active',
  scope TEXT DEFAULT 'global',
  start_date TEXT,
  end_date TEXT,
  day_of_week TEXT,
  customer_id TEXT,
  customer_name TEXT,
  product_id TEXT,
  product_name TEXT,
  channel TEXT,
  region TEXT,
  category TEXT,
  brand TEXT,
  max_concurrent_promotions INTEGER,
  max_spend_amount REAL,
  min_gap_days INTEGER DEFAULT 0,
  max_discount_pct REAL,
  min_lead_time_days INTEGER DEFAULT 0,
  require_approval INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  violation_action TEXT DEFAULT 'warn',
  notes TEXT,
  created_by TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cal_events_company ON trade_calendar_events(company_id);
CREATE INDEX IF NOT EXISTS idx_cal_events_status ON trade_calendar_events(company_id, status);
CREATE INDEX IF NOT EXISTS idx_cal_events_dates ON trade_calendar_events(company_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_cal_events_type ON trade_calendar_events(company_id, event_type);
CREATE INDEX IF NOT EXISTS idx_cal_events_customer ON trade_calendar_events(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_cal_events_promotion ON trade_calendar_events(company_id, promotion_id);
CREATE INDEX IF NOT EXISTS idx_cal_constraints_company ON trade_calendar_constraints(company_id);
CREATE INDEX IF NOT EXISTS idx_cal_constraints_type ON trade_calendar_constraints(company_id, constraint_type);
CREATE INDEX IF NOT EXISTS idx_cal_constraints_dates ON trade_calendar_constraints(company_id, start_date, end_date);
