-- Migration 0013: Add missing tables for transactions, alerts, customer_assignments, announcements, policies, courses, games

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  transaction_number TEXT,
  transaction_type TEXT DEFAULT 'accrual',
  status TEXT DEFAULT 'pending',
  customer_id TEXT,
  product_id TEXT,
  amount REAL DEFAULT 0,
  description TEXT,
  reference TEXT,
  payment_reference TEXT,
  created_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  rejected_by TEXT,
  rejected_at TEXT,
  rejection_reason TEXT,
  settled_at TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_company ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(company_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(company_id, customer_id);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  alert_type TEXT DEFAULT 'system',
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  title TEXT,
  message TEXT,
  entity_type TEXT,
  entity_id TEXT,
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  dismissed_at TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_alerts_company ON alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(company_id, status);

CREATE TABLE IF NOT EXISTS customer_assignments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'kam',
  status TEXT DEFAULT 'active',
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_customer_assignments_company ON customer_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_customer ON customer_assignments(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_user ON customer_assignments(company_id, user_id);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  title TEXT,
  content TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'draft',
  target_audience TEXT DEFAULT 'all',
  published_at TEXT,
  created_by TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_announcements_company ON announcements(company_id);

CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  title TEXT,
  content TEXT,
  category TEXT DEFAULT 'general',
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'draft',
  effective_date TEXT,
  published_at TEXT,
  created_by TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_policies_company ON policies(company_id);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  difficulty TEXT DEFAULT 'beginner',
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'draft',
  content_url TEXT,
  created_by TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_courses_company ON courses(company_id);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  game_type TEXT DEFAULT 'quiz',
  difficulty TEXT DEFAULT 'medium',
  points INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_games_company ON games(company_id);
