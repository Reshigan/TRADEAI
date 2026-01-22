-- TRADEAI D1 Seed Data for New Modules
-- Seed data for vendors, campaigns, trading_terms, rebates, claims, deductions, approvals, forecasts

-- Get company IDs (these should match existing seed data)
-- sunrise-foods-sa, metro-distribution, freshmart-stores, diplomat-sa

-- ============================================
-- VENDORS
-- ============================================

-- Sunrise Foods SA vendors
INSERT INTO vendors (id, company_id, name, code, vendor_type, status, contact_name, contact_email, contact_phone, address, city, region, country, payment_terms, created_at, updated_at)
VALUES 
  ('vnd-sunrise-001', 'sunrise-foods-sa', 'Premium Packaging Solutions', 'VND-PKG-001', 'supplier', 'active', 'John Packaging', 'john@premiumpack.co.za', '+27 11 555 0101', '123 Industrial Road', 'Johannesburg', 'Gauteng', 'ZA', 'Net 30', datetime('now'), datetime('now')),
  ('vnd-sunrise-002', 'sunrise-foods-sa', 'Fresh Ingredients Co', 'VND-ING-001', 'supplier', 'active', 'Sarah Fresh', 'sarah@freshingredients.co.za', '+27 21 555 0102', '456 Farm Lane', 'Cape Town', 'Western Cape', 'ZA', 'Net 45', datetime('now'), datetime('now')),
  ('vnd-sunrise-003', 'sunrise-foods-sa', 'Marketing Masters Agency', 'VND-MKT-001', 'agency', 'active', 'Mike Marketing', 'mike@marketingmasters.co.za', '+27 11 555 0103', '789 Creative Street', 'Sandton', 'Gauteng', 'ZA', 'Net 15', datetime('now'), datetime('now'));

-- Metro Distribution vendors
INSERT INTO vendors (id, company_id, name, code, vendor_type, status, contact_name, contact_email, contact_phone, address, city, region, country, payment_terms, created_at, updated_at)
VALUES 
  ('vnd-metro-001', 'metro-distribution', 'Fleet Services SA', 'VND-FLT-001', 'service_provider', 'active', 'Tom Fleet', 'tom@fleetservices.co.za', '+27 11 555 0201', '100 Transport Ave', 'Johannesburg', 'Gauteng', 'ZA', 'Net 30', datetime('now'), datetime('now')),
  ('vnd-metro-002', 'metro-distribution', 'Warehouse Solutions', 'VND-WHS-001', 'service_provider', 'active', 'Lisa Warehouse', 'lisa@warehousesolutions.co.za', '+27 31 555 0202', '200 Storage Road', 'Durban', 'KwaZulu-Natal', 'ZA', 'Net 30', datetime('now'), datetime('now'));

-- FreshMart vendors
INSERT INTO vendors (id, company_id, name, code, vendor_type, status, contact_name, contact_email, contact_phone, address, city, region, country, payment_terms, created_at, updated_at)
VALUES 
  ('vnd-freshmart-001', 'freshmart-stores', 'Store Fixtures Inc', 'VND-FIX-001', 'supplier', 'active', 'Bob Fixtures', 'bob@storefixtures.co.za', '+27 11 555 0301', '300 Retail Park', 'Johannesburg', 'Gauteng', 'ZA', 'Net 60', datetime('now'), datetime('now'));

-- Diplomat SA vendors
INSERT INTO vendors (id, company_id, name, code, vendor_type, status, contact_name, contact_email, contact_phone, address, city, region, country, payment_terms, created_at, updated_at)
VALUES 
  ('vnd-diplomat-001', 'diplomat-sa', 'Cold Chain Logistics', 'VND-CCL-001', 'service_provider', 'active', 'Anna Cold', 'anna@coldchain.co.za', '+27 21 555 0401', '400 Cold Storage Way', 'Cape Town', 'Western Cape', 'ZA', 'Net 30', datetime('now'), datetime('now'));

-- ============================================
-- CAMPAIGNS
-- ============================================

