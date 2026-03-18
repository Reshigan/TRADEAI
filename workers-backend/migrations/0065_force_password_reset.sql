-- Force password reset for all seeded demo users on first login
-- This addresses the hardcoded credentials security finding

ALTER TABLE users ADD COLUMN password_reset_required INTEGER DEFAULT 0;

UPDATE users SET password_reset_required = 1
WHERE id IN (
  'user-sunrise-admin',
  'user-sunrise-kam',
  'user-metro-admin',
  'user-freshmart-admin',
  'user-diplomat-admin',
  'user-diplomat-user'
);
