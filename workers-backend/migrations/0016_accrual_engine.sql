-- Migration 0016: Accrual Engine tables
-- Accruals track the financial liability for trade promotions over time.
-- They represent money owed to customers based on promotion performance,
-- calculated periodically and posted to the GL for financial reporting.

CREATE TABLE IF NOT EXISTS accruals (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  accrual_type TEXT DEFAULT 'promotion',
  calculation_method TEXT DEFAULT 'percentage_of_sales',
  frequency TEXT DEFAULT 'monthly',
  customer_id TEXT,
  product_id TEXT,
  promotion_id TEXT,
  budget_id TEXT,
  trading_term_id TEXT,
  baseline_id TEXT,
  gl_account TEXT,
  cost_center TEXT,
  start_date TEXT,
  end_date TEXT,
  rate REAL DEFAULT 0,
  rate_type TEXT DEFAULT 'percentage',
  base_amount REAL DEFAULT 0,
  accrued_amount REAL DEFAULT 0,
  posted_amount REAL DEFAULT 0,
  reversed_amount REAL DEFAULT 0,
  settled_amount REAL DEFAULT 0,
  remaining_amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'ZAR',
  last_calculated_at TEXT,
  last_posted_at TEXT,
  auto_calculate INTEGER DEFAULT 1,
  auto_post INTEGER DEFAULT 0,
  created_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_accruals_company ON accruals(company_id);
CREATE INDEX IF NOT EXISTS idx_accruals_status ON accruals(company_id, status);
CREATE INDEX IF NOT EXISTS idx_accruals_customer ON accruals(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_accruals_promotion ON accruals(company_id, promotion_id);
CREATE INDEX IF NOT EXISTS idx_accruals_dates ON accruals(company_id, start_date, end_date);

-- Accrual periods store per-period calculated amounts
CREATE TABLE IF NOT EXISTS accrual_periods (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  accrual_id TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  period_number INTEGER,
  period_label TEXT,
  base_sales REAL DEFAULT 0,
  accrual_rate REAL DEFAULT 0,
  calculated_amount REAL DEFAULT 0,
  adjusted_amount REAL DEFAULT 0,
  posted_amount REAL DEFAULT 0,
  variance_amount REAL DEFAULT 0,
  variance_pct REAL DEFAULT 0,
  status TEXT DEFAULT 'calculated',
  posted_at TEXT,
  posted_by TEXT,
  gl_journal_ref TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (accrual_id) REFERENCES accruals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_accrual_periods_accrual ON accrual_periods(accrual_id);
CREATE INDEX IF NOT EXISTS idx_accrual_periods_company ON accrual_periods(company_id);
CREATE INDEX IF NOT EXISTS idx_accrual_periods_dates ON accrual_periods(company_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_accrual_periods_status ON accrual_periods(company_id, status);

-- Accrual journal entries track GL postings for audit trail
CREATE TABLE IF NOT EXISTS accrual_journals (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  accrual_id TEXT NOT NULL,
  accrual_period_id TEXT,
  journal_type TEXT DEFAULT 'accrual',
  journal_date TEXT NOT NULL,
  debit_account TEXT,
  credit_account TEXT,
  amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'ZAR',
  reference TEXT,
  narration TEXT,
  status TEXT DEFAULT 'posted',
  posted_by TEXT,
  reversed_by TEXT,
  reversed_at TEXT,
  reversal_journal_id TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (accrual_id) REFERENCES accruals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_accrual_journals_accrual ON accrual_journals(accrual_id);
CREATE INDEX IF NOT EXISTS idx_accrual_journals_company ON accrual_journals(company_id);
CREATE INDEX IF NOT EXISTS idx_accrual_journals_date ON accrual_journals(company_id, journal_date);
CREATE INDEX IF NOT EXISTS idx_accrual_journals_type ON accrual_journals(company_id, journal_type);
