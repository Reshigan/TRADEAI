-- Sprint 0: Fix budget column consistency
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS committed REAL DEFAULT 0;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS spent REAL DEFAULT 0;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS alerts_sent TEXT DEFAULT '[]';
UPDATE budgets SET committed = COALESCE(total_committed, utilized, 0) WHERE committed IS NULL OR committed = 0;
UPDATE budgets SET spent = COALESCE(total_spent, 0) WHERE spent IS NULL OR spent = 0;
