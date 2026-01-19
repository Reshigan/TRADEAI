-- TRADEAI D1 Golden Dataset for Calculation Accuracy Testing
-- This migration adds comprehensive test data with known expected outcomes
-- Each scenario has documented expected calculations for verification
-- 
-- IMPORTANT: Order of inserts matters for foreign key constraints:
-- 1. Budgets (no dependencies)
-- 2. Customers (depends on companies - already exist)
-- 3. Products (depends on companies - already exist)
-- 4. Promotions (depends on budgets, users, companies)
-- 5. Trade Spends (depends on customers, promotions, budgets)

-- ============================================================================
-- STEP 1: CREATE ALL BUDGETS FIRST
-- ============================================================================

-- Golden Test Budget with known utilization (65%)
INSERT OR REPLACE INTO budgets (id, company_id, name, year, amount, utilized, status, budget_type, created_by, data, created_at, updated_at) VALUES
('budget-golden-001', 'comp-sunrise-001', 'Golden Test Budget', 2026, 500000.00, 325000.00, 'active', 'annual', 'user-sunrise-admin', 
'{"testScenario": "BUDGET_UTILIZATION", "expectedUtilization": 0.65, "allocations": {"Q1": 125000, "Q2": 125000, "Q3": 125000, "Q4": 125000}}', 
datetime('now'), datetime('now'));

-- Metro Golden Test Budget (25% utilization)
INSERT OR REPLACE INTO budgets (id, company_id, name, year, amount, utilized, status, budget_type, created_by, data, created_at, updated_at) VALUES
('budget-metro-golden', 'comp-metro-001', 'Metro Golden Test Budget', 2026, 300000.00, 75000.00, 'active', 'annual', 'user-metro-admin', 
'{"testScenario": "TENANT_ISOLATION", "expectedUtilization": 0.25}', 
datetime('now'), datetime('now'));

-- FreshMart Golden Test Budget (25% utilization)
INSERT OR REPLACE INTO budgets (id, company_id, name, year, amount, utilized, status, budget_type, created_by, data, created_at, updated_at) VALUES
('budget-freshmart-golden', 'comp-freshmart-001', 'FreshMart Golden Test Budget', 2026, 200000.00, 50000.00, 'active', 'annual', 'user-freshmart-admin', 
'{"testScenario": "TENANT_ISOLATION", "expectedUtilization": 0.25}', 
datetime('now'), datetime('now'));

-- Diplomat Golden Test Budget (40% utilization)
INSERT OR REPLACE INTO budgets (id, company_id, name, year, amount, utilized, status, budget_type, created_by, data, created_at, updated_at) VALUES
('budget-diplomat-golden', 'comp-diplomat-001', 'Diplomat Golden Test Budget', 2026, 250000.00, 100000.00, 'active', 'annual', 'user-diplomat-admin', 
'{"testScenario": "TENANT_ISOLATION", "expectedUtilization": 0.40}', 
datetime('now'), datetime('now'));

-- ============================================================================
-- STEP 2: CREATE ALL CUSTOMERS
-- ============================================================================

-- Golden Test Customers for Sunrise (proportional allocation testing)
INSERT OR REPLACE INTO customers (id, company_id, name, code, customer_type, channel, tier, status, region, city, data, created_at, updated_at) VALUES
('golden-cust-001', 'comp-sunrise-001', 'Golden Customer A (60%)', 'GOLD-A', 'chain', 'modern_trade', 'platinum', 'active', 'Gauteng', 'Johannesburg', 
'{"testScenario": "PROPORTIONAL_ALLOCATION", "annualRevenue": 600000, "revenueShare": 0.60, "expectedAllocation": 60000, "contacts": [{"name": "Test Contact A", "email": "testa@test.co.za"}]}', 
datetime('now'), datetime('now')),
('golden-cust-002', 'comp-sunrise-001', 'Golden Customer B (30%)', 'GOLD-B', 'chain', 'modern_trade', 'gold', 'active', 'Western Cape', 'Cape Town', 
'{"testScenario": "PROPORTIONAL_ALLOCATION", "annualRevenue": 300000, "revenueShare": 0.30, "expectedAllocation": 30000, "contacts": [{"name": "Test Contact B", "email": "testb@test.co.za"}]}', 
datetime('now'), datetime('now')),
('golden-cust-003', 'comp-sunrise-001', 'Golden Customer C (10%)', 'GOLD-C', 'independent', 'traditional_trade', 'silver', 'active', 'KwaZulu-Natal', 'Durban', 
'{"testScenario": "PROPORTIONAL_ALLOCATION", "annualRevenue": 100000, "revenueShare": 0.10, "expectedAllocation": 10000, "contacts": [{"name": "Test Contact C", "email": "testc@test.co.za"}]}', 
datetime('now'), datetime('now'));

