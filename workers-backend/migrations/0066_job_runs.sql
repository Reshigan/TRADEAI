-- D-13: Idempotency guards for scheduled jobs
CREATE TABLE IF NOT EXISTS job_runs (
  id TEXT PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error_message TEXT,
  records_processed INTEGER DEFAULT 0,
  company_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_job_runs_name_status ON job_runs(job_name, status);
CREATE INDEX IF NOT EXISTS idx_job_runs_started ON job_runs(started_at);
