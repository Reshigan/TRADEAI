-- TRADEAI Realistic Demo Dataset for Full System Simulation
-- This migration adds comprehensive, realistic FMCG trade spend data
-- All values are realistic for South African FMCG market
-- Schema uses 'data' JSON column for nested fields

-- ============================================================================
-- STEP 1: COMPREHENSIVE BUDGETS WITH REALISTIC AMOUNTS
-- ============================================================================

-- Sunrise Foods SA Budgets (Manufacturer - larger budgets)
INSERT OR REPLACE INTO budgets (id, company_id, name, year, amount, utilized, status, budget_type, created_by, data, created_at, updated_at) VALUES
('budget-sunrise-2026-annual', 'comp-sunrise-001', 'Annual Trade Budget 2026', 2026, 12500000, 4875000, 'active', 'annual', 'user-sunrise-admin', '{"allocations": {"Q1": 3125000, "Q2": 3125000, "Q3": 3125000, "Q4": 3125000}, "category": "trade_spend"}', datetime('now'), datetime('now')),
('budget-sunrise-2026-promo', 'comp-sunrise-001', 'Promotional Activities 2026', 2026, 3500000, 1225000, 'active', 'promotional', 'user-sunrise-admin', '{"allocations": {"Q1": 875000, "Q2": 875000, "Q3": 875000, "Q4": 875000}, "category": "promotional"}', datetime('now'), datetime('now')),
('budget-sunrise-2026-listing', 'comp-sunrise-001', 'Listing Fees 2026', 2026, 2000000, 850000, 'active', 'listing', 'user-sunrise-admin', '{"allocations": {"Q1": 500000, "Q2": 500000, "Q3": 500000, "Q4": 500000}, "category": "listing"}', datetime('now'), datetime('now')),
('budget-sunrise-2025-annual', 'comp-sunrise-001', 'Annual Trade Budget 2025', 2025, 10000000, 9250000, 'completed', 'annual', 'user-sunrise-admin', '{"allocations": {"Q1": 2500000, "Q2": 2500000, "Q3": 2500000, "Q4": 2500000}, "category": "trade_spend"}', datetime('now', '-1 year'), datetime('now'));

-- Metro Distribution Budgets (Distributor - medium budgets)
INSERT OR REPLACE INTO budgets (id, company_id, name, year, amount, utilized, status, budget_type, created_by, data, created_at, updated_at) VALUES
('budget-metro-2026-annual', 'comp-metro-001', 'Annual Trade Budget 2026', 2026, 5000000, 1750000, 'active', 'annual', 'user-metro-admin', '{"allocations": {"Q1": 1250000, "Q2": 1250000, "Q3": 1250000, "Q4": 1250000}, "category": "trade_spend"}', datetime('now'), datetime('now')),
('budget-metro-2026-rebates', 'comp-metro-001', 'Rebate Programs 2026', 2026, 1500000, 525000, 'active', 'rebate', 'user-metro-admin', '{"allocations": {"Q1": 375000, "Q2": 375000, "Q3": 375000, "Q4": 375000}, "category": "rebate"}', datetime('now'), datetime('now'));

-- FreshMart Stores Budgets (Retailer - smaller budgets)
INSERT OR REPLACE INTO budgets (id, company_id, name, year, amount, utilized, status, budget_type, created_by, data, created_at, updated_at) VALUES
('budget-freshmart-2026-annual', 'comp-freshmart-001', 'Annual Trade Budget 2026', 2026, 2500000, 875000, 'active', 'annual', 'user-freshmart-admin', '{"allocations": {"Q1": 625000, "Q2": 625000, "Q3": 625000, "Q4": 625000}, "category": "trade_spend"}', datetime('now'), datetime('now')),
('budget-freshmart-2026-instore', 'comp-freshmart-001', 'In-Store Promotions 2026', 2026, 800000, 280000, 'active', 'promotional', 'user-freshmart-admin', '{"allocations": {"Q1": 200000, "Q2": 200000, "Q3": 200000, "Q4": 200000}, "category": "promotional"}', datetime('now'), datetime('now'));

-- Diplomat SA Budgets (Distributor)
INSERT OR REPLACE INTO budgets (id, company_id, name, year, amount, utilized, status, budget_type, created_by, data, created_at, updated_at) VALUES
('budget-diplomat-2026-annual', 'comp-diplomat-001', 'Annual Trade Budget 2026', 2026, 4000000, 1400000, 'active', 'annual', 'user-diplomat-admin', '{"allocations": {"Q1": 1000000, "Q2": 1000000, "Q3": 1000000, "Q4": 1000000}, "category": "trade_spend"}', datetime('now'), datetime('now')),
('budget-diplomat-2026-growth', 'comp-diplomat-001', 'Growth Initiatives 2026', 2026, 1200000, 420000, 'active', 'growth', 'user-diplomat-admin', '{"allocations": {"Q1": 300000, "Q2": 300000, "Q3": 300000, "Q4": 300000}, "category": "growth"}', datetime('now'), datetime('now'));

