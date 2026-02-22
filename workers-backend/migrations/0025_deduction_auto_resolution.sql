-- Migration: 0025_deduction_auto_resolution
-- Feature 11: Deduction Auto-Resolution (Phase 3)
-- Tables: deduction_resolution_rules, deduction_resolution_runs, deduction_resolution_matches

-- Resolution rules define how deductions are automatically matched
CREATE TABLE IF NOT EXISTS deduction_resolution_rules (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL DEFAULT 'match',
  status TEXT NOT NULL DEFAULT 'active',
  priority INTEGER NOT NULL DEFAULT 100,
  match_field TEXT NOT NULL,
  match_operator TEXT NOT NULL DEFAULT 'equals',
  match_value TEXT,
  match_tolerance_pct REAL DEFAULT 0,
  min_confidence INTEGER DEFAULT 70,
  auto_approve_threshold INTEGER DEFAULT 90,
  max_amount REAL,
  deduction_types TEXT,
  customer_scope TEXT,
  action_on_match TEXT NOT NULL DEFAULT 'propose',
  gl_account TEXT,
  cost_center TEXT,
  effective_date TEXT,
  expiry_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  match_count INTEGER DEFAULT 0,
  last_matched_at TEXT,
  created_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Resolution runs track each auto-resolution execution
CREATE TABLE IF NOT EXISTS deduction_resolution_runs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  run_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  run_type TEXT NOT NULL DEFAULT 'manual',
  triggered_by TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  total_deductions INTEGER DEFAULT 0,
  matched_count INTEGER DEFAULT 0,
  auto_resolved_count INTEGER DEFAULT 0,
  needs_review_count INTEGER DEFAULT 0,
  no_match_count INTEGER DEFAULT 0,
  total_amount REAL DEFAULT 0,
  matched_amount REAL DEFAULT 0,
  resolved_amount REAL DEFAULT 0,
  avg_confidence REAL DEFAULT 0,
  rules_applied INTEGER DEFAULT 0,
  processing_time_ms INTEGER DEFAULT 0,
  error_message TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Resolution matches link deductions to their matched entities
CREATE TABLE IF NOT EXISTS deduction_resolution_matches (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  run_id TEXT,
  deduction_id TEXT NOT NULL,
  deduction_number TEXT,
  deduction_amount REAL DEFAULT 0,
  matched_entity_type TEXT NOT NULL,
  matched_entity_id TEXT NOT NULL,
  matched_entity_name TEXT,
  matched_amount REAL DEFAULT 0,
  confidence_score INTEGER DEFAULT 0,
  match_reasons TEXT,
  rule_id TEXT,
  rule_name TEXT,
  status TEXT NOT NULL DEFAULT 'proposed',
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_notes TEXT,
  resolution_type TEXT,
  gl_account TEXT,
  cost_center TEXT,
  auto_approved INTEGER DEFAULT 0,
  customer_id TEXT,
  customer_name TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deduction_resolution_rules_company ON deduction_resolution_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_deduction_resolution_rules_status ON deduction_resolution_rules(company_id, status);
CREATE INDEX IF NOT EXISTS idx_deduction_resolution_rules_active ON deduction_resolution_rules(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_deduction_resolution_runs_company ON deduction_resolution_runs(company_id);
CREATE INDEX IF NOT EXISTS idx_deduction_resolution_runs_status ON deduction_resolution_runs(company_id, status);
CREATE INDEX IF NOT EXISTS idx_deduction_resolution_matches_company ON deduction_resolution_matches(company_id);
CREATE INDEX IF NOT EXISTS idx_deduction_resolution_matches_run ON deduction_resolution_matches(run_id);
CREATE INDEX IF NOT EXISTS idx_deduction_resolution_matches_deduction ON deduction_resolution_matches(deduction_id);
CREATE INDEX IF NOT EXISTS idx_deduction_resolution_matches_status ON deduction_resolution_matches(company_id, status);
CREATE INDEX IF NOT EXISTS idx_deduction_resolution_matches_entity ON deduction_resolution_matches(matched_entity_type, matched_entity_id);
