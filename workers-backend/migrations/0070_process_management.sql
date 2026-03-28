-- Process Management Schema
-- For TRADEAI Process UI Components
-- Cloudflare D1 Database Migration

-- ============================================================================
-- Core Process Tables
-- ============================================================================

-- Processes table
CREATE TABLE IF NOT EXISTS processes (
  process_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trade_spend', 'promotion', 'budget', 'claim', 'approval', 'workflow')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'archived')),
  owner_id TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  start_date DATETIME,
  end_date DATETIME,
  completed_at DATETIME,
  metadata TEXT, -- JSON metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
);

-- Process steps table
CREATE TABLE IF NOT EXISTS process_steps (
  step_id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  step_type TEXT DEFAULT 'manual' CHECK (step_type IN ('manual', 'automated', 'approval', 'system')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'error', 'warning')),
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  started_at DATETIME,
  completed_at DATETIME,
  assignee_id TEXT,
  dependencies TEXT, -- JSON array of step_ids
  metadata TEXT, -- JSON metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (process_id) REFERENCES processes(process_id) ON DELETE CASCADE
);

-- Process history/audit log
CREATE TABLE IF NOT EXISTS process_history (
  history_id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL,
  step_id TEXT,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  user_id TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (process_id) REFERENCES processes(process_id) ON DELETE CASCADE
);

-- ============================================================================
-- Dependencies & Relationships
-- ============================================================================

-- Step dependencies
CREATE TABLE IF NOT EXISTS step_dependencies (
  dependency_id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL,
  from_step_id TEXT NOT NULL,
  to_step_id TEXT NOT NULL,
  dependency_type TEXT DEFAULT 'finish-to-start' CHECK (dependency_type IN ('finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish')),
  is_mandatory INTEGER DEFAULT 1,
  lag_minutes INTEGER DEFAULT 0,
  condition TEXT, -- SQL condition for conditional dependencies
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (process_id) REFERENCES processes(process_id) ON DELETE CASCADE,
  FOREIGN KEY (from_step_id) REFERENCES process_steps(step_id),
  FOREIGN KEY (to_step_id) REFERENCES process_steps(step_id)
);

-- Process metrics cache
CREATE TABLE IF NOT EXISTS process_metrics (
  metric_id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL UNIQUE,
  progress INTEGER DEFAULT 0,
  completed_steps INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  avg_completion_time REAL,
  bottleneck_count INTEGER DEFAULT 0,
  health_score REAL DEFAULT 0,
  last_calculated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (process_id) REFERENCES processes(process_id) ON DELETE CASCADE
);

-- ============================================================================
-- AI/ML Related Tables
-- ============================================================================

-- AI recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  recommendation_id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL,
  step_id TEXT,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('optimization', 'warning', 'suggestion', 'insight', 'prediction')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score REAL DEFAULT 0,
  impact_level TEXT DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high')),
  suggested_action TEXT,
  is_accepted INTEGER DEFAULT 0,
  accepted_at DATETIME,
  accepted_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (process_id) REFERENCES processes(process_id) ON DELETE CASCADE
);

-- Predictions cache
CREATE TABLE IF NOT EXISTS predictions (
  prediction_id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('completion_time', 'success_rate', 'bottleneck', 'resource_need')),
  predicted_value TEXT NOT NULL,
  confidence_score REAL,
  factors TEXT, -- JSON array
  valid_until DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (process_id) REFERENCES processes(process_id) ON DELETE CASCADE
);

-- Scenario analyses
CREATE TABLE IF NOT EXISTS scenario_analyses (
  scenario_id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL,
  scenario_name TEXT NOT NULL,
  parameters TEXT NOT NULL, -- JSON
  outcome TEXT, -- JSON
  comparison TEXT, -- JSON
  risk_level TEXT DEFAULT 'medium',
  is_recommended INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (process_id) REFERENCES processes(process_id) ON DELETE CASCADE
);

-- ============================================================================
-- Analytics & Reporting
-- ============================================================================

-- Process analytics cache
CREATE TABLE IF NOT EXISTS process_analytics (
  analytics_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_processes INTEGER DEFAULT 0,
  completed_processes INTEGER DEFAULT 0,
  avg_completion_time REAL,
  on_time_rate REAL,
  bottleneck_count INTEGER,
  quality_score REAL,
  team_utilization REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
);

-- Step performance metrics
CREATE TABLE IF NOT EXISTS step_performance (
  performance_id TEXT PRIMARY KEY,
  step_id TEXT NOT NULL,
  process_id TEXT NOT NULL,
  avg_duration REAL,
  median_duration REAL,
  completion_rate REAL,
  error_rate REAL,
  rework_rate REAL,
  avg_wait_time REAL,
  sample_count INTEGER DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (process_id) REFERENCES processes(process_id) ON DELETE CASCADE
);

-- Team performance
CREATE TABLE IF NOT EXISTS team_performance (
  performance_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  avg_completion_time REAL,
  on_time_rate REAL,
  quality_score REAL,
  current_load INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
);