-- ============================================================================
-- STEP 2: COMPREHENSIVE CUSTOMERS WITH HIERARCHIES
-- ============================================================================

-- Sunrise Foods SA Customers (Retailers they sell to)
INSERT OR REPLACE INTO customers (id, company_id, name, code, customer_type, channel, tier, status, region, city, data, created_at, updated_at) VALUES
('cust-sunrise-pnp-001', 'comp-sunrise-001', 'Pick n Pay - National', 'PNP-NAT', 'retailer', 'modern_trade', 'platinum', 'active', 'National', 'Johannesburg', '{"contactName": "Sarah van der Berg", "contactEmail": "sarah.vdb@pnp.co.za", "contactPhone": "+27 11 555 0001", "creditLimit": 5000000, "paymentTerms": 30}', datetime('now'), datetime('now')),
('cust-sunrise-pnp-gauteng', 'comp-sunrise-001', 'Pick n Pay - Gauteng Region', 'PNP-GP', 'retailer', 'modern_trade', 'gold', 'active', 'Gauteng', 'Johannesburg', '{"contactName": "John Mokoena", "contactEmail": "john.m@pnp.co.za", "contactPhone": "+27 11 555 0002", "creditLimit": 2000000, "paymentTerms": 30}', datetime('now'), datetime('now')),
('cust-sunrise-checkers-001', 'comp-sunrise-001', 'Checkers - National', 'CHK-NAT', 'retailer', 'modern_trade', 'platinum', 'active', 'National', 'Cape Town', '{"contactName": "Lisa Naidoo", "contactEmail": "lisa.n@checkers.co.za", "contactPhone": "+27 21 555 0001", "creditLimit": 4500000, "paymentTerms": 30}', datetime('now'), datetime('now')),
('cust-sunrise-woolworths-001', 'comp-sunrise-001', 'Woolworths Food - National', 'WW-NAT', 'retailer', 'premium', 'platinum', 'active', 'National', 'Cape Town', '{"contactName": "Michael Peters", "contactEmail": "michael.p@woolworths.co.za", "contactPhone": "+27 21 555 0002", "creditLimit": 3500000, "paymentTerms": 45}', datetime('now'), datetime('now')),
('cust-sunrise-spar-001', 'comp-sunrise-001', 'SPAR Group - National', 'SPAR-NAT', 'retailer', 'modern_trade', 'gold', 'active', 'National', 'Durban', '{"contactName": "Priya Govender", "contactEmail": "priya.g@spar.co.za", "contactPhone": "+27 31 555 0001", "creditLimit": 3000000, "paymentTerms": 30}', datetime('now'), datetime('now')),
('cust-sunrise-makro-001', 'comp-sunrise-001', 'Makro - National', 'MAK-NAT', 'wholesaler', 'cash_carry', 'gold', 'active', 'National', 'Johannesburg', '{"contactName": "David Khumalo", "contactEmail": "david.k@makro.co.za", "contactPhone": "+27 11 555 0003", "creditLimit": 2500000, "paymentTerms": 14}', datetime('now'), datetime('now')),
('cust-sunrise-metro-cc', 'comp-sunrise-001', 'Metro Cash & Carry', 'MET-CC', 'wholesaler', 'cash_carry', 'silver', 'active', 'Gauteng', 'Pretoria', '{"contactName": "Anna Botha", "contactEmail": "anna.b@metrocc.co.za", "contactPhone": "+27 12 555 0001", "creditLimit": 1500000, "paymentTerms": 14}', datetime('now'), datetime('now')),
('cust-sunrise-ind-001', 'comp-sunrise-001', 'Sunshine Supermarket', 'IND-001', 'retailer', 'independent', 'bronze', 'active', 'Gauteng', 'Soweto', '{"contactName": "Thabo Molefe", "contactEmail": "thabo@sunshinesuper.co.za", "contactPhone": "+27 11 555 0004", "creditLimit": 250000, "paymentTerms": 7}', datetime('now'), datetime('now')),
('cust-sunrise-ind-002', 'comp-sunrise-001', 'Family Foods Express', 'IND-002', 'retailer', 'independent', 'bronze', 'active', 'Western Cape', 'Stellenbosch', '{"contactName": "Jan du Plessis", "contactEmail": "jan@familyfoods.co.za", "contactPhone": "+27 21 555 0003", "creditLimit": 150000, "paymentTerms": 7}', datetime('now'), datetime('now'));

