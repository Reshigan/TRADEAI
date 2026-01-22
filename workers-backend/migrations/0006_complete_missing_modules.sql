-- TRADEAI D1 Database Schema Enhancement
-- Migration: Add all missing tables for complete platform functionality

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  vendor_type TEXT, -- supplier, service_provider, agency
  status TEXT DEFAULT 'active',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  region TEXT,
  country TEXT DEFAULT 'ZA',
  payment_terms TEXT,
  tax_number TEXT,
  bank_details TEXT, -- JSON blob
  data TEXT, -- JSON blob for additional fields
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX idx_vendors_company_id ON vendors(company_id);
CREATE INDEX idx_vendors_code ON vendors(code);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_name ON vendors(name);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT, -- seasonal, tactical, brand, trade
  status TEXT DEFAULT 'draft', -- draft, pending_approval, approved, active, completed, cancelled
  start_date TEXT,
  end_date TEXT,
  budget_amount REAL DEFAULT 0,
  spent_amount REAL DEFAULT 0,
  target_revenue REAL DEFAULT 0,
  actual_revenue REAL DEFAULT 0,
  target_volume REAL DEFAULT 0,
  actual_volume REAL DEFAULT 0,
  created_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  data TEXT, -- JSON blob for promotions, customers, products, etc.
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_campaigns_company_id ON campaigns(company_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX idx_campaigns_end_date ON campaigns(end_date);

-- Trading Terms table
CREATE TABLE IF NOT EXISTS trading_terms (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  term_type TEXT, -- volume_rebate, growth_rebate, listing_fee, marketing_contribution, payment_terms
  status TEXT DEFAULT 'draft', -- draft, pending_approval, approved, active, expired, cancelled
  customer_id TEXT,
  start_date TEXT,
  end_date TEXT,
  rate REAL DEFAULT 0, -- percentage or fixed amount
  rate_type TEXT DEFAULT 'percentage', -- percentage, fixed
  threshold REAL DEFAULT 0, -- minimum threshold for rebate
  cap REAL, -- maximum cap
  payment_frequency TEXT, -- monthly, quarterly, annually
  calculation_basis TEXT, -- revenue, volume, margin
  created_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  data TEXT, -- JSON blob for tiers, conditions, etc.
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_trading_terms_company_id ON trading_terms(company_id);
CREATE INDEX idx_trading_terms_customer_id ON trading_terms(customer_id);
CREATE INDEX idx_trading_terms_status ON trading_terms(status);
CREATE INDEX idx_trading_terms_term_type ON trading_terms(term_type);
CREATE INDEX idx_trading_terms_start_date ON trading_terms(start_date);

-- Rebates table
CREATE TABLE IF NOT EXISTS rebates (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rebate_type TEXT, -- volume, growth, loyalty, promotional, retrospective
  status TEXT DEFAULT 'draft', -- draft, pending_approval, approved, active, calculating, settled, cancelled
  customer_id TEXT,
  trading_term_id TEXT,
  start_date TEXT,
  end_date TEXT,
  rate REAL DEFAULT 0,
  rate_type TEXT DEFAULT 'percentage',
  threshold REAL DEFAULT 0,
  cap REAL,
  accrued_amount REAL DEFAULT 0,
  settled_amount REAL DEFAULT 0,
  calculation_basis TEXT, -- revenue, volume, margin
  settlement_frequency TEXT, -- monthly, quarterly, annually
  last_calculated_at TEXT,
  created_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  data TEXT, -- JSON blob for tiers, products, calculations, etc.
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (trading_term_id) REFERENCES trading_terms(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_rebates_company_id ON rebates(company_id);
CREATE INDEX idx_rebates_customer_id ON rebates(customer_id);
CREATE INDEX idx_rebates_status ON rebates(status);
CREATE INDEX idx_rebates_rebate_type ON rebates(rebate_type);
CREATE INDEX idx_rebates_start_date ON rebates(start_date);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  claim_number TEXT,
  claim_type TEXT, -- promotion, rebate, damage, shortage, pricing
  status TEXT DEFAULT 'pending', -- pending, under_review, approved, partially_approved, rejected, settled
  customer_id TEXT,
  promotion_id TEXT,
  rebate_id TEXT,
  claimed_amount REAL DEFAULT 0,
  approved_amount REAL DEFAULT 0,
  settled_amount REAL DEFAULT 0,
  claim_date TEXT,
  due_date TEXT,
  settlement_date TEXT,
  reason TEXT,
  supporting_documents TEXT, -- JSON array of document URLs
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_notes TEXT,
  created_by TEXT,
  data TEXT, -- JSON blob for line items, history, etc.
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (promotion_id) REFERENCES promotions(id),
  FOREIGN KEY (rebate_id) REFERENCES rebates(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_claims_company_id ON claims(company_id);
CREATE INDEX idx_claims_customer_id ON claims(customer_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_claim_type ON claims(claim_type);
CREATE INDEX idx_claims_claim_date ON claims(claim_date);

-- Deductions table
CREATE TABLE IF NOT EXISTS deductions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  deduction_number TEXT,
  deduction_type TEXT, -- promotion, rebate, damage, shortage, pricing, unauthorized
  status TEXT DEFAULT 'open', -- open, under_review, matched, disputed, approved, written_off
  customer_id TEXT,
  invoice_number TEXT,
  invoice_date TEXT,
  deduction_amount REAL DEFAULT 0,
  matched_amount REAL DEFAULT 0,
  remaining_amount REAL DEFAULT 0,
  deduction_date TEXT,
  due_date TEXT,
  reason_code TEXT,
  reason_description TEXT,
  matched_to TEXT, -- JSON array of matched claim/promotion IDs
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_notes TEXT,
  created_by TEXT,
  data TEXT, -- JSON blob for line items, history, etc.
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_deductions_company_id ON deductions(company_id);
CREATE INDEX idx_deductions_customer_id ON deductions(customer_id);
CREATE INDEX idx_deductions_status ON deductions(status);
CREATE INDEX idx_deductions_deduction_type ON deductions(deduction_type);
CREATE INDEX idx_deductions_deduction_date ON deductions(deduction_date);

-- Approvals table (for centralized approval workflow)
CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- promotion, budget, trade_spend, rebate, trading_term, claim, campaign
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  amount REAL DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, cancelled, escalated
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  requested_by TEXT,
  requested_at TEXT,
  assigned_to TEXT,
  approved_by TEXT,
  approved_at TEXT,
  rejected_by TEXT,
  rejected_at TEXT,
  rejection_reason TEXT,
  comments TEXT,
  due_date TEXT,
  sla_hours INTEGER DEFAULT 48,
  escalated_to TEXT,
  escalated_at TEXT,
  data TEXT, -- JSON blob for approval chain, history, etc.
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE INDEX idx_approvals_company_id ON approvals(company_id);
CREATE INDEX idx_approvals_entity_type ON approvals(entity_type);
CREATE INDEX idx_approvals_entity_id ON approvals(entity_id);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_assigned_to ON approvals(assigned_to);
CREATE INDEX idx_approvals_requested_by ON approvals(requested_by);
CREATE INDEX idx_approvals_due_date ON approvals(due_date);

-- Data Lineage table (for audit trail and data governance)
CREATE TABLE IF NOT EXISTS data_lineage (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  change_type TEXT, -- create, update, delete, calculate, import
  source TEXT, -- manual, import, calculation, api
  source_details TEXT, -- JSON blob for import file, calculation method, etc.
  changed_by TEXT,
  changed_at TEXT DEFAULT (datetime('now')),
  data TEXT, -- JSON blob for additional context
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE INDEX idx_data_lineage_company_id ON data_lineage(company_id);
CREATE INDEX idx_data_lineage_entity_type ON data_lineage(entity_type);
CREATE INDEX idx_data_lineage_entity_id ON data_lineage(entity_id);
CREATE INDEX idx_data_lineage_changed_at ON data_lineage(changed_at);

-- Forecasts table
CREATE TABLE IF NOT EXISTS forecasts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  forecast_type TEXT, -- budget, demand, revenue, volume
  status TEXT DEFAULT 'draft', -- draft, active, archived
  period_type TEXT, -- monthly, quarterly, annually
  start_period TEXT,
  end_period TEXT,
  base_year INTEGER,
  forecast_year INTEGER,
  total_forecast REAL DEFAULT 0,
  total_actual REAL DEFAULT 0,
  variance REAL DEFAULT 0,
  variance_percent REAL DEFAULT 0,
  method TEXT, -- historical, growth_rate, manual, ml_predicted
  confidence_level REAL,
  created_by TEXT,
  data TEXT, -- JSON blob for period breakdowns, assumptions, etc.
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_forecasts_company_id ON forecasts(company_id);
CREATE INDEX idx_forecasts_forecast_type ON forecasts(forecast_type);
CREATE INDEX idx_forecasts_status ON forecasts(status);
CREATE INDEX idx_forecasts_forecast_year ON forecasts(forecast_year);

-- KAM Wallet table (for Key Account Manager budget tracking)
CREATE TABLE IF NOT EXISTS kam_wallets (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  year INTEGER,
  quarter INTEGER,
  month INTEGER,
  allocated_amount REAL DEFAULT 0,
  utilized_amount REAL DEFAULT 0,
  committed_amount REAL DEFAULT 0,
  available_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  data TEXT, -- JSON blob for breakdown by customer, category, etc.
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_kam_wallets_company_id ON kam_wallets(company_id);
CREATE INDEX idx_kam_wallets_user_id ON kam_wallets(user_id);
CREATE INDEX idx_kam_wallets_year ON kam_wallets(year);

-- Import Jobs table (for tracking data imports)
CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  import_type TEXT, -- customers, products, promotions, budgets, trade_spends, sales
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  file_name TEXT,
  file_url TEXT,
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  success_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  errors TEXT, -- JSON array of error details
  mapping TEXT, -- JSON blob for column mapping
  options TEXT, -- JSON blob for import options
  started_at TEXT,
  completed_at TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_import_jobs_company_id ON import_jobs(company_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_jobs_import_type ON import_jobs(import_type);
CREATE INDEX idx_import_jobs_created_at ON import_jobs(created_at);