-- Metro Test Customer (tenant isolation)
INSERT OR REPLACE INTO customers (id, company_id, name, code, customer_type, channel, tier, status, region, city, data, created_at, updated_at) VALUES
('golden-metro-cust-001', 'comp-metro-001', 'Metro Test Customer', 'METRO-TEST', 'wholesale', 'wholesale', 'gold', 'active', 'Gauteng', 'Pretoria', 
'{"testScenario": "TENANT_ISOLATION", "contacts": [{"name": "Metro Contact", "email": "metro@test.co.za"}]}', 
datetime('now'), datetime('now'));

-- FreshMart Test Customer (tenant isolation)
INSERT OR REPLACE INTO customers (id, company_id, name, code, customer_type, channel, tier, status, region, city, data, created_at, updated_at) VALUES
('golden-freshmart-cust-001', 'comp-freshmart-001', 'FreshMart Test Supplier', 'FM-TEST', 'chain', 'modern_trade', 'platinum', 'active', 'National', 'Johannesburg', 
'{"testScenario": "TENANT_ISOLATION", "contacts": [{"name": "FreshMart Contact", "email": "freshmart@test.co.za"}]}', 
datetime('now'), datetime('now'));

-- Diplomat Test Customer (tenant isolation)
INSERT OR REPLACE INTO customers (id, company_id, name, code, customer_type, channel, tier, status, region, city, data, created_at, updated_at) VALUES
('golden-diplomat-cust-001', 'comp-diplomat-001', 'Diplomat Test Customer', 'DIP-TEST', 'wholesale', 'wholesale', 'gold', 'active', 'Gauteng', 'Johannesburg', 
'{"testScenario": "TENANT_ISOLATION", "contacts": [{"name": "Diplomat Contact", "email": "diplomat@test.co.za"}]}', 
datetime('now'), datetime('now'));

-- ============================================================================
-- STEP 3: CREATE ALL PRODUCTS
-- ============================================================================

-- Golden Test Products for margin calculation
INSERT OR REPLACE INTO products (id, company_id, name, sku, barcode, category, subcategory, brand, unit_price, cost_price, status, data, created_at, updated_at) VALUES
('golden-prod-001', 'comp-sunrise-001', 'Golden Test Product (40% Margin)', 'GOLD-PROD-001', '6009999000001', 'Test', 'Margin Test', 'Golden', 100.00, 60.00, 'active', 
'{"testScenario": "MARGIN_CALCULATION", "expectedMargin": 0.40, "expectedGrossProfit": 40.00, "packSize": "1 unit", "unitsPerCase": 12}', 
datetime('now'), datetime('now')),
('golden-prod-002', 'comp-sunrise-001', 'Golden Test Product (25% Margin)', 'GOLD-PROD-002', '6009999000002', 'Test', 'Margin Test', 'Golden', 80.00, 60.00, 'active', 
'{"testScenario": "MARGIN_CALCULATION", "expectedMargin": 0.25, "expectedGrossProfit": 20.00, "packSize": "1 unit", "unitsPerCase": 24}', 
datetime('now'), datetime('now')),
('golden-prod-003', 'comp-sunrise-001', 'Golden Test Product (50% Margin)', 'GOLD-PROD-003', '6009999000003', 'Test', 'Margin Test', 'Golden', 200.00, 100.00, 'active', 
'{"testScenario": "MARGIN_CALCULATION", "expectedMargin": 0.50, "expectedGrossProfit": 100.00, "packSize": "1 unit", "unitsPerCase": 6}', 
datetime('now'), datetime('now'));

-- Metro Test Product (tenant isolation)
INSERT OR REPLACE INTO products (id, company_id, name, sku, barcode, category, subcategory, brand, unit_price, cost_price, status, data, created_at, updated_at) VALUES
('golden-metro-prod-001', 'comp-metro-001', 'Metro Test Product', 'METRO-PROD-001', '6009999100001', 'Distribution', 'Test', 'Metro Brand', 150.00, 90.00, 'active', 
'{"testScenario": "TENANT_ISOLATION", "packSize": "1 unit", "unitsPerCase": 10}', 
datetime('now'), datetime('now'));

-- ============================================================================
-- STEP 4: CREATE ALL PROMOTIONS
-- ============================================================================