-- Metro Distribution Customers
INSERT OR REPLACE INTO customers (id, company_id, name, code, customer_type, channel, tier, status, region, city, data, created_at, updated_at) VALUES
('cust-metro-spaza-001', 'comp-metro-001', 'Township Traders Network', 'TTN-001', 'retailer', 'traditional', 'silver', 'active', 'Gauteng', 'Alexandra', '{"contactName": "Sipho Ndlovu", "contactEmail": "sipho@ttn.co.za", "contactPhone": "+27 11 555 0010", "creditLimit": 100000, "paymentTerms": 7}', datetime('now'), datetime('now')),
('cust-metro-spaza-002', 'comp-metro-001', 'Kasi Corner Stores', 'KCS-001', 'retailer', 'traditional', 'bronze', 'active', 'Gauteng', 'Tembisa', '{"contactName": "Grace Mahlangu", "contactEmail": "grace@kasicorner.co.za", "contactPhone": "+27 11 555 0011", "creditLimit": 75000, "paymentTerms": 7}', datetime('now'), datetime('now')),
('cust-metro-cafe-001', 'comp-metro-001', 'Urban Cafe Chain', 'UCC-001', 'retailer', 'foodservice', 'gold', 'active', 'Gauteng', 'Sandton', '{"contactName": "Emma Wilson", "contactEmail": "emma@urbancafe.co.za", "contactPhone": "+27 11 555 0012", "creditLimit": 500000, "paymentTerms": 14}', datetime('now'), datetime('now')),
('cust-metro-hotel-001', 'comp-metro-001', 'Safari Lodge Group', 'SLG-001', 'retailer', 'hospitality', 'gold', 'active', 'Mpumalanga', 'Nelspruit', '{"contactName": "James van Wyk", "contactEmail": "james@safarilodge.co.za", "contactPhone": "+27 13 555 0001", "creditLimit": 750000, "paymentTerms": 30}', datetime('now'), datetime('now'));

-- FreshMart Stores Customers (Suppliers they buy from)
INSERT OR REPLACE INTO customers (id, company_id, name, code, customer_type, channel, tier, status, region, city, data, created_at, updated_at) VALUES
('cust-freshmart-supplier-001', 'comp-freshmart-001', 'Local Farms Cooperative', 'LFC-001', 'supplier', 'direct', 'gold', 'active', 'Western Cape', 'Paarl', '{"contactName": "Pieter Joubert", "contactEmail": "pieter@localfarms.co.za", "contactPhone": "+27 21 555 0010", "creditLimit": 1000000, "paymentTerms": 30}', datetime('now'), datetime('now')),
('cust-freshmart-supplier-002', 'comp-freshmart-001', 'Artisan Bakery Co', 'ABC-001', 'supplier', 'direct', 'silver', 'active', 'Western Cape', 'Cape Town', '{"contactName": "Maria Santos", "contactEmail": "maria@artisanbakery.co.za", "contactPhone": "+27 21 555 0011", "creditLimit": 250000, "paymentTerms": 14}', datetime('now'), datetime('now'));

-- Diplomat SA Customers
INSERT OR REPLACE INTO customers (id, company_id, name, code, customer_type, channel, tier, status, region, city, data, created_at, updated_at) VALUES
('cust-diplomat-retail-001', 'comp-diplomat-001', 'Eastern Cape Retailers', 'ECR-001', 'retailer', 'modern_trade', 'gold', 'active', 'Eastern Cape', 'Port Elizabeth', '{"contactName": "Nomsa Dlamini", "contactEmail": "nomsa@ecretailers.co.za", "contactPhone": "+27 41 555 0001", "creditLimit": 800000, "paymentTerms": 30}', datetime('now'), datetime('now')),
('cust-diplomat-retail-002', 'comp-diplomat-001', 'KZN Supermarkets', 'KZN-001', 'retailer', 'modern_trade', 'gold', 'active', 'KwaZulu-Natal', 'Durban', '{"contactName": "Raj Pillay", "contactEmail": "raj@kznsupermarkets.co.za", "contactPhone": "+27 31 555 0002", "creditLimit": 1200000, "paymentTerms": 30}', datetime('now'), datetime('now'));

-- ============================================================================
-- STEP 3: COMPREHENSIVE PRODUCTS WITH REALISTIC PRICING
-- ============================================================================

