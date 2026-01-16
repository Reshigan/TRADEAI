-- TRADEAI D1 Demo Seed Data
-- Creates demo companies, users, and sample data for testing

-- Demo Companies
INSERT INTO companies (id, name, code, type, country, currency, timezone, status, settings, created_at, updated_at) VALUES
('comp-sunrise-001', 'Sunrise Foods SA', 'SUNRISE', 'manufacturer', 'ZA', 'ZAR', 'Africa/Johannesburg', 'active', '{"industry": "FMCG", "brands": ["Sunrise", "Golden Harvest", "Fresh Start"]}', datetime('now'), datetime('now')),
('comp-metro-001', 'Metro Distribution', 'METRO', 'distributor', 'ZA', 'ZAR', 'Africa/Johannesburg', 'active', '{"industry": "Distribution", "regions": ["Gauteng", "Western Cape", "KwaZulu-Natal"]}', datetime('now'), datetime('now')),
('comp-freshmart-001', 'FreshMart Stores', 'FRESHMART', 'retailer', 'ZA', 'ZAR', 'Africa/Johannesburg', 'active', '{"industry": "Retail", "storeCount": 45}', datetime('now'), datetime('now')),
('comp-diplomat-001', 'Diplomat SA', 'DIPLOMAT', 'distributor', 'ZA', 'ZAR', 'Africa/Johannesburg', 'active', '{"industry": "Distribution", "regions": ["Gauteng", "Mpumalanga"]}', datetime('now'), datetime('now'));

-- Demo Users (password hash is SHA-256 of 'Demo@123' and 'Diplomat@123')
-- Note: SHA-256('Demo@123') = ff96673205dc722320598ebf8f88325b2ac56922d5a2164b5765868274bc0d73
-- Note: SHA-256('Diplomat@123') = 8e61782552ff2990eca3e5793970680d50b38573b2aac7dd3dc099f1fb3c55b5
INSERT INTO users (id, company_id, email, password, first_name, last_name, role, department, is_active, login_attempts, permissions, created_at, updated_at) VALUES
-- Sunrise Foods users
('user-sunrise-admin', 'comp-sunrise-001', 'admin@sunrisefoods.co.za', 'ff96673205dc722320598ebf8f88325b2ac56922d5a2164b5765868274bc0d73', 'John', 'Smith', 'admin', 'Management', 1, 0, '["all"]', datetime('now'), datetime('now')),
('user-sunrise-kam', 'comp-sunrise-001', 'kam@sunrisefoods.co.za', 'ff96673205dc722320598ebf8f88325b2ac56922d5a2164b5765868274bc0d73', 'Sarah', 'Johnson', 'kam', 'Sales', 1, 0, '["promotions", "customers", "trade_spends"]', datetime('now'), datetime('now')),
-- Metro Distribution users
('user-metro-admin', 'comp-metro-001', 'admin@metrodist.co.za', 'ff96673205dc722320598ebf8f88325b2ac56922d5a2164b5765868274bc0d73', 'Michael', 'Brown', 'admin', 'Management', 1, 0, '["all"]', datetime('now'), datetime('now')),
-- FreshMart users
('user-freshmart-admin', 'comp-freshmart-001', 'admin@freshmart.co.za', 'ff96673205dc722320598ebf8f88325b2ac56922d5a2164b5765868274bc0d73', 'Lisa', 'Williams', 'admin', 'Management', 1, 0, '["all"]', datetime('now'), datetime('now')),
-- Diplomat SA users
('user-diplomat-admin', 'comp-diplomat-001', 'admin@diplomatsa.co.za', '8e61782552ff2990eca3e5793970680d50b38573b2aac7dd3dc099f1fb3c55b5', 'David', 'Miller', 'admin', 'Management', 1, 0, '["all"]', datetime('now'), datetime('now')),
('user-diplomat-user', 'comp-diplomat-001', 'user@diplomatsa.co.za', '8e61782552ff2990eca3e5793970680d50b38573b2aac7dd3dc099f1fb3c55b5', 'Emma', 'Davis', 'kam', 'Sales', 1, 0, '["promotions", "customers"]', datetime('now'), datetime('now'));

