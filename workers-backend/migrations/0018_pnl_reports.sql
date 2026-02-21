-- Migration 0018: P&L Reports (Profit & Loss by Customer/Promotion)
-- Part of Phase 1 Financial Foundation

-- Main P&L report table — stores generated P&L snapshots
CREATE TABLE IF NOT EXISTS pnl_reports (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  report_type TEXT DEFAULT 'customer',
  period_type TEXT DEFAULT 'monthly',
  start_date TEXT,
  end_date TEXT,
  customer_id TEXT,
  promotion_id TEXT,
  product_id TEXT,
  category TEXT,
  channel TEXT,
  region TEXT,
  gross_sales REAL DEFAULT 0,
  trade_spend REAL DEFAULT 0,
  net_sales REAL DEFAULT 0,
  cogs REAL DEFAULT 0,
  gross_profit REAL DEFAULT 0,
  gross_margin_pct REAL DEFAULT 0,
  accruals REAL DEFAULT 0,
  settlements REAL DEFAULT 0,
  claims REAL DEFAULT 0,
  deductions REAL DEFAULT 0,
  net_trade_cost REAL DEFAULT 0,
  net_profit REAL DEFAULT 0,
  net_margin_pct REAL DEFAULT 0,
  budget_amount REAL DEFAULT 0,
  budget_variance REAL DEFAULT 0,
  budget_variance_pct REAL DEFAULT 0,
  roi REAL DEFAULT 0,
  currency TEXT DEFAULT 'ZAR',
  generated_at TEXT,
  generated_by TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- P&L line items — per-period or per-entity breakdown rows
CREATE TABLE IF NOT EXISTS pnl_line_items (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  report_id TEXT NOT NULL,
  line_type TEXT DEFAULT 'period',
  line_label TEXT,
  sort_order INTEGER DEFAULT 0,
  customer_id TEXT,
  customer_name TEXT,
  promotion_id TEXT,
  promotion_name TEXT,
  product_id TEXT,
  product_name TEXT,
  period_start TEXT,
  period_end TEXT,
  gross_sales REAL DEFAULT 0,
  trade_spend REAL DEFAULT 0,
  net_sales REAL DEFAULT 0,
  cogs REAL DEFAULT 0,
  gross_profit REAL DEFAULT 0,
  gross_margin_pct REAL DEFAULT 0,
  accruals REAL DEFAULT 0,
  settlements REAL DEFAULT 0,
  claims REAL DEFAULT 0,
  deductions REAL DEFAULT 0,
  net_trade_cost REAL DEFAULT 0,
  net_profit REAL DEFAULT 0,
  net_margin_pct REAL DEFAULT 0,
  budget_amount REAL DEFAULT 0,
  budget_variance REAL DEFAULT 0,
  roi REAL DEFAULT 0,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pnl_reports_company ON pnl_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_pnl_reports_type ON pnl_reports(company_id, report_type);
CREATE INDEX IF NOT EXISTS idx_pnl_reports_status ON pnl_reports(company_id, status);
CREATE INDEX IF NOT EXISTS idx_pnl_reports_customer ON pnl_reports(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_pnl_reports_promotion ON pnl_reports(company_id, promotion_id);
CREATE INDEX IF NOT EXISTS idx_pnl_reports_dates ON pnl_reports(company_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pnl_line_items_report ON pnl_line_items(report_id);
CREATE INDEX IF NOT EXISTS idx_pnl_line_items_company ON pnl_line_items(company_id);
CREATE INDEX IF NOT EXISTS idx_pnl_line_items_customer ON pnl_line_items(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_pnl_line_items_promotion ON pnl_line_items(company_id, promotion_id);
