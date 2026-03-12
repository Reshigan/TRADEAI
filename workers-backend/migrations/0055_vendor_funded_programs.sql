-- Market Feature 1: Vendor-Funded Trade Programs
CREATE TABLE IF NOT EXISTS vendor_funds (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  fund_type TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  total_amount REAL NOT NULL DEFAULT 0,
  committed_amount REAL DEFAULT 0,
  spent_amount REAL DEFAULT 0,
  claimed_amount REAL DEFAULT 0,
  available_amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'ZAR',
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  customer_hierarchy_level TEXT,
  customer_hierarchy_id TEXT,
  customer_hierarchy_name TEXT,
  product_hierarchy_level TEXT,
  product_hierarchy_id TEXT,
  product_hierarchy_name TEXT,
  min_spend_pct REAL DEFAULT 0,
  requires_proof_of_performance INTEGER DEFAULT 0,
  proof_types TEXT DEFAULT '[]',
  auto_renew INTEGER DEFAULT 0,
  renewal_terms TEXT,
  vendor_contact_name TEXT,
  vendor_contact_email TEXT,
  vendor_reference TEXT,
  payment_terms TEXT,
  invoice_frequency TEXT,
  created_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_funds_company ON vendor_funds(company_id);
CREATE INDEX IF NOT EXISTS idx_vendor_funds_vendor ON vendor_funds(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_funds_status ON vendor_funds(status);
CREATE INDEX IF NOT EXISTS idx_vendor_funds_dates ON vendor_funds(start_date, end_date);

CREATE TABLE IF NOT EXISTS vendor_fund_usages (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  vendor_fund_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'committed',
  proof_of_performance TEXT,
  claimed_at TEXT,
  settled_at TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (vendor_fund_id) REFERENCES vendor_funds(id)
);

CREATE INDEX IF NOT EXISTS idx_vfu_fund ON vendor_fund_usages(vendor_fund_id);
CREATE INDEX IF NOT EXISTS idx_vfu_entity ON vendor_fund_usages(entity_type, entity_id);