-- Demo Customers for Sunrise Foods
INSERT INTO customers (id, company_id, name, code, customer_type, channel, tier, status, region, city, data, created_at, updated_at) VALUES
('cust-pnp-001', 'comp-sunrise-001', 'Pick n Pay', 'PNP001', 'chain', 'modern_trade', 'platinum', 'active', 'National', 'Johannesburg', '{"contacts": [{"name": "Buyer Team", "email": "buyers@pnp.co.za"}], "storeCount": 1800}', datetime('now'), datetime('now')),
('cust-shoprite-001', 'comp-sunrise-001', 'Shoprite Holdings', 'SHOP001', 'chain', 'modern_trade', 'platinum', 'active', 'National', 'Cape Town', '{"contacts": [{"name": "Category Manager", "email": "category@shoprite.co.za"}], "storeCount": 2900}', datetime('now'), datetime('now')),
('cust-woolworths-001', 'comp-sunrise-001', 'Woolworths Food', 'WOOL001', 'chain', 'modern_trade', 'gold', 'active', 'National', 'Cape Town', '{"contacts": [{"name": "Food Buyer", "email": "food@woolworths.co.za"}], "storeCount": 450}', datetime('now'), datetime('now')),
('cust-spar-001', 'comp-sunrise-001', 'SPAR Group', 'SPAR001', 'chain', 'modern_trade', 'gold', 'active', 'National', 'Durban', '{"contacts": [{"name": "Procurement", "email": "procurement@spar.co.za"}], "storeCount": 900}', datetime('now'), datetime('now')),
('cust-checkers-001', 'comp-sunrise-001', 'Checkers', 'CHECK001', 'chain', 'modern_trade', 'gold', 'active', 'National', 'Cape Town', '{"contacts": [{"name": "Buyer", "email": "buyers@checkers.co.za"}], "storeCount": 800}', datetime('now'), datetime('now'));

-- Demo Products for Sunrise Foods
INSERT INTO products (id, company_id, name, sku, barcode, category, subcategory, brand, unit_price, cost_price, status, data, created_at, updated_at) VALUES
('prod-001', 'comp-sunrise-001', 'Sunrise Orange Juice 1L', 'SUN-OJ-1L', '6001234567890', 'Beverages', 'Juices', 'Sunrise', 24.99, 15.50, 'active', '{"packSize": "1L", "unitsPerCase": 12}', datetime('now'), datetime('now')),
('prod-002', 'comp-sunrise-001', 'Sunrise Apple Juice 1L', 'SUN-AJ-1L', '6001234567891', 'Beverages', 'Juices', 'Sunrise', 24.99, 15.50, 'active', '{"packSize": "1L", "unitsPerCase": 12}', datetime('now'), datetime('now')),
('prod-003', 'comp-sunrise-001', 'Golden Harvest Corn Flakes 500g', 'GH-CF-500', '6001234567892', 'Breakfast', 'Cereals', 'Golden Harvest', 45.99, 28.00, 'active', '{"packSize": "500g", "unitsPerCase": 24}', datetime('now'), datetime('now')),
('prod-004', 'comp-sunrise-001', 'Golden Harvest Muesli 750g', 'GH-MU-750', '6001234567893', 'Breakfast', 'Cereals', 'Golden Harvest', 89.99, 55.00, 'active', '{"packSize": "750g", "unitsPerCase": 12}', datetime('now'), datetime('now')),
('prod-005', 'comp-sunrise-001', 'Fresh Start Yogurt 500ml', 'FS-YG-500', '6001234567894', 'Dairy', 'Yogurt', 'Fresh Start', 32.99, 20.00, 'active', '{"packSize": "500ml", "unitsPerCase": 6}', datetime('now'), datetime('now')),
('prod-006', 'comp-sunrise-001', 'Fresh Start Milk 2L', 'FS-MK-2L', '6001234567895', 'Dairy', 'Milk', 'Fresh Start', 29.99, 18.00, 'active', '{"packSize": "2L", "unitsPerCase": 6}', datetime('now'), datetime('now')),
('prod-007', 'comp-sunrise-001', 'Sunrise Energy Drink 500ml', 'SUN-ED-500', '6001234567896', 'Beverages', 'Energy Drinks', 'Sunrise', 19.99, 12.00, 'active', '{"packSize": "500ml", "unitsPerCase": 24}', datetime('now'), datetime('now')),
('prod-008', 'comp-sunrise-001', 'Golden Harvest Granola Bar', 'GH-GB-40', '6001234567897', 'Snacks', 'Bars', 'Golden Harvest', 15.99, 9.50, 'active', '{"packSize": "40g", "unitsPerCase": 48}', datetime('now'), datetime('now'));

