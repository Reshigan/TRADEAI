-- Migration 0067: Comprehensive seed data for Methodist tenant
-- Includes: company, users, customers, products, vendors, budgets, promotions, trade spends,
-- claims, deductions, settlements, accruals, P&L reports, forecasts, baselines, KPIs,
-- trade calendar events, scenarios, demand signals, and all supporting data

-- ============================================================================
-- 1. COMPANY & USERS
-- ============================================================================

-- Create Methodist company
INSERT INTO companies (id, name, code, type, country, currency, timezone, status, subscription_plan, created_at, updated_at)
VALUES (
  'comp-methodist-001',
  'Methodist',
  'METH',
  'manufacturer',
  'South Africa',
  'ZAR',
  'Africa/Johannesburg',
  'active',
  'enterprise',
  datetime('now'),
  datetime('now')
);

-- Create Methodist users (Admin, KAM, Manager, Analyst)
INSERT INTO users (id, company_id, email, password, first_name, last_name, role, department, is_active, permissions, created_at, updated_at)
VALUES
  ('user-meth-admin-001', 'comp-methodist-001', 'admin@methodist.co.za', 'fd5ae0a1ba1e7dc1f2d7735c67fff7ecd5a223efa813dfe8af35c80868ec096e', 'Sarah', 'Johnson', 'admin', 'Management', 1, '["all"]', datetime('now'), datetime('now')),
  ('user-meth-kam-001', 'comp-methodist-001', 'kam@methodist.co.za', 'f5465a32156c3823577c1906122b4f9c97e3ee19770681b09cd01edfc48fa9ff', 'David', 'Williams', 'kam', 'Sales', 1, '["trade_spend:read","trade_spend:write","promotions:read","promotions:write"]', datetime('now'), datetime('now')),
  ('user-meth-manager-001', 'comp-methodist-001', 'manager@methodist.co.za', '86a3988d1bd5be2f6f9c7ac074932eafcf6c86ee43be71f21d33625f596bd728', 'Emily', 'Brown', 'manager', 'Trade Marketing', 1, '["budgets:read","budgets:write","reports:read"]', datetime('now'), datetime('now')),
  ('user-meth-analyst-001', 'comp-methodist-001', 'analyst@methodist.co.za', 'b797d80ff65038e8b685b02262fa1cec04230616de09a89b54f3ddcfcb4dfcd2', 'Michael', 'Davis', 'analyst', 'Analytics', 1, '["reports:read","analytics:read"]', datetime('now'), datetime('now'));

-- ============================================================================
-- 2. CUSTOMERS
-- ============================================================================

INSERT INTO customers (id, company_id, name, code, sap_customer_id, customer_type, channel, sub_channel, tier, status, region, city, segmentation, hierarchy_1, hierarchy_2, hierarchy_3, head_office, created_at, updated_at)
VALUES
  ('cust-meth-001', 'comp-methodist-001', 'Shoprite Holdings', 'SHP001', 'SAP-SHP-001', 'retail', 'Modern Trade', 'Supermarket', 'Tier 1', 'active', 'Gauteng', 'Johannesburg', 'Key Account', 'National Chains', 'Supermarkets', 'Shoprite', 'Johannesburg HQ', datetime('now'), datetime('now')),
  ('cust-meth-002', 'comp-methodist-001', 'Pick n Pay', 'PNP001', 'SAP-PNP-001', 'retail', 'Modern Trade', 'Supermarket', 'Tier 1', 'active', 'Western Cape', 'Cape Town', 'Key Account', 'National Chains', 'Supermarkets', 'Pick n Pay', 'Cape Town HQ', datetime('now'), datetime('now')),
  ('cust-meth-003', 'comp-methodist-001', 'Woolworths', 'WOO001', 'SAP-WOO-001', 'retail', 'Modern Trade', 'Premium', 'Tier 1', 'active', 'Gauteng', 'Johannesburg', 'Key Account', 'National Chains', 'Premium', 'Woolworths', 'Johannesburg HQ', datetime('now'), datetime('now')),
  ('cust-meth-004', 'comp-methodist-001', 'Spar Group', 'SPR001', 'SAP-SPR-001', 'retail', 'Modern Trade', 'Supermarket', 'Tier 2', 'active', 'KwaZulu-Natal', 'Durban', 'Regional', 'Regional Chains', 'Supermarkets', 'Spar', 'Durban HQ', datetime('now'), datetime('now')),
  ('cust-meth-005', 'comp-methodist-001', 'Checkers', 'CHK001', 'SAP-CHK-001', 'retail', 'Modern Trade', 'Supermarket', 'Tier 1', 'active', 'Gauteng', 'Pretoria', 'Key Account', 'National Chains', 'Supermarkets', 'Checkers', 'Pretoria HQ', datetime('now'), datetime('now')),
  ('cust-meth-006', 'comp-methodist-001', 'Makro', 'MKR001', 'SAP-MKR-001', 'wholesale', 'Wholesale', 'Cash & Carry', 'Tier 2', 'active', 'Gauteng', 'Johannesburg', 'Wholesale', 'Wholesale Chains', 'Cash & Carry', 'Makro', 'Johannesburg HQ', datetime('now'), datetime('now')),
  ('cust-meth-007', 'comp-methodist-001', 'Cambridge Food', 'CAM001', 'SAP-CAM-001', 'wholesale', 'Wholesale', 'Distributor', 'Tier 2', 'active', 'Western Cape', 'Cape Town', 'Distributor', 'Distributors', 'Food Service', 'Cambridge', 'Cape Town HQ', datetime('now'), datetime('now')),
  ('cust-meth-008', 'comp-methodist-001', 'Boxer Stores', 'BOX001', 'SAP-BOX-001', 'retail', 'Modern Trade', 'Discount', 'Tier 2', 'active', 'Limpopo', 'Polokwane', 'Regional', 'Regional Chains', 'Discount', 'Boxer', 'Polokwane HQ', datetime('now'), datetime('now')),
  ('cust-meth-009', 'comp-methodist-001', 'Food Lover''s Market', 'FLM001', 'SAP-FLM-001', 'retail', 'Modern Trade', 'Fresh Market', 'Tier 2', 'active', 'Gauteng', 'Johannesburg', 'Regional', 'Regional Chains', 'Fresh Markets', 'FLM', 'Johannesburg HQ', datetime('now'), datetime('now')),
  ('cust-meth-010', 'comp-methodist-001', 'Game Stores', 'GAM001', 'SAP-GAM-001', 'retail', 'Modern Trade', 'General Merchandise', 'Tier 2', 'active', 'Gauteng', 'Johannesburg', 'Regional', 'National Chains', 'General Merchandise', 'Game', 'Johannesburg HQ', datetime('now'), datetime('now'));

-- ============================================================================
-- 3. PRODUCTS
-- ============================================================================

INSERT INTO products (id, company_id, name, sku, barcode, code, category, subcategory, brand, sub_brand, vendor, unit_price, cost_price, status, created_at, updated_at)
VALUES
  ('prod-meth-001', 'comp-methodist-001', 'Methodist Premium Coffee 250g', 'METH-COF-250', '6001234567890', 'COF250', 'Beverages', 'Coffee', 'Methodist', 'Premium', 'Methodist Manufacturing', 45.99, 28.50, 'active', datetime('now'), datetime('now')),
  ('prod-meth-002', 'comp-methodist-001', 'Methodist Instant Coffee 200g', 'METH-COF-200', '6001234567891', 'COF200', 'Beverages', 'Coffee', 'Methodist', 'Classic', 'Methodist Manufacturing', 32.99, 19.80, 'active', datetime('now'), datetime('now')),
  ('prod-meth-003', 'comp-methodist-001', 'Methodist Tea Bags 100s', 'METH-TEA-100', '6001234567892', 'TEA100', 'Beverages', 'Tea', 'Methodist', 'Classic', 'Methodist Manufacturing', 28.99, 17.40, 'active', datetime('now'), datetime('now')),
  ('prod-meth-004', 'comp-methodist-001', 'Methodist Green Tea 50s', 'METH-TEA-050', '6001234567893', 'TEA050', 'Beverages', 'Tea', 'Methodist', 'Wellness', 'Methodist Manufacturing', 35.99, 21.60, 'active', datetime('now'), datetime('now')),
  ('prod-meth-005', 'comp-methodist-001', 'Methodist Hot Chocolate 500g', 'METH-CHO-500', '6001234567894', 'CHO500', 'Beverages', 'Chocolate', 'Methodist', 'Premium', 'Methodist Manufacturing', 52.99, 31.80, 'active', datetime('now'), datetime('now')),
  ('prod-meth-006', 'comp-methodist-001', 'Methodist Biscuits Assorted 500g', 'METH-BIS-500', '6001234567895', 'BIS500', 'Snacks', 'Biscuits', 'Methodist', 'Classic', 'Methodist Manufacturing', 38.99, 23.40, 'active', datetime('now'), datetime('now')),
  ('prod-meth-007', 'comp-methodist-001', 'Methodist Rusks 500g', 'METH-RSK-500', '6001234567896', 'RSK500', 'Snacks', 'Rusks', 'Methodist', 'Traditional', 'Methodist Manufacturing', 42.99, 25.80, 'active', datetime('now'), datetime('now')),
  ('prod-meth-008', 'comp-methodist-001', 'Methodist Cereal Flakes 750g', 'METH-CER-750', '6001234567897', 'CER750', 'Breakfast', 'Cereal', 'Methodist', 'Wellness', 'Methodist Manufacturing', 48.99, 29.40, 'active', datetime('now'), datetime('now')),
  ('prod-meth-009', 'comp-methodist-001', 'Methodist Oats 1kg', 'METH-OAT-1KG', '6001234567898', 'OAT1KG', 'Breakfast', 'Oats', 'Methodist', 'Wellness', 'Methodist Manufacturing', 55.99, 33.60, 'active', datetime('now'), datetime('now')),
  ('prod-meth-010', 'comp-methodist-001', 'Methodist Muesli 500g', 'METH-MUS-500', '6001234567899', 'MUS500', 'Breakfast', 'Muesli', 'Methodist', 'Premium', 'Methodist Manufacturing', 62.99, 37.80, 'active', datetime('now'), datetime('now'));

-- ============================================================================
-- 4. VENDORS
-- ============================================================================

INSERT INTO vendors (id, company_id, name, code, vendor_type, status, contact_name, contact_email, contact_phone, address, city, region, country, payment_terms, tax_number, created_at, updated_at)
VALUES
  ('vend-meth-001', 'comp-methodist-001', 'Methodist Manufacturing', 'METH-MFG', 'manufacturer', 'active', 'John Smith', 'john.smith@methodist.co.za', '+27 11 123 4567', '123 Industrial Road', 'Johannesburg', 'Gauteng', 'South Africa', 'Net 30', '9876543210', datetime('now'), datetime('now')),
  ('vend-meth-002', 'comp-methodist-001', 'Premium Packaging Solutions', 'PPS-001', 'supplier', 'active', 'Jane Doe', 'jane@pps.co.za', '+27 21 987 6543', '456 Packaging Ave', 'Cape Town', 'Western Cape', 'South Africa', 'Net 45', '1234567890', datetime('now'), datetime('now')),
  ('vend-meth-003', 'comp-methodist-001', 'Logistics Express SA', 'LEX-001', 'logistics', 'active', 'Peter Jones', 'peter@logex.co.za', '+27 31 456 7890', '789 Transport Street', 'Durban', 'KwaZulu-Natal', 'South Africa', 'Net 30', '5678901234', datetime('now'), datetime('now'));

-- ============================================================================
-- 5. VENDOR FUNDS
-- ============================================================================

