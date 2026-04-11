-- Cockpit Layer Schema Extensions
-- Migration 0073: Cockpit Support

-- Add reports_to column for manager-team relationship
ALTER TABLE users ADD COLUMN reports_to TEXT DEFAULT NULL;

-- Add priority and due_date to approvals for task queue sorting
ALTER TABLE approvals ADD COLUMN priority TEXT DEFAULT 'medium';
ALTER TABLE approvals ADD COLUMN due_date TEXT DEFAULT NULL;

-- Create user_preferences table for cockpit customisation
CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  dashboard_layout TEXT DEFAULT '{}',
  pinned_widgets TEXT DEFAULT '[]',
  notification_prefs TEXT DEFAULT '{}',
  theme TEXT DEFAULT 'auto',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(company_id, user_id)
);

-- Index for /api/my/* query performance
CREATE INDEX IF NOT EXISTS idx_promotions_created_by ON promotions(company_id, created_by, status);
CREATE INDEX IF NOT EXISTS idx_approvals_assigned ON approvals(company_id, assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_user ON customer_assignments(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_trade_spends_promo ON trade_spends(company_id, promotion_id);
CREATE INDEX IF NOT EXISTS idx_users_reports_to ON users(company_id, reports_to);
CREATE INDEX IF NOT EXISTS idx_claims_created_by ON claims(company_id, created_by, status);
