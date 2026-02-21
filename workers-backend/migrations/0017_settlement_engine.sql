-- Migration 0017: Settlement Engine tables
-- Settlements represent the final financial resolution of trade promotions.
-- They reconcile accrued amounts against actual claims, deductions, and payments,
-- closing the loop on the trade promotion lifecycle.

CREATE TABLE IF NOT EXISTS settlements (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  settlement_number TEXT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  settlement_type TEXT DEFAULT 'claim',
  customer_id TEXT,
  promotion_id TEXT,
  accrual_id TEXT,
  claim_id TEXT,
  deduction_id TEXT,
  budget_id TEXT,
  gl_account TEXT,
  cost_center TEXT,
  settlement_date TEXT,
  due_date TEXT,
  accrued_amount REAL DEFAULT 0,
  claimed_amount REAL DEFAULT 0,
  approved_amount REAL DEFAULT 0,
  settled_amount REAL DEFAULT 0,
  variance_amount REAL DEFAULT 0,
  variance_pct REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'credit_note',
  payment_reference TEXT,
  payment_date TEXT,
  currency TEXT DEFAULT 'ZAR',
  notes TEXT,
  created_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  processed_by TEXT,
  processed_at TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_settlements_company ON settlements(company_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(company_id, status);
CREATE INDEX IF NOT EXISTS idx_settlements_customer ON settlements(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_settlements_promotion ON settlements(company_id, promotion_id);
CREATE INDEX IF NOT EXISTS idx_settlements_accrual ON settlements(company_id, accrual_id);
CREATE INDEX IF NOT EXISTS idx_settlements_dates ON settlements(company_id, settlement_date);

-- Settlement line items break down the settlement by product/category
CREATE TABLE IF NOT EXISTS settlement_lines (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  settlement_id TEXT NOT NULL,
  line_number INTEGER,
  product_id TEXT,
  product_name TEXT,
  category TEXT,
  description TEXT,
  quantity REAL DEFAULT 0,
  unit_price REAL DEFAULT 0,
  accrued_amount REAL DEFAULT 0,
  claimed_amount REAL DEFAULT 0,
  approved_amount REAL DEFAULT 0,
  adjustment_amount REAL DEFAULT 0,
  adjustment_reason TEXT,
  settled_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_settlement_lines_settlement ON settlement_lines(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_lines_company ON settlement_lines(company_id);
CREATE INDEX IF NOT EXISTS idx_settlement_lines_product ON settlement_lines(company_id, product_id);

-- Settlement payments track actual money movement (credit notes, EFTs, offsets)
CREATE TABLE IF NOT EXISTS settlement_payments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  settlement_id TEXT NOT NULL,
  payment_type TEXT DEFAULT 'credit_note',
  payment_date TEXT,
  amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'ZAR',
  reference TEXT,
  bank_reference TEXT,
  erp_reference TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_settlement_payments_settlement ON settlement_payments(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_payments_company ON settlement_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_settlement_payments_date ON settlement_payments(company_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_settlement_payments_status ON settlement_payments(company_id, status);