-- Sunrise Foods SA Products (Manufacturer)
INSERT OR REPLACE INTO products (id, company_id, name, sku, barcode, category, subcategory, brand, unit_price, cost_price, status, data, created_at, updated_at) VALUES
('prod-sunrise-cereal-001', 'comp-sunrise-001', 'Sunrise Corn Flakes 500g', 'SCF-500', '6001234567890', 'Breakfast', 'Cereals', 'Sunrise', 45.99, 27.59, 'active', '{"unitOfMeasure": "unit", "packSize": 12, "weight": "500g"}', datetime('now'), datetime('now')),
('prod-sunrise-cereal-002', 'comp-sunrise-001', 'Sunrise Muesli Premium 750g', 'SMP-750', '6001234567891', 'Breakfast', 'Cereals', 'Sunrise', 89.99, 53.99, 'active', '{"unitOfMeasure": "unit", "packSize": 8, "weight": "750g"}', datetime('now'), datetime('now')),
('prod-sunrise-cereal-003', 'comp-sunrise-001', 'Sunrise Oats Instant 1kg', 'SOI-1000', '6001234567892', 'Breakfast', 'Cereals', 'Sunrise', 34.99, 20.99, 'active', '{"unitOfMeasure": "unit", "packSize": 12, "weight": "1kg"}', datetime('now'), datetime('now')),
('prod-sunrise-snack-001', 'comp-sunrise-001', 'Crispy Chips Original 150g', 'CCO-150', '6001234567893', 'Snacks', 'Chips', 'Crispy', 24.99, 14.99, 'active', '{"unitOfMeasure": "unit", "packSize": 24, "weight": "150g"}', datetime('now'), datetime('now')),
('prod-sunrise-snack-002', 'comp-sunrise-001', 'Crispy Chips BBQ 150g', 'CCB-150', '6001234567894', 'Snacks', 'Chips', 'Crispy', 24.99, 14.99, 'active', '{"unitOfMeasure": "unit", "packSize": 24, "weight": "150g"}', datetime('now'), datetime('now')),
('prod-sunrise-snack-003', 'comp-sunrise-001', 'Nutty Crunch Mixed 200g', 'NCM-200', '6001234567895', 'Snacks', 'Nuts', 'Nutty', 54.99, 32.99, 'active', '{"unitOfMeasure": "unit", "packSize": 12, "weight": "200g"}', datetime('now'), datetime('now')),
('prod-sunrise-bev-001', 'comp-sunrise-001', 'Fresh Juice Orange 1L', 'FJO-1000', '6001234567896', 'Beverages', 'Juice', 'Fresh', 32.99, 19.79, 'active', '{"unitOfMeasure": "unit", "packSize": 12, "volume": "1L"}', datetime('now'), datetime('now')),
('prod-sunrise-bev-002', 'comp-sunrise-001', 'Fresh Juice Apple 1L', 'FJA-1000', '6001234567897', 'Beverages', 'Juice', 'Fresh', 32.99, 19.79, 'active', '{"unitOfMeasure": "unit", "packSize": 12, "volume": "1L"}', datetime('now'), datetime('now')),
('prod-sunrise-bev-003', 'comp-sunrise-001', 'Energy Boost 500ml', 'EB-500', '6001234567898', 'Beverages', 'Energy', 'Boost', 19.99, 11.99, 'active', '{"unitOfMeasure": "unit", "packSize": 24, "volume": "500ml"}', datetime('now'), datetime('now')),
('prod-sunrise-dairy-001', 'comp-sunrise-001', 'Farm Fresh Milk 2L', 'FFM-2000', '6001234567899', 'Dairy', 'Milk', 'Farm Fresh', 36.99, 22.19, 'active', '{"unitOfMeasure": "unit", "packSize": 6, "volume": "2L"}', datetime('now'), datetime('now')),
('prod-sunrise-dairy-002', 'comp-sunrise-001', 'Creamy Yogurt Strawberry 500g', 'CYS-500', '6001234567900', 'Dairy', 'Yogurt', 'Creamy', 29.99, 17.99, 'active', '{"unitOfMeasure": "unit", "packSize": 12, "weight": "500g"}', datetime('now'), datetime('now'));

