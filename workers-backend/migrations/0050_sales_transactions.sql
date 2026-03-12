CREATE TABLE IF NOT EXISTS sales_transactions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  transaction_date TEXT NOT NULL,
  quantity REAL DEFAULT 0,
  unit_price REAL DEFAULT 0,
  gross_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  net_amount REAL DEFAULT 0,
  channel TEXT,
  store_id TEXT,
  promotion_id TEXT,
  is_promotional INTEGER DEFAULT 0,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX idx_sales_tx_company ON sales_transactions(company_id);
CREATE INDEX idx_sales_tx_customer ON sales_transactions(customer_id);
CREATE INDEX idx_sales_tx_product ON sales_transactions(product_id);
CREATE INDEX idx_sales_tx_date ON sales_transactions(transaction_date);
CREATE INDEX idx_sales_tx_promo ON sales_transactions(is_promotional);
CREATE INDEX idx_sales_tx_composite ON sales_transactions(company_id, customer_id, product_id, transaction_date);