-- Golden Test Promotion 1: Known ROI Calculation
-- Inputs: Trade Spend = R100,000, Baseline Revenue = R500,000, Promo Revenue = R750,000
-- Expected: Incremental Revenue = R250,000, ROI = (250,000 - 100,000) / 100,000 = 1.5 (150%)
INSERT OR REPLACE INTO promotions (id, company_id, name, description, promotion_type, status, start_date, end_date, created_by, budget_id, data, created_at, updated_at) VALUES
('golden-promo-001', 'comp-sunrise-001', 'Golden Test: ROI Verification', 'Test promotion with known ROI calculation', 'price_discount', 'completed', '2025-10-01', '2025-10-31', 'user-sunrise-admin', 'budget-2026-annual', 
'{"mechanics": {"discountType": "percentage", "discountValue": 15}, "financial": {"plannedSpend": 100000, "actualSpend": 100000, "baselineRevenue": 500000, "promoRevenue": 750000, "incrementalRevenue": 250000, "profitability": {"roi": 150, "roiDecimal": 1.5}}, "products": ["prod-001", "prod-002"], "customers": ["cust-pnp-001"], "testScenario": "ROI_VERIFICATION", "expectedROI": 1.5}', 
datetime('now'), datetime('now'));

-- Golden Test Promotion 2: Budget Utilization
INSERT OR REPLACE INTO promotions (id, company_id, name, description, promotion_type, status, start_date, end_date, created_by, budget_id, data, created_at, updated_at) VALUES
('golden-promo-002', 'comp-sunrise-001', 'Golden Test: Budget Utilization', 'Test promotion for budget utilization calculation', 'volume_discount', 'active', '2026-01-01', '2026-03-31', 'user-sunrise-admin', 'budget-golden-001', 
'{"mechanics": {"discountType": "volume", "discountValue": 10, "minQuantity": 50}, "financial": {"plannedSpend": 200000, "actualSpend": 175000, "profitability": {"roi": 0}}, "products": ["prod-003", "prod-004"], "customers": ["cust-shoprite-001", "cust-woolworths-001"], "testScenario": "BUDGET_UTILIZATION"}', 
datetime('now'), datetime('now'));

-- Golden Test Promotion 3: Proportional Allocation
INSERT OR REPLACE INTO promotions (id, company_id, name, description, promotion_type, status, start_date, end_date, created_by, budget_id, data, created_at, updated_at) VALUES
('golden-promo-003', 'comp-sunrise-001', 'Golden Test: Proportional Allocation', 'Test promotion for proportional allocation by revenue', 'price_discount', 'approved', '2026-02-01', '2026-02-28', 'user-sunrise-admin', 'budget-golden-001', 
'{"mechanics": {"discountType": "percentage", "discountValue": 12}, "financial": {"plannedSpend": 100000, "allocationMethod": "revenue", "allocations": [{"customerId": "golden-cust-001", "amount": 60000, "share": 0.60}, {"customerId": "golden-cust-002", "amount": 30000, "share": 0.30}, {"customerId": "golden-cust-003", "amount": 10000, "share": 0.10}]}, "products": ["prod-001", "prod-002", "prod-003"], "customers": ["golden-cust-001", "golden-cust-002", "golden-cust-003"], "testScenario": "PROPORTIONAL_ALLOCATION", "totalAllocationBudget": 100000}', 
datetime('now'), datetime('now'));

-- Metro Golden Test Promotion (tenant isolation)
INSERT OR REPLACE INTO promotions (id, company_id, name, description, promotion_type, status, start_date, end_date, created_by, budget_id, data, created_at, updated_at) VALUES
('golden-metro-promo-001', 'comp-metro-001', 'Metro Golden Test Promotion', 'Test promotion for Metro Distribution', 'volume_discount', 'active', '2026-01-01', '2026-06-30', 'user-metro-admin', 'budget-metro-golden', 
'{"mechanics": {"discountType": "volume", "discountValue": 8}, "financial": {"plannedSpend": 50000, "actualSpend": 45000, "profitability": {"roi": 120}}, "testScenario": "TENANT_ISOLATION"}', 
datetime('now'), datetime('now'));