-- Demo Budgets for Sunrise Foods
INSERT INTO budgets (id, company_id, name, year, amount, utilized, status, budget_type, created_by, data, created_at, updated_at) VALUES
('budget-2026-annual', 'comp-sunrise-001', 'Annual Trade Budget 2026', 2026, 5000000.00, 1250000.00, 'active', 'annual', 'user-sunrise-admin', '{"allocations": {"Q1": 1250000, "Q2": 1250000, "Q3": 1250000, "Q4": 1250000}}', datetime('now'), datetime('now')),
('budget-2026-q1', 'comp-sunrise-001', 'Q1 2026 Promotions', 2026, 1250000.00, 450000.00, 'active', 'quarterly', 'user-sunrise-admin', '{"quarter": 1, "months": ["January", "February", "March"]}', datetime('now'), datetime('now')),
('budget-2026-pnp', 'comp-sunrise-001', 'Pick n Pay Partnership 2026', 2026, 800000.00, 320000.00, 'active', 'annual', 'user-sunrise-admin', '{"customer": "Pick n Pay", "type": "key_account"}', datetime('now'), datetime('now')),
('budget-2026-launch', 'comp-sunrise-001', 'New Product Launch Budget', 2026, 500000.00, 125000.00, 'approved', 'quarterly', 'user-sunrise-admin', '{"purpose": "new_product_launch", "products": ["Energy Drink Range"]}', datetime('now'), datetime('now'));

