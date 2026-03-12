-- Sprint 8.5: Multi-level promotions
ALTER TABLE promotions ADD COLUMN promotion_level TEXT DEFAULT 'customer';
ALTER TABLE promotions ADD COLUMN region_id TEXT;
ALTER TABLE promotions ADD COLUMN channel TEXT;
ALTER TABLE promotions ADD COLUMN store_ids TEXT DEFAULT '[]';