-- Simulation Baseline Promotions (completed with full actuals)
INSERT OR REPLACE INTO promotions (id, company_id, name, description, promotion_type, status, start_date, end_date, created_by, budget_id, data, created_at, updated_at) VALUES
('golden-promo-sim-001', 'comp-sunrise-001', 'Golden Simulation Baseline 1', 'Completed promotion for simulation baseline', 'price_discount', 'completed', '2025-07-01', '2025-07-31', 'user-sunrise-admin', 'budget-2026-annual', 
'{"mechanics": {"discountType": "percentage", "discountValue": 20}, "financial": {"plannedSpend": 80000, "actualSpend": 78000, "baselineRevenue": 400000, "promoRevenue": 520000, "incrementalRevenue": 120000, "profitability": {"roi": 153.8, "roiDecimal": 1.538}}, "products": ["prod-001"], "customers": ["cust-pnp-001"], "testScenario": "SIMULATION_BASELINE", "uplift": 30}', 
datetime('now'), datetime('now')),
('golden-promo-sim-002', 'comp-sunrise-001', 'Golden Simulation Baseline 2', 'Completed promotion for simulation baseline', 'volume_discount', 'completed', '2025-08-01', '2025-08-31', 'user-sunrise-admin', 'budget-2026-annual', 
'{"mechanics": {"discountType": "volume", "discountValue": 15, "minQuantity": 100}, "financial": {"plannedSpend": 60000, "actualSpend": 58000, "baselineRevenue": 300000, "promoRevenue": 375000, "incrementalRevenue": 75000, "profitability": {"roi": 129.3, "roiDecimal": 1.293}}, "products": ["prod-003"], "customers": ["cust-shoprite-001"], "testScenario": "SIMULATION_BASELINE", "uplift": 25}', 
datetime('now'), datetime('now')),
('golden-promo-sim-003', 'comp-sunrise-001', 'Golden Simulation Baseline 3', 'Completed promotion for simulation baseline', 'bundle', 'completed', '2025-09-01', '2025-09-30', 'user-sunrise-admin', 'budget-2026-annual', 
'{"mechanics": {"discountType": "bogo", "discountValue": 50}, "financial": {"plannedSpend": 120000, "actualSpend": 115000, "baselineRevenue": 600000, "promoRevenue": 840000, "incrementalRevenue": 240000, "profitability": {"roi": 208.7, "roiDecimal": 2.087}}, "products": ["prod-005", "prod-006"], "customers": ["cust-woolworths-001", "cust-spar-001"], "testScenario": "SIMULATION_BASELINE", "uplift": 40}', 
datetime('now'), datetime('now'));

-- ============================================================================
-- STEP 5: CREATE ALL TRADE SPENDS (last, as they depend on customers and promotions)
-- ============================================================================

INSERT OR REPLACE INTO trade_spends (id, company_id, spend_id, spend_type, activity_type, amount, status, customer_id, promotion_id, budget_id, created_by, approved_by, approved_at, data, created_at, updated_at) VALUES
-- Approved trade spend
('golden-ts-001', 'comp-sunrise-001', 'GTS-001', 'cash_coop', 'trade_marketing', 25000.00, 'approved', 'golden-cust-001', 'golden-promo-001', 'budget-golden-001', 'user-sunrise-kam', 'user-sunrise-admin', datetime('now', '-3 days'), 
'{"testScenario": "APPROVAL_WORKFLOW", "description": "Approved trade spend for testing", "invoiceNumber": "GINV-001"}', 
datetime('now', '-5 days'), datetime('now')),
-- Pending trade spend
('golden-ts-002', 'comp-sunrise-001', 'GTS-002', 'off_invoice', 'key_account', 35000.00, 'pending', 'golden-cust-002', 'golden-promo-002', 'budget-golden-001', 'user-sunrise-kam', NULL, NULL, 
'{"testScenario": "APPROVAL_WORKFLOW", "description": "Pending trade spend for testing", "invoiceNumber": "GINV-002"}', 
datetime('now', '-2 days'), datetime('now')),
-- Rejected trade spend
('golden-ts-003', 'comp-sunrise-001', 'GTS-003', 'scan_rebate', 'trade_marketing', 15000.00, 'rejected', 'golden-cust-003', 'golden-promo-003', 'budget-golden-001', 'user-sunrise-kam', NULL, NULL, 
'{"testScenario": "APPROVAL_WORKFLOW", "description": "Rejected trade spend for testing", "invoiceNumber": "GINV-003", "rejectionReason": "Budget exceeded"}', 
datetime('now', '-1 days'), datetime('now'));

-- ============================================================================
-- SUMMARY OF GOLDEN TEST SCENARIOS
-- ============================================================================
-- 1. ROI Calculation: golden-promo-001 (Expected ROI: 1.5 / 150%)
-- 2. Budget Utilization: budget-golden-001 (Expected: 65%)
-- 3. Proportional Allocation: golden-promo-003 (60/30/10 split)
-- 4. Trade Spend Workflow: golden-ts-001/002/003 (approved/pending/rejected)
-- 5. Product Margin: golden-prod-001/002/003 (40%/25%/50%)
-- 6. Tenant Isolation: Data for all 4 companies
-- 7. Simulation Baseline: 3 completed promotions with known uplift/ROI
-- ============================================================================
