-- Sprint 0: KAM Wallet Transactions table
CREATE TABLE IF NOT EXISTS kam_wallet_transactions (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- commit, release, spend, allocate, transfer
  amount REAL NOT NULL,
  reference_type TEXT, -- promotion, trade_spend, budget, manual
  reference_id TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (wallet_id) REFERENCES kam_wallets(id)
);
CREATE INDEX idx_kwt_wallet ON kam_wallet_transactions(wallet_id);
CREATE INDEX idx_kwt_ref ON kam_wallet_transactions(reference_type, reference_id);
