-- Create Diplomat SA company with graceful fallback
-- Uses INSERT OR IGNORE to avoid duplicate errors on re-run

INSERT OR IGNORE INTO companies (
  id, name, country, currency, timezone,
  status, created_at, updated_at
) VALUES (
  'comp-diplomat-001',
  'Diplomat SA',
  'ZA',
  'ZAR',
  'Africa/Johannesburg',
  'active',
  datetime('now'),
  datetime('now')
);

-- Create admin user for Diplomat SA
-- Password: DiplomatAdmin123! (bcrypt hash)
INSERT OR IGNORE INTO users (
  id, email, password_hash, first_name, last_name,
  role, company_id, status, created_at, updated_at
) VALUES (
  'user-diplomat-admin-001',
  'admin@diplomatsa.co.za',
  '$2a$10$arFWpiRsND0yXzUqZL3/euTcc.dUm3W4UzPYJQ5S/7aAP6PXwpWo6',
  'Diplomat',
  'Admin',
  'admin',
  'comp-diplomat-001',
  'active',
  datetime('now'),
  datetime('now')
);

-- Create default budget for Diplomat SA
INSERT OR IGNORE INTO budgets (
  id, company_id, name, year, amount,
  utilized, committed, spent,
  budget_type, status, created_at, updated_at
) VALUES (
  'budget-diplomat-2024',
  'comp-diplomat-001',
  'Diplomat SA Annual Budget 2024',
  2024,
  5000000.00,
  0.00,
  0.00,
  0.00,
  'annual',
  'active',
  datetime('now'),
  datetime('now')
);

-- Create default system config for Diplomat SA
INSERT OR IGNORE INTO system_config (
  id, company_id, config_key, config_value, created_at, updated_at
) VALUES (
  'config-diplomat-currency',
  'comp-diplomat-001',
  'currency',
  'ZAR',
  datetime('now'),
  datetime('now')
);

INSERT OR IGNORE INTO system_config (
  id, company_id, config_key, config_value, created_at, updated_at
) VALUES (
  'config-diplomat-timezone',
  'comp-diplomat-001',
  'timezone',
  'Africa/Johannesburg',
  datetime('now'),
  datetime('now')
);
