-- Feature 16: Predictive Analytics Engine (Phase 4)
-- ML-driven predictions for revenue, demand, promotion performance, and customer behavior

CREATE TABLE IF NOT EXISTS predictive_models (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  model_type TEXT NOT NULL,
  target_metric TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  algorithm TEXT,
  features TEXT DEFAULT '[]',
  hyperparameters TEXT DEFAULT '{}',
  training_data_start TEXT,
  training_data_end TEXT,
  training_records INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 0,
  mae REAL DEFAULT 0,
  rmse REAL DEFAULT 0,
  r_squared REAL DEFAULT 0,
  mape REAL DEFAULT 0,
  confidence_level REAL DEFAULT 0.95,
  last_trained_at TEXT,
  last_predicted_at TEXT,
  version INTEGER DEFAULT 1,
  created_by TEXT,
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS predictions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  prediction_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  period TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  predicted_value REAL NOT NULL DEFAULT 0,
  actual_value REAL,
  confidence_low REAL,
  confidence_high REAL,
  confidence_pct REAL DEFAULT 0.95,
  variance REAL,
  variance_pct REAL,
  accuracy_score REAL,
  factors TEXT DEFAULT '[]',
  trend_direction TEXT,
  trend_strength REAL DEFAULT 0,
  seasonality_index REAL DEFAULT 1.0,
  anomaly_flag INTEGER DEFAULT 0,
  anomaly_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  data TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pred_models_company ON predictive_models(company_id);
CREATE INDEX IF NOT EXISTS idx_pred_models_type ON predictive_models(company_id, model_type);
CREATE INDEX IF NOT EXISTS idx_pred_models_status ON predictive_models(company_id, status);
CREATE INDEX IF NOT EXISTS idx_predictions_company ON predictions(company_id);
CREATE INDEX IF NOT EXISTS idx_predictions_model ON predictions(model_id);
CREATE INDEX IF NOT EXISTS idx_predictions_type ON predictions(company_id, prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictions_entity ON predictions(company_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_predictions_period ON predictions(company_id, period);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(company_id, status);