INSERT INTO vendor_funds (id, company_id, vendor_id, name, description, fund_type, status, total_amount, available_amount, committed_amount, spent_amount, claimed_amount, currency, start_date, end_date, approved_by, approved_at, created_by, created_at, updated_at)
VALUES
  ('vfund-meth-001', 'comp-methodist-001', 'vend-meth-001', 'Methodist 2026 Trade Fund', 'Annual trade marketing fund', 'trade_marketing', 'active', 5000000.00, 3200000.00, 1200000.00, 600000.00, 0.00, 'ZAR', '2026-01-01', '2026-12-31', 'user-meth-admin-001', datetime('now'), 'user-meth-admin-001', datetime('now'), datetime('now')),
  ('vfund-meth-002', 'comp-methodist-001', 'vend-meth-001', 'Methodist Q2 Promo Fund', 'Q2 promotional support', 'promotional', 'active', 1500000.00, 800000.00, 400000.00, 300000.00, 0.00, 'ZAR', '2026-04-01', '2026-06-30', 'user-meth-admin-001', datetime('now'), 'user-meth-admin-001', datetime('now'), datetime('now'));

-- ============================================================================
-- 6. BUDGETS
-- ============================================================================

INSERT INTO budgets (id, company_id, name, year, amount, utilized, committed, spent, status, budget_type, budget_category, scope_type, created_by, created_at, updated_at)
VALUES
  ('budget-meth-001', 'comp-methodist-001', 'Methodist 2026 Annual Trade Budget', 2026, 8000000.00, 2400000.00, 1600000.00, 2400000.00, 'active', 'trade_spend', 'promotional', 'company', 'user-meth-admin-001', datetime('now'), datetime('now')),
  ('budget-meth-002', 'comp-methodist-001', 'Methodist Q1 2026 Promotional', 2026, 2000000.00, 800000.00, 400000.00, 800000.00, 'active', 'promotional', 'promotional', 'quarterly', 'user-meth-manager-001', datetime('now'), datetime('now')),
  ('budget-meth-003', 'comp-methodist-001', 'Methodist Q2 2026 Promotional', 2026, 2200000.00, 600000.00, 800000.00, 600000.00, 'active', 'promotional', 'promotional', 'quarterly', 'user-meth-manager-001', datetime('now'), datetime('now')),
  ('budget-meth-004', 'comp-methodist-001', 'Methodist Shoprite 2026', 2026, 1500000.00, 450000.00, 300000.00, 450000.00, 'active', 'customer', 'customer_specific', 'customer', 'user-meth-kam-001', datetime('now'), datetime('now')),
  ('budget-meth-005', 'comp-methodist-001', 'Methodist Pick n Pay 2026', 2026, 1200000.00, 360000.00, 240000.00, 360000.00, 'active', 'customer', 'customer_specific', 'customer', 'user-meth-kam-001', datetime('now'), datetime('now'));

-- ============================================================================
-- 7. PROMOTIONS
-- ============================================================================

