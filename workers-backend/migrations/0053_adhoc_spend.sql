-- Sprint 8.3: Ad-hoc spend support
ALTER TABLE trade_spends ADD COLUMN is_adhoc INTEGER DEFAULT 0;
ALTER TABLE trade_spends ADD COLUMN adhoc_type TEXT;
ALTER TABLE trade_spends ADD COLUMN wallet_id TEXT;