-- Sunrise Foods SA campaigns
INSERT INTO campaigns (id, company_id, name, description, campaign_type, status, start_date, end_date, budget_amount, spent_amount, target_revenue, actual_revenue, created_by, data, created_at, updated_at)
VALUES 
  ('cmp-sunrise-001', 'sunrise-foods-sa', 'Summer Breakfast Bonanza 2026', 'Major summer campaign promoting breakfast cereals and spreads', 'seasonal', 'active', '2026-01-01', '2026-03-31', 500000, 125000, 2500000, 650000, 'user-sunrise-admin', '{"promotionIds": [], "customerIds": [], "productIds": []}', datetime('now'), datetime('now')),
  ('cmp-sunrise-002', 'sunrise-foods-sa', 'Back to School 2026', 'Lunchbox essentials promotion for school season', 'tactical', 'draft', '2026-01-15', '2026-02-28', 300000, 0, 1500000, 0, 'user-sunrise-admin', '{"promotionIds": [], "customerIds": [], "productIds": []}', datetime('now'), datetime('now')),
  ('cmp-sunrise-003', 'sunrise-foods-sa', 'Brand Awareness Q1', 'Brand building campaign across all channels', 'brand', 'approved', '2026-01-01', '2026-03-31', 200000, 50000, 0, 0, 'user-sunrise-admin', '{"promotionIds": [], "customerIds": [], "productIds": []}', datetime('now'), datetime('now'));

-- Metro Distribution campaigns
INSERT INTO campaigns (id, company_id, name, description, campaign_type, status, start_date, end_date, budget_amount, spent_amount, target_revenue, actual_revenue, created_by, data, created_at, updated_at)
VALUES 
  ('cmp-metro-001', 'metro-distribution', 'Q1 Trade Push', 'Quarterly trade promotion to boost distribution', 'trade', 'active', '2026-01-01', '2026-03-31', 250000, 75000, 1200000, 320000, 'user-metro-admin', '{"promotionIds": [], "customerIds": [], "productIds": []}', datetime('now'), datetime('now'));

-- ============================================
-- TRADING TERMS
-- ============================================

-- Sunrise Foods SA trading terms
INSERT INTO trading_terms (id, company_id, name, description, term_type, status, customer_id, start_date, end_date, rate, rate_type, threshold, cap, payment_frequency, calculation_basis, created_by, data, created_at, updated_at)
VALUES 
  ('tt-sunrise-001', 'sunrise-foods-sa', 'Pick n Pay Volume Rebate 2026', 'Annual volume rebate agreement with Pick n Pay', 'volume_rebate', 'active', 'cust-sunrise-pnp', '2026-01-01', '2026-12-31', 3.5, 'percentage', 5000000, 500000, 'quarterly', 'revenue', 'user-sunrise-admin', '{"tiers": [{"threshold": 5000000, "rate": 3.5}, {"threshold": 10000000, "rate": 4.0}, {"threshold": 20000000, "rate": 4.5}]}', datetime('now'), datetime('now')),
  ('tt-sunrise-002', 'sunrise-foods-sa', 'Shoprite Growth Rebate 2026', 'Growth-based rebate for Shoprite', 'growth_rebate', 'active', 'cust-sunrise-shoprite', '2026-01-01', '2026-12-31', 2.0, 'percentage', 0, 300000, 'annually', 'revenue', 'user-sunrise-admin', '{"baselineYear": 2025, "growthThreshold": 0.05}', datetime('now'), datetime('now')),
  ('tt-sunrise-003', 'sunrise-foods-sa', 'Woolworths Marketing Contribution', 'Marketing fund contribution agreement', 'marketing_contribution', 'active', 'cust-sunrise-woolworths', '2026-01-01', '2026-12-31', 1.5, 'percentage', 0, null, 'monthly', 'revenue', 'user-sunrise-admin', '{}', datetime('now'), datetime('now')),
  ('tt-sunrise-004', 'sunrise-foods-sa', 'Spar Listing Fee Agreement', 'Annual listing fee for new products', 'listing_fee', 'approved', 'cust-sunrise-spar', '2026-01-01', '2026-12-31', 50000, 'fixed', 0, null, 'annually', 'revenue', 'user-sunrise-admin', '{"productsIncluded": 25}', datetime('now'), datetime('now'));

-- Metro Distribution trading terms
INSERT INTO trading_terms (id, company_id, name, description, term_type, status, customer_id, start_date, end_date, rate, rate_type, threshold, payment_frequency, calculation_basis, created_by, data, created_at, updated_at)
VALUES 
  ('tt-metro-001', 'metro-distribution', 'Makro Volume Agreement', 'Volume-based rebate for Makro stores', 'volume_rebate', 'active', 'cust-metro-makro', '2026-01-01', '2026-12-31', 2.5, 'percentage', 2000000, 'quarterly', 'revenue', 'user-metro-admin', '{}', datetime('now'), datetime('now'));