-- Demo Promotions for Sunrise Foods
INSERT INTO promotions (id, company_id, name, description, promotion_type, status, start_date, end_date, created_by, budget_id, data, created_at, updated_at) VALUES
('promo-001', 'comp-sunrise-001', 'Summer Juice Festival', 'Buy 2 Get 1 Free on all Sunrise Juices', 'bundle', 'active', '2026-01-01', '2026-02-28', 'user-sunrise-admin', 'budget-2026-q1', '{"mechanics": {"discountType": "bogo", "discountValue": 33.3, "minQuantity": 2}, "financial": {"plannedSpend": 150000, "actualSpend": 125000, "profitability": {"roi": 145.5}}, "products": ["prod-001", "prod-002"], "customers": ["cust-pnp-001", "cust-shoprite-001"]}', datetime('now'), datetime('now')),
('promo-002', 'comp-sunrise-001', 'Breakfast Week Special', '20% off Golden Harvest Cereals', 'price_discount', 'active', '2026-01-15', '2026-01-31', 'user-sunrise-admin', 'budget-2026-q1', '{"mechanics": {"discountType": "percentage", "discountValue": 20}, "financial": {"plannedSpend": 80000, "actualSpend": 75000, "profitability": {"roi": 128.3}}, "products": ["prod-003", "prod-004"], "customers": ["cust-woolworths-001", "cust-spar-001"]}', datetime('now'), datetime('now')),
('promo-003', 'comp-sunrise-001', 'Dairy Days', 'Volume discount on Fresh Start products', 'volume_discount', 'approved', '2026-02-01', '2026-02-14', 'user-sunrise-kam', 'budget-2026-q1', '{"mechanics": {"discountType": "volume", "discountValue": 15, "minQuantity": 100}, "financial": {"plannedSpend": 60000, "profitability": {"roi": 0}}, "products": ["prod-005", "prod-006"], "customers": ["cust-checkers-001"]}', datetime('now'), datetime('now')),
('promo-004', 'comp-sunrise-001', 'Energy Launch Promo', 'New Energy Drink introductory offer', 'price_discount', 'pending_approval', '2026-02-15', '2026-03-15', 'user-sunrise-kam', 'budget-2026-launch', '{"mechanics": {"discountType": "percentage", "discountValue": 25}, "financial": {"plannedSpend": 100000, "profitability": {"roi": 0}}, "products": ["prod-007"], "customers": ["cust-pnp-001", "cust-shoprite-001", "cust-checkers-001"]}', datetime('now'), datetime('now')),
('promo-005', 'comp-sunrise-001', 'Snack Attack', 'Granola bar multi-buy deal', 'bundle', 'draft', '2026-03-01', '2026-03-31', 'user-sunrise-kam', 'budget-2026-q1', '{"mechanics": {"discountType": "bundle", "discountValue": 10, "bundleSize": 5}, "financial": {"plannedSpend": 45000, "profitability": {"roi": 0}}, "products": ["prod-008"], "customers": ["cust-spar-001"]}', datetime('now'), datetime('now')),
('promo-006', 'comp-sunrise-001', 'Holiday Season Special', 'End of year clearance', 'price_discount', 'completed', '2025-12-01', '2025-12-31', 'user-sunrise-admin', 'budget-2026-annual', '{"mechanics": {"discountType": "percentage", "discountValue": 30}, "financial": {"plannedSpend": 200000, "actualSpend": 195000, "profitability": {"roi": 167.8}}, "products": ["prod-001", "prod-002", "prod-003"], "customers": ["cust-pnp-001", "cust-shoprite-001", "cust-woolworths-001"]}', datetime('now'), datetime('now'));

-- Demo Trade Spends for Sunrise Foods
INSERT INTO trade_spends (id, company_id, spend_id, spend_type, activity_type, amount, status, customer_id, promotion_id, budget_id, created_by, approved_by, approved_at, data, created_at, updated_at) VALUES
('ts-001', 'comp-sunrise-001', 'TS-2026-001', 'cash_coop', 'trade_marketing', 50000.00, 'approved', 'cust-pnp-001', 'promo-001', 'budget-2026-q1', 'user-sunrise-kam', 'user-sunrise-admin', datetime('now', '-5 days'), '{"description": "Co-op advertising for Summer Juice Festival", "invoiceNumber": "INV-001"}', datetime('now', '-7 days'), datetime('now')),
('ts-002', 'comp-sunrise-001', 'TS-2026-002', 'off_invoice', 'key_account', 75000.00, 'approved', 'cust-shoprite-001', 'promo-001', 'budget-2026-q1', 'user-sunrise-kam', 'user-sunrise-admin', datetime('now', '-3 days'), '{"description": "Off-invoice discount for Shoprite", "invoiceNumber": "INV-002"}', datetime('now', '-5 days'), datetime('now')),
('ts-003', 'comp-sunrise-001', 'TS-2026-003', 'scan_rebate', 'trade_marketing', 35000.00, 'approved', 'cust-woolworths-001', 'promo-002', 'budget-2026-q1', 'user-sunrise-kam', 'user-sunrise-admin', datetime('now', '-2 days'), '{"description": "Scan rebate for Breakfast Week", "invoiceNumber": "INV-003"}', datetime('now', '-4 days'), datetime('now')),
('ts-004', 'comp-sunrise-001', 'TS-2026-004', 'volume_rebate', 'key_account', 40000.00, 'approved', 'cust-spar-001', 'promo-002', 'budget-2026-q1', 'user-sunrise-kam', 'user-sunrise-admin', datetime('now', '-1 days'), '{"description": "Volume rebate for SPAR", "invoiceNumber": "INV-004"}', datetime('now', '-3 days'), datetime('now')),
('ts-005', 'comp-sunrise-001', 'TS-2026-005', 'cash_coop', 'trade_marketing', 60000.00, 'pending', 'cust-checkers-001', 'promo-003', 'budget-2026-q1', 'user-sunrise-kam', NULL, NULL, '{"description": "Dairy Days promotional support", "invoiceNumber": "INV-005"}', datetime('now', '-1 days'), datetime('now')),
('ts-006', 'comp-sunrise-001', 'TS-2026-006', 'off_invoice', 'key_account', 100000.00, 'pending', 'cust-pnp-001', 'promo-004', 'budget-2026-launch', 'user-sunrise-kam', NULL, NULL, '{"description": "Energy Drink launch support", "invoiceNumber": "INV-006"}', datetime('now'), datetime('now'));