-- Metro Distribution Products
INSERT OR REPLACE INTO products (id, company_id, name, sku, barcode, category, subcategory, brand, unit_price, cost_price, status, data, created_at, updated_at) VALUES
('prod-metro-bulk-001', 'comp-metro-001', 'Bulk Rice 10kg', 'BR-10000', '6002234567890', 'Staples', 'Rice', 'Metro Value', 149.99, 89.99, 'active', '{"unitOfMeasure": "unit", "packSize": 4, "weight": "10kg"}', datetime('now'), datetime('now')),
('prod-metro-bulk-002', 'comp-metro-001', 'Bulk Sugar 5kg', 'BS-5000', '6002234567891', 'Staples', 'Sugar', 'Metro Value', 79.99, 47.99, 'active', '{"unitOfMeasure": "unit", "packSize": 8, "weight": "5kg"}', datetime('now'), datetime('now')),
('prod-metro-bulk-003', 'comp-metro-001', 'Cooking Oil 5L', 'CO-5000', '6002234567892', 'Staples', 'Oil', 'Metro Value', 129.99, 77.99, 'active', '{"unitOfMeasure": "unit", "packSize": 4, "volume": "5L"}', datetime('now'), datetime('now')),
('prod-metro-bulk-004', 'comp-metro-001', 'Maize Meal 12.5kg', 'MM-12500', '6002234567893', 'Staples', 'Maize', 'Metro Value', 119.99, 71.99, 'active', '{"unitOfMeasure": "unit", "packSize": 4, "weight": "12.5kg"}', datetime('now'), datetime('now'));

-- FreshMart Products
INSERT OR REPLACE INTO products (id, company_id, name, sku, barcode, category, subcategory, brand, unit_price, cost_price, status, data, created_at, updated_at) VALUES
('prod-freshmart-own-001', 'comp-freshmart-001', 'FreshMart Bread White 700g', 'FBW-700', '6003234567890', 'Bakery', 'Bread', 'FreshMart', 18.99, 11.39, 'active', '{"unitOfMeasure": "unit", "packSize": 1, "weight": "700g"}', datetime('now'), datetime('now')),
('prod-freshmart-own-002', 'comp-freshmart-001', 'FreshMart Eggs Large 18s', 'FEL-18', '6003234567891', 'Dairy', 'Eggs', 'FreshMart', 64.99, 38.99, 'active', '{"unitOfMeasure": "unit", "packSize": 1, "count": "18"}', datetime('now'), datetime('now')),
('prod-freshmart-own-003', 'comp-freshmart-001', 'FreshMart Chicken Whole 1.5kg', 'FCW-1500', '6003234567892', 'Meat', 'Poultry', 'FreshMart', 89.99, 53.99, 'active', '{"unitOfMeasure": "unit", "packSize": 1, "weight": "1.5kg"}', datetime('now'), datetime('now'));

-- Diplomat SA Products
INSERT OR REPLACE INTO products (id, company_id, name, sku, barcode, category, subcategory, brand, unit_price, cost_price, status, data, created_at, updated_at) VALUES
('prod-diplomat-dist-001', 'comp-diplomat-001', 'Premium Coffee Beans 1kg', 'PCB-1000', '6004234567890', 'Beverages', 'Coffee', 'Diplomat Select', 189.99, 113.99, 'active', '{"unitOfMeasure": "unit", "packSize": 6, "weight": "1kg"}', datetime('now'), datetime('now')),
('prod-diplomat-dist-002', 'comp-diplomat-001', 'Gourmet Tea Collection 100s', 'GTC-100', '6004234567891', 'Beverages', 'Tea', 'Diplomat Select', 79.99, 47.99, 'active', '{"unitOfMeasure": "unit", "packSize": 12, "count": "100"}', datetime('now'), datetime('now'));

-- ============================================================================
-- STEP 4: COMPREHENSIVE PROMOTIONS WITH REALISTIC FINANCIALS
-- ============================================================================

-- Sunrise Foods SA Promotions (using data column for nested fields)
INSERT OR REPLACE INTO promotions (id, company_id, name, description, promotion_type, status, start_date, end_date, created_by, budget_id, data, created_at, updated_at) VALUES
('promo-sunrise-summer-001', 'comp-sunrise-001', 'Summer Refresh Campaign', 'Major summer promotion across all juice products', 'price_discount', 'active', '2026-01-01', '2026-02-28', 'user-sunrise-admin', 'budget-sunrise-2026-promo', 
'{"mechanics": {"discountType": "percentage", "discountValue": 20, "minPurchase": 100}, "financial": {"plannedSpend": 450000, "actualSpend": 225000, "baselineRevenue": 1500000, "promoRevenue": 2100000, "incrementalRevenue": 600000, "profitability": {"roi": 166.67, "roiDecimal": 1.67}}, "products": ["prod-sunrise-bev-001", "prod-sunrise-bev-002", "prod-sunrise-bev-003"], "customers": ["cust-sunrise-pnp-001", "cust-sunrise-checkers-001", "cust-sunrise-woolworths-001"]}',
datetime('now'), datetime('now')),

