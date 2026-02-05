-- Migration: Add activity_grid table for calendar view of activities
-- This table stores activities that can be viewed in a calendar/grid format

CREATE TABLE IF NOT EXISTS activity_grid (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    activity_name TEXT NOT NULL,
    activity_type TEXT DEFAULT 'Promotion',
    status TEXT DEFAULT 'Planned',
    start_date TEXT,
    end_date TEXT,
    customer_id TEXT,
    product_id TEXT,
    vendor_id TEXT,
    budget_allocated REAL DEFAULT 0,
    budget_spent REAL DEFAULT 0,
    performance TEXT,
    notes TEXT,
    source_type TEXT,
    source_id TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_grid_company ON activity_grid(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_grid_dates ON activity_grid(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_activity_grid_customer ON activity_grid(customer_id);
CREATE INDEX IF NOT EXISTS idx_activity_grid_status ON activity_grid(status);
