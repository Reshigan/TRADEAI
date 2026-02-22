-- Migration: 0024_trade_fund_management
-- Feature 10: Trade Fund Management
-- Fund pools, drawdowns, carryover, transfers, rules

CREATE TABLE IF NOT EXISTS trade_funds (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  fund_name TEXT NOT NULL,
  fund_code TEXT,
  fund_type TEXT DEFAULT 'trade_promotion',
  parent_fund_id TEXT,
  budget_id TEXT,
  fiscal_year INTEGER,
  currency TEXT DEFAULT 'ZAR',
  original_amount REAL DEFAULT 0,
  allocated_amount REAL DEFAULT 0,
  drawn_amount REAL DEFAULT 0,
  remaining_amount REAL DEFAULT 0,
  committed_amount REAL DEFAULT 0,
  carryover_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  owner_id TEXT,
  owner_name TEXT,
  region TEXT,
  channel TEXT,
  customer_id TEXT,
  customer_name TEXT,
  product_category TEXT,
  effective_date TEXT,
  expiry_date TEXT,
  carryover_policy TEXT DEFAULT 'forfeit',
  max_carryover_pct REAL DEFAULT 0,
  notes TEXT,
  data TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trade_fund_transactions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  fund_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  amount REAL NOT NULL,
  running_balance REAL DEFAULT 0,
  reference_type TEXT,
  reference_id TEXT,
  reference_name TEXT,
  from_fund_id TEXT,
  to_fund_id TEXT,
  customer_id TEXT,
  customer_name TEXT,
  product_id TEXT,
  product_name TEXT,
  promotion_id TEXT,
  promotion_name TEXT,
  description TEXT,
  posted_by TEXT,
  posted_at TEXT,
  reversal_id TEXT,
  status TEXT DEFAULT 'posted',
  data TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trade_fund_rules (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  fund_id TEXT,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  condition_field TEXT,
  condition_operator TEXT,
  condition_value TEXT,
  action_type TEXT,
  action_value TEXT,
  priority INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  effective_date TEXT,
  expiry_date TEXT,
  description TEXT,
  data TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_trade_funds_company ON trade_funds(company_id);
CREATE INDEX IF NOT EXISTS idx_trade_funds_status ON trade_funds(company_id, status);
CREATE INDEX IF NOT EXISTS idx_trade_funds_parent ON trade_funds(parent_fund_id);
CREATE INDEX IF NOT EXISTS idx_trade_funds_budget ON trade_funds(budget_id);
CREATE INDEX IF NOT EXISTS idx_trade_funds_customer ON trade_funds(customer_id);
CREATE INDEX IF NOT EXISTS idx_trade_funds_year ON trade_funds(company_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_trade_fund_txns_company ON trade_fund_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_trade_fund_txns_fund ON trade_fund_transactions(fund_id);
CREATE INDEX IF NOT EXISTS idx_trade_fund_txns_type ON trade_fund_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_trade_fund_txns_ref ON trade_fund_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_trade_fund_rules_company ON trade_fund_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_trade_fund_rules_fund ON trade_fund_rules(fund_id);