('promo-sunrise-backtoschool', 'comp-sunrise-001', 'Back to School Breakfast', 'Cereal promotion for school season', 'bundle', 'active', '2026-01-15', '2026-02-15', 'user-sunrise-admin', 'budget-sunrise-2026-promo',
'{"mechanics": {"discountType": "bundle", "discountValue": 15, "bundleItems": 3}, "financial": {"plannedSpend": 280000, "actualSpend": 140000, "baselineRevenue": 800000, "promoRevenue": 1120000, "incrementalRevenue": 320000, "profitability": {"roi": 128.57, "roiDecimal": 1.29}}, "products": ["prod-sunrise-cereal-001", "prod-sunrise-cereal-002", "prod-sunrise-cereal-003"], "customers": ["cust-sunrise-pnp-001", "cust-sunrise-spar-001"]}',
datetime('now'), datetime('now')),

('promo-sunrise-festive-2025', 'comp-sunrise-001', 'Festive Season 2025', 'December holiday promotion', 'volume_discount', 'completed', '2025-12-01', '2025-12-31', 'user-sunrise-admin', 'budget-sunrise-2025-annual',
'{"mechanics": {"discountType": "volume", "discountValue": 25, "minQuantity": 50}, "financial": {"plannedSpend": 750000, "actualSpend": 725000, "baselineRevenue": 2500000, "promoRevenue": 3750000, "incrementalRevenue": 1250000, "profitability": {"roi": 172.41, "roiDecimal": 1.72}}, "products": ["prod-sunrise-snack-001", "prod-sunrise-snack-002", "prod-sunrise-bev-001"], "customers": ["cust-sunrise-pnp-001", "cust-sunrise-checkers-001", "cust-sunrise-makro-001"]}',
datetime('now', '-2 months'), datetime('now', '-1 month')),

('promo-sunrise-spring-2025', 'comp-sunrise-001', 'Spring Clean Eating', 'Health-focused promotion', 'price_discount', 'completed', '2025-09-01', '2025-10-31', 'user-sunrise-admin', 'budget-sunrise-2025-annual',
'{"mechanics": {"discountType": "percentage", "discountValue": 18}, "financial": {"plannedSpend": 350000, "actualSpend": 340000, "baselineRevenue": 1200000, "promoRevenue": 1680000, "incrementalRevenue": 480000, "profitability": {"roi": 141.18, "roiDecimal": 1.41}}, "products": ["prod-sunrise-cereal-002", "prod-sunrise-dairy-002"], "customers": ["cust-sunrise-woolworths-001", "cust-sunrise-pnp-001"]}',
datetime('now', '-5 months'), datetime('now', '-3 months')),

('promo-sunrise-easter-2026', 'comp-sunrise-001', 'Easter Treats Campaign', 'Easter holiday promotion', 'gift', 'pending', '2026-03-15', '2026-04-15', 'user-sunrise-admin', 'budget-sunrise-2026-promo',
'{"mechanics": {"discountType": "gift", "giftValue": 50, "minPurchase": 200}, "financial": {"plannedSpend": 320000, "actualSpend": 0, "baselineRevenue": 900000, "promoRevenue": 0, "incrementalRevenue": 0, "profitability": {"roi": 0, "roiDecimal": 0}}, "products": ["prod-sunrise-snack-001", "prod-sunrise-snack-003"], "customers": ["cust-sunrise-pnp-001", "cust-sunrise-checkers-001"]}',
datetime('now'), datetime('now'));

-- Metro Distribution Promotions
INSERT OR REPLACE INTO promotions (id, company_id, name, description, promotion_type, status, start_date, end_date, created_by, budget_id, data, created_at, updated_at) VALUES
('promo-metro-bulk-001', 'comp-metro-001', 'Bulk Buy Bonanza', 'Volume discounts on staples', 'volume_discount', 'active', '2026-01-01', '2026-03-31', 'user-metro-admin', 'budget-metro-2026-annual',
'{"mechanics": {"discountType": "volume", "discountValue": 12, "minQuantity": 100}, "financial": {"plannedSpend": 180000, "actualSpend": 90000, "baselineRevenue": 600000, "promoRevenue": 840000, "incrementalRevenue": 240000, "profitability": {"roi": 166.67, "roiDecimal": 1.67}}, "products": ["prod-metro-bulk-001", "prod-metro-bulk-002", "prod-metro-bulk-003"], "customers": ["cust-metro-spaza-001", "cust-metro-spaza-002"]}',
datetime('now'), datetime('now')),

('promo-metro-cafe-001', 'comp-metro-001', 'Cafe Partner Program', 'Special pricing for cafe partners', 'rebate', 'active', '2026-01-01', '2026-06-30', 'user-metro-admin', 'budget-metro-2026-rebates',
'{"mechanics": {"discountType": "rebate", "rebatePercent": 8, "minVolume": 50000}, "financial": {"plannedSpend": 120000, "actualSpend": 40000, "baselineRevenue": 400000, "promoRevenue": 520000, "incrementalRevenue": 120000, "profitability": {"roi": 200, "roiDecimal": 2.0}}, "products": ["prod-metro-bulk-001", "prod-metro-bulk-003"], "customers": ["cust-metro-cafe-001"]}',
datetime('now'), datetime('now'));

