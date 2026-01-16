-- TRADEAI D1 Database Schema
-- Initial migration: Create all tables for the Workers backend

-- Companies/Tenants table
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  type TEXT DEFAULT 'manufacturer', -- manufacturer, distributor, retailer
  country TEXT DEFAULT 'ZA',
  currency TEXT DEFAULT 'ZAR',
  timezone TEXT DEFAULT 'Africa/Johannesburg',
  status TEXT DEFAULT 'active',
  settings TEXT, -- JSON blob for nested settings
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_companies_code ON companies(code);
CREATE INDEX idx_companies_type ON companies(type);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user', -- admin, manager, kam, user
  department TEXT,
  is_active INTEGER DEFAULT 1,
  login_attempts INTEGER DEFAULT 0,
  lock_until TEXT,
  last_login TEXT,
  refresh_token TEXT,
  refresh_token_expiry TEXT,
  password_changed_at TEXT,
  permissions TEXT, -- JSON array
  data TEXT, -- JSON blob for additional fields
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_role ON users(role);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  sap_customer_id TEXT,
  customer_type TEXT, -- chain, independent, wholesale
  channel TEXT, -- modern_trade, traditional_trade, wholesale
  tier TEXT, -- platinum, gold, silver, bronze, standard
  status TEXT DEFAULT 'active',
  region TEXT,
  city TEXT,
  data TEXT, -- JSON blob for contacts, address, hierarchy, etc.
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_tier ON customers(tier);
CREATE INDEX idx_customers_name ON customers(name);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  category TEXT,
  subcategory TEXT,
  brand TEXT,
  unit_price REAL DEFAULT 0,
  cost_price REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  data TEXT, -- JSON blob for hierarchy, promotion settings, etc.
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_name ON products(name);

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  promotion_type TEXT, -- price_discount, volume_discount, bogo, bundle, gift, loyalty
  status TEXT DEFAULT 'draft', -- draft, pending_approval, approved, active, completed, cancelled
  start_date TEXT,
  end_date TEXT,
  sell_in_start_date TEXT,
  sell_in_end_date TEXT,
  created_by TEXT,
  budget_id TEXT,
  data TEXT, -- JSON blob for mechanics, financial, products, customers, approvals, etc.
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (budget_id) REFERENCES budgets(id)
);

CREATE INDEX idx_promotions_company_id ON promotions(company_id);
CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_type ON promotions(promotion_type);
CREATE INDEX idx_promotions_start_date ON promotions(start_date);
CREATE INDEX idx_promotions_end_date ON promotions(end_date);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  year INTEGER,
  amount REAL DEFAULT 0,
  utilized REAL DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft, approved, active, closed
  budget_type TEXT, -- annual, quarterly, monthly
  created_by TEXT,
  data TEXT, -- JSON blob for allocations, monthly breakdown, etc.
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_budgets_company_id ON budgets(company_id);
CREATE INDEX idx_budgets_year ON budgets(year);
CREATE INDEX idx_budgets_status ON budgets(status);

-- Trade Spends table
CREATE TABLE IF NOT EXISTS trade_spends (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  spend_id TEXT,
  spend_type TEXT, -- cash_coop, off_invoice, scan_rebate, volume_rebate
  activity_type TEXT, -- trade_marketing, key_account
  amount REAL DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, paid
  customer_id TEXT,
  promotion_id TEXT,
  budget_id TEXT,
  created_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  rejected_by TEXT,
  rejected_at TEXT,
  rejection_reason TEXT,
  data TEXT, -- JSON blob for details, line items, etc.
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (promotion_id) REFERENCES promotions(id),
  FOREIGN KEY (budget_id) REFERENCES budgets(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_trade_spends_company_id ON trade_spends(company_id);
CREATE INDEX idx_trade_spends_status ON trade_spends(status);
CREATE INDEX idx_trade_spends_customer_id ON trade_spends(customer_id);
CREATE INDEX idx_trade_spends_promotion_id ON trade_spends(promotion_id);
CREATE INDEX idx_trade_spends_budget_id ON trade_spends(budget_id);
CREATE INDEX idx_trade_spends_created_at ON trade_spends(created_at);

-- Activities table (for activity feed)
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT, -- promotion, budget, trade_spend, customer, product
  entity_id TEXT,
  description TEXT,
  data TEXT, -- JSON blob for additional context
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_activities_company_id ON activities(company_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT,
  message TEXT,
  type TEXT, -- info, warning, success, error
  read INTEGER DEFAULT 0,
  data TEXT, -- JSON blob for links, actions, etc.
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_notifications_company_id ON notifications(company_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Report Runs table (for generated reports)
CREATE TABLE IF NOT EXISTS report_runs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  report_type TEXT NOT NULL,
  status TEXT DEFAULT 'processing', -- processing, completed, failed
  date_range TEXT, -- JSON blob for start/end dates
  filters TEXT, -- JSON blob for report filters
  data TEXT, -- JSON blob for report results
  created_by TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_report_runs_company_id ON report_runs(company_id);
CREATE INDEX idx_report_runs_report_type ON report_runs(report_type);
CREATE INDEX idx_report_runs_status ON report_runs(status);
CREATE INDEX idx_report_runs_created_at ON report_runs(created_at);