-- ============================================
-- REBATES
-- ============================================

-- Sunrise Foods SA rebates
INSERT INTO rebates (id, company_id, name, description, rebate_type, status, customer_id, trading_term_id, start_date, end_date, rate, rate_type, threshold, accrued_amount, settled_amount, calculation_basis, settlement_frequency, created_by, data, created_at, updated_at)
VALUES 
  ('reb-sunrise-001', 'sunrise-foods-sa', 'Pick n Pay Q1 2026 Rebate', 'Q1 volume rebate accrual for Pick n Pay', 'volume', 'active', 'cust-sunrise-pnp', 'tt-sunrise-001', '2026-01-01', '2026-03-31', 3.5, 'percentage', 1250000, 87500, 0, 'revenue', 'quarterly', 'user-sunrise-admin', '{"salesVolume": 2500000, "calculatedAt": "2026-01-15"}', datetime('now'), datetime('now')),
  ('reb-sunrise-002', 'sunrise-foods-sa', 'Shoprite Growth Rebate 2026', 'Annual growth rebate for Shoprite', 'growth', 'calculating', 'cust-sunrise-shoprite', 'tt-sunrise-002', '2026-01-01', '2026-12-31', 2.0, 'percentage', 0, 45000, 0, 'revenue', 'annually', 'user-sunrise-admin', '{"baselineRevenue": 8000000, "currentRevenue": 2250000}', datetime('now'), datetime('now')),
  ('reb-sunrise-003', 'sunrise-foods-sa', 'Woolworths Loyalty Rebate', 'Loyalty program rebate', 'loyalty', 'active', 'cust-sunrise-woolworths', null, '2026-01-01', '2026-12-31', 1.0, 'percentage', 0, 22000, 0, 'revenue', 'monthly', 'user-sunrise-admin', '{}', datetime('now'), datetime('now'));

-- Metro Distribution rebates
INSERT INTO rebates (id, company_id, name, description, rebate_type, status, customer_id, start_date, end_date, rate, rate_type, accrued_amount, settled_amount, calculation_basis, settlement_frequency, created_by, data, created_at, updated_at)
VALUES 
  ('reb-metro-001', 'metro-distribution', 'Makro Q1 Rebate', 'Quarterly rebate for Makro', 'volume', 'active', 'cust-metro-makro', '2026-01-01', '2026-03-31', 2.5, 'percentage', 35000, 0, 'revenue', 'quarterly', 'user-metro-admin', '{}', datetime('now'), datetime('now'));

-- ============================================
-- CLAIMS
-- ============================================

-- Sunrise Foods SA claims
INSERT INTO claims (id, company_id, claim_number, claim_type, status, customer_id, claimed_amount, approved_amount, settled_amount, claim_date, reason, created_by, data, created_at, updated_at)
VALUES 
  ('clm-sunrise-001', 'sunrise-foods-sa', 'CLM-2026-001', 'promotion', 'approved', 'cust-sunrise-pnp', 125000, 120000, 0, '2026-01-10', 'Summer promotion claim for January activities', 'user-sunrise-admin', '{"promotionId": "promo-sunrise-001", "invoices": ["INV-001", "INV-002"]}', datetime('now'), datetime('now')),
  ('clm-sunrise-002', 'sunrise-foods-sa', 'CLM-2026-002', 'rebate', 'pending', 'cust-sunrise-shoprite', 45000, 0, 0, '2026-01-15', 'Q4 2025 rebate settlement claim', 'user-sunrise-admin', '{"rebateId": "reb-2025-q4", "period": "Q4 2025"}', datetime('now'), datetime('now')),
  ('clm-sunrise-003', 'sunrise-foods-sa', 'CLM-2026-003', 'damage', 'under_review', 'cust-sunrise-woolworths', 8500, 0, 0, '2026-01-18', 'Damaged goods during transit - 50 cases', 'user-sunrise-admin', '{"deliveryNote": "DN-12345", "damagedUnits": 50}', datetime('now'), datetime('now')),
  ('clm-sunrise-004', 'sunrise-foods-sa', 'CLM-2026-004', 'pricing', 'settled', 'cust-sunrise-spar', 15000, 15000, 15000, '2026-01-05', 'Price difference claim for December invoices', 'user-sunrise-admin', '{"invoices": ["INV-DEC-001", "INV-DEC-002"]}', datetime('now'), datetime('now'));