INSERT INTO promotions (id, company_id, name, description, promotion_type, status, start_date, end_date, sell_in_start_date, sell_in_end_date, budget_id, expected_spend, actual_spend, created_by, approved_by, approved_at, created_at, updated_at)
VALUES
  ('promo-meth-001', 'comp-methodist-001', 'Methodist Easter Coffee Promo 2026', 'Easter promotional campaign for coffee range', 'price_discount', 'completed', '2026-03-20', '2026-04-10', '2026-03-10', '2026-03-19', 'budget-meth-002', 250000.00, 245000.00, 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-30 days'), datetime('now', '-45 days'), datetime('now')),
  ('promo-meth-002', 'comp-methodist-001', 'Methodist Winter Warmers 2026', 'Winter hot beverage promotion', 'bundle', 'active', '2026-05-01', '2026-07-31', '2026-04-15', '2026-04-30', 'budget-meth-003', 450000.00, 180000.00, 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-15 days'), datetime('now', '-20 days'), datetime('now')),
  ('promo-meth-003', 'comp-methodist-001', 'Methodist Back to School Breakfast', 'Back to school breakfast cereal promotion', 'price_discount', 'planned', '2026-01-05', '2026-02-15', '2025-12-15', '2026-01-04', 'budget-meth-001', 320000.00, 0.00, 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-60 days'), datetime('now', '-70 days'), datetime('now')),
  ('promo-meth-004', 'comp-methodist-001', 'Methodist Shoprite Exclusive Deal', 'Exclusive promotional deal for Shoprite', 'volume_discount', 'active', '2026-04-01', '2026-06-30', '2026-03-20', '2026-03-31', 'budget-meth-004', 380000.00, 120000.00, 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-10 days'), datetime('now', '-15 days'), datetime('now')),
  ('promo-meth-005', 'comp-methodist-001', 'Methodist Pick n Pay Premium Range', 'Premium product launch at Pick n Pay', 'new_product', 'active', '2026-05-15', '2026-08-15', '2026-05-01', '2026-05-14', 'budget-meth-005', 280000.00, 85000.00, 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-5 days'), datetime('now', '-10 days'), datetime('now'));

-- ============================================================================
-- 8. TRADE SPENDS
-- ============================================================================

INSERT INTO trade_spends (id, company_id, spend_id, spend_type, activity_type, amount, status, customer_id, product_id, promotion_id, budget_id, description, created_by, approved_by, approved_at, created_at, updated_at)
VALUES
  ('tspend-meth-001', 'comp-methodist-001', 'TS-2026-001', 'promotional', 'price_discount', 85000.00, 'approved', 'cust-meth-001', 'prod-meth-001', 'promo-meth-001', 'budget-meth-002', 'Easter coffee discount - Shoprite', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-25 days'), datetime('now', '-30 days'), datetime('now')),
  ('tspend-meth-002', 'comp-methodist-001', 'TS-2026-002', 'promotional', 'price_discount', 65000.00, 'approved', 'cust-meth-002', 'prod-meth-001', 'promo-meth-001', 'budget-meth-002', 'Easter coffee discount - Pick n Pay', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-25 days'), datetime('now', '-30 days'), datetime('now')),
  ('tspend-meth-003', 'comp-methodist-001', 'TS-2026-003', 'promotional', 'bundle', 120000.00, 'approved', 'cust-meth-001', 'prod-meth-005', 'promo-meth-002', 'budget-meth-003', 'Winter warmers bundle - Shoprite', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-10 days'), datetime('now', '-15 days'), datetime('now')),
  ('tspend-meth-004', 'comp-methodist-001', 'TS-2026-004', 'promotional', 'volume_discount', 95000.00, 'approved', 'cust-meth-001', 'prod-meth-002', 'promo-meth-004', 'budget-meth-004', 'Shoprite exclusive volume discount', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-8 days'), datetime('now', '-10 days'), datetime('now')),
  ('tspend-meth-005', 'comp-methodist-001', 'TS-2026-005', 'promotional', 'new_product', 75000.00, 'approved', 'cust-meth-002', 'prod-meth-010', 'promo-meth-005', 'budget-meth-005', 'Premium muesli launch - Pick n Pay', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-3 days'), datetime('now', '-5 days'), datetime('now')),
  ('tspend-meth-006', 'comp-methodist-001', 'TS-2026-006', 'listing_fee', 'listing', 45000.00, 'approved', 'cust-meth-003', 'prod-meth-010', NULL, 'budget-meth-001', 'Woolworths premium range listing fee', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-20 days'), datetime('now', '-25 days'), datetime('now')),
  ('tspend-meth-007', 'comp-methodist-001', 'TS-2026-007', 'marketing', 'in_store_display', 32000.00, 'approved', 'cust-meth-001', NULL, 'promo-meth-001', 'budget-meth-002', 'Easter in-store display - Shoprite', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-28 days'), datetime('now', '-30 days'), datetime('now')),
  ('tspend-meth-008', 'comp-methodist-001', 'TS-2026-008', 'marketing', 'catalogue', 28000.00, 'approved', 'cust-meth-002', NULL, 'promo-meth-001', 'budget-meth-002', 'Easter catalogue feature - Pick n Pay', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-28 days'), datetime('now', '-30 days'), datetime('now'));

-- ============================================================================
-- 9. CLAIMS
-- ============================================================================

INSERT INTO claims (id, company_id, claim_number, claim_type, status, customer_id, promotion_id, claimed_amount, approved_amount, settled_amount, claim_date, due_date, settlement_date, reason, reviewed_by, reviewed_at, created_by, created_at, updated_at)
VALUES
  ('claim-meth-001', 'comp-methodist-001', 'CLM-2026-001', 'promotional', 'settled', 'cust-meth-001', 'promo-meth-001', 85000.00, 85000.00, 85000.00, datetime('now', '-20 days'), datetime('now', '-10 days'), datetime('now', '-5 days'), 'Easter coffee promotion claim', 'user-meth-manager-001', datetime('now', '-15 days'), 'user-meth-kam-001', datetime('now', '-20 days'), datetime('now')),
  ('claim-meth-002', 'comp-methodist-001', 'CLM-2026-002', 'promotional', 'settled', 'cust-meth-002', 'promo-meth-001', 65000.00, 65000.00, 65000.00, datetime('now', '-20 days'), datetime('now', '-10 days'), datetime('now', '-5 days'), 'Easter coffee promotion claim', 'user-meth-manager-001', datetime('now', '-15 days'), 'user-meth-kam-001', datetime('now', '-20 days'), datetime('now')),
  ('claim-meth-003', 'comp-methodist-001', 'CLM-2026-003', 'promotional', 'approved', 'cust-meth-001', 'promo-meth-002', 120000.00, 115000.00, 0.00, datetime('now', '-8 days'), datetime('now', '+5 days'), NULL, 'Winter warmers bundle claim', 'user-meth-manager-001', datetime('now', '-5 days'), 'user-meth-kam-001', datetime('now', '-8 days'), datetime('now')),
  ('claim-meth-004', 'comp-methodist-001', 'CLM-2026-004', 'volume_rebate', 'pending', 'cust-meth-001', 'promo-meth-004', 95000.00, 0.00, 0.00, datetime('now', '-3 days'), datetime('now', '+10 days'), NULL, 'Shoprite exclusive volume rebate', NULL, NULL, 'user-meth-kam-001', datetime('now', '-3 days'), datetime('now'));

-- ============================================================================
-- 10. DEDUCTIONS
-- ============================================================================

INSERT INTO deductions (id, company_id, deduction_number, deduction_type, status, customer_id, invoice_number, invoice_date, deduction_amount, matched_amount, remaining_amount, deduction_date, due_date, reason_code, reason_description, matched_to, reviewed_by, reviewed_at, created_by, created_at, updated_at)
VALUES
  ('ded-meth-001', 'comp-methodist-001', 'DED-2026-001', 'shortage', 'resolved', 'cust-meth-001', 'INV-2026-0234', datetime('now', '-35 days'), 12500.00, 12500.00, 0.00, datetime('now', '-30 days'), datetime('now', '-20 days'), 'SHORT', 'Product shortage on delivery', 'claim-meth-001', 'user-meth-manager-001', datetime('now', '-22 days'), 'user-meth-kam-001', datetime('now', '-30 days'), datetime('now')),
  ('ded-meth-002', 'comp-methodist-001', 'DED-2026-002', 'pricing', 'resolved', 'cust-meth-002', 'INV-2026-0456', datetime('now', '-28 days'), 8750.00, 8750.00, 0.00, datetime('now', '-25 days'), datetime('now', '-15 days'), 'PRICE', 'Pricing discrepancy', 'claim-meth-002', 'user-meth-manager-001', datetime('now', '-18 days'), 'user-meth-kam-001', datetime('now', '-25 days'), datetime('now')),
  ('ded-meth-003', 'comp-methodist-001', 'DED-2026-003', 'promotional', 'pending', 'cust-meth-001', 'INV-2026-0678', datetime('now', '-15 days'), 15000.00, 0.00, 15000.00, datetime('now', '-12 days'), datetime('now', '+5 days'), 'PROMO', 'Promotional allowance deduction', NULL, NULL, NULL, 'user-meth-kam-001', datetime('now', '-12 days'), datetime('now')),
  ('ded-meth-004', 'comp-methodist-001', 'DED-2026-004', 'damage', 'pending', 'cust-meth-003', 'INV-2026-0789', datetime('now', '-10 days'), 6200.00, 0.00, 6200.00, datetime('now', '-8 days'), datetime('now', '+7 days'), 'DAMAGE', 'Damaged goods on arrival', NULL, NULL, NULL, 'user-meth-kam-001', datetime('now', '-8 days'), datetime('now'));

-- ============================================================================
-- 11. SETTLEMENTS
-- ============================================================================

INSERT INTO settlements (id, company_id, settlement_number, name, description, status, settlement_type, customer_id, promotion_id, claim_id, budget_id, settlement_date, due_date, accrued_amount, claimed_amount, approved_amount, settled_amount, variance_amount, variance_pct, payment_method, payment_reference, payment_date, currency, created_by, approved_by, approved_at, processed_by, processed_at, created_at, updated_at)
VALUES
  ('settle-meth-001', 'comp-methodist-001', 'SET-2026-001', 'Easter Promo Settlement - Shoprite', 'Settlement for Easter coffee promotion', 'completed', 'promotional', 'cust-meth-001', 'promo-meth-001', 'claim-meth-001', 'budget-meth-002', datetime('now', '-5 days'), datetime('now', '-10 days'), 87000.00, 85000.00, 85000.00, 85000.00, -2000.00, -2.30, 'credit_note', 'CN-2026-001', datetime('now', '-5 days'), 'ZAR', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-15 days'), 'user-meth-manager-001', datetime('now', '-5 days'), datetime('now', '-20 days'), datetime('now')),
  ('settle-meth-002', 'comp-methodist-001', 'SET-2026-002', 'Easter Promo Settlement - Pick n Pay', 'Settlement for Easter coffee promotion', 'completed', 'promotional', 'cust-meth-002', 'promo-meth-001', 'claim-meth-002', 'budget-meth-002', datetime('now', '-5 days'), datetime('now', '-10 days'), 67000.00, 65000.00, 65000.00, 65000.00, -2000.00, -2.99, 'credit_note', 'CN-2026-002', datetime('now', '-5 days'), 'ZAR', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-15 days'), 'user-meth-manager-001', datetime('now', '-5 days'), datetime('now', '-20 days'), datetime('now')),
  ('settle-meth-003', 'comp-methodist-001', 'SET-2026-003', 'Winter Warmers Settlement - Shoprite', 'Settlement for winter bundle promotion', 'approved', 'promotional', 'cust-meth-001', 'promo-meth-002', 'claim-meth-003', 'budget-meth-003', datetime('now', '+5 days'), datetime('now', '+10 days'), 122000.00, 120000.00, 115000.00, 0.00, -7000.00, -5.74, 'credit_note', NULL, NULL, 'ZAR', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-5 days'), NULL, NULL, datetime('now', '-8 days'), datetime('now'));

-- ============================================================================
-- 12. ACCRUALS
-- ============================================================================

INSERT INTO accruals (id, company_id, name, description, status, accrual_type, calculation_method, frequency, customer_id, product_id, promotion_id, budget_id, start_date, end_date, rate, rate_type, base_amount, accrued_amount, posted_amount, reversed_amount, settled_amount, remaining_amount, currency, last_calculated_at, auto_calculate, auto_post, created_by, approved_by, approved_at, created_at, updated_at)
VALUES
  ('accr-meth-001', 'comp-methodist-001', 'Easter Promo Accrual - Shoprite', 'Accrual for Easter coffee promotion', 'posted', 'promotional', 'percentage', 'monthly', 'cust-meth-001', 'prod-meth-001', 'promo-meth-001', 'budget-meth-002', '2026-03-20', '2026-04-10', 15.00, 'percentage', 580000.00, 87000.00, 87000.00, 0.00, 85000.00, 2000.00, 'ZAR', datetime('now', '-5 days'), 1, 1, 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-30 days'), datetime('now', '-35 days'), datetime('now')),
  ('accr-meth-002', 'comp-methodist-001', 'Easter Promo Accrual - Pick n Pay', 'Accrual for Easter coffee promotion', 'posted', 'promotional', 'percentage', 'monthly', 'cust-meth-002', 'prod-meth-001', 'promo-meth-001', 'budget-meth-002', '2026-03-20', '2026-04-10', 15.00, 'percentage', 445000.00, 67000.00, 67000.00, 0.00, 65000.00, 2000.00, 'ZAR', datetime('now', '-5 days'), 1, 1, 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-30 days'), datetime('now', '-35 days'), datetime('now')),
  ('accr-meth-003', 'comp-methodist-001', 'Winter Warmers Accrual - Shoprite', 'Accrual for winter bundle promotion', 'active', 'promotional', 'percentage', 'monthly', 'cust-meth-001', 'prod-meth-005', 'promo-meth-002', 'budget-meth-003', '2026-05-01', '2026-07-31', 18.00, 'percentage', 680000.00, 122000.00, 122000.00, 0.00, 0.00, 122000.00, 'ZAR', datetime('now', '-2 days'), 1, 1, 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-15 days'), datetime('now', '-20 days'), datetime('now')),
  ('accr-meth-004', 'comp-methodist-001', 'Shoprite Exclusive Accrual', 'Accrual for Shoprite exclusive deal', 'active', 'volume_discount', 'fixed', 'quarterly', 'cust-meth-001', NULL, 'promo-meth-004', 'budget-meth-004', '2026-04-01', '2026-06-30', 0.00, 'fixed', 380000.00, 95000.00, 95000.00, 0.00, 0.00, 95000.00, 'ZAR', datetime('now', '-1 days'), 1, 1, 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-10 days'), datetime('now', '-15 days'), datetime('now'));

-- ============================================================================
-- 13. P&L REPORTS
-- ============================================================================

INSERT INTO pnl_reports (id, company_id, name, description, status, report_type, period_type, start_date, end_date, customer_id, promotion_id, category, channel, region, gross_sales, trade_spend, net_sales, cogs, gross_profit, gross_margin_pct, accruals, settlements, claims, deductions, net_trade_cost, net_profit, net_margin_pct, budget_amount, budget_variance, budget_variance_pct, roi, currency, generated_at, generated_by, created_at, updated_at)
VALUES
  ('pnl-meth-001', 'comp-methodist-001', 'Methodist Q1 2026 P&L', 'Q1 2026 Profit & Loss Report', 'published', 'quarterly', 'quarter', '2026-01-01', '2026-03-31', NULL, NULL, NULL, NULL, NULL, 12500000.00, 800000.00, 11700000.00, 7500000.00, 4200000.00, 33.60, 850000.00, 150000.00, 150000.00, 21250.00, 821250.00, 3378750.00, 27.03, 2000000.00, -621250.00, -31.06, 4.11, 'ZAR', datetime('now', '-5 days'), 'user-meth-analyst-001', datetime('now', '-5 days'), datetime('now')),
  ('pnl-meth-002', 'comp-methodist-001', 'Methodist Easter Promo P&L', 'Easter Coffee Promotion P&L', 'published', 'promotional', 'custom', '2026-03-20', '2026-04-10', NULL, 'promo-meth-001', 'Beverages', 'Modern Trade', NULL, 1025000.00, 245000.00, 780000.00, 615000.00, 165000.00, 16.10, 154000.00, 150000.00, 150000.00, 21250.00, 125250.00, 39750.00, 3.88, 250000.00, 124750.00, 49.90, 0.16, 'ZAR', datetime('now', '-3 days'), 'user-meth-analyst-001', datetime('now', '-3 days'), datetime('now')),
  ('pnl-meth-003', 'comp-methodist-001', 'Methodist Shoprite 2026 YTD P&L', 'Shoprite YTD P&L Report', 'published', 'customer', 'ytd', '2026-01-01', '2026-03-31', 'cust-meth-001', NULL, NULL, 'Modern Trade', 'Gauteng', 4200000.00, 352000.00, 3848000.00, 2520000.00, 1328000.00, 31.62, 369000.00, 85000.00, 85000.00, 12500.00, 284000.00, 1044000.00, 24.86, 1500000.00, 1216000.00, 81.07, 3.68, 'ZAR', datetime('now', '-2 days'), 'user-meth-analyst-001', datetime('now', '-2 days'), datetime('now'));

-- ============================================================================
-- 14. P&L LINE ITEMS
-- ============================================================================

INSERT INTO pnl_line_items (id, company_id, report_id, line_type, line_label, sort_order, customer_id, customer_name, promotion_id, promotion_name, product_id, product_name, period_start, period_end, gross_sales, trade_spend, net_sales, cogs, gross_profit, gross_margin_pct, accruals, settlements, claims, deductions, net_trade_cost, net_profit, net_margin_pct, budget_amount, budget_variance, roi, created_at, updated_at)
VALUES
  ('pnl-line-meth-001', 'comp-methodist-001', 'pnl-meth-002', 'customer', 'Shoprite Holdings', 1, 'cust-meth-001', 'Shoprite Holdings', 'promo-meth-001', 'Methodist Easter Coffee Promo 2026', 'prod-meth-001', 'Methodist Premium Coffee 250g', '2026-03-20', '2026-04-10', 580000.00, 117000.00, 463000.00, 348000.00, 115000.00, 19.83, 87000.00, 85000.00, 85000.00, 12500.00, 72500.00, 42500.00, 7.33, 150000.00, 77500.00, 0.36, datetime('now', '-3 days'), datetime('now')),
  ('pnl-line-meth-002', 'comp-methodist-001', 'pnl-meth-002', 'customer', 'Pick n Pay', 2, 'cust-meth-002', 'Pick n Pay', 'promo-meth-001', 'Methodist Easter Coffee Promo 2026', 'prod-meth-001', 'Methodist Premium Coffee 250g', '2026-03-20', '2026-04-10', 445000.00, 93000.00, 352000.00, 267000.00, 85000.00, 19.10, 67000.00, 65000.00, 65000.00, 8750.00, 52750.00, 32250.00, 7.25, 100000.00, 47250.00, 0.35, datetime('now', '-3 days'), datetime('now')),
  ('pnl-line-meth-003', 'comp-methodist-001', 'pnl-meth-003', 'product', 'Methodist Premium Coffee 250g', 1, 'cust-meth-001', 'Shoprite Holdings', NULL, NULL, 'prod-meth-001', 'Methodist Premium Coffee 250g', '2026-01-01', '2026-03-31', 1250000.00, 95000.00, 1155000.00, 750000.00, 405000.00, 32.40, 102000.00, 85000.00, 85000.00, 12500.00, 72500.00, 332500.00, 26.60, 380000.00, 285000.00, 3.50, datetime('now', '-2 days'), datetime('now')),
  ('pnl-line-meth-004', 'comp-methodist-001', 'pnl-meth-003', 'product', 'Methodist Instant Coffee 200g', 2, 'cust-meth-001', 'Shoprite Holdings', NULL, NULL, 'prod-meth-002', 'Methodist Instant Coffee 200g', '2026-01-01', '2026-03-31', 980000.00, 78000.00, 902000.00, 588000.00, 314000.00, 32.04, 85000.00, 0.00, 0.00, 0.00, 78000.00, 236000.00, 24.08, 320000.00, 242000.00, 3.03, datetime('now', '-2 days'), datetime('now'));

-- ============================================================================
-- 15. FORECASTS
-- ============================================================================

INSERT INTO forecasts (id, company_id, name, forecast_type, status, period_type, start_period, end_period, base_year, forecast_year, total_forecast, total_actual, variance, variance_percent, method, confidence_level, created_by, created_at, updated_at)
VALUES
  ('forecast-meth-001', 'comp-methodist-001', 'Methodist 2026 Annual Revenue Forecast', 'revenue', 'active', 'annual', '2026-01-01', '2026-12-31', 2025, 2026, 52000000.00, 12500000.00, -500000.00, -3.85, 'time_series', 0.85, 'user-meth-analyst-001', datetime('now', '-60 days'), datetime('now')),
  ('forecast-meth-002', 'comp-methodist-001', 'Methodist Q2 2026 Trade Spend Forecast', 'trade_spend', 'active', 'quarterly', '2026-04-01', '2026-06-30', 2025, 2026, 2200000.00, 600000.00, -100000.00, -14.29, 'regression', 0.78, 'user-meth-analyst-001', datetime('now', '-30 days'), datetime('now')),
  ('forecast-meth-003', 'comp-methodist-001', 'Methodist H2 2026 Volume Forecast', 'volume', 'active', 'half_year', '2026-07-01', '2026-12-31', 2025, 2026, 1850000.00, 0.00, 0.00, 0.00, 'ml_model', 0.82, 'user-meth-analyst-001', datetime('now', '-45 days'), datetime('now'));

-- ============================================================================
-- 16. BASELINES
-- ============================================================================

INSERT INTO baselines (id, company_id, name, description, status, baseline_type, calculation_method, granularity, customer_id, product_id, category, brand, channel, region, start_date, end_date, base_year, periods_used, seasonality_enabled, trend_enabled, outlier_removal_enabled, outlier_threshold, confidence_level, total_base_volume, total_base_revenue, avg_weekly_volume, avg_weekly_revenue, trend_coefficient, r_squared, mape, created_by, approved_by, approved_at, created_at, updated_at)
VALUES
  ('baseline-meth-001', 'comp-methodist-001', 'Methodist Coffee Baseline 2026', 'Baseline for coffee category', 'approved', 'product_category', 'moving_average', 'weekly', NULL, NULL, 'Beverages', 'Methodist', 'Modern Trade', NULL, '2025-01-01', '2025-12-31', 2025, 52, 1, 1, 1, 2.5, 0.88, 125000.00, 5750000.00, 2404.00, 110577.00, 1.05, 0.92, 8.5, 'user-meth-analyst-001', 'user-meth-manager-001', datetime('now', '-50 days'), datetime('now', '-60 days'), datetime('now')),
  ('baseline-meth-002', 'comp-methodist-001', 'Methodist Shoprite Baseline 2026', 'Baseline for Shoprite customer', 'approved', 'customer', 'exponential_smoothing', 'weekly', 'cust-meth-001', NULL, NULL, 'Methodist', 'Modern Trade', 'Gauteng', '2025-01-01', '2025-12-31', 2025, 52, 1, 1, 1, 2.0, 0.85, 42000.00, 1932000.00, 808.00, 37154.00, 1.08, 0.89, 9.2, 'user-meth-analyst-001', 'user-meth-manager-001', datetime('now', '-50 days'), datetime('now', '-60 days'), datetime('now')),
  ('baseline-meth-003', 'comp-methodist-001', 'Methodist Premium Coffee Baseline', 'Baseline for premium coffee SKU', 'approved', 'product', 'regression', 'daily', NULL, 'prod-meth-001', 'Beverages', 'Methodist', NULL, NULL, '2025-01-01', '2025-12-31', 2025, 365, 1, 1, 1, 3.0, 0.90, 28000.00, 1287720.00, 538.00, 24764.00, 1.03, 0.94, 7.8, 'user-meth-analyst-001', 'user-meth-manager-001', datetime('now', '-50 days'), datetime('now', '-60 days'), datetime('now'));

-- ============================================================================
-- 17. KPI DEFINITIONS
-- ============================================================================

INSERT INTO kpi_definitions (id, company_id, name, description, kpi_type, category, unit, format, calculation_method, data_source, frequency, direction, threshold_red, threshold_amber, threshold_green, weight, sort_order, is_active, owner, created_by, created_at, updated_at)
VALUES
  ('kpi-def-meth-001', 'comp-methodist-001', 'Trade Spend as % of Revenue', 'Trade spend as percentage of gross revenue', 'financial', 'Trade Efficiency', 'percentage', 'percentage', 'trade_spend / gross_sales * 100', 'pnl_reports', 'monthly', 'lower', 12.0, 10.0, 8.0, 1.0, 1, 1, 'user-meth-manager-001', 'user-meth-admin-001', datetime('now', '-90 days'), datetime('now')),
  ('kpi-def-meth-002', 'comp-methodist-001', 'Gross Margin %', 'Gross profit margin percentage', 'financial', 'Profitability', 'percentage', 'percentage', '(gross_sales - cogs) / gross_sales * 100', 'pnl_reports', 'monthly', 'higher', 28.0, 30.0, 35.0, 1.0, 2, 1, 'user-meth-manager-001', 'user-meth-admin-001', datetime('now', '-90 days'), datetime('now')),
  ('kpi-def-meth-003', 'comp-methodist-001', 'Promotional ROI', 'Return on investment for promotional activities', 'financial', 'Trade Efficiency', 'ratio', 'decimal', 'incremental_revenue / trade_spend', 'promotions', 'quarterly', 'higher', 2.0, 3.0, 4.0, 1.0, 3, 1, 'user-meth-manager-001', 'user-meth-admin-001', datetime('now', '-90 days'), datetime('now')),
  ('kpi-def-meth-004', 'comp-methodist-001', 'Claims Settlement Time', 'Average days to settle claims', 'operational', 'Settlement Efficiency', 'days', 'integer', 'avg(settlement_date - claim_date)', 'claims', 'monthly', 'lower', 30.0, 20.0, 15.0, 0.8, 4, 1, 'user-meth-manager-001', 'user-meth-admin-001', datetime('now', '-90 days'), datetime('now')),
  ('kpi-def-meth-005', 'comp-methodist-001', 'Budget Utilization %', 'Percentage of budget utilized', 'financial', 'Budget Management', 'percentage', 'percentage', 'utilized / amount * 100', 'budgets', 'monthly', 'optimal', 50.0, 75.0, 90.0, 0.9, 5, 1, 'user-meth-manager-001', 'user-meth-admin-001', datetime('now', '-90 days'), datetime('now'));

-- ============================================================================
-- 18. KPI TARGETS
-- ============================================================================

INSERT INTO kpi_targets (id, company_id, kpi_id, kpi_name, period, period_start, period_end, target_value, stretch_target, floor_value, prior_year_value, budget_value, status, approved_by, approved_at, created_by, created_at, updated_at)
VALUES
  ('kpi-tgt-meth-001', 'comp-methodist-001', 'kpi-def-meth-001', 'Trade Spend as % of Revenue', '2026-Q1', '2026-01-01', '2026-03-31', 9.5, 8.0, 11.0, 10.2, 10.0, 'approved', 'user-meth-admin-001', datetime('now', '-80 days'), 'user-meth-manager-001', datetime('now', '-85 days'), datetime('now')),
  ('kpi-tgt-meth-002', 'comp-methodist-001', 'kpi-def-meth-002', 'Gross Margin %', '2026-Q1', '2026-01-01', '2026-03-31', 33.0, 35.0, 30.0, 32.5, 33.0, 'approved', 'user-meth-admin-001', datetime('now', '-80 days'), 'user-meth-manager-001', datetime('now', '-85 days'), datetime('now')),
  ('kpi-tgt-meth-003', 'comp-methodist-001', 'kpi-def-meth-003', 'Promotional ROI', '2026-Q1', '2026-01-01', '2026-03-31', 3.5, 4.5, 2.5, 3.2, 3.5, 'approved', 'user-meth-admin-001', datetime('now', '-80 days'), 'user-meth-manager-001', datetime('now', '-85 days'), datetime('now')),
  ('kpi-tgt-meth-004', 'comp-methodist-001', 'kpi-def-meth-004', 'Claims Settlement Time', '2026-Q1', '2026-01-01', '2026-03-31', 18.0, 15.0, 25.0, 22.0, 20.0, 'approved', 'user-meth-admin-001', datetime('now', '-80 days'), 'user-meth-manager-001', datetime('now', '-85 days'), datetime('now')),
  ('kpi-tgt-meth-005', 'comp-methodist-001', 'kpi-def-meth-005', 'Budget Utilization %', '2026-Q1', '2026-01-01', '2026-03-31', 80.0, 90.0, 65.0, 75.0, 80.0, 'approved', 'user-meth-admin-001', datetime('now', '-80 days'), 'user-meth-manager-001', datetime('now', '-85 days'), datetime('now'));

-- ============================================================================
-- 19. KPI ACTUALS
-- ============================================================================

INSERT INTO kpi_actuals (id, company_id, kpi_id, kpi_name, period, period_start, period_end, actual_value, target_value, variance, variance_pct, achievement_pct, trend_direction, prior_period_value, prior_year_value, yoy_growth_pct, ytd_actual, ytd_target, ytd_achievement_pct, rag_status, created_by, created_at, updated_at)
VALUES
  ('kpi-act-meth-001', 'comp-methodist-001', 'kpi-def-meth-001', 'Trade Spend as % of Revenue', '2026-Q1', '2026-01-01', '2026-03-31', 6.40, 9.5, -3.10, -32.63, 132.63, 'improving', 10.5, 10.2, -37.25, 6.40, 9.5, 132.63, 'green', 'user-meth-analyst-001', datetime('now', '-5 days'), datetime('now')),
  ('kpi-act-meth-002', 'comp-methodist-001', 'kpi-def-meth-002', 'Gross Margin %', '2026-Q1', '2026-01-01', '2026-03-31', 33.60, 33.0, 0.60, 1.82, 101.82, 'stable', 32.8, 32.5, 3.38, 33.60, 33.0, 101.82, 'green', 'user-meth-analyst-001', datetime('now', '-5 days'), datetime('now')),
  ('kpi-act-meth-003', 'comp-methodist-001', 'kpi-def-meth-003', 'Promotional ROI', '2026-Q1', '2026-01-01', '2026-03-31', 4.11, 3.5, 0.61, 17.43, 117.43, 'improving', 3.1, 3.2, 28.44, 4.11, 3.5, 117.43, 'green', 'user-meth-analyst-001', datetime('now', '-5 days'), datetime('now')),
  ('kpi-act-meth-004', 'comp-methodist-001', 'kpi-def-meth-004', 'Claims Settlement Time', '2026-Q1', '2026-01-01', '2026-03-31', 15.0, 18.0, -3.0, -16.67, 120.00, 'improving', 20.0, 22.0, -31.82, 15.0, 18.0, 120.00, 'green', 'user-meth-analyst-001', datetime('now', '-5 days'), datetime('now')),
  ('kpi-act-meth-005', 'comp-methodist-001', 'kpi-def-meth-005', 'Budget Utilization %', '2026-Q1', '2026-01-01', '2026-03-31', 30.0, 80.0, -50.0, -62.50, 37.50, 'declining', 70.0, 75.0, -60.00, 30.0, 80.0, 37.50, 'red', 'user-meth-analyst-001', datetime('now', '-5 days'), datetime('now'));

-- ============================================================================
-- 20. TRADE CALENDAR EVENTS
-- ============================================================================

INSERT INTO trade_calendar_events (id, company_id, name, description, event_type, status, start_date, end_date, all_day, customer_id, customer_name, product_id, product_name, promotion_id, budget_id, channel, region, category, brand, planned_spend, actual_spend, planned_volume, actual_volume, planned_revenue, actual_revenue, roi, lift_pct, priority, created_by, approved_by, approved_at, created_at, updated_at)
VALUES
  ('cal-meth-001', 'comp-methodist-001', 'Easter Coffee Promo - Shoprite', 'Easter promotional campaign at Shoprite', 'promotion', 'completed', '2026-03-20', '2026-04-10', 0, 'cust-meth-001', 'Shoprite Holdings', 'prod-meth-001', 'Methodist Premium Coffee 250g', 'promo-meth-001', 'budget-meth-002', 'Modern Trade', 'Gauteng', 'Beverages', 'Methodist', 150000.00, 117000.00, 12600.00, 12609.00, 600000.00, 580000.00, 3.68, 22.5, 'high', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-30 days'), datetime('now', '-45 days'), datetime('now')),
  ('cal-meth-002', 'comp-methodist-001', 'Winter Warmers Launch', 'Winter hot beverage promotional launch', 'promotion', 'active', '2026-05-01', '2026-07-31', 0, 'cust-meth-001', 'Shoprite Holdings', 'prod-meth-005', 'Methodist Hot Chocolate 500g', 'promo-meth-002', 'budget-meth-003', 'Modern Trade', 'Gauteng', 'Beverages', 'Methodist', 450000.00, 180000.00, 12840.00, 5136.00, 1800000.00, 720000.00, 3.00, 18.0, 'high', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-15 days'), datetime('now', '-20 days'), datetime('now')),
  ('cal-meth-003', 'comp-methodist-001', 'Shoprite Quarterly Business Review', 'Q2 business review meeting with Shoprite', 'meeting', 'scheduled', '2026-06-15', '2026-06-15', 0, 'cust-meth-001', 'Shoprite Holdings', NULL, NULL, NULL, NULL, 'Modern Trade', 'Gauteng', NULL, 'Methodist', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'medium', 'user-meth-kam-001', NULL, NULL, datetime('now', '-10 days'), datetime('now')),
  ('cal-meth-004', 'comp-methodist-001', 'Pick n Pay Premium Launch', 'Premium muesli range launch at Pick n Pay', 'product_launch', 'active', '2026-05-15', '2026-08-15', 0, 'cust-meth-002', 'Pick n Pay', 'prod-meth-010', 'Methodist Muesli 500g', 'promo-meth-005', 'budget-meth-005', 'Modern Trade', 'Western Cape', 'Breakfast', 'Methodist', 280000.00, 85000.00, 4444.00, 1349.00, 1120000.00, 339920.00, 3.00, 25.0, 'high', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-5 days'), datetime('now', '-10 days'), datetime('now')),
  ('cal-meth-005', 'comp-methodist-001', 'Heritage Day Campaign Planning', 'Planning session for Heritage Day campaign', 'planning', 'scheduled', '2026-07-10', '2026-07-10', 1, NULL, NULL, NULL, NULL, NULL, 'budget-meth-001', NULL, NULL, NULL, 'Methodist', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'medium', 'user-meth-manager-001', NULL, NULL, datetime('now', '-8 days'), datetime('now'));

-- ============================================================================
-- 21. SCENARIOS
-- ============================================================================

INSERT INTO scenarios (id, company_id, name, description, scenario_type, status, base_promotion_id, base_promotion_name, customer_id, customer_name, product_id, product_name, category, brand, channel, region, start_date, end_date, baseline_revenue, baseline_units, baseline_margin_pct, projected_revenue, projected_units, projected_spend, projected_roi, projected_lift_pct, projected_margin_pct, projected_incremental_revenue, projected_incremental_units, projected_net_profit, confidence_score, risk_level, recommendation, is_favorite, created_by, created_at, updated_at)
VALUES
  ('scenario-meth-001', 'comp-methodist-001', 'Easter Promo - 20% Discount Scenario', 'What-if scenario: 20% discount on premium coffee', 'what_if', 'completed', 'promo-meth-001', 'Methodist Easter Coffee Promo 2026', 'cust-meth-001', 'Shoprite Holdings', 'prod-meth-001', 'Methodist Premium Coffee 250g', 'Beverages', 'Methodist', 'Modern Trade', 'Gauteng', '2026-03-20', '2026-04-10', 465000.00, 10115.00, 33.60, 580000.00, 12609.00, 117000.00, 3.68, 24.67, 19.83, 115000.00, 2494.00, 42500.00, 0.88, 'low', 'Proceed - Strong ROI and incremental lift', 1, 'user-meth-analyst-001', datetime('now', '-40 days'), datetime('now')),
  ('scenario-meth-002', 'comp-methodist-001', 'Winter Warmers - Bundle vs Discount', 'Compare bundle offer vs straight discount', 'comparison', 'active', 'promo-meth-002', 'Methodist Winter Warmers 2026', 'cust-meth-001', 'Shoprite Holdings', 'prod-meth-005', 'Methodist Hot Chocolate 500g', 'Beverages', 'Methodist', 'Modern Trade', 'Gauteng', '2026-05-01', '2026-07-31', 610000.00, 11509.00, 32.00, 720000.00, 13585.00, 180000.00, 3.00, 18.03, 22.92, 110000.00, 2076.00, 55000.00, 0.82, 'medium', 'Bundle offer preferred - Better margin retention', 0, 'user-meth-analyst-001', datetime('now', '-18 days'), datetime('now')),
  ('scenario-meth-003', 'comp-methodist-001', 'Woolworths Premium Range Expansion', 'Scenario for expanding into Woolworths premium', 'opportunity', 'draft', NULL, NULL, 'cust-meth-003', 'Woolworths', 'prod-meth-010', 'Methodist Muesli 500g', 'Breakfast', 'Methodist', 'Modern Trade', 'Gauteng', '2026-08-01', '2026-10-31', 0.00, 0.00, 0.00, 850000.00, 13492.00, 180000.00, 3.72, 0.00, 28.50, 850000.00, 13492.00, 242500.00, 0.75, 'medium', 'Promising opportunity - Requires listing fee negotiation', 0, 'user-meth-analyst-001', datetime('now', '-12 days'), datetime('now'));

-- ============================================================================
-- 22. SCENARIO RESULTS
-- ============================================================================

INSERT INTO scenario_results (id, company_id, scenario_id, result_type, period, metric_name, metric_value, baseline_value, variance, variance_pct, confidence_low, confidence_high, confidence_pct, sort_order, created_at, updated_at)
VALUES
  ('scenario-res-meth-001', 'comp-methodist-001', 'scenario-meth-001', 'revenue', '2026-03-20 to 2026-04-10', 'Total Revenue', 580000.00, 465000.00, 115000.00, 24.73, 550000.00, 610000.00, 88.0, 1, datetime('now', '-40 days'), datetime('now')),
  ('scenario-res-meth-002', 'comp-methodist-001', 'scenario-meth-001', 'volume', '2026-03-20 to 2026-04-10', 'Total Units', 12609.00, 10115.00, 2494.00, 24.67, 12000.00, 13200.00, 88.0, 2, datetime('now', '-40 days'), datetime('now')),
  ('scenario-res-meth-003', 'comp-methodist-001', 'scenario-meth-001', 'margin', '2026-03-20 to 2026-04-10', 'Gross Margin %', 19.83, 33.60, -13.77, -40.98, 18.50, 21.00, 88.0, 3, datetime('now', '-40 days'), datetime('now')),
  ('scenario-res-meth-004', 'comp-methodist-001', 'scenario-meth-001', 'roi', '2026-03-20 to 2026-04-10', 'ROI', 3.68, 0.00, 3.68, 0.00, 3.20, 4.10, 88.0, 4, datetime('now', '-40 days'), datetime('now')),
  ('scenario-res-meth-005', 'comp-methodist-001', 'scenario-meth-002', 'revenue', '2026-05-01 to 2026-07-31', 'Total Revenue', 720000.00, 610000.00, 110000.00, 18.03, 680000.00, 760000.00, 82.0, 1, datetime('now', '-18 days'), datetime('now')),
  ('scenario-res-meth-006', 'comp-methodist-001', 'scenario-meth-002', 'margin', '2026-05-01 to 2026-07-31', 'Gross Margin %', 22.92, 32.00, -9.08, -28.38, 21.00, 24.50, 82.0, 2, datetime('now', '-18 days'), datetime('now'));

-- ============================================================================
-- 23. DEMAND SIGNALS
-- ============================================================================

INSERT INTO demand_signals (id, company_id, source_id, source_name, signal_type, signal_date, period_start, period_end, granularity, customer_id, customer_name, product_id, product_name, category, brand, channel, region, units_sold, revenue, baseline_units, baseline_revenue, incremental_units, incremental_revenue, lift_pct, promo_flag, promotion_id, inventory_level, distribution_pct, price_index, market_share_pct, trend_direction, confidence, created_at, updated_at)
VALUES
  ('demand-meth-001', 'comp-methodist-001', 'src-pos-001', 'Shoprite POS Data', 'pos', datetime('now', '-7 days'), datetime('now', '-7 days'), datetime('now', '-7 days'), 'daily', 'cust-meth-001', 'Shoprite Holdings', 'prod-meth-001', 'Methodist Premium Coffee 250g', 'Beverages', 'Methodist', 'Modern Trade', 'Gauteng', 580.00, 26674.20, 465.00, 21388.35, 115.00, 5285.85, 24.73, 1, 'promo-meth-001', 2400.00, 98.5, 1.15, 18.5, 'up', 0.92, datetime('now', '-7 days'), datetime('now')),
  ('demand-meth-002', 'comp-methodist-001', 'src-pos-002', 'Pick n Pay POS Data', 'pos', datetime('now', '-7 days'), datetime('now', '-7 days'), datetime('now', '-7 days'), 'daily', 'cust-meth-002', 'Pick n Pay', 'prod-meth-001', 'Methodist Premium Coffee 250g', 'Beverages', 'Methodist', 'Modern Trade', 'Western Cape', 445.00, 20465.55, 352.00, 16188.48, 93.00, 4277.07, 26.42, 1, 'promo-meth-001', 1800.00, 96.0, 1.18, 15.2, 'up', 0.89, datetime('now', '-7 days'), datetime('now')),
  ('demand-meth-003', 'comp-methodist-001', 'src-pos-001', 'Shoprite POS Data', 'pos', datetime('now', '-14 days'), datetime('now', '-14 days'), datetime('now', '-14 days'), 'daily', 'cust-meth-001', 'Shoprite Holdings', 'prod-meth-002', 'Methodist Instant Coffee 200g', 'Beverages', 'Methodist', 'Modern Trade', 'Gauteng', 420.00, 13855.80, 410.00, 13524.90, 10.00, 330.90, 2.44, 0, NULL, 3200.00, 99.2, 1.02, 16.8, 'stable', 0.88, datetime('now', '-14 days'), datetime('now')),
  ('demand-meth-004', 'comp-methodist-001', 'src-forecast-001', 'Methodist ML Forecast', 'forecast', datetime('now'), datetime('now', '+7 days'), datetime('now', '+7 days'), 'daily', 'cust-meth-001', 'Shoprite Holdings', 'prod-meth-005', 'Methodist Hot Chocolate 500g', 'Beverages', 'Methodist', 'Modern Trade', 'Gauteng', 285.00, 15102.15, 240.00, 12717.60, 45.00, 2384.55, 18.75, 1, 'promo-meth-002', 1500.00, 95.0, 1.12, 14.5, 'up', 0.78, datetime('now'), datetime('now')),
  ('demand-meth-005', 'comp-methodist-001', 'src-pos-003', 'Woolworths POS Data', 'pos', datetime('now', '-3 days'), datetime('now', '-3 days'), datetime('now', '-3 days'), 'daily', 'cust-meth-003', 'Woolworths', 'prod-meth-010', 'Methodist Muesli 500g', 'Breakfast', 'Methodist', 'Modern Trade', 'Gauteng', 95.00, 5983.05, 85.00, 5354.15, 10.00, 628.90, 11.76, 1, 'promo-meth-005', 850.00, 92.0, 1.08, 12.3, 'up', 0.85, datetime('now', '-3 days'), datetime('now'));

-- ============================================================================
-- 24. BUDGET ALLOCATIONS
-- ============================================================================

INSERT INTO budget_allocations (id, company_id, name, description, status, allocation_method, budget_id, source_amount, allocated_amount, remaining_amount, utilized_amount, utilization_pct, fiscal_year, period_type, start_date, end_date, dimension, currency, locked, approved_by, approved_at, created_by, created_at, updated_at)
VALUES
  ('balloc-meth-001', 'comp-methodist-001', 'Methodist 2026 Customer Allocation', 'Budget allocation by customer', 'active', 'proportional', 'budget-meth-001', 8000000.00, 8000000.00, 5600000.00, 2400000.00, 30.00, 2026, 'annual', '2026-01-01', '2026-12-31', 'customer', 'ZAR', 0, 'user-meth-admin-001', datetime('now', '-80 days'), 'user-meth-manager-001', datetime('now', '-85 days'), datetime('now')),
  ('balloc-meth-002', 'comp-methodist-001', 'Methodist Q2 2026 Product Allocation', 'Q2 budget allocation by product category', 'active', 'manual', 'budget-meth-003', 2200000.00, 2200000.00, 1600000.00, 600000.00, 27.27, 2026, 'quarterly', '2026-04-01', '2026-06-30', 'product', 'ZAR', 0, 'user-meth-manager-001', datetime('now', '-20 days'), 'user-meth-manager-001', datetime('now', '-25 days'), datetime('now'));

-- ============================================================================
-- 25. BUDGET ALLOCATION LINES
-- ============================================================================

INSERT INTO budget_allocation_lines (id, company_id, allocation_id, line_number, dimension_type, dimension_id, dimension_name, level, source_amount, allocated_amount, allocated_pct, utilized_amount, committed_amount, remaining_amount, utilization_pct, status, created_at, updated_at)
VALUES
  ('balline-meth-001', 'comp-methodist-001', 'balloc-meth-001', 1, 'customer', 'cust-meth-001', 'Shoprite Holdings', 1, 8000000.00, 1500000.00, 18.75, 450000.00, 300000.00, 750000.00, 30.00, 'active', datetime('now', '-85 days'), datetime('now')),
  ('balline-meth-002', 'comp-methodist-001', 'balloc-meth-001', 2, 'customer', 'cust-meth-002', 'Pick n Pay', 1, 8000000.00, 1200000.00, 15.00, 360000.00, 240000.00, 600000.00, 30.00, 'active', datetime('now', '-85 days'), datetime('now')),
  ('balline-meth-003', 'comp-methodist-001', 'balloc-meth-001', 3, 'customer', 'cust-meth-003', 'Woolworths', 1, 8000000.00, 1000000.00, 12.50, 200000.00, 150000.00, 650000.00, 20.00, 'active', datetime('now', '-85 days'), datetime('now')),
  ('balline-meth-004', 'comp-methodist-001', 'balloc-meth-002', 1, 'category', 'Beverages', 'Beverages', 1, 2200000.00, 1400000.00, 63.64, 450000.00, 600000.00, 350000.00, 32.14, 'active', datetime('now', '-25 days'), datetime('now')),
  ('balline-meth-005', 'comp-methodist-001', 'balloc-meth-002', 2, 'category', 'Breakfast', 'Breakfast', 1, 2200000.00, 800000.00, 36.36, 150000.00, 200000.00, 450000.00, 18.75, 'active', datetime('now', '-25 days'), datetime('now'));

-- ============================================================================
-- 26. APPROVALS
-- ============================================================================

INSERT INTO approvals (id, company_id, entity_type, entity_id, entity_name, amount, status, priority, requested_by, requested_at, assigned_to, approved_by, approved_at, comments, created_at, updated_at)
VALUES
  ('appr-meth-001', 'comp-methodist-001', 'promotion', 'promo-meth-001', 'Methodist Easter Coffee Promo 2026', 250000.00, 'approved', 'high', 'user-meth-kam-001', datetime('now', '-45 days'), 'user-meth-manager-001', 'user-meth-manager-001', datetime('now', '-30 days'), 'Approved - Strong ROI projection', datetime('now', '-45 days'), datetime('now')),
  ('appr-meth-002', 'comp-methodist-001', 'promotion', 'promo-meth-002', 'Methodist Winter Warmers 2026', 450000.00, 'approved', 'high', 'user-meth-kam-001', datetime('now', '-20 days'), 'user-meth-manager-001', 'user-meth-manager-001', datetime('now', '-15 days'), 'Approved - Seasonal opportunity', datetime('now', '-20 days'), datetime('now')),
  ('appr-meth-003', 'comp-methodist-001', 'claim', 'claim-meth-003', 'CLM-2026-003', 120000.00, 'approved', 'medium', 'user-meth-kam-001', datetime('now', '-8 days'), 'user-meth-manager-001', 'user-meth-manager-001', datetime('now', '-5 days'), 'Approved with minor adjustment', datetime('now', '-8 days'), datetime('now')),
  ('appr-meth-004', 'comp-methodist-001', 'claim', 'claim-meth-004', 'CLM-2026-004', 95000.00, 'pending', 'medium', 'user-meth-kam-001', datetime('now', '-3 days'), 'user-meth-manager-001', NULL, NULL, NULL, datetime('now', '-3 days'), datetime('now'));

-- ============================================================================
-- 27. TRADING TERMS
-- ============================================================================

INSERT INTO trading_terms (id, company_id, name, description, term_type, status, customer_id, start_date, end_date, rate, rate_type, threshold, cap, payment_frequency, calculation_basis, created_by, approved_by, approved_at, created_at, updated_at)
VALUES
  ('term-meth-001', 'comp-methodist-001', 'Shoprite Volume Rebate 2026', 'Volume-based rebate for Shoprite', 'volume_rebate', 'active', 'cust-meth-001', '2026-01-01', '2026-12-31', 2.5, 'percentage', 5000000.00, 150000.00, 'quarterly', 'net_sales', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-90 days'), datetime('now', '-95 days'), datetime('now')),
  ('term-meth-002', 'comp-methodist-001', 'Pick n Pay Growth Incentive', 'Growth-based incentive for Pick n Pay', 'growth_incentive', 'active', 'cust-meth-002', '2026-01-01', '2026-12-31', 3.0, 'percentage', 10.0, 120000.00, 'annual', 'yoy_growth', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-90 days'), datetime('now', '-95 days'), datetime('now')),
  ('term-meth-003', 'comp-methodist-001', 'Woolworths Premium Listing', 'Premium range listing terms', 'listing_fee', 'active', 'cust-meth-003', '2026-01-01', '2026-12-31', 45000.00, 'fixed', 0.00, 45000.00, 'one_time', 'fixed', 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-80 days'), datetime('now', '-85 days'), datetime('now'));

-- ============================================================================
-- 28. REBATES
-- ============================================================================

INSERT INTO rebates (id, company_id, name, description, rebate_type, status, customer_id, trading_term_id, start_date, end_date, rate, rate_type, threshold, cap, accrued_amount, settled_amount, calculation_basis, settlement_frequency, last_calculated_at, created_by, approved_by, approved_at, created_at, updated_at)
VALUES
  ('rebate-meth-001', 'comp-methodist-001', 'Shoprite Q1 Volume Rebate', 'Q1 volume rebate for Shoprite', 'volume', 'active', 'cust-meth-001', 'term-meth-001', '2026-01-01', '2026-03-31', 2.5, 'percentage', 1250000.00, 37500.00, 105000.00, 0.00, 'net_sales', 'quarterly', datetime('now', '-5 days'), 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-90 days'), datetime('now', '-95 days'), datetime('now')),
  ('rebate-meth-002', 'comp-methodist-001', 'Pick n Pay 2026 Growth Rebate', 'Annual growth rebate for Pick n Pay', 'growth', 'pending', 'cust-meth-002', 'term-meth-002', '2026-01-01', '2026-12-31', 3.0, 'percentage', 10.0, 120000.00, 0.00, 0.00, 'yoy_growth', 'annual', NULL, 'user-meth-kam-001', 'user-meth-manager-001', datetime('now', '-90 days'), datetime('now', '-95 days'), datetime('now'));

-- ============================================================================
-- 29. EXECUTIVE SCORECARDS
-- ============================================================================

INSERT INTO executive_scorecards (id, company_id, name, description, scorecard_type, status, period, period_start, period_end, overall_score, overall_rag, financial_score, operational_score, customer_score, growth_score, total_kpis, green_count, amber_count, red_count, highlights, lowlights, actions, commentary, published_at, published_by, created_by, created_at, updated_at)
VALUES
  ('scorecard-meth-001', 'comp-methodist-001', 'Methodist Q1 2026 Executive Scorecard', 'Q1 2026 executive performance scorecard', 'quarterly', 'published', '2026-Q1', '2026-01-01', '2026-03-31', 82.5, 'green', 88.0, 85.0, 78.0, 80.0, 5, 4, 0, 1, 'Strong promotional ROI (4.11), Excellent gross margin (33.6%), Fast claims settlement (15 days)', 'Budget utilization below target (30% vs 80% target)', 'Accelerate promotional pipeline, Increase customer engagement', 'Q1 performance exceeded expectations with strong profitability metrics. Trade spend efficiency improved significantly. Focus needed on budget deployment velocity.', datetime('now', '-3 days'), 'user-meth-admin-001', 'user-meth-analyst-001', datetime('now', '-5 days'), datetime('now'));

-- ============================================================================
-- 30. CUSTOMER 360 PROFILES
-- ============================================================================

INSERT INTO customer_360_profiles (id, company_id, customer_id, customer_name, customer_code, channel, sub_channel, tier, region, status, total_revenue, total_spend, total_claims, total_deductions, net_revenue, gross_margin_pct, trade_spend_pct, revenue_growth_pct, avg_order_value, order_frequency, last_order_date, active_promotions, completed_promotions, active_claims, pending_deductions, ltv_score, churn_risk, segment, price_sensitivity, promo_responsiveness, next_best_action, health_score, satisfaction_score, engagement_score, payment_reliability, last_calculated_at, created_at, updated_at)
VALUES
  ('c360-meth-001', 'comp-methodist-001', 'cust-meth-001', 'Shoprite Holdings', 'SHP001', 'Modern Trade', 'Supermarket', 'Tier 1', 'Gauteng', 'active', 4200000.00, 352000.00, 205000.00, 12500.00, 3848000.00, 31.62, 8.38, 12.5, 105000.00, 40, datetime('now', '-2 days'), 2, 1, 1, 1, 92.5, 0.08, 'Strategic Partner', 0.65, 0.88, 'Expand into breakfast category', 88.0, 85.0, 90.0, 95.0, datetime('now', '-1 days'), datetime('now', '-90 days'), datetime('now')),
  ('c360-meth-002', 'comp-methodist-001', 'cust-meth-002', 'Pick n Pay', 'PNP001', 'Modern Trade', 'Supermarket', 'Tier 1', 'Western Cape', 'active', 3200000.00, 285000.00, 65000.00, 8750.00, 2914250.00, 32.10, 8.91, 15.2, 80000.00, 40, datetime('now', '-3 days'), 1, 1, 0, 0, 88.0, 0.12, 'Key Account', 0.70, 0.82, 'Launch premium muesli range', 85.0, 82.0, 88.0, 92.0, datetime('now', '-1 days'), datetime('now', '-90 days'), datetime('now')),
  ('c360-meth-003', 'comp-methodist-001', 'cust-meth-003', 'Woolworths', 'WOO001', 'Modern Trade', 'Premium', 'Tier 1', 'Gauteng', 'active', 850000.00, 45000.00, 0.00, 6200.00, 804800.00, 35.20, 5.29, 0.00, 42500.00, 20, datetime('now', '-5 days'), 1, 0, 0, 1, 75.0, 0.25, 'Growth Opportunity', 0.45, 0.65, 'Resolve pending deduction, expand SKU range', 72.0, 70.0, 75.0, 88.0, datetime('now', '-1 days'), datetime('now', '-90 days'), datetime('now'));

-- ============================================================================
-- 31. CUSTOMER 360 INSIGHTS
-- ============================================================================

INSERT INTO customer_360_insights (id, company_id, customer_id, insight_type, category, severity, title, description, metric_name, metric_value, metric_unit, benchmark_value, variance_pct, trend_direction, recommendation, action_taken, confidence, source, created_at, updated_at)
VALUES
  ('c360-ins-meth-001', 'comp-methodist-001', 'cust-meth-001', 'opportunity', 'revenue', 'medium', 'Breakfast Category Expansion Opportunity', 'Shoprite shows strong performance in beverages but limited breakfast category penetration', 'Category Revenue Share', 15.0, 'percentage', 35.0, -57.14, 'stable', 'Launch targeted breakfast promotion with cereal and oats range', 0, 0.82, 'sales_analysis', datetime('now', '-10 days'), datetime('now')),
  ('c360-ins-meth-002', 'comp-methodist-001', 'cust-meth-001', 'performance', 'roi', 'low', 'Exceptional Promotional ROI', 'Shoprite promotional ROI (3.68) significantly exceeds company average (3.2)', 'Promotional ROI', 3.68, 'ratio', 3.20, 15.00, 'up', 'Maintain promotional strategy, consider increasing investment', 0, 0.92, 'promotion_analysis', datetime('now', '-8 days'), datetime('now')),
  ('c360-ins-meth-003', 'comp-methodist-001', 'cust-meth-002', 'risk', 'margin', 'low', 'Premium Range Launch Success', 'Pick n Pay premium muesli launch showing strong early traction', 'Launch Performance', 85.0, 'percentage', 70.0, 21.43, 'up', 'Accelerate premium range expansion, add 2-3 SKUs', 0, 0.78, 'product_launch', datetime('now', '-5 days'), datetime('now')),
  ('c360-ins-meth-004', 'comp-methodist-001', 'cust-meth-003', 'risk', 'payment', 'medium', 'Pending Deduction Requires Resolution', 'Woolworths has pending damage deduction (R6,200) requiring investigation', 'Deduction Amount', 6200.00, 'ZAR', 0.00, 0.00, 'stable', 'Investigate damage claim, resolve within 7 days to maintain relationship', 0, 0.95, 'deduction_monitoring', datetime('now', '-3 days'), datetime('now'));

-- ============================================================================
-- 32. NOTIFICATIONS
-- ============================================================================

INSERT INTO notifications (id, company_id, user_id, title, message, type, notification_type, category, priority, status, read, source_entity_type, source_entity_id, source_entity_name, action_url, action_label, created_at)
VALUES
  ('notif-meth-001', 'comp-methodist-001', 'user-meth-manager-001', 'New Claim Pending Approval', 'Claim CLM-2026-004 from Shoprite (R95,000) requires your approval', 'approval', 'approval_request', 'claims', 'high', 'active', 0, 'claim', 'claim-meth-004', 'CLM-2026-004', '/claims/claim-meth-004', 'Review Claim', datetime('now', '-3 days')),
  ('notif-meth-002', 'comp-methodist-001', 'user-meth-kam-001', 'Deduction Requires Investigation', 'Deduction DED-2026-003 (R15,000) from Shoprite needs review', 'alert', 'task', 'deductions', 'medium', 'active', 0, 'deduction', 'ded-meth-003', 'DED-2026-003', '/deductions/ded-meth-003', 'View Deduction', datetime('now', '-12 days')),
  ('notif-meth-003', 'comp-methodist-001', 'user-meth-analyst-001', 'Q1 P&L Report Published', 'Methodist Q1 2026 P&L report has been published', 'info', 'report', 'reports', 'low', 'active', 1, 'pnl_report', 'pnl-meth-001', 'Methodist Q1 2026 P&L', '/reports/pnl/pnl-meth-001', 'View Report', datetime('now', '-5 days')),
  ('notif-meth-004', 'comp-methodist-001', 'user-meth-manager-001', 'Budget Utilization Alert', 'Q1 budget utilization (30%) is below target (80%)', 'warning', 'alert', 'budgets', 'high', 'active', 0, 'budget', 'budget-meth-002', 'Methodist Q1 2026 Promotional', '/budgets/budget-meth-002', 'Review Budget', datetime('now', '-6 days'));

-- ============================================================================
-- 33. CAMPAIGNS
-- ============================================================================

INSERT INTO campaigns (id, company_id, name, description, campaign_type, status, start_date, end_date, budget_amount, spent_amount, target_revenue, actual_revenue, target_volume, actual_volume, created_by, approved_by, approved_at, created_at, updated_at)
VALUES
  ('camp-meth-001', 'comp-methodist-001', 'Methodist Easter 2026 Campaign', 'Cross-category Easter promotional campaign', 'seasonal', 'completed', '2026-03-10', '2026-04-15', 350000.00, 245000.00, 1500000.00, 1025000.00, 25000.00, 22000.00, 'user-meth-manager-001', 'user-meth-admin-001', datetime('now', '-50 days'), datetime('now', '-55 days'), datetime('now')),
  ('camp-meth-002', 'comp-methodist-001', 'Methodist Winter 2026 Campaign', 'Winter hot beverage multi-retailer campaign', 'seasonal', 'active', '2026-04-15', '2026-08-15', 750000.00, 265000.00, 3200000.00, 1060000.00, 38000.00, 12585.00, 'user-meth-manager-001', 'user-meth-admin-001', datetime('now', '-20 days'), datetime('now', '-25 days'), datetime('now')),
  ('camp-meth-003', 'comp-methodist-001', 'Methodist Premium Range Launch', 'National premium product range launch', 'product_launch', 'active', '2026-05-01', '2026-09-30', 500000.00, 130000.00, 2500000.00, 425000.00, 20000.00, 3400.00, 'user-meth-manager-001', 'user-meth-admin-001', datetime('now', '-10 days'), datetime('now', '-15 days'), datetime('now'));

-- ============================================================================
-- 34. ACTIVITIES (Audit Trail)
-- ============================================================================

INSERT INTO activities (id, company_id, user_id, action, entity_type, entity_id, description, created_at)
VALUES
  ('act-meth-001', 'comp-methodist-001', 'user-meth-admin-001', 'create', 'company', 'comp-methodist-001', 'Created Methodist company', datetime('now', '-90 days')),
  ('act-meth-002', 'comp-methodist-001', 'user-meth-kam-001', 'create', 'promotion', 'promo-meth-001', 'Created Easter Coffee Promo 2026', datetime('now', '-45 days')),
  ('act-meth-003', 'comp-methodist-001', 'user-meth-manager-001', 'approve', 'promotion', 'promo-meth-001', 'Approved Easter Coffee Promo 2026', datetime('now', '-30 days')),
  ('act-meth-004', 'comp-methodist-001', 'user-meth-kam-001', 'create', 'claim', 'claim-meth-001', 'Created claim CLM-2026-001 for Shoprite', datetime('now', '-20 days')),
  ('act-meth-005', 'comp-methodist-001', 'user-meth-manager-001', 'settle', 'settlement', 'settle-meth-001', 'Settled Easter Promo - Shoprite (R85,000)', datetime('now', '-5 days')),
  ('act-meth-006', 'comp-methodist-001', 'user-meth-analyst-001', 'publish', 'pnl_report', 'pnl-meth-001', 'Published Q1 2026 P&L Report', datetime('now', '-5 days')),
  ('act-meth-007', 'comp-methodist-001', 'user-meth-kam-001', 'create', 'promotion', 'promo-meth-002', 'Created Winter Warmers 2026 promotion', datetime('now', '-20 days')),
  ('act-meth-008', 'comp-methodist-001', 'user-meth-manager-001', 'approve', 'promotion', 'promo-meth-002', 'Approved Winter Warmers 2026', datetime('now', '-15 days')),
  ('act-meth-009', 'comp-methodist-001', 'user-meth-kam-001', 'create', 'trade_spend', 'tspend-meth-003', 'Created trade spend for Winter Warmers bundle', datetime('now', '-15 days')),
  ('act-meth-010', 'comp-methodist-001', 'user-meth-analyst-001', 'create', 'scenario', 'scenario-meth-001', 'Created Easter Promo discount scenario', datetime('now', '-40 days'));

-- ============================================================================
-- 35. DOCUMENTS
-- ============================================================================

INSERT INTO documents (id, company_id, name, description, document_type, category, status, file_name, file_type, file_size, entity_type, entity_id, entity_name, version, is_latest, tags, access_level, download_count, uploaded_by, created_at, updated_at)
VALUES
  ('doc-meth-001', 'comp-methodist-001', 'Methodist Q1 2026 P&L Report', 'Quarterly P&L report for Q1 2026', 'report', 'financial', 'published', 'Methodist_Q1_2026_PL.pdf', 'pdf', 245000, 'pnl_report', 'pnl-meth-001', 'Methodist Q1 2026 P&L', 1, 1, '["financial","q1","2026"]', 'company', 12, 'user-meth-analyst-001', datetime('now', '-5 days'), datetime('now')),
  ('doc-meth-002', 'comp-methodist-001', 'Shoprite Trading Terms 2026', 'Annual trading terms agreement', 'contract', 'trading_terms', 'active', 'Shoprite_Terms_2026.pdf', 'pdf', 180000, 'trading_term', 'term-meth-001', 'Shoprite Volume Rebate 2026', 1, 1, '["contract","shoprite","2026"]', 'restricted', 5, 'user-meth-kam-001', datetime('now', '-90 days'), datetime('now')),
  ('doc-meth-003', 'comp-methodist-001', 'Easter Campaign Brief', 'Easter 2026 campaign creative brief', 'brief', 'marketing', 'approved', 'Easter_Campaign_Brief_2026.docx', 'docx', 125000, 'campaign', 'camp-meth-001', 'Methodist Easter 2026 Campaign', 2, 1, '["marketing","easter","brief"]', 'company', 18, 'user-meth-manager-001', datetime('now', '-55 days'), datetime('now')),
  ('doc-meth-004', 'comp-methodist-001', 'Winter Warmers Planogram', 'In-store display planogram for winter campaign', 'planogram', 'merchandising', 'active', 'Winter_Warmers_Planogram.pdf', 'pdf', 320000, 'promotion', 'promo-meth-002', 'Methodist Winter Warmers 2026', 1, 1, '["planogram","winter","display"]', 'company', 8, 'user-meth-kam-001', datetime('now', '-15 days'), datetime('now'));

-- ============================================================================
-- 36. REPORT TEMPLATES
-- ============================================================================

INSERT INTO report_templates (id, company_id, name, description, report_category, report_type, data_source, is_system, is_shared, schedule_enabled, run_count, created_by, version, status, created_at, updated_at)
VALUES
  ('rpt-tpl-meth-001', 'comp-methodist-001', 'Monthly P&L Summary', 'Monthly profit and loss summary report', 'financial', 'pnl_summary', 'pnl_reports', 1, 1, 1, 3, 'user-meth-admin-001', 1, 'active', datetime('now', '-90 days'), datetime('now')),
  ('rpt-tpl-meth-002', 'comp-methodist-001', 'Trade Spend by Customer', 'Trade spend analysis by customer and period', 'trade', 'trade_spend_analysis', 'trade_spends', 1, 1, 0, 8, 'user-meth-admin-001', 1, 'active', datetime('now', '-90 days'), datetime('now')),
  ('rpt-tpl-meth-003', 'comp-methodist-001', 'Promotion ROI Analysis', 'Promotional return on investment analysis', 'analytics', 'promotion_roi', 'promotions', 1, 1, 0, 5, 'user-meth-admin-001', 1, 'active', datetime('now', '-90 days'), datetime('now')),
  ('rpt-tpl-meth-004', 'comp-methodist-001', 'Claims Aging Report', 'Outstanding claims aging analysis', 'settlement', 'claims_aging', 'claims', 1, 1, 1, 4, 'user-meth-admin-001', 1, 'active', datetime('now', '-90 days'), datetime('now'));

-- ============================================================================
-- 37. KAM WALLETS
-- ============================================================================

INSERT INTO kam_wallets (id, company_id, user_id, year, quarter, month, allocated_amount, utilized_amount, committed_amount, available_amount, status, created_at, updated_at)
VALUES
  ('wallet-meth-001', 'comp-methodist-001', 'user-meth-kam-001', 2026, 1, 1, 500000.00, 245000.00, 150000.00, 105000.00, 'active', datetime('now', '-90 days'), datetime('now')),
  ('wallet-meth-002', 'comp-methodist-001', 'user-meth-kam-001', 2026, 2, 4, 600000.00, 180000.00, 200000.00, 220000.00, 'active', datetime('now', '-30 days'), datetime('now')),
  ('wallet-meth-003', 'comp-methodist-001', 'user-meth-kam-001', 2026, 2, 5, 600000.00, 85000.00, 250000.00, 265000.00, 'active', datetime('now', '-15 days'), datetime('now'));

-- ============================================================================
-- 38. TRANSACTIONS
-- ============================================================================

INSERT INTO transactions (id, company_id, transaction_number, transaction_type, status, customer_id, product_id, amount, description, reference, payment_reference, created_by, approved_by, approved_at, created_at, updated_at)
VALUES
  ('txn-meth-001', 'comp-methodist-001', 'TXN-2026-001', 'credit_note', 'completed', 'cust-meth-001', NULL, 85000.00, 'Easter Promo Settlement - Shoprite', 'settle-meth-001', 'CN-2026-001', 'user-meth-manager-001', 'user-meth-admin-001', datetime('now', '-5 days'), datetime('now', '-5 days'), datetime('now')),
  ('txn-meth-002', 'comp-methodist-001', 'TXN-2026-002', 'credit_note', 'completed', 'cust-meth-002', NULL, 65000.00, 'Easter Promo Settlement - Pick n Pay', 'settle-meth-002', 'CN-2026-002', 'user-meth-manager-001', 'user-meth-admin-001', datetime('now', '-5 days'), datetime('now', '-5 days'), datetime('now')),
  ('txn-meth-003', 'comp-methodist-001', 'TXN-2026-003', 'deduction', 'pending', 'cust-meth-001', NULL, 15000.00, 'Promotional allowance deduction', 'ded-meth-003', NULL, 'user-meth-kam-001', NULL, NULL, datetime('now', '-12 days'), datetime('now'));

-- ============================================================================
-- 39. SALES TRANSACTIONS
-- ============================================================================

INSERT INTO sales_transactions (id, company_id, customer_id, product_id, transaction_date, quantity, unit_price, gross_amount, discount_amount, net_amount, channel, is_promotional, created_at, updated_at)
VALUES
  ('stxn-meth-001', 'comp-methodist-001', 'cust-meth-001', 'prod-meth-001', datetime('now', '-7 days'), 250.00, 45.99, 11497.50, 1149.75, 10347.75, 'Modern Trade', 1, datetime('now', '-7 days'), datetime('now')),
  ('stxn-meth-002', 'comp-methodist-001', 'cust-meth-001', 'prod-meth-002', datetime('now', '-7 days'), 380.00, 32.99, 12536.20, 0.00, 12536.20, 'Modern Trade', 0, datetime('now', '-7 days'), datetime('now')),
  ('stxn-meth-003', 'comp-methodist-001', 'cust-meth-002', 'prod-meth-001', datetime('now', '-7 days'), 195.00, 45.99, 8968.05, 896.81, 8071.25, 'Modern Trade', 1, datetime('now', '-7 days'), datetime('now')),
  ('stxn-meth-004', 'comp-methodist-001', 'cust-meth-001', 'prod-meth-005', datetime('now', '-5 days'), 285.00, 52.99, 15102.15, 2265.32, 12836.83, 'Modern Trade', 1, datetime('now', '-5 days'), datetime('now')),
  ('stxn-meth-005', 'comp-methodist-001', 'cust-meth-003', 'prod-meth-010', datetime('now', '-3 days'), 95.00, 62.99, 5984.05, 598.41, 5385.65, 'Modern Trade', 1, datetime('now', '-3 days'), datetime('now')),
  ('stxn-meth-006', 'comp-methodist-001', 'cust-meth-004', 'prod-meth-003', datetime('now', '-2 days'), 420.00, 28.99, 12175.80, 0.00, 12175.80, 'Modern Trade', 0, datetime('now', '-2 days'), datetime('now')),
  ('stxn-meth-007', 'comp-methodist-001', 'cust-meth-001', 'prod-meth-008', datetime('now', '-1 days'), 180.00, 48.99, 8818.20, 881.82, 7936.38, 'Modern Trade', 1, datetime('now', '-1 days'), datetime('now')),
  ('stxn-meth-008', 'comp-methodist-001', 'cust-meth-002', 'prod-meth-005', datetime('now', '-1 days'), 250.00, 52.99, 13247.50, 1987.13, 11260.38, 'Modern Trade', 1, datetime('now', '-1 days'), datetime('now'));

-- ============================================================================
-- 40. TRADE FUNDS
-- ============================================================================

INSERT INTO trade_funds (id, company_id, fund_name, fund_code, fund_type, budget_id, fiscal_year, currency, original_amount, allocated_amount, drawn_amount, remaining_amount, committed_amount, status, owner_id, owner_name, region, channel, customer_id, customer_name, effective_date, expiry_date, created_by, created_at, updated_at)
VALUES
  ('tfund-meth-001', 'comp-methodist-001', 'Methodist National Trade Fund 2026', 'METH-NTF-2026', 'national', 'budget-meth-001', 2026, 'ZAR', 5000000.00, 3800000.00, 1200000.00, 2600000.00, 800000.00, 'active', 'user-meth-manager-001', 'Emily Brown', NULL, NULL, NULL, NULL, '2026-01-01', '2026-12-31', 'user-meth-admin-001', datetime('now', '-90 days'), datetime('now')),
  ('tfund-meth-002', 'comp-methodist-001', 'Shoprite Customer Fund 2026', 'METH-SHP-2026', 'customer', 'budget-meth-004', 2026, 'ZAR', 1500000.00, 1500000.00, 450000.00, 750000.00, 300000.00, 'active', 'user-meth-kam-001', 'David Williams', 'Gauteng', 'Modern Trade', 'cust-meth-001', 'Shoprite Holdings', '2026-01-01', '2026-12-31', 'user-meth-manager-001', datetime('now', '-85 days'), datetime('now'));

-- ============================================================================
-- 41. TRADE FUND TRANSACTIONS
-- ============================================================================

INSERT INTO trade_fund_transactions (id, company_id, fund_id, transaction_type, amount, running_balance, reference_type, reference_id, reference_name, customer_id, customer_name, product_id, product_name, promotion_id, promotion_name, description, posted_by, posted_at, status, created_at, updated_at)
VALUES
  ('tft-meth-001', 'comp-methodist-001', 'tfund-meth-001', 'allocation', 5000000.00, 5000000.00, 'budget', 'budget-meth-001', 'Methodist 2026 Annual Trade Budget', NULL, NULL, NULL, NULL, NULL, NULL, 'Initial fund allocation from annual budget', 'user-meth-admin-001', datetime('now', '-90 days'), 'posted', datetime('now', '-90 days'), datetime('now')),
  ('tft-meth-002', 'comp-methodist-001', 'tfund-meth-001', 'draw', -245000.00, 4755000.00, 'promotion', 'promo-meth-001', 'Methodist Easter Coffee Promo 2026', 'cust-meth-001', 'Shoprite Holdings', 'prod-meth-001', 'Methodist Premium Coffee 250g', 'promo-meth-001', 'Methodist Easter Coffee Promo 2026', 'Easter promotion spend draw', 'user-meth-kam-001', datetime('now', '-25 days'), 'posted', datetime('now', '-25 days'), datetime('now')),
  ('tft-meth-003', 'comp-methodist-001', 'tfund-meth-002', 'allocation', 1500000.00, 1500000.00, 'budget', 'budget-meth-004', 'Methodist Shoprite 2026', 'cust-meth-001', 'Shoprite Holdings', NULL, NULL, NULL, NULL, 'Shoprite customer fund allocation', 'user-meth-manager-001', datetime('now', '-85 days'), 'posted', datetime('now', '-85 days'), datetime('now')),
  ('tft-meth-004', 'comp-methodist-001', 'tfund-meth-002', 'draw', -120000.00, 1380000.00, 'trade_spend', 'tspend-meth-003', 'Winter warmers bundle - Shoprite', 'cust-meth-001', 'Shoprite Holdings', 'prod-meth-005', 'Methodist Hot Chocolate 500g', 'promo-meth-002', 'Methodist Winter Warmers 2026', 'Winter warmers bundle spend', 'user-meth-kam-001', datetime('now', '-10 days'), 'posted', datetime('now', '-10 days'), datetime('now'));

-- ============================================================================
-- 42. INTEGRATIONS (SAP)
-- ============================================================================

INSERT INTO integrations (id, company_id, name, description, integration_type, provider, category, status, endpoint_url, auth_type, sync_frequency, last_sync_at, sync_status, record_count, error_count, created_by, created_at, updated_at)
VALUES
  ('integ-meth-001', 'comp-methodist-001', 'SAP ERP - Sales Orders', 'SAP sales order data integration', 'inbound', 'sap', 'erp', 'active', 'https://sap.methodist.co.za/api/v1/sales-orders', 'api_key', 'daily', datetime('now', '-1 days'), 'success', 1250, 0, 'user-meth-admin-001', datetime('now', '-90 days'), datetime('now')),
  ('integ-meth-002', 'comp-methodist-001', 'SAP ERP - Customer Master', 'SAP customer master data sync', 'inbound', 'sap', 'erp', 'active', 'https://sap.methodist.co.za/api/v1/customers', 'api_key', 'weekly', datetime('now', '-3 days'), 'success', 45, 0, 'user-meth-admin-001', datetime('now', '-90 days'), datetime('now')),
  ('integ-meth-003', 'comp-methodist-001', 'SAP ERP - Settlement Export', 'Export settlement data to SAP', 'outbound', 'sap', 'erp', 'active', 'https://sap.methodist.co.za/api/v1/settlements', 'api_key', 'on_demand', datetime('now', '-5 days'), 'success', 2, 0, 'user-meth-admin-001', datetime('now', '-90 days'), datetime('now'));

-- ============================================================================
-- SEED COMPLETE — Methodist tenant fully seeded across all tables
-- ============================================================================