-- FreshMart Promotions
INSERT OR REPLACE INTO promotions (id, company_id, name, description, promotion_type, status, start_date, end_date, created_by, budget_id, data, created_at, updated_at) VALUES
('promo-freshmart-weekend-001', 'comp-freshmart-001', 'Weekend Specials', 'Weekly weekend promotions', 'price_discount', 'active', '2026-01-01', '2026-12-31', 'user-freshmart-admin', 'budget-freshmart-2026-instore',
'{"mechanics": {"discountType": "percentage", "discountValue": 15}, "financial": {"plannedSpend": 150000, "actualSpend": 37500, "baselineRevenue": 500000, "promoRevenue": 650000, "incrementalRevenue": 150000, "profitability": {"roi": 300, "roiDecimal": 3.0}}, "products": ["prod-freshmart-own-001", "prod-freshmart-own-002", "prod-freshmart-own-003"], "customers": ["cust-freshmart-supplier-001"]}',
datetime('now'), datetime('now'));

-- Diplomat SA Promotions
INSERT OR REPLACE INTO promotions (id, company_id, name, description, promotion_type, status, start_date, end_date, created_by, budget_id, data, created_at, updated_at) VALUES
('promo-diplomat-premium-001', 'comp-diplomat-001', 'Premium Coffee Launch', 'New premium coffee line launch', 'price_discount', 'active', '2026-01-01', '2026-02-28', 'user-diplomat-admin', 'budget-diplomat-2026-growth',
'{"mechanics": {"discountType": "percentage", "discountValue": 22}, "financial": {"plannedSpend": 200000, "actualSpend": 100000, "baselineRevenue": 650000, "promoRevenue": 910000, "incrementalRevenue": 260000, "profitability": {"roi": 160, "roiDecimal": 1.6}}, "products": ["prod-diplomat-dist-001", "prod-diplomat-dist-002"], "customers": ["cust-diplomat-retail-001", "cust-diplomat-retail-002"]}',
datetime('now'), datetime('now'));

-- ============================================================================
-- STEP 5: COMPREHENSIVE TRADE SPENDS WITH WORKFLOW STATES
-- ============================================================================

-- Sunrise Foods SA Trade Spends (using data column for description)
INSERT OR REPLACE INTO trade_spends (id, company_id, spend_id, spend_type, activity_type, amount, status, customer_id, promotion_id, budget_id, created_by, approved_by, approved_at, data, created_at, updated_at) VALUES
('ts-sunrise-001', 'comp-sunrise-001', 'TS-2026-001', 'promotional', 'price_discount', 125000, 'approved', 'cust-sunrise-pnp-001', 'promo-sunrise-summer-001', 'budget-sunrise-2026-promo', 'user-sunrise-admin', 'user-sunrise-admin', datetime('now', '-5 days'), '{"description": "Summer campaign - Pick n Pay allocation"}', datetime('now', '-7 days'), datetime('now', '-5 days')),
('ts-sunrise-002', 'comp-sunrise-001', 'TS-2026-002', 'promotional', 'price_discount', 100000, 'approved', 'cust-sunrise-checkers-001', 'promo-sunrise-summer-001', 'budget-sunrise-2026-promo', 'user-sunrise-admin', 'user-sunrise-admin', datetime('now', '-5 days'), '{"description": "Summer campaign - Checkers allocation"}', datetime('now', '-7 days'), datetime('now', '-5 days')),
('ts-sunrise-003', 'comp-sunrise-001', 'TS-2026-003', 'promotional', 'bundle', 75000, 'approved', 'cust-sunrise-pnp-001', 'promo-sunrise-backtoschool', 'budget-sunrise-2026-promo', 'user-sunrise-admin', 'user-sunrise-admin', datetime('now', '-3 days'), '{"description": "Back to school - Pick n Pay"}', datetime('now', '-5 days'), datetime('now', '-3 days')),
('ts-sunrise-004', 'comp-sunrise-001', 'TS-2026-004', 'listing', 'listing_fee', 150000, 'approved', 'cust-sunrise-woolworths-001', NULL, 'budget-sunrise-2026-listing', 'user-sunrise-admin', 'user-sunrise-admin', datetime('now', '-10 days'), '{"description": "New product listing fees - Woolworths"}', datetime('now', '-14 days'), datetime('now', '-10 days')),
('ts-sunrise-005', 'comp-sunrise-001', 'TS-2026-005', 'promotional', 'gift', 80000, 'pending', 'cust-sunrise-pnp-001', 'promo-sunrise-easter-2026', 'budget-sunrise-2026-promo', 'user-sunrise-admin', NULL, NULL, '{"description": "Easter campaign - pending approval"}', datetime('now', '-1 day'), datetime('now', '-1 day')),
('ts-sunrise-006', 'comp-sunrise-001', 'TS-2026-006', 'rebate', 'volume_rebate', 200000, 'pending', 'cust-sunrise-makro-001', NULL, 'budget-sunrise-2026-annual', 'user-sunrise-admin', NULL, NULL, '{"description": "Q1 volume rebate - Makro"}', datetime('now'), datetime('now')),
('ts-sunrise-007', 'comp-sunrise-001', 'TS-2026-007', 'promotional', 'price_discount', 500000, 'rejected', 'cust-sunrise-spar-001', NULL, 'budget-sunrise-2026-promo', 'user-sunrise-admin', 'user-sunrise-admin', datetime('now', '-2 days'), '{"description": "Rejected - exceeds budget allocation", "rejectionReason": "Budget exceeded"}', datetime('now', '-4 days'), datetime('now', '-2 days'));