-- Metro Distribution claims
INSERT INTO claims (id, company_id, claim_number, claim_type, status, customer_id, claimed_amount, approved_amount, claim_date, reason, created_by, data, created_at, updated_at)
VALUES 
  ('clm-metro-001', 'metro-distribution', 'CLM-M-2026-001', 'shortage', 'approved', 'cust-metro-makro', 22000, 20000, '2026-01-12', 'Short delivery claim - 20 pallets', 'user-metro-admin', '{"deliveryNote": "DN-M-001", "shortUnits": 20}', datetime('now'), datetime('now'));

-- ============================================
-- DEDUCTIONS
-- ============================================

-- Sunrise Foods SA deductions
INSERT INTO deductions (id, company_id, deduction_number, deduction_type, status, customer_id, invoice_number, invoice_date, deduction_amount, matched_amount, remaining_amount, deduction_date, reason_code, reason_description, created_by, data, created_at, updated_at)
VALUES 
  ('ded-sunrise-001', 'sunrise-foods-sa', 'DED-2026-001', 'promotion', 'matched', 'cust-sunrise-pnp', 'INV-2026-0001', '2026-01-05', 125000, 120000, 5000, '2026-01-08', 'PROMO', 'Promotional allowance deduction', 'user-sunrise-admin', '{"matchedClaims": ["clm-sunrise-001"]}', datetime('now'), datetime('now')),
  ('ded-sunrise-002', 'sunrise-foods-sa', 'DED-2026-002', 'rebate', 'open', 'cust-sunrise-shoprite', 'INV-2026-0015', '2026-01-10', 45000, 0, 45000, '2026-01-12', 'REBATE', 'Quarterly rebate deduction', 'user-sunrise-admin', '{}', datetime('now'), datetime('now')),
  ('ded-sunrise-003', 'sunrise-foods-sa', 'DED-2026-003', 'damage', 'under_review', 'cust-sunrise-woolworths', 'INV-2026-0022', '2026-01-15', 8500, 0, 8500, '2026-01-18', 'DAMAGE', 'Damaged goods deduction', 'user-sunrise-admin', '{}', datetime('now'), datetime('now')),
  ('ded-sunrise-004', 'sunrise-foods-sa', 'DED-2026-004', 'unauthorized', 'disputed', 'cust-sunrise-spar', 'INV-2026-0030', '2026-01-20', 12000, 0, 12000, '2026-01-22', 'UNAUTH', 'Unauthorized deduction - investigating', 'user-sunrise-admin', '{"disputeReason": "No supporting documentation provided"}', datetime('now'), datetime('now'));

-- Metro Distribution deductions
INSERT INTO deductions (id, company_id, deduction_number, deduction_type, status, customer_id, invoice_number, deduction_amount, matched_amount, remaining_amount, deduction_date, reason_code, reason_description, created_by, data, created_at, updated_at)
VALUES 
  ('ded-metro-001', 'metro-distribution', 'DED-M-2026-001', 'shortage', 'matched', 'cust-metro-makro', 'INV-M-2026-001', 22000, 20000, 2000, '2026-01-14', 'SHORT', 'Shortage deduction', 'user-metro-admin', '{"matchedClaims": ["clm-metro-001"]}', datetime('now'), datetime('now'));

-- ============================================
-- APPROVALS
-- ============================================

