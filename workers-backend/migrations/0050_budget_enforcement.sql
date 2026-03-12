-- Sprint 1: Budget Enforcement Chain
-- Add top-level tracking columns to budgets table

ALTER TABLE budgets ADD COLUMN total_allocated REAL DEFAULT 0;
ALTER TABLE budgets ADD COLUMN total_committed REAL DEFAULT 0;
ALTER TABLE budgets ADD COLUMN total_spent REAL DEFAULT 0;
ALTER TABLE budgets ADD COLUMN total_available REAL DEFAULT 0;
ALTER TABLE budgets ADD COLUMN approved_by TEXT;
ALTER TABLE budgets ADD COLUMN approved_at TEXT;

-- Budget enforcement audit log
CREATE TABLE IF NOT EXISTS budget_transactions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  budget_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'commit', 'release', 'spend', 'allocate', 'refund'
  amount REAL NOT NULL,
  reference_type TEXT, -- 'promotion', 'trade_spend', 'claim', 'settlement'
  reference_id TEXT,
  reference_name TEXT,
  previous_committed REAL DEFAULT 0,
  previous_spent REAL DEFAULT 0,
  new_committed REAL DEFAULT 0,
  new_spent REAL DEFAULT 0,
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (budget_id) REFERENCES budgets(id)
);

CREATE INDEX IF NOT EXISTS idx_budget_transactions_budget ON budget_transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_ref ON budget_transactions(reference_type, reference_id);

-- Add budget_id to promotions if missing
-- (promotions table already has budget_amount column from initial schema)

-- Budget alerts table
CREATE TABLE IF NOT EXISTS budget_alerts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  budget_id TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'threshold_80', 'threshold_90', 'threshold_100', 'overspend'
  threshold_pct REAL,
  current_pct REAL,
  message TEXT,
  acknowledged INTEGER DEFAULT 0,
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (budget_id) REFERENCES budgets(id)
);

CREATE INDEX IF NOT EXISTS idx_budget_alerts_budget ON budget_alerts(budget_id);
