-- Feature 12: Compliance & Audit Engine (Phase 3)
-- Tables for compliance rules, audit trails, violations, and compliance reports

CREATE TABLE IF NOT EXISTS compliance_rules (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL DEFAULT 'threshold',
  category TEXT NOT NULL DEFAULT 'general',
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  entity_type TEXT NOT NULL,
  field_name TEXT,
  operator TEXT NOT NULL DEFAULT 'greater_than',
  threshold_value TEXT,
  threshold_min TEXT,
  threshold_max TEXT,
  action_on_violation TEXT NOT NULL DEFAULT 'flag',
  auto_enforce INTEGER NOT NULL DEFAULT 0,
  notification_roles TEXT,
  escalation_hours INTEGER DEFAULT 24,
  effective_date TEXT,
  expiry_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  violation_count INTEGER DEFAULT 0,
  last_violation_at TEXT,
  created_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_trails (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'update',
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  user_id TEXT,
  user_name TEXT,
  user_role TEXT,
  ip_address TEXT,
  session_id TEXT,
  approval_id TEXT,
  compliance_rule_id TEXT,
  risk_score INTEGER DEFAULT 0,
  flagged INTEGER DEFAULT 0,
  flag_reason TEXT,
  reviewed INTEGER DEFAULT 0,
  reviewed_by TEXT,
  reviewed_at TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS compliance_violations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  rule_name TEXT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  violation_type TEXT NOT NULL DEFAULT 'threshold_breach',
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  description TEXT,
  field_name TEXT,
  expected_value TEXT,
  actual_value TEXT,
  variance_amount REAL DEFAULT 0,
  variance_pct REAL DEFAULT 0,
  detected_at TEXT NOT NULL DEFAULT (datetime('now')),
  detected_by TEXT DEFAULT 'system',
  assigned_to TEXT,
  resolved_by TEXT,
  resolved_at TEXT,
  resolution_notes TEXT,
  resolution_action TEXT,
  escalated INTEGER DEFAULT 0,
  escalated_to TEXT,
  escalated_at TEXT,
  risk_score INTEGER DEFAULT 0,
  financial_impact REAL DEFAULT 0,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS compliance_reports (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL DEFAULT 'summary',
  status TEXT NOT NULL DEFAULT 'draft',
  period_start TEXT,
  period_end TEXT,
  total_rules INTEGER DEFAULT 0,
  active_rules INTEGER DEFAULT 0,
  total_violations INTEGER DEFAULT 0,
  open_violations INTEGER DEFAULT 0,
  resolved_violations INTEGER DEFAULT 0,
  critical_violations INTEGER DEFAULT 0,
  total_audits INTEGER DEFAULT 0,
  flagged_audits INTEGER DEFAULT 0,
  avg_risk_score REAL DEFAULT 0,
  total_financial_impact REAL DEFAULT 0,
  compliance_score REAL DEFAULT 0,
  generated_at TEXT,
  generated_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_compliance_rules_company ON compliance_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_status ON compliance_rules(company_id, status);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_entity ON compliance_rules(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_trails_company ON audit_trails(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_entity ON audit_trails(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_user ON audit_trails(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_action ON audit_trails(company_id, action_type);
CREATE INDEX IF NOT EXISTS idx_audit_trails_created ON audit_trails(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_company ON compliance_violations(company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_status ON compliance_violations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_rule ON compliance_violations(rule_id);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_entity ON compliance_violations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_company ON compliance_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON compliance_reports(company_id, report_type);