-- Demo Activities
INSERT INTO activities (id, company_id, user_id, action, entity_type, entity_id, description, data, created_at) VALUES
('act-001', 'comp-sunrise-001', 'user-sunrise-admin', 'approved', 'trade_spend', 'ts-001', 'Approved trade spend TS-2026-001', '{"amount": 50000}', datetime('now', '-5 days')),
('act-002', 'comp-sunrise-001', 'user-sunrise-admin', 'approved', 'trade_spend', 'ts-002', 'Approved trade spend TS-2026-002', '{"amount": 75000}', datetime('now', '-3 days')),
('act-003', 'comp-sunrise-001', 'user-sunrise-kam', 'created', 'promotion', 'promo-004', 'Created Energy Launch Promo', '{}', datetime('now', '-2 days')),
('act-004', 'comp-sunrise-001', 'user-sunrise-admin', 'approved', 'trade_spend', 'ts-003', 'Approved trade spend TS-2026-003', '{"amount": 35000}', datetime('now', '-2 days')),
('act-005', 'comp-sunrise-001', 'user-sunrise-admin', 'approved', 'trade_spend', 'ts-004', 'Approved trade spend TS-2026-004', '{"amount": 40000}', datetime('now', '-1 days')),
('act-006', 'comp-sunrise-001', 'user-sunrise-kam', 'created', 'trade_spend', 'ts-005', 'Created trade spend for Dairy Days', '{"amount": 60000}', datetime('now', '-1 days')),
('act-007', 'comp-sunrise-001', 'user-sunrise-kam', 'created', 'trade_spend', 'ts-006', 'Created trade spend for Energy Launch', '{"amount": 100000}', datetime('now'));

-- Demo Notifications
INSERT INTO notifications (id, company_id, user_id, title, message, type, read, data, created_at) VALUES
('notif-001', 'comp-sunrise-001', 'user-sunrise-admin', 'Trade Spend Pending Approval', 'TS-2026-005 requires your approval', 'warning', 0, '{"entityType": "trade_spend", "entityId": "ts-005"}', datetime('now', '-1 days')),
('notif-002', 'comp-sunrise-001', 'user-sunrise-admin', 'Trade Spend Pending Approval', 'TS-2026-006 requires your approval', 'warning', 0, '{"entityType": "trade_spend", "entityId": "ts-006"}', datetime('now')),
('notif-003', 'comp-sunrise-001', 'user-sunrise-admin', 'Promotion Pending Approval', 'Energy Launch Promo requires approval', 'info', 0, '{"entityType": "promotion", "entityId": "promo-004"}', datetime('now', '-2 days')),
('notif-004', 'comp-sunrise-001', 'user-sunrise-kam', 'Trade Spend Approved', 'TS-2026-004 has been approved', 'success', 1, '{"entityType": "trade_spend", "entityId": "ts-004"}', datetime('now', '-1 days'));