-- Sunrise Foods SA approvals
INSERT INTO approvals (id, company_id, entity_type, entity_id, entity_name, amount, status, priority, requested_by, requested_at, due_date, sla_hours, data, created_at, updated_at)
VALUES 
  ('apr-sunrise-001', 'sunrise-foods-sa', 'promotion', 'promo-sunrise-new', 'Easter Promotion 2026', 150000, 'pending', 'high', 'user-sunrise-kam', datetime('now', '-2 days'), datetime('now', '+1 day'), 48, '{"department": "Trade Marketing"}', datetime('now', '-2 days'), datetime('now')),
  ('apr-sunrise-002', 'sunrise-foods-sa', 'budget', 'budget-sunrise-q2', 'Q2 2026 Trade Budget', 2000000, 'pending', 'urgent', 'user-sunrise-admin', datetime('now', '-1 day'), datetime('now', '+2 days'), 72, '{"fiscalYear": 2026, "quarter": 2}', datetime('now', '-1 day'), datetime('now')),
  ('apr-sunrise-003', 'sunrise-foods-sa', 'claim', 'clm-sunrise-002', 'Shoprite Rebate Claim', 45000, 'pending', 'normal', 'user-sunrise-kam', datetime('now'), datetime('now', '+2 days'), 48, '{}', datetime('now'), datetime('now')),
  ('apr-sunrise-004', 'sunrise-foods-sa', 'trading_term', 'tt-sunrise-new', 'Checkers Volume Agreement', 0, 'approved', 'normal', 'user-sunrise-admin', datetime('now', '-5 days'), datetime('now', '-3 days'), 48, '{}', datetime('now', '-5 days'), datetime('now', '-3 days'));

-- Metro Distribution approvals
INSERT INTO approvals (id, company_id, entity_type, entity_id, entity_name, amount, status, priority, requested_by, requested_at, due_date, sla_hours, data, created_at, updated_at)
VALUES 
  ('apr-metro-001', 'metro-distribution', 'trade_spend', 'ts-metro-new', 'Makro Co-op Marketing', 75000, 'pending', 'high', 'user-metro-admin', datetime('now', '-1 day'), datetime('now', '+1 day'), 48, '{}', datetime('now', '-1 day'), datetime('now'));

-- ============================================
-- FORECASTS
-- ============================================

-- Sunrise Foods SA forecasts
INSERT INTO forecasts (id, company_id, name, forecast_type, status, period_type, base_year, forecast_year, total_forecast, total_actual, variance, variance_percent, method, confidence_level, created_by, data, created_at, updated_at)
VALUES 
  ('fcst-sunrise-001', 'sunrise-foods-sa', 'Trade Budget Forecast 2026', 'budget', 'active', 'annually', 2025, 2026, 12000000, 1500000, -10500000, -87.5, 'growth_rate', 0.85, 'user-sunrise-admin', '{"growthRate": 0.08, "assumptions": ["8% YoY growth", "New product launches", "Expanded distribution"]}', datetime('now'), datetime('now')),
  ('fcst-sunrise-002', 'sunrise-foods-sa', 'Revenue Forecast Q1 2026', 'revenue', 'active', 'quarterly', 2025, 2026, 45000000, 12500000, -32500000, -72.2, 'weighted_moving_average', 0.80, 'user-sunrise-admin', '{"weights": [0.5, 0.3, 0.2], "seasonalityFactor": 1.1}', datetime('now'), datetime('now')),
  ('fcst-sunrise-003', 'sunrise-foods-sa', 'Demand Forecast - Cereals', 'demand', 'draft', 'monthly', 2025, 2026, 500000, 0, 0, 0, 'historical', 0.75, 'user-sunrise-admin', '{"productCategory": "Cereals", "units": "cases"}', datetime('now'), datetime('now'));

-- Metro Distribution forecasts
INSERT INTO forecasts (id, company_id, name, forecast_type, status, period_type, base_year, forecast_year, total_forecast, total_actual, method, confidence_level, created_by, data, created_at, updated_at)
VALUES 
  ('fcst-metro-001', 'metro-distribution', 'Distribution Revenue 2026', 'revenue', 'active', 'annually', 2025, 2026, 25000000, 6500000, 'growth_rate', 0.82, 'user-metro-admin', '{"growthRate": 0.05}', datetime('now'), datetime('now'));

-- ============================================
-- ACTIVITIES (Recent activity feed)
-- ============================================

