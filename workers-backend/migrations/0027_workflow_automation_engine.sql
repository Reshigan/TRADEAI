-- Feature 13: Workflow Automation Engine (Phase 3)
-- Tables for workflow templates, instances, steps, and automation rules

CREATE TABLE IF NOT EXISTS workflow_templates (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT NOT NULL DEFAULT 'approval',
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'active',
  trigger_entity TEXT NOT NULL,
  trigger_event TEXT NOT NULL DEFAULT 'created',
  trigger_conditions TEXT,
  steps_json TEXT DEFAULT '[]',
  sla_hours INTEGER DEFAULT 24,
  escalation_enabled INTEGER NOT NULL DEFAULT 0,
  escalation_after_hours INTEGER DEFAULT 48,
  escalation_to TEXT,
  notification_enabled INTEGER NOT NULL DEFAULT 1,
  auto_approve_below REAL,
  require_all_approvers INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  is_active INTEGER NOT NULL DEFAULT 1,
  version INTEGER DEFAULT 1,
  usage_count INTEGER DEFAULT 0,
  last_triggered_at TEXT,
  created_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workflow_instances (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  template_name TEXT,
  workflow_type TEXT NOT NULL DEFAULT 'approval',
  status TEXT NOT NULL DEFAULT 'pending',
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  entity_amount REAL DEFAULT 0,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'normal',
  initiated_by TEXT,
  initiated_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  completed_by TEXT,
  cancelled_at TEXT,
  cancelled_by TEXT,
  cancellation_reason TEXT,
  sla_deadline TEXT,
  sla_breached INTEGER DEFAULT 0,
  escalated INTEGER DEFAULT 0,
  escalated_at TEXT,
  escalated_to TEXT,
  outcome TEXT,
  outcome_notes TEXT,
  processing_time_ms INTEGER DEFAULT 0,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  template_id TEXT,
  step_number INTEGER NOT NULL,
  step_type TEXT NOT NULL DEFAULT 'approval',
  step_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  assigned_role TEXT,
  assigned_at TEXT,
  action_taken TEXT,
  action_by TEXT,
  action_at TEXT,
  action_notes TEXT,
  condition_met INTEGER DEFAULT 0,
  condition_expression TEXT,
  sla_hours INTEGER DEFAULT 24,
  sla_deadline TEXT,
  sla_breached INTEGER DEFAULT 0,
  reminder_sent INTEGER DEFAULT 0,
  reminder_sent_at TEXT,
  retry_count INTEGER DEFAULT 0,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS automation_rules (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL DEFAULT 'trigger',
  status TEXT NOT NULL DEFAULT 'active',
  trigger_entity TEXT NOT NULL,
  trigger_event TEXT NOT NULL DEFAULT 'created',
  trigger_field TEXT,
  trigger_operator TEXT DEFAULT 'equals',
  trigger_value TEXT,
  action_type TEXT NOT NULL DEFAULT 'notify',
  action_target TEXT,
  action_config TEXT DEFAULT '{}',
  priority INTEGER DEFAULT 100,
  is_active INTEGER NOT NULL DEFAULT 1,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TEXT,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_company ON workflow_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_status ON workflow_templates(company_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_entity ON workflow_templates(trigger_entity);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_company ON workflow_instances(company_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(company_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_entity ON workflow_instances(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_template ON workflow_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_company ON workflow_steps(company_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_instance ON workflow_steps(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_assigned ON workflow_steps(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_automation_rules_company ON automation_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_status ON automation_rules(company_id, status);
CREATE INDEX IF NOT EXISTS idx_automation_rules_entity ON automation_rules(trigger_entity);