-- ============================================================================
-- Notifications & Events
-- ============================================================================

-- Process notifications
CREATE TABLE IF NOT EXISTS process_notifications (
  notification_id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (process_id) REFERENCES processes(process_id) ON DELETE CASCADE
);

-- Process events (for WebSocket)
CREATE TABLE IF NOT EXISTS process_events (
  event_id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (process_id) REFERENCES processes(process_id) ON DELETE CASCADE
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_processes_tenant ON processes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_type ON processes(type);
CREATE INDEX IF NOT EXISTS idx_processes_owner ON processes(owner_id);
CREATE INDEX IF NOT EXISTS idx_processes_created ON processes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_steps_process ON process_steps(process_id);
CREATE INDEX IF NOT EXISTS idx_steps_status ON process_steps(status);
CREATE INDEX IF NOT EXISTS idx_steps_order ON process_steps(process_id, step_order);
CREATE INDEX IF NOT EXISTS idx_steps_assignee ON process_steps(assignee_id);

CREATE INDEX IF NOT EXISTS idx_history_process ON process_history(process_id);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON process_history(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_dependencies_process ON step_dependencies(process_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_from ON step_dependencies(from_step_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_to ON step_dependencies(to_step_id);

CREATE INDEX IF NOT EXISTS idx_metrics_process ON process_metrics(process_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_process ON ai_recommendations(process_id);
CREATE INDEX IF NOT EXISTS idx_predictions_process ON predictions(process_id);

CREATE INDEX IF NOT EXISTS idx_analytics_tenant ON process_analytics(tenant_id, period_start);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON process_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_events_process ON process_events(process_id, created_at DESC);

-- ============================================================================
-- Initial Seed Data
-- ============================================================================

-- Insert demo process template
INSERT OR IGNORE INTO processes (process_id, tenant_id, name, type, description, status, priority)
VALUES 
  ('demo-process-1', 'tenant-1', 'Q1 2024 Trade Spend Process', 'trade_spend', 'Comprehensive trade spend management workflow for Q1', 'active', 'high'),
  ('demo-process-2', 'tenant-1', 'New Product Launch', 'promotion', 'Product launch promotion workflow', 'pending', 'medium'),
  ('demo-process-3', 'tenant-1', 'Annual Budget Planning', 'budget', 'Annual budget allocation and planning', 'completed', 'critical');

-- Insert demo steps for first process
INSERT OR IGNORE INTO process_steps (step_id, process_id, step_name, step_order, step_type, description, status, estimated_minutes, assignee_id)
VALUES 
  ('step-1', 'demo-process-1', 'Planning & Strategy', 0, 'manual', 'Define objectives, budget, and target metrics', 'completed', 180, 'user-1'),
  ('step-2', 'demo-process-1', 'Management Approval', 1, 'approval', 'Review and approve by department heads', 'completed', 120, 'user-2'),
  ('step-3', 'demo-process-1', 'Campaign Execution', 2, 'manual', 'Launch and monitor promotional activities', 'in_progress', 840, 'user-3'),
  ('step-4', 'demo-process-1', 'Performance Analysis', 3, 'automated', 'Measure results and gather insights', 'pending', 300, 'user-1'),
  ('step-5', 'demo-process-1', 'Optimization & Scaling', 4, 'manual', 'Refine strategy and scale successful tactics', 'pending', 420, 'user-1');

-- Insert demo dependencies
INSERT OR IGNORE INTO step_dependencies (dependency_id, process_id, from_step_id, to_step_id, dependency_type, is_mandatory)
VALUES 
  ('dep-1', 'demo-process-1', 'step-1', 'step-2', 'finish-to-start', 1),
  ('dep-2', 'demo-process-1', 'step-2', 'step-3', 'finish-to-start', 1),
  ('dep-3', 'demo-process-1', 'step-3', 'step-4', 'finish-to-start', 1),
  ('dep-4', 'demo-process-1', 'step-4', 'step-5', 'finish-to-start', 1);

-- Insert demo AI recommendations
INSERT OR IGNORE INTO ai_recommendations (recommendation_id, process_id, step_id, recommendation_type, title, description, confidence_score, impact_level)
VALUES 
  ('rec-1', 'demo-process-1', 'step-3', 'optimization', 'Consider Parallel Execution', 'Running activities in parallel could save 2 days', 85.5, 'high'),
  ('rec-2', 'demo-process-1', 'step-3', 'warning', 'Resource Constraint Detected', 'Current team capacity may cause delays', 72.3, 'medium'),
  ('rec-3', 'demo-process-1', NULL, 'insight', 'Historical Performance', 'Similar processes completed 15% faster in Q4', 90.0, 'low');

-- Insert demo metrics
INSERT OR IGNORE INTO process_metrics (metric_id, process_id, progress, completed_steps, total_steps, avg_completion_time, bottleneck_count, health_score)
VALUES 
  ('metric-1', 'demo-process-1', 40, 2, 5, 150.0, 1, 75.0);
