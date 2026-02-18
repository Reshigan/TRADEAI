-- TRADEAI D1 Schema Alignment Migration
-- Ensures D1 schema matches what backend code (TABLE_COLUMNS) expects

-- companies: add missing columns
ALTER TABLE companies ADD COLUMN subscription_plan TEXT;
ALTER TABLE companies ADD COLUMN data TEXT;

-- products: add missing 'code' column (TABLE_COLUMNS expects it)
ALTER TABLE products ADD COLUMN code TEXT;

-- promotions: add approval/rejection columns
ALTER TABLE promotions ADD COLUMN approved_by TEXT;
ALTER TABLE promotions ADD COLUMN approved_at TEXT;
ALTER TABLE promotions ADD COLUMN rejected_by TEXT;
ALTER TABLE promotions ADD COLUMN rejected_at TEXT;
ALTER TABLE promotions ADD COLUMN rejection_reason TEXT;

-- trade_spends: add missing columns
ALTER TABLE trade_spends ADD COLUMN product_id TEXT;
ALTER TABLE trade_spends ADD COLUMN description TEXT;

-- simulations: add missing columns that TABLE_COLUMNS expects
ALTER TABLE simulations ADD COLUMN parameters TEXT;
ALTER TABLE simulations ADD COLUMN data TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_trade_spends_product_id ON trade_spends(product_id);
CREATE INDEX IF NOT EXISTS idx_promotions_approved_by ON promotions(approved_by);
