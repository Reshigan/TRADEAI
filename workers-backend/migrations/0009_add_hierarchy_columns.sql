-- Add hierarchy columns to products table
ALTER TABLE products ADD COLUMN vendor TEXT;
ALTER TABLE products ADD COLUMN sub_brand TEXT;

-- Add hierarchy columns to customers table  
ALTER TABLE customers ADD COLUMN sub_channel TEXT;
ALTER TABLE customers ADD COLUMN segmentation TEXT;
ALTER TABLE customers ADD COLUMN hierarchy_1 TEXT;
ALTER TABLE customers ADD COLUMN hierarchy_2 TEXT;
ALTER TABLE customers ADD COLUMN hierarchy_3 TEXT;
ALTER TABLE customers ADD COLUMN head_office TEXT;

-- Add hierarchy and deal/claim type columns to budgets table
ALTER TABLE budgets ADD COLUMN budget_category TEXT DEFAULT 'marketing';
ALTER TABLE budgets ADD COLUMN scope_type TEXT DEFAULT 'customer';
ALTER TABLE budgets ADD COLUMN deal_type TEXT DEFAULT 'off_invoice';
ALTER TABLE budgets ADD COLUMN claim_type TEXT DEFAULT 'vendor_invoice';
ALTER TABLE budgets ADD COLUMN product_vendor TEXT;
ALTER TABLE budgets ADD COLUMN product_category TEXT;
ALTER TABLE budgets ADD COLUMN product_brand TEXT;
ALTER TABLE budgets ADD COLUMN product_sub_brand TEXT;
ALTER TABLE budgets ADD COLUMN product_id TEXT;
ALTER TABLE budgets ADD COLUMN customer_channel TEXT;
ALTER TABLE budgets ADD COLUMN customer_sub_channel TEXT;
ALTER TABLE budgets ADD COLUMN customer_segmentation TEXT;
ALTER TABLE budgets ADD COLUMN customer_hierarchy_1 TEXT;
ALTER TABLE budgets ADD COLUMN customer_hierarchy_2 TEXT;
ALTER TABLE budgets ADD COLUMN customer_hierarchy_3 TEXT;
ALTER TABLE budgets ADD COLUMN customer_head_office TEXT;
ALTER TABLE budgets ADD COLUMN customer_id TEXT;