-- Metro Distribution Trade Spends
INSERT OR REPLACE INTO trade_spends (id, company_id, spend_id, spend_type, activity_type, amount, status, customer_id, promotion_id, budget_id, created_by, approved_by, approved_at, data, created_at, updated_at) VALUES
('ts-metro-001', 'comp-metro-001', 'TS-M-2026-001', 'promotional', 'volume_discount', 45000, 'approved', 'cust-metro-spaza-001', 'promo-metro-bulk-001', 'budget-metro-2026-annual', 'user-metro-admin', 'user-metro-admin', datetime('now', '-3 days'), '{"description": "Bulk buy program - Township Traders"}', datetime('now', '-5 days'), datetime('now', '-3 days')),
('ts-metro-002', 'comp-metro-001', 'TS-M-2026-002', 'rebate', 'rebate', 40000, 'approved', 'cust-metro-cafe-001', 'promo-metro-cafe-001', 'budget-metro-2026-rebates', 'user-metro-admin', 'user-metro-admin', datetime('now', '-2 days'), '{"description": "Cafe partner rebate Q1"}', datetime('now', '-4 days'), datetime('now', '-2 days')),
('ts-metro-003', 'comp-metro-001', 'TS-M-2026-003', 'promotional', 'volume_discount', 45000, 'pending', 'cust-metro-spaza-002', 'promo-metro-bulk-001', 'budget-metro-2026-annual', 'user-metro-admin', NULL, NULL, '{"description": "Bulk buy - Kasi Corner pending"}', datetime('now'), datetime('now'));

-- FreshMart Trade Spends
INSERT OR REPLACE INTO trade_spends (id, company_id, spend_id, spend_type, activity_type, amount, status, customer_id, promotion_id, budget_id, created_by, approved_by, approved_at, data, created_at, updated_at) VALUES
('ts-freshmart-001', 'comp-freshmart-001', 'TS-F-2026-001', 'promotional', 'price_discount', 37500, 'approved', 'cust-freshmart-supplier-001', 'promo-freshmart-weekend-001', 'budget-freshmart-2026-instore', 'user-freshmart-admin', 'user-freshmart-admin', datetime('now', '-1 day'), '{"description": "Weekend specials - Local Farms"}', datetime('now', '-3 days'), datetime('now', '-1 day'));

-- Diplomat SA Trade Spends
INSERT OR REPLACE INTO trade_spends (id, company_id, spend_id, spend_type, activity_type, amount, status, customer_id, promotion_id, budget_id, created_by, approved_by, approved_at, data, created_at, updated_at) VALUES
('ts-diplomat-001', 'comp-diplomat-001', 'TS-D-2026-001', 'promotional', 'price_discount', 50000, 'approved', 'cust-diplomat-retail-001', 'promo-diplomat-premium-001', 'budget-diplomat-2026-growth', 'user-diplomat-admin', 'user-diplomat-admin', datetime('now', '-2 days'), '{"description": "Premium coffee launch - EC Retailers"}', datetime('now', '-4 days'), datetime('now', '-2 days')),
('ts-diplomat-002', 'comp-diplomat-001', 'TS-D-2026-002', 'promotional', 'price_discount', 50000, 'approved', 'cust-diplomat-retail-002', 'promo-diplomat-premium-001', 'budget-diplomat-2026-growth', 'user-diplomat-admin', 'user-diplomat-admin', datetime('now', '-2 days'), '{"description": "Premium coffee launch - KZN Supermarkets"}', datetime('now', '-4 days'), datetime('now', '-2 days'));
