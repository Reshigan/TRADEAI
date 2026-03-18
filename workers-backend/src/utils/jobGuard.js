// D-13: Idempotency guards for scheduled jobs
// Prevents duplicate execution of cron jobs across Worker instances

export async function acquireJobLock(db, jobName) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Mark stale 'running' jobs (>1 hour old) as 'timeout'
  await db.prepare(
    "UPDATE job_runs SET status = 'timeout', completed_at = ? WHERE job_name = ? AND status = 'running' AND started_at < ?"
  ).bind(now, jobName, new Date(Date.now() - 3600000).toISOString()).run();

  // Check for already running job
  const running = await db.prepare(
    "SELECT id FROM job_runs WHERE job_name = ? AND status = 'running' LIMIT 1"
  ).bind(jobName).first();

  if (running) {
    return null; // Job already running
  }

  // Insert new job run
  await db.prepare(
    "INSERT INTO job_runs (id, job_name, status, started_at) VALUES (?, ?, 'running', ?)"
  ).bind(id, jobName, now).run();

  return id;
}

export async function completeJob(db, jobRunId, recordsProcessed = 0) {
  await db.prepare(
    "UPDATE job_runs SET status = 'completed', completed_at = ?, records_processed = ? WHERE id = ?"
  ).bind(new Date().toISOString(), recordsProcessed, jobRunId).run();
}

export async function failJob(db, jobRunId, errorMessage) {
  await db.prepare(
    "UPDATE job_runs SET status = 'failed', completed_at = ?, error_message = ? WHERE id = ?"
  ).bind(new Date().toISOString(), errorMessage?.substring(0, 1000) || 'Unknown error', jobRunId).run();
}