-- Sunrise Foods SA activities
INSERT INTO activities (id, company_id, user_id, action, entity_type, entity_id, description, data, created_at)
VALUES 
  ('act-sunrise-001', 'sunrise-foods-sa', 'user-sunrise-admin', 'create', 'promotion', 'promo-sunrise-001', 'Created Summer Breakfast Bonanza promotion', '{}', datetime('now', '-5 days')),
  ('act-sunrise-002', 'sunrise-foods-sa', 'user-sunrise-admin', 'approve', 'budget', 'budget-sunrise-001', 'Approved Q1 2026 Trade Budget', '{"amount": 3000000}', datetime('now', '-4 days')),
  ('act-sunrise-003', 'sunrise-foods-sa', 'user-sunrise-kam', 'submit', 'claim', 'clm-sunrise-001', 'Submitted Pick n Pay promotion claim', '{"amount": 125000}', datetime('now', '-3 days')),
  ('act-sunrise-004', 'sunrise-foods-sa', 'user-sunrise-admin', 'update', 'trading_term', 'tt-sunrise-001', 'Updated Pick n Pay volume rebate rates', '{}', datetime('now', '-2 days')),
  ('act-sunrise-005', 'sunrise-foods-sa', 'user-sunrise-kam', 'create', 'trade_spend', 'ts-sunrise-new', 'Created new trade spend request', '{"amount": 50000}', datetime('now', '-1 day')),
  ('act-sunrise-006', 'sunrise-foods-sa', 'user-sunrise-admin', 'calculate', 'rebate', 'reb-sunrise-001', 'Calculated Q1 rebate accrual for Pick n Pay', '{"accrued": 87500}', datetime('now'));

-- Metro Distribution activities
INSERT INTO activities (id, company_id, user_id, action, entity_type, entity_id, description, data, created_at)
VALUES 
  ('act-metro-001', 'metro-distribution', 'user-metro-admin', 'create', 'campaign', 'cmp-metro-001', 'Created Q1 Trade Push campaign', '{}', datetime('now', '-3 days')),
  ('act-metro-002', 'metro-distribution', 'user-metro-admin', 'approve', 'claim', 'clm-metro-001', 'Approved Makro shortage claim', '{"amount": 20000}', datetime('now', '-1 day'));

-- ============================================
-- DATA LINEAGE (Audit trail entries)
-- ============================================

-- Sunrise Foods SA data lineage
INSERT INTO data_lineage (id, company_id, entity_type, entity_id, field_name, old_value, new_value, change_type, source, changed_by, changed_at, data)
VALUES 
  ('dl-sunrise-001', 'sunrise-foods-sa', 'budget', 'budget-sunrise-001', 'amount', '2500000', '3000000', 'update', 'manual', 'user-sunrise-admin', datetime('now', '-4 days'), '{"reason": "Increased allocation for new product launches"}'),
  ('dl-sunrise-002', 'sunrise-foods-sa', 'promotion', 'promo-sunrise-001', 'status', 'draft', 'active', 'update', 'manual', 'user-sunrise-admin', datetime('now', '-5 days'), '{}'),
  ('dl-sunrise-003', 'sunrise-foods-sa', 'rebate', 'reb-sunrise-001', 'accrued_amount', '0', '87500', 'calculate', 'calculation', 'system', datetime('now'), '{"calculationMethod": "volume_rebate", "salesBase": 2500000}'),
  ('dl-sunrise-004', 'sunrise-foods-sa', 'trading_term', 'tt-sunrise-001', 'rate', '3.0', '3.5', 'update', 'manual', 'user-sunrise-admin', datetime('now', '-2 days'), '{"reason": "Annual rate review"}');

-- ============================================
-- KAM WALLETS
-- ============================================

-- Sunrise Foods SA KAM wallets
INSERT INTO kam_wallets (id, company_id, user_id, year, quarter, allocated_amount, utilized_amount, committed_amount, available_amount, status, data, created_at, updated_at)
VALUES 
  ('kw-sunrise-001', 'sunrise-foods-sa', 'user-sunrise-kam', 2026, 1, 500000, 125000, 75000, 300000, 'active', '{"customers": {"pnp": 200000, "shoprite": 150000, "woolworths": 100000, "spar": 50000}}', datetime('now'), datetime('now')),
  ('kw-sunrise-002', 'sunrise-foods-sa', 'user-sunrise-kam2', 2026, 1, 350000, 80000, 50000, 220000, 'active', '{"customers": {"checkers": 150000, "game": 100000, "other": 100000}}', datetime('now'), datetime('now'));

-- Metro Distribution KAM wallets
INSERT INTO kam_wallets (id, company_id, user_id, year, quarter, allocated_amount, utilized_amount, committed_amount, available_amount, status, data, created_at, updated_at)
VALUES 
  ('kw-metro-001', 'metro-distribution', 'user-metro-kam', 2026, 1, 250000, 75000, 25000, 150000, 'active', '{}', datetime('now'), datetime('now'));
