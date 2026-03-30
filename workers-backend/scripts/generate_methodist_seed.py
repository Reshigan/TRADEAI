#!/usr/bin/env python3
"""
Generate comprehensive Methodist demo company seed data for TRADEAI.
Produces 12 months (Jan-Dec 2026) of realistic transactional data across ALL tables.
Outputs SQL that can be executed against the live D1 database.

Uses INSERT OR IGNORE to avoid conflicts with existing seed data from migration 0067.
"""

import random
import hashlib
import os
from datetime import datetime, timedelta
import json

random.seed(42)  # Deterministic for reproducibility

# ============================================================================
# CONSTANTS
# ============================================================================
COMPANY_ID = "comp-methodist-001"
YEAR = 2026

CUSTOMERS = [
    ("cust-meth-001", "Shoprite Holdings", "SHP001", "Modern Trade", "Supermarket", "Tier 1", "Gauteng", "Johannesburg"),
    ("cust-meth-002", "Pick n Pay", "PNP001", "Modern Trade", "Supermarket", "Tier 1", "Western Cape", "Cape Town"),
    ("cust-meth-003", "Woolworths", "WOO001", "Modern Trade", "Premium", "Tier 1", "Gauteng", "Johannesburg"),
    ("cust-meth-004", "Spar Group", "SPR001", "Modern Trade", "Supermarket", "Tier 2", "KwaZulu-Natal", "Durban"),
    ("cust-meth-005", "Checkers", "CHK001", "Modern Trade", "Supermarket", "Tier 2", "Gauteng", "Pretoria"),
    ("cust-meth-006", "Makro", "MAK001", "Wholesale", "Cash & Carry", "Tier 2", "Gauteng", "Johannesburg"),
    ("cust-meth-007", "Cambridge Food", "CAM001", "Traditional Trade", "Independent", "Tier 3", "Gauteng", "Johannesburg"),
    ("cust-meth-008", "Boxer", "BOX001", "Traditional Trade", "Discount", "Tier 3", "KwaZulu-Natal", "Durban"),
    ("cust-meth-009", "Food Lovers Market", "FLM001", "Modern Trade", "Specialty", "Tier 2", "Western Cape", "Cape Town"),
    ("cust-meth-010", "Game", "GAM001", "Wholesale", "Cash & Carry", "Tier 3", "Gauteng", "Johannesburg"),
]

PRODUCTS = [
    ("prod-meth-001", "Methodist Premium Coffee 250g", "METH-COF-250", "Beverages", "Coffee", 45.99, 27.59),
    ("prod-meth-002", "Methodist Instant Coffee 200g", "METH-ICF-200", "Beverages", "Coffee", 32.99, 19.79),
    ("prod-meth-003", "Methodist Rooibos Tea 80s", "METH-TEA-080", "Beverages", "Tea", 28.99, 14.50),
    ("prod-meth-004", "Methodist Green Tea 40s", "METH-GTE-040", "Beverages", "Tea", 35.99, 18.00),
    ("prod-meth-005", "Methodist Hot Chocolate 500g", "METH-CHO-500", "Beverages", "Hot Chocolate", 52.99, 26.50),
    ("prod-meth-006", "Methodist Digestive Biscuits 200g", "METH-BIS-200", "Snacks", "Biscuits", 24.99, 12.50),
    ("prod-meth-007", "Methodist Rusks 500g", "METH-RSK-500", "Snacks", "Rusks", 42.99, 21.50),
    ("prod-meth-008", "Methodist Granola Cereal 450g", "METH-CER-450", "Breakfast", "Cereal", 48.99, 24.50),
    ("prod-meth-009", "Methodist Oats 1kg", "METH-OAT-1KG", "Breakfast", "Oats", 38.99, 19.50),
    ("prod-meth-010", "Methodist Muesli 500g", "METH-MUS-500", "Breakfast", "Muesli", 62.99, 31.50),
]

USERS = [
    ("user-meth-admin-001", "admin"),
    ("user-meth-kam-001", "kam"),
    ("user-meth-manager-001", "manager"),
    ("user-meth-analyst-001", "analyst"),
]

# Seasonal multipliers by month (1=Jan..12=Dec)
SEASONALITY = {
    1: 0.85,   # January - post-holiday lull
    2: 0.90,   # February - back to school
    3: 1.05,   # March - Easter build
    4: 1.15,   # April - Easter peak
    5: 1.10,   # May - Winter start
    6: 1.20,   # June - Winter peak
    7: 1.15,   # July - Mid-winter
    8: 0.95,   # August - Spring transition
    9: 1.00,   # September - Heritage Day
    10: 1.05,  # October - Spring
    11: 1.10,  # November - Pre-festive
    12: 1.25,  # December - Festive peak
}

# Customer revenue share weights
CUSTOMER_WEIGHTS = {
    "cust-meth-001": 0.22,  # Shoprite - largest
    "cust-meth-002": 0.18,  # Pick n Pay
    "cust-meth-003": 0.12,  # Woolworths
    "cust-meth-004": 0.11,  # Spar
    "cust-meth-005": 0.10,  # Checkers
    "cust-meth-006": 0.08,  # Makro
    "cust-meth-007": 0.05,  # Cambridge
    "cust-meth-008": 0.05,  # Boxer
    "cust-meth-009": 0.05,  # Food Lovers
    "cust-meth-010": 0.04,  # Game
}

ANNUAL_REVENUE = 52000000  # R52M annual revenue target

def esc(s):
    """Escape single quotes for SQL."""
    if s is None:
        return "NULL"
    return str(s).replace("'", "''")

def sql_val(v):
    """Format a value for SQL."""
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return str(round(v, 2))
    return f"'{esc(v)}'"

def date_str(year, month, day):
    """Return ISO date string."""
    return f"{year:04d}-{month:02d}-{day:02d}"

def datetime_str(year, month, day, hour=12, minute=0):
    """Return ISO datetime string."""
    return f"{year:04d}-{month:02d}-{day:02d} {hour:02d}:{minute:02d}:00"

# ============================================================================
# SQL GENERATION
# ============================================================================

lines = []
lines.append("-- ============================================================================")
lines.append("-- METHODIST DEMO COMPANY: 12-MONTH COMPREHENSIVE SEED DATA")
lines.append("-- Generated for TRADEAI - Full year 2026")
lines.append("-- Uses INSERT OR IGNORE to coexist with existing seed data (migration 0067)")
lines.append("-- ============================================================================")
lines.append("")

# ============================================================================
# 1. SALES TRANSACTIONS - 12 months of weekly sales data
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- SALES TRANSACTIONS (weekly data for 12 months)")
lines.append("-- ============================================================================")

stxn_counter = 100  # Start after existing IDs
for month in range(1, 13):
    season = SEASONALITY[month]
    days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
    
    for week in range(4):  # ~4 weeks per month
        day = min(1 + week * 7, days_in_month)
        tx_date = date_str(YEAR, month, day)
        
        for cust_id, cust_name, cust_code, channel, sub_ch, tier, region, city in CUSTOMERS:
            cust_weight = CUSTOMER_WEIGHTS[cust_id]
            
            # Each customer buys 3-6 products per week
            num_products = random.randint(3, 6)
            selected_products = random.sample(PRODUCTS, num_products)
            
            for prod_id, prod_name, sku, cat, subcat, unit_price, cost_price in selected_products:
                stxn_counter += 1
                sid = f"stxn-meth-{stxn_counter:04d}"
                
                # Base weekly quantity adjusted by seasonality and customer weight
                base_qty = int(150 * cust_weight * season * random.uniform(0.7, 1.3))
                qty = max(10, base_qty)
                
                gross = round(qty * unit_price, 2)
                is_promo = 1 if random.random() < 0.35 else 0
                discount = round(gross * random.uniform(0.08, 0.18), 2) if is_promo else 0
                net = round(gross - discount, 2)
                
                lines.append(
                    f"INSERT OR IGNORE INTO sales_transactions (id, company_id, customer_id, product_id, transaction_date, quantity, unit_price, gross_amount, discount_amount, net_amount, channel, is_promotional, created_at, updated_at) "
                    f"VALUES ({sql_val(sid)}, {sql_val(COMPANY_ID)}, {sql_val(cust_id)}, {sql_val(prod_id)}, {sql_val(tx_date)}, {qty}, {unit_price}, {gross}, {discount}, {net}, {sql_val(channel)}, {is_promo}, {sql_val(tx_date)}, {sql_val(tx_date)});"
                )

lines.append("")

# ============================================================================
# 2. MONTHLY PROMOTIONS (2 per month = 24 total)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- PROMOTIONS (monthly, 24 total)")
lines.append("-- ============================================================================")

promo_types = ["price_discount", "volume_discount", "bundle", "bogo", "new_product", "loyalty"]
promo_statuses_by_month = lambda m: "completed" if m <= 3 else ("active" if m <= 6 else "planned")
promo_names = [
    "New Year Coffee Kickstart", "Back to School Breakfast Bundle",
    "Easter Coffee Celebration", "Easter Snack Attack",
    "Autumn Harvest Oats Promo", "Mother's Day Gift Hamper",
    "Winter Warmer Coffee Deal", "Winter Hot Choc Festival",
    "Heritage Day Rooibos Special", "Spring Clean Eating Promo",
    "Summer Snack Pack", "Festive Season Mega Deal",
    "January Health Reset", "Valentine's Tea for Two",
    "Easter Premium Range", "Freedom Day Celebration",
    "Workers Day Special", "Youth Day Breakfast Drive",
    "Mandela Day Community Pack", "Women's Day Wellness",
    "Braai Day BBQ Bundle", "Halloween Treat Pack",
    "Black Friday Mega Sale", "Christmas Hamper Collection",
]

promo_counter = 100
for month in range(1, 13):
    for pi in range(2):  # 2 promos per month
        promo_counter += 1
        idx = (month - 1) * 2 + pi
        pid = f"promo-meth-{promo_counter:03d}"
        name = f"Methodist {promo_names[idx]}"
        ptype = promo_types[idx % len(promo_types)]
        status = promo_statuses_by_month(month)
        
        start = date_str(YEAR, month, 1)
        end_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
        end = date_str(YEAR, month, end_day)
        
        budget_amt = round(random.uniform(150000, 500000), 2)
        spent = round(budget_amt * random.uniform(0.3, 0.9), 2) if status in ("completed", "active") else 0
        
        sell_in_start = date_str(YEAR, max(1, month - 1), 15)
        sell_in_end = date_str(YEAR, month, 1)
        
        cust_idx = idx % len(CUSTOMERS)
        cust_id = CUSTOMERS[cust_idx][0]
        
        lines.append(
            f"INSERT OR IGNORE INTO promotions (id, company_id, name, description, promotion_type, status, start_date, end_date, sell_in_start_date, sell_in_end_date, budget_id, expected_spend, actual_spend, created_by, approved_by, created_at, approved_at, updated_at) "
            f"VALUES ({sql_val(pid)}, {sql_val(COMPANY_ID)}, {sql_val(name)}, {sql_val(f'{name} - promotional campaign')}, {sql_val(ptype)}, {sql_val(status)}, {sql_val(start)}, {sql_val(end)}, {sql_val(sell_in_start)}, {sql_val(sell_in_end)}, 'budget-meth-001', {budget_amt}, {spent}, 'user-meth-kam-001', 'user-meth-manager-001', {sql_val(datetime_str(YEAR, max(1,month-1), 20))}, {sql_val(datetime_str(YEAR, max(1,month-1), 25))}, {sql_val(datetime_str(YEAR, month, 1))});"
        )

lines.append("")

# ============================================================================
# 3. MONTHLY TRADE SPENDS (3-4 per month)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- TRADE SPENDS (monthly, ~40 total)")
lines.append("-- ============================================================================")

spend_types = ["promotional", "listing_fee", "marketing", "volume_rebate", "co_op"]
activity_types = ["price_discount", "volume_discount", "in_store_display", "catalogue", "listing", "bundle"]
spend_statuses_by_month = lambda m: "approved" if m <= 6 else ("pending" if m <= 9 else "draft")

ts_counter = 100
for month in range(1, 13):
    season = SEASONALITY[month]
    num_spends = random.randint(3, 5)
    
    for si in range(num_spends):
        ts_counter += 1
        tsid = f"tspend-meth-{ts_counter:03d}"
        sid = f"TS-2026-{ts_counter:03d}"
        
        stype = spend_types[si % len(spend_types)]
        atype = activity_types[si % len(activity_types)]
        status = spend_statuses_by_month(month)
        
        cust_idx = (month * 3 + si) % len(CUSTOMERS)
        cust_id = CUSTOMERS[cust_idx][0]
        prod_idx = (month * 2 + si) % len(PRODUCTS)
        prod_id = PRODUCTS[prod_idx][0]
        
        amount = round(random.uniform(25000, 180000) * season, 2)
        
        promo_ref = f"promo-meth-{101 + (month-1)*2 + (si % 2):03d}"
        
        approved_by = "'user-meth-manager-001'" if status == "approved" else "NULL"
        approved_at = f"'{datetime_str(YEAR, month, 10)}'" if status == "approved" else "NULL"
        
        lines.append(
            f"INSERT OR IGNORE INTO trade_spends (id, company_id, spend_id, spend_type, activity_type, amount, status, customer_id, product_id, promotion_id, budget_id, description, created_by, approved_by, approved_at, created_at, updated_at) "
            f"VALUES ({sql_val(tsid)}, {sql_val(COMPANY_ID)}, {sql_val(sid)}, {sql_val(stype)}, {sql_val(atype)}, {amount}, {sql_val(status)}, {sql_val(cust_id)}, {sql_val(prod_id)}, {sql_val(promo_ref)}, 'budget-meth-001', {sql_val(f'Trade spend - {stype} - Month {month}')}, 'user-meth-kam-001', {approved_by}, {approved_at}, {sql_val(datetime_str(YEAR, month, 5))}, {sql_val(datetime_str(YEAR, month, 5))});"
        )

lines.append("")

# ============================================================================
# 4. MONTHLY CLAIMS (2-3 per month for completed periods)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- CLAIMS (monthly)")
lines.append("-- ============================================================================")

claim_types = ["promotional", "volume_rebate", "damage", "shortage", "pricing"]
claim_counter = 100
for month in range(1, 10):  # Claims only for Jan-Sep (past/current periods)
    num_claims = random.randint(2, 4)
    for ci in range(num_claims):
        claim_counter += 1
        cid = f"claim-meth-{claim_counter:03d}"
        cnum = f"CLM-2026-{claim_counter:03d}"
        
        ctype = claim_types[ci % len(claim_types)]
        status = "settled" if month <= 3 else ("approved" if month <= 6 else "pending")
        
        cust_idx = (month + ci) % len(CUSTOMERS)
        cust_id = CUSTOMERS[cust_idx][0]
        promo_ref = f"promo-meth-{100 + (month-1)*2:03d}"
        
        claimed = round(random.uniform(15000, 120000), 2)
        approved = round(claimed * random.uniform(0.85, 1.0), 2) if status != "pending" else 0
        settled = approved if status == "settled" else 0
        
        claim_date = datetime_str(YEAR, month, random.randint(10, 25))
        due_date = date_str(YEAR, min(12, month + 1), 15)
        settle_date = f"'{datetime_str(YEAR, month, 28)}'" if status == "settled" else "NULL"
        reviewed_by = "'user-meth-manager-001'" if status != "pending" else "NULL"
        reviewed_at = f"'{datetime_str(YEAR, month, 20)}'" if status != "pending" else "NULL"
        
        lines.append(
            f"INSERT OR IGNORE INTO claims (id, company_id, claim_number, claim_type, status, customer_id, promotion_id, claimed_amount, approved_amount, settled_amount, claim_date, due_date, settlement_date, reason, reviewed_by, reviewed_at, created_by, created_at, updated_at) "
            f"VALUES ({sql_val(cid)}, {sql_val(COMPANY_ID)}, {sql_val(cnum)}, {sql_val(ctype)}, {sql_val(status)}, {sql_val(cust_id)}, {sql_val(promo_ref)}, {claimed}, {approved}, {settled}, {sql_val(claim_date)}, {sql_val(due_date)}, {settle_date}, {sql_val(f'{ctype} claim for month {month}')}, {reviewed_by}, {reviewed_at}, 'user-meth-kam-001', {sql_val(claim_date)}, {sql_val(claim_date)});"
        )

lines.append("")

# ============================================================================
# 5. DEDUCTIONS (1-2 per month)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- DEDUCTIONS (monthly)")
lines.append("-- ============================================================================")

ded_types = ["shortage", "pricing", "promotional", "damage", "quality"]
ded_counter = 100
for month in range(1, 10):
    num_deds = random.randint(1, 3)
    for di in range(num_deds):
        ded_counter += 1
        did = f"ded-meth-{ded_counter:03d}"
        dnum = f"DED-2026-{ded_counter:03d}"
        
        dtype = ded_types[di % len(ded_types)]
        status = "resolved" if month <= 3 else ("disputed" if month <= 6 else "pending")
        
        cust_idx = (month * 2 + di) % len(CUSTOMERS)
        cust_id = CUSTOMERS[cust_idx][0]
        
        amount = round(random.uniform(3000, 25000), 2)
        matched = amount if status == "resolved" else 0
        remaining = 0 if status == "resolved" else amount
        
        inv_num = f"INV-2026-{1000 + ded_counter:04d}"
        inv_date = datetime_str(YEAR, month, random.randint(1, 15))
        ded_date = datetime_str(YEAR, month, random.randint(16, 28))
        due_date = date_str(YEAR, min(12, month + 1), 20)
        
        reason_codes = {"shortage": "SHORT", "pricing": "PRICE", "promotional": "PROMO", "damage": "DAMAGE", "quality": "QUAL"}
        
        lines.append(
            f"INSERT OR IGNORE INTO deductions (id, company_id, deduction_number, deduction_type, status, customer_id, invoice_number, invoice_date, deduction_amount, matched_amount, remaining_amount, deduction_date, due_date, reason_code, reason_description, created_by, created_at, updated_at) "
            f"VALUES ({sql_val(did)}, {sql_val(COMPANY_ID)}, {sql_val(dnum)}, {sql_val(dtype)}, {sql_val(status)}, {sql_val(cust_id)}, {sql_val(inv_num)}, {sql_val(inv_date)}, {amount}, {matched}, {remaining}, {sql_val(ded_date)}, {sql_val(due_date)}, {sql_val(reason_codes.get(dtype, 'OTHER'))}, {sql_val(f'{dtype} deduction')}, 'user-meth-kam-001', {sql_val(ded_date)}, {sql_val(ded_date)});"
        )

lines.append("")

# ============================================================================
# 6. SETTLEMENTS (for settled claims)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- SETTLEMENTS (for completed months)")
lines.append("-- ============================================================================")

settle_counter = 100
for month in range(1, 4):  # Settlements for Q1 (settled claims)
    num_settles = random.randint(2, 3)
    for si in range(num_settles):
        settle_counter += 1
        sid = f"settle-meth-{settle_counter:03d}"
        snum = f"SET-2026-{settle_counter:03d}"
        
        cust_idx = (month + si) % len(CUSTOMERS)
        cust_id = CUSTOMERS[cust_idx][0]
        cust_name = CUSTOMERS[cust_idx][1]
        
        accrued = round(random.uniform(50000, 150000), 2)
        claimed = round(accrued * random.uniform(0.90, 1.0), 2)
        approved = round(claimed * random.uniform(0.92, 1.0), 2)
        settled = approved
        variance = round(settled - accrued, 2)
        variance_pct = round(variance / accrued * 100, 2) if accrued else 0
        
        settle_date = datetime_str(YEAR, month, 28)
        
        lines.append(
            f"INSERT OR IGNORE INTO settlements (id, company_id, settlement_number, name, description, status, settlement_type, customer_id, settlement_date, due_date, accrued_amount, claimed_amount, approved_amount, settled_amount, variance_amount, variance_pct, payment_method, payment_reference, payment_date, currency, created_by, approved_by, approved_at, processed_by, processed_at, created_at, updated_at) "
            f"VALUES ({sql_val(sid)}, {sql_val(COMPANY_ID)}, {sql_val(snum)}, {sql_val(f'Settlement {snum} - {cust_name}')}, {sql_val(f'Monthly settlement for {cust_name}')}, 'completed', 'promotional', {sql_val(cust_id)}, {sql_val(settle_date)}, {sql_val(date_str(YEAR, month, 25))}, {accrued}, {claimed}, {approved}, {settled}, {variance}, {variance_pct}, 'credit_note', {sql_val(f'CN-2026-{settle_counter:03d}')}, {sql_val(settle_date)}, 'ZAR', 'user-meth-kam-001', 'user-meth-manager-001', {sql_val(datetime_str(YEAR, month, 20))}, 'user-meth-manager-001', {sql_val(settle_date)}, {sql_val(datetime_str(YEAR, month, 15))}, {sql_val(settle_date)});"
        )

lines.append("")

# ============================================================================
# 7. ACCRUALS (monthly per major customer)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- ACCRUALS (monthly per major customer)")
lines.append("-- ============================================================================")

accr_counter = 100
for month in range(1, 13):
    for ci in range(5):  # Top 5 customers
        accr_counter += 1
        aid = f"accr-meth-{accr_counter:03d}"
        cust_id = CUSTOMERS[ci][0]
        cust_name = CUSTOMERS[ci][1]
        prod_id = PRODUCTS[ci % len(PRODUCTS)][0]
        
        status = "posted" if month <= 3 else ("active" if month <= 6 else "draft")
        base_amount = round(ANNUAL_REVENUE * CUSTOMER_WEIGHTS[cust_id] / 12 * SEASONALITY[month], 2)
        rate = round(random.uniform(10, 20), 2)
        accrued = round(base_amount * rate / 100, 2)
        posted = accrued if status == "posted" else 0
        settled_amt = round(accrued * 0.95, 2) if status == "posted" else 0
        remaining = round(accrued - settled_amt, 2)
        
        start = date_str(YEAR, month, 1)
        end_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
        end = date_str(YEAR, month, end_day)
        
        lines.append(
            f"INSERT OR IGNORE INTO accruals (id, company_id, name, description, status, accrual_type, calculation_method, frequency, customer_id, product_id, budget_id, start_date, end_date, rate, rate_type, base_amount, accrued_amount, posted_amount, reversed_amount, settled_amount, remaining_amount, currency, auto_calculate, auto_post, created_by, created_at, updated_at) "
            f"VALUES ({sql_val(aid)}, {sql_val(COMPANY_ID)}, {sql_val(f'{cust_name} Accrual - {month:02d}/{YEAR}')}, {sql_val(f'Monthly accrual for {cust_name}')}, {sql_val(status)}, 'promotional', 'percentage', 'monthly', {sql_val(cust_id)}, {sql_val(prod_id)}, 'budget-meth-001', {sql_val(start)}, {sql_val(end)}, {rate}, 'percentage', {base_amount}, {accrued}, {posted}, 0, {settled_amt}, {remaining}, 'ZAR', 1, 1, 'user-meth-kam-001', {sql_val(datetime_str(YEAR, month, 1))}, {sql_val(datetime_str(YEAR, month, end_day))});"
        )

lines.append("")

# ============================================================================
# 8. P&L REPORTS (quarterly + annual)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- P&L REPORTS (quarterly + annual)")
lines.append("-- ============================================================================")

pnl_counter = 100
quarters = [
    ("Q1", "2026-01-01", "2026-03-31", "published"),
    ("Q2", "2026-04-01", "2026-06-30", "published"),
    ("Q3", "2026-07-01", "2026-09-30", "draft"),
    ("Q4", "2026-10-01", "2026-12-31", "draft"),
]

for q_name, q_start, q_end, q_status in quarters:
    pnl_counter += 1
    pnl_id = f"pnl-meth-{pnl_counter:03d}"
    
    q_months = [int(q_start[5:7]) + i for i in range(3)]
    q_season = sum(SEASONALITY[m] for m in q_months) / 3
    
    gross_sales = round(ANNUAL_REVENUE / 4 * q_season, 2)
    trade_spend = round(gross_sales * random.uniform(0.06, 0.09), 2)
    net_sales = round(gross_sales - trade_spend, 2)
    cogs = round(gross_sales * 0.60, 2)
    gross_profit = round(net_sales - cogs, 2)
    gross_margin = round(gross_profit / gross_sales * 100, 2) if gross_sales else 0
    accruals_amt = round(trade_spend * 1.05, 2)
    settlements_amt = round(trade_spend * 0.95, 2) if q_status == "published" else 0
    claims_amt = round(trade_spend * 0.90, 2) if q_status == "published" else 0
    deductions_amt = round(random.uniform(15000, 45000), 2)
    net_trade = round(trade_spend + deductions_amt, 2)
    net_profit = round(gross_profit - net_trade, 2)
    net_margin = round(net_profit / gross_sales * 100, 2) if gross_sales else 0
    budget_amt = round(ANNUAL_REVENUE / 4 * 0.08, 2)
    budget_var = round(budget_amt - trade_spend, 2)
    budget_var_pct = round(budget_var / budget_amt * 100, 2) if budget_amt else 0
    roi = round(gross_profit / trade_spend, 2) if trade_spend else 0
    
    gen_date = datetime_str(YEAR, q_months[-1], 28)
    
    lines.append(
        f"INSERT OR IGNORE INTO pnl_reports (id, company_id, name, description, status, report_type, period_type, start_date, end_date, gross_sales, trade_spend, net_sales, cogs, gross_profit, gross_margin_pct, accruals, settlements, claims, deductions, net_trade_cost, net_profit, net_margin_pct, budget_amount, budget_variance, budget_variance_pct, roi, currency, generated_at, generated_by, created_at, updated_at) "
        f"VALUES ({sql_val(pnl_id)}, {sql_val(COMPANY_ID)}, {sql_val(f'Methodist {q_name} {YEAR} P&L')}, {sql_val(f'{q_name} {YEAR} Profit & Loss Report')}, {sql_val(q_status)}, 'quarterly', 'quarter', {sql_val(q_start)}, {sql_val(q_end)}, {gross_sales}, {trade_spend}, {net_sales}, {cogs}, {gross_profit}, {gross_margin}, {accruals_amt}, {settlements_amt}, {claims_amt}, {deductions_amt}, {net_trade}, {net_profit}, {net_margin}, {budget_amt}, {budget_var}, {budget_var_pct}, {roi}, 'ZAR', {sql_val(gen_date)}, 'user-meth-analyst-001', {sql_val(gen_date)}, {sql_val(gen_date)});"
    )

# Annual P&L
pnl_counter += 1
pnl_id = f"pnl-meth-{pnl_counter:03d}"
gross_sales_annual = ANNUAL_REVENUE
trade_spend_annual = round(gross_sales_annual * 0.075, 2)
net_sales_annual = round(gross_sales_annual - trade_spend_annual, 2)
cogs_annual = round(gross_sales_annual * 0.60, 2)
gross_profit_annual = round(net_sales_annual - cogs_annual, 2)
lines.append(
    f"INSERT OR IGNORE INTO pnl_reports (id, company_id, name, description, status, report_type, period_type, start_date, end_date, gross_sales, trade_spend, net_sales, cogs, gross_profit, gross_margin_pct, roi, currency, generated_at, generated_by, created_at, updated_at) "
    f"VALUES ({sql_val(pnl_id)}, {sql_val(COMPANY_ID)}, 'Methodist Annual {YEAR} P&L', 'Annual {YEAR} Profit & Loss', 'draft', 'annual', 'annual', '2026-01-01', '2026-12-31', {gross_sales_annual}, {trade_spend_annual}, {net_sales_annual}, {cogs_annual}, {gross_profit_annual}, {round(gross_profit_annual/gross_sales_annual*100,2)}, {round(gross_profit_annual/trade_spend_annual,2)}, 'ZAR', '{datetime_str(YEAR,12,31)}', 'user-meth-analyst-001', '{datetime_str(YEAR,12,31)}', '{datetime_str(YEAR,12,31)}');"
)

lines.append("")

# ============================================================================
# 9. KPI ACTUALS (monthly for all KPIs)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- KPI ACTUALS (monthly)")
lines.append("-- ============================================================================")

kpi_defs = [
    ("kpi-def-meth-001", "Trade Spend as % of Revenue", 9.5, "lower"),
    ("kpi-def-meth-002", "Gross Margin %", 33.0, "higher"),
    ("kpi-def-meth-003", "Promotional ROI", 3.5, "higher"),
    ("kpi-def-meth-004", "Claims Settlement Time", 18.0, "lower"),
    ("kpi-def-meth-005", "Budget Utilization %", 80.0, "optimal"),
]

kpi_act_counter = 100
for month in range(1, 13):
    for kpi_id, kpi_name, target, direction in kpi_defs:
        kpi_act_counter += 1
        aid = f"kpi-act-meth-{kpi_act_counter:03d}"
        period = f"2026-M{month:02d}"
        p_start = date_str(YEAR, month, 1)
        end_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
        p_end = date_str(YEAR, month, end_day)
        
        # Generate realistic actuals with slight trend
        trend = 1 + (month - 1) * 0.005  # Slight improvement over time
        noise = random.uniform(0.90, 1.10)
        
        if kpi_name == "Trade Spend as % of Revenue":
            actual = round(random.uniform(6.0, 9.0) * noise, 2)
        elif kpi_name == "Gross Margin %":
            actual = round(random.uniform(31.0, 36.0) * noise, 2)
        elif kpi_name == "Promotional ROI":
            actual = round(random.uniform(2.8, 4.5) * trend * noise, 2)
        elif kpi_name == "Claims Settlement Time":
            actual = round(random.uniform(12.0, 22.0) / trend * noise, 2)
        else:  # Budget Utilization
            actual = round(min(100, (month / 12 * 100) * random.uniform(0.85, 1.15)), 2)
        
        variance = round(actual - target, 2)
        variance_pct = round(variance / target * 100, 2) if target else 0
        achievement = round(actual / target * 100, 2) if target else 0
        
        if direction == "lower":
            rag = "green" if actual < target * 0.9 else ("amber" if actual < target * 1.1 else "red")
        elif direction == "higher":
            rag = "green" if actual > target * 1.05 else ("amber" if actual > target * 0.9 else "red")
        else:
            rag = "green" if 0.85 * target <= actual <= 1.15 * target else ("amber" if 0.7 * target <= actual <= 1.3 * target else "red")
        
        trend_dir = "improving" if month > 1 and random.random() > 0.3 else "stable"
        prior_val = round(actual * random.uniform(0.90, 1.05), 2)
        
        lines.append(
            f"INSERT OR IGNORE INTO kpi_actuals (id, company_id, kpi_id, kpi_name, period, period_start, period_end, actual_value, target_value, variance, variance_pct, achievement_pct, trend_direction, prior_period_value, rag_status, created_by, created_at, updated_at) "
            f"VALUES ({sql_val(aid)}, {sql_val(COMPANY_ID)}, {sql_val(kpi_id)}, {sql_val(kpi_name)}, {sql_val(period)}, {sql_val(p_start)}, {sql_val(p_end)}, {actual}, {target}, {variance}, {variance_pct}, {achievement}, {sql_val(trend_dir)}, {prior_val}, {sql_val(rag)}, 'user-meth-analyst-001', {sql_val(datetime_str(YEAR, month, end_day))}, {sql_val(datetime_str(YEAR, month, end_day))});"
        )

lines.append("")

# ============================================================================
# 10. KPI TARGETS (quarterly)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- KPI TARGETS (quarterly)")
lines.append("-- ============================================================================")

kpi_tgt_counter = 100
for qi, (q_name, q_start, q_end, _) in enumerate(quarters):
    for kpi_id, kpi_name, base_target, direction in kpi_defs:
        kpi_tgt_counter += 1
        tid = f"kpi-tgt-meth-{kpi_tgt_counter:03d}"
        
        # Targets get slightly more ambitious each quarter
        target = round(base_target * (1 + qi * 0.02), 2)
        stretch = round(target * 1.15, 2)
        floor_val = round(target * 0.80, 2)
        prior_year = round(target * 0.95, 2)
        
        lines.append(
            f"INSERT OR IGNORE INTO kpi_targets (id, company_id, kpi_id, kpi_name, period, period_start, period_end, target_value, stretch_target, floor_value, prior_year_value, budget_value, status, approved_by, created_by, created_at, updated_at) "
            f"VALUES ({sql_val(tid)}, {sql_val(COMPANY_ID)}, {sql_val(kpi_id)}, {sql_val(kpi_name)}, {sql_val(f'2026-{q_name}')}, {sql_val(q_start)}, {sql_val(q_end)}, {target}, {stretch}, {floor_val}, {prior_year}, {target}, 'approved', 'user-meth-admin-001', 'user-meth-manager-001', {sql_val(datetime_str(YEAR, 1, 5))}, {sql_val(datetime_str(YEAR, 1, 5))});"
        )

lines.append("")

# ============================================================================
# 11. TRADE CALENDAR EVENTS (monthly)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- TRADE CALENDAR EVENTS (monthly)")
lines.append("-- ============================================================================")

cal_events = [
    ("New Year Coffee Launch", "promotion", 1), ("Back to School Drive", "promotion", 1),
    ("Valentine's Special", "promotion", 2), ("Q1 Business Review - Shoprite", "meeting", 2),
    ("Easter Campaign Kickoff", "planning", 3), ("Easter In-Store Activation", "promotion", 3),
    ("Easter Peak Campaign", "promotion", 4), ("Freedom Day Special", "promotion", 4),
    ("Mother's Day Hamper", "promotion", 5), ("Winter Campaign Launch", "planning", 5),
    ("Winter Warmer Mega Push", "promotion", 6), ("Q2 Business Review - Pick n Pay", "meeting", 6),
    ("Mandela Day Community Pack", "promotion", 7), ("School Holiday Promo", "promotion", 7),
    ("Women's Day Wellness", "promotion", 8), ("Spring Campaign Planning", "planning", 8),
    ("Heritage Day Rooibos Fest", "promotion", 9), ("Q3 Business Review - Spar", "meeting", 9),
    ("Spring Healthy Eating", "promotion", 10), ("Diwali Celebration Pack", "promotion", 10),
    ("Black Friday Mega Deal", "promotion", 11), ("Summer Snack Campaign", "promotion", 11),
    ("Christmas Hamper Collection", "promotion", 12), ("Year-End Clearance", "promotion", 12),
]

cal_counter = 100
for event_name, event_type, month in cal_events:
    cal_counter += 1
    cid = f"cal-meth-{cal_counter:03d}"
    
    status = "completed" if month <= 3 else ("active" if month <= 6 else "scheduled")
    end_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
    
    cust_idx = (cal_counter) % len(CUSTOMERS)
    cust_id = CUSTOMERS[cust_idx][0]
    cust_name = CUSTOMERS[cust_idx][1]
    
    planned_spend = round(random.uniform(50000, 300000), 2)
    actual_spend = round(planned_spend * random.uniform(0.6, 0.95), 2) if status != "scheduled" else 0
    planned_rev = round(planned_spend * random.uniform(3, 6), 2)
    actual_rev = round(planned_rev * random.uniform(0.7, 1.1), 2) if status != "scheduled" else 0
    planned_vol = int(planned_rev / 45)
    actual_vol = int(actual_rev / 45) if status != "scheduled" else 0
    roi_val = round(actual_rev / actual_spend, 2) if actual_spend > 0 else 0
    lift = round(random.uniform(10, 30), 1) if status != "scheduled" else 0
    
    lines.append(
        f"INSERT OR IGNORE INTO trade_calendar_events (id, company_id, name, description, event_type, status, start_date, end_date, all_day, customer_id, customer_name, planned_spend, actual_spend, planned_volume, actual_volume, planned_revenue, actual_revenue, roi, lift_pct, priority, created_by, created_at, updated_at) "
        f"VALUES ({sql_val(cid)}, {sql_val(COMPANY_ID)}, {sql_val(f'Methodist {event_name}')}, {sql_val(f'{event_name} event')}, {sql_val(event_type)}, {sql_val(status)}, {sql_val(date_str(YEAR, month, 1))}, {sql_val(date_str(YEAR, month, end_day))}, 0, {sql_val(cust_id)}, {sql_val(cust_name)}, {planned_spend}, {actual_spend}, {planned_vol}, {actual_vol}, {planned_rev}, {actual_rev}, {roi_val}, {lift}, 'high', 'user-meth-kam-001', {sql_val(datetime_str(YEAR, max(1,month-1), 15))}, {sql_val(datetime_str(YEAR, month, 1))});"
    )

lines.append("")

# ============================================================================
# 12. DEMAND SIGNALS (weekly for top 5 customers x top 5 products)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- DEMAND SIGNALS (weekly)")
lines.append("-- ============================================================================")

ds_counter = 100
for month in range(1, 13):
    season = SEASONALITY[month]
    for week in range(4):
        day = min(1 + week * 7, 28)
        sig_date = date_str(YEAR, month, day)
        
        for ci in range(5):  # Top 5 customers
            for pi in range(3):  # Top 3 products per customer
                ds_counter += 1
                dsid = f"demand-meth-{ds_counter:04d}"
                
                cust_id = CUSTOMERS[ci][0]
                cust_name = CUSTOMERS[ci][1]
                prod_id = PRODUCTS[(ci + pi) % len(PRODUCTS)][0]
                prod_name = PRODUCTS[(ci + pi) % len(PRODUCTS)][1]
                prod_cat = PRODUCTS[(ci + pi) % len(PRODUCTS)][3]
                unit_price = PRODUCTS[(ci + pi) % len(PRODUCTS)][5]
                
                cust_weight = CUSTOMER_WEIGHTS[cust_id]
                base_units = int(500 * cust_weight * season * random.uniform(0.75, 1.25))
                revenue = round(base_units * unit_price, 2)
                
                baseline_units = int(base_units * 0.85)
                baseline_rev = round(baseline_units * unit_price, 2)
                incr_units = base_units - baseline_units
                incr_rev = round(revenue - baseline_rev, 2)
                lift = round(incr_units / baseline_units * 100, 2) if baseline_units else 0
                
                is_promo = 1 if random.random() < 0.30 else 0
                inv_level = int(base_units * random.uniform(1.5, 4.0))
                dist_pct = round(random.uniform(88, 99.5), 1)
                price_idx = round(random.uniform(0.95, 1.20), 2)
                mkt_share = round(random.uniform(8, 22) * cust_weight * 5, 1)
                trend = random.choice(["up", "stable", "down"])
                confidence = round(random.uniform(0.75, 0.95), 2)
                
                source_name = f"{cust_name} POS Data"
                
                lines.append(
                    f"INSERT OR IGNORE INTO demand_signals (id, company_id, source_id, source_name, signal_type, signal_date, period_start, period_end, granularity, customer_id, customer_name, product_id, product_name, category, brand, channel, region, units_sold, revenue, baseline_units, baseline_revenue, incremental_units, incremental_revenue, lift_pct, promo_flag, inventory_level, distribution_pct, price_index, market_share_pct, trend_direction, confidence, created_at, updated_at) "
                    f"VALUES ({sql_val(dsid)}, {sql_val(COMPANY_ID)}, {sql_val(f'src-pos-{ci+1:03d}')}, {sql_val(source_name)}, 'pos', {sql_val(sig_date)}, {sql_val(sig_date)}, {sql_val(sig_date)}, 'weekly', {sql_val(cust_id)}, {sql_val(cust_name)}, {sql_val(prod_id)}, {sql_val(prod_name)}, {sql_val(prod_cat)}, 'Methodist', {sql_val(CUSTOMERS[ci][3])}, {sql_val(CUSTOMERS[ci][6])}, {base_units}, {revenue}, {baseline_units}, {baseline_rev}, {incr_units}, {incr_rev}, {lift}, {is_promo}, {inv_level}, {dist_pct}, {price_idx}, {mkt_share}, {sql_val(trend)}, {confidence}, {sql_val(sig_date)}, {sql_val(sig_date)});"
                )

lines.append("")

# ============================================================================
# 13. SCENARIOS (6 total for different what-if analyses)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- SCENARIOS (what-if analyses)")
lines.append("-- ============================================================================")

scenario_defs = [
    ("Q1 Deep Discount Coffee Push", "what_if", "completed", "cust-meth-001", "prod-meth-001", 1, 3),
    ("Q2 Premium Range Expansion", "opportunity", "active", "cust-meth-003", "prod-meth-010", 4, 6),
    ("Winter Bundle vs Individual", "comparison", "active", "cust-meth-001", "prod-meth-005", 5, 7),
    ("Spar Growth Incentive Plan", "what_if", "active", "cust-meth-004", "prod-meth-002", 4, 9),
    ("Black Friday Mega Investment", "what_if", "draft", "cust-meth-001", "prod-meth-001", 11, 11),
    ("2027 Annual Strategy Preview", "optimization", "draft", "cust-meth-002", "prod-meth-008", 1, 12),
]

scen_counter = 100
for sc_name, sc_type, sc_status, sc_cust, sc_prod, start_m, end_m in scenario_defs:
    scen_counter += 1
    scid = f"scenario-meth-{scen_counter:03d}"
    
    cust_info = next(c for c in CUSTOMERS if c[0] == sc_cust)
    prod_info = next(p for p in PRODUCTS if p[0] == sc_prod)
    
    baseline_rev = round(random.uniform(300000, 800000), 2)
    baseline_units = int(baseline_rev / prod_info[5])
    proj_rev = round(baseline_rev * random.uniform(1.1, 1.35), 2)
    proj_units = int(proj_rev / prod_info[5])
    proj_spend = round(proj_rev * random.uniform(0.12, 0.22), 2)
    proj_roi = round(proj_rev / proj_spend, 2) if proj_spend else 0
    proj_lift = round((proj_rev - baseline_rev) / baseline_rev * 100, 2) if baseline_rev else 0
    proj_margin = round(random.uniform(18, 32), 2)
    incr_rev = round(proj_rev - baseline_rev, 2)
    incr_units = proj_units - baseline_units
    net_profit = round(incr_rev * proj_margin / 100, 2)
    confidence = round(random.uniform(0.70, 0.92), 2)
    risk = random.choice(["low", "medium", "high"])
    
    lines.append(
        f"INSERT OR IGNORE INTO scenarios (id, company_id, name, description, scenario_type, status, customer_id, customer_name, product_id, product_name, category, brand, channel, region, start_date, end_date, baseline_revenue, baseline_units, projected_revenue, projected_units, projected_spend, projected_roi, projected_lift_pct, projected_margin_pct, projected_incremental_revenue, projected_incremental_units, projected_net_profit, confidence_score, risk_level, recommendation, is_favorite, created_by, created_at, updated_at) "
        f"VALUES ({sql_val(scid)}, {sql_val(COMPANY_ID)}, {sql_val(f'Methodist {sc_name}')}, {sql_val(f'Scenario analysis: {sc_name}')}, {sql_val(sc_type)}, {sql_val(sc_status)}, {sql_val(sc_cust)}, {sql_val(cust_info[1])}, {sql_val(sc_prod)}, {sql_val(prod_info[1])}, {sql_val(prod_info[3])}, 'Methodist', {sql_val(cust_info[3])}, {sql_val(cust_info[6])}, {sql_val(date_str(YEAR, start_m, 1))}, {sql_val(date_str(YEAR, end_m, [31,28,31,30,31,30,31,31,30,31,30,31][end_m-1]))}, {baseline_rev}, {baseline_units}, {proj_rev}, {proj_units}, {proj_spend}, {proj_roi}, {proj_lift}, {proj_margin}, {incr_rev}, {incr_units}, {net_profit}, {confidence}, {sql_val(risk)}, {sql_val(f'Recommended - {sc_name}')}, {1 if scen_counter <= 102 else 0}, 'user-meth-analyst-001', {sql_val(datetime_str(YEAR, start_m, 10))}, {sql_val(datetime_str(YEAR, start_m, 10))});"
    )

lines.append("")

# ============================================================================
# 14. FORECASTS (multiple types)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- FORECASTS (revenue, trade_spend, volume)")
lines.append("-- ============================================================================")

forecast_defs = [
    ("Methodist 2026 Revenue Forecast", "revenue", "annual", "2026-01-01", "2026-12-31", 52000000, "time_series", 0.87),
    ("Methodist Q1 Revenue Forecast", "revenue", "quarterly", "2026-01-01", "2026-03-31", 12000000, "regression", 0.85),
    ("Methodist Q2 Revenue Forecast", "revenue", "quarterly", "2026-04-01", "2026-06-30", 14500000, "regression", 0.83),
    ("Methodist Q3 Revenue Forecast", "revenue", "quarterly", "2026-07-01", "2026-09-30", 13000000, "ml_model", 0.80),
    ("Methodist Q4 Revenue Forecast", "revenue", "quarterly", "2026-10-01", "2026-12-31", 14500000, "ml_model", 0.78),
    ("Methodist 2026 Trade Spend Forecast", "trade_spend", "annual", "2026-01-01", "2026-12-31", 3900000, "regression", 0.82),
    ("Methodist H1 Volume Forecast", "volume", "half_year", "2026-01-01", "2026-06-30", 980000, "ml_model", 0.84),
    ("Methodist H2 Volume Forecast", "volume", "half_year", "2026-07-01", "2026-12-31", 1050000, "ml_model", 0.81),
    ("Methodist Coffee Category Forecast", "revenue", "annual", "2026-01-01", "2026-12-31", 22000000, "time_series", 0.86),
    ("Methodist Breakfast Category Forecast", "revenue", "annual", "2026-01-01", "2026-12-31", 18000000, "regression", 0.83),
]

fc_counter = 100
for fc_name, fc_type, period_type, fc_start, fc_end, total_fc, method, confidence in forecast_defs:
    fc_counter += 1
    fid = f"forecast-meth-{fc_counter:03d}"
    
    # Calculate actual based on how much of the period has passed
    actual = round(total_fc * random.uniform(0.20, 0.55), 2)
    variance = round(actual - total_fc * 0.25, 2)
    var_pct = round(variance / total_fc * 100, 2) if total_fc else 0
    
    lines.append(
        f"INSERT OR IGNORE INTO forecasts (id, company_id, name, forecast_type, status, period_type, start_period, end_period, base_year, forecast_year, total_forecast, total_actual, variance, variance_percent, method, confidence_level, created_by, created_at, updated_at) "
        f"VALUES ({sql_val(fid)}, {sql_val(COMPANY_ID)}, {sql_val(fc_name)}, {sql_val(fc_type)}, 'active', {sql_val(period_type)}, {sql_val(fc_start)}, {sql_val(fc_end)}, 2025, 2026, {total_fc}, {actual}, {variance}, {var_pct}, {sql_val(method)}, {confidence}, 'user-meth-analyst-001', {sql_val(datetime_str(YEAR, 1, 15))}, {sql_val(datetime_str(YEAR, 3, 30))});"
    )

lines.append("")

# ============================================================================
# 15. BASELINES (per customer + per product)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- BASELINES (customer + product)")
lines.append("-- ============================================================================")

bl_counter = 100
for ci in range(5):  # Top 5 customers
    bl_counter += 1
    bid = f"baseline-meth-{bl_counter:03d}"
    cust_id = CUSTOMERS[ci][0]
    cust_name = CUSTOMERS[ci][1]
    cust_weight = CUSTOMER_WEIGHTS[cust_id]
    
    total_vol = int(ANNUAL_REVENUE * cust_weight / 45)  # Avg price ~R45
    total_rev = round(ANNUAL_REVENUE * cust_weight, 2)
    avg_weekly_vol = int(total_vol / 52)
    avg_weekly_rev = round(total_rev / 52, 2)
    
    lines.append(
        f"INSERT OR IGNORE INTO baselines (id, company_id, name, description, status, baseline_type, calculation_method, granularity, customer_id, category, brand, channel, start_date, end_date, base_year, periods_used, seasonality_enabled, trend_enabled, outlier_removal_enabled, outlier_threshold, confidence_level, total_base_volume, total_base_revenue, avg_weekly_volume, avg_weekly_revenue, trend_coefficient, r_squared, mape, created_by, approved_by, created_at, updated_at) "
        f"VALUES ({sql_val(bid)}, {sql_val(COMPANY_ID)}, {sql_val(f'{cust_name} Baseline 2026')}, {sql_val(f'Customer baseline for {cust_name}')}, 'approved', 'customer', 'moving_average', 'weekly', {sql_val(cust_id)}, NULL, 'Methodist', {sql_val(CUSTOMERS[ci][3])}, '2025-01-01', '2025-12-31', 2025, 52, 1, 1, 1, 2.5, {round(random.uniform(0.82, 0.92), 2)}, {total_vol}, {total_rev}, {avg_weekly_vol}, {avg_weekly_rev}, {round(random.uniform(1.01, 1.08), 2)}, {round(random.uniform(0.85, 0.95), 2)}, {round(random.uniform(6, 12), 1)}, 'user-meth-analyst-001', 'user-meth-manager-001', {sql_val(datetime_str(YEAR, 1, 10))}, {sql_val(datetime_str(YEAR, 1, 10))});"
    )

for pi in range(len(PRODUCTS)):
    bl_counter += 1
    bid = f"baseline-meth-{bl_counter:03d}"
    prod_id = PRODUCTS[pi][0]
    prod_name = PRODUCTS[pi][1]
    prod_cat = PRODUCTS[pi][3]
    prod_price = PRODUCTS[pi][5]
    
    total_vol = int(ANNUAL_REVENUE * 0.1 / prod_price)  # ~10% share per product
    total_rev = round(total_vol * prod_price, 2)
    avg_weekly_vol = int(total_vol / 52)
    avg_weekly_rev = round(total_rev / 52, 2)
    
    lines.append(
        f"INSERT OR IGNORE INTO baselines (id, company_id, name, description, status, baseline_type, calculation_method, granularity, product_id, category, brand, start_date, end_date, base_year, periods_used, seasonality_enabled, trend_enabled, outlier_removal_enabled, outlier_threshold, confidence_level, total_base_volume, total_base_revenue, avg_weekly_volume, avg_weekly_revenue, trend_coefficient, r_squared, mape, created_by, approved_by, created_at, updated_at) "
        f"VALUES ({sql_val(bid)}, {sql_val(COMPANY_ID)}, {sql_val(f'{prod_name} Baseline 2026')}, {sql_val(f'Product baseline for {prod_name}')}, 'approved', 'product', 'exponential_smoothing', 'weekly', {sql_val(prod_id)}, {sql_val(prod_cat)}, 'Methodist', '2025-01-01', '2025-12-31', 2025, 52, 1, 1, 1, 2.5, {round(random.uniform(0.82, 0.92), 2)}, {total_vol}, {total_rev}, {avg_weekly_vol}, {avg_weekly_rev}, {round(random.uniform(1.01, 1.08), 2)}, {round(random.uniform(0.85, 0.95), 2)}, {round(random.uniform(6, 12), 1)}, 'user-meth-analyst-001', 'user-meth-manager-001', {sql_val(datetime_str(YEAR, 1, 10))}, {sql_val(datetime_str(YEAR, 1, 10))});"
    )

lines.append("")

# ============================================================================
# 16. KAM WALLETS (monthly for both KAMs)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- KAM WALLETS (monthly)")
lines.append("-- ============================================================================")

wallet_counter = 100
for month in range(1, 13):
    quarter = (month - 1) // 3 + 1
    for user_id in ["user-meth-kam-001"]:
        wallet_counter += 1
        wid = f"wallet-meth-{wallet_counter:03d}"
        
        allocated = round(random.uniform(400000, 700000), 2)
        utilized = round(allocated * min(1.0, month / 12 * random.uniform(0.8, 1.2)), 2) if month <= 6 else round(allocated * random.uniform(0.1, 0.4), 2)
        committed = round((allocated - utilized) * random.uniform(0.2, 0.5), 2)
        available = round(allocated - utilized - committed, 2)
        
        status = "active" if month >= 1 else "closed"
        
        lines.append(
            f"INSERT OR IGNORE INTO kam_wallets (id, company_id, user_id, year, quarter, month, allocated_amount, utilized_amount, committed_amount, available_amount, status, created_at, updated_at) "
            f"VALUES ({sql_val(wid)}, {sql_val(COMPANY_ID)}, {sql_val(user_id)}, {YEAR}, {quarter}, {month}, {allocated}, {utilized}, {committed}, {available}, {sql_val(status)}, {sql_val(datetime_str(YEAR, month, 1))}, {sql_val(datetime_str(YEAR, month, 28))});"
        )

lines.append("")

# ============================================================================
# 17. KAM WALLET TRANSACTIONS - SKIPPED (table does not exist in live DB)
# ============================================================================
lines.append("-- KAM WALLET TRANSACTIONS: Skipped - table does not exist in live schema")
lines.append("")

# ============================================================================
# 18. BUDGET ALLOCATIONS (quarterly)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- BUDGET ALLOCATIONS")
lines.append("-- ============================================================================")

ba_counter = 100
for qi, (q_name, q_start, q_end, _) in enumerate(quarters):
    ba_counter += 1
    baid = f"balloc-meth-{ba_counter:03d}"
    
    source = round(ANNUAL_REVENUE * 0.08 / 4, 2)  # ~8% of revenue per quarter
    allocated = source
    q_months = [int(q_start[5:7]) + i for i in range(3)]
    utilization = min(1.0, sum(1 for m in q_months if m <= 3) / 3 * 0.9) if qi == 0 else (0.6 if qi == 1 else 0.3)
    utilized = round(allocated * utilization, 2)
    remaining = round(allocated - utilized, 2)
    
    lines.append(
        f"INSERT OR IGNORE INTO budget_allocations (id, company_id, name, description, status, allocation_method, budget_id, source_amount, allocated_amount, remaining_amount, utilized_amount, utilization_pct, fiscal_year, period_type, start_date, end_date, dimension, currency, locked, approved_by, created_by, created_at, updated_at) "
        f"VALUES ({sql_val(baid)}, {sql_val(COMPANY_ID)}, {sql_val(f'Methodist {q_name} {YEAR} Allocation')}, {sql_val(f'{q_name} budget allocation')}, 'active', 'proportional', 'budget-meth-001', {source}, {allocated}, {remaining}, {utilized}, {round(utilized/allocated*100, 2)}, {YEAR}, 'quarterly', {sql_val(q_start)}, {sql_val(q_end)}, 'customer', 'ZAR', 0, 'user-meth-admin-001', 'user-meth-manager-001', {sql_val(datetime_str(YEAR, 1, 5))}, {sql_val(datetime_str(YEAR, 1, 5))});"
    )

lines.append("")

# ============================================================================
# 19. CUSTOMER 360 PROFILES (all 10 customers)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- CUSTOMER 360 PROFILES")
lines.append("-- ============================================================================")

c360_counter = 100
for cust_id, cust_name, cust_code, channel, sub_ch, tier, region, city in CUSTOMERS:
    c360_counter += 1
    cid = f"c360-meth-{c360_counter:03d}"
    
    weight = CUSTOMER_WEIGHTS[cust_id]
    total_rev = round(ANNUAL_REVENUE * weight, 2)
    total_spend = round(total_rev * random.uniform(0.06, 0.10), 2)
    total_claims = round(total_spend * random.uniform(0.3, 0.6), 2)
    total_deds = round(random.uniform(5000, 30000), 2)
    net_rev = round(total_rev - total_spend, 2)
    gm_pct = round(random.uniform(28, 36), 2)
    ts_pct = round(total_spend / total_rev * 100, 2) if total_rev else 0
    rev_growth = round(random.uniform(5, 20), 1)
    avg_order = round(total_rev / 52, 2)
    
    ltv = round(random.uniform(70, 95), 1)
    churn = round(random.uniform(0.03, 0.25), 2)
    health = round(random.uniform(65, 92), 1)
    satisfaction = round(random.uniform(60, 90), 1)
    engagement = round(random.uniform(65, 95), 1)
    payment_rel = round(random.uniform(80, 98), 1)
    
    segment = "Strategic Partner" if weight >= 0.15 else ("Key Account" if weight >= 0.08 else "Growth Opportunity")
    
    lines.append(
        f"INSERT OR IGNORE INTO customer_360_profiles (id, company_id, customer_id, customer_name, customer_code, channel, sub_channel, tier, region, status, total_revenue, total_spend, total_claims, total_deductions, net_revenue, gross_margin_pct, trade_spend_pct, revenue_growth_pct, avg_order_value, order_frequency, active_promotions, completed_promotions, ltv_score, churn_risk, segment, health_score, satisfaction_score, engagement_score, payment_reliability, last_calculated_at, created_at, updated_at) "
        f"VALUES ({sql_val(cid)}, {sql_val(COMPANY_ID)}, {sql_val(cust_id)}, {sql_val(cust_name)}, {sql_val(cust_code)}, {sql_val(channel)}, {sql_val(sub_ch)}, {sql_val(tier)}, {sql_val(region)}, 'active', {total_rev}, {total_spend}, {total_claims}, {total_deds}, {net_rev}, {gm_pct}, {ts_pct}, {rev_growth}, {avg_order}, 52, {random.randint(1, 4)}, {random.randint(2, 8)}, {ltv}, {churn}, {sql_val(segment)}, {health}, {satisfaction}, {engagement}, {payment_rel}, {sql_val(datetime_str(YEAR, 3, 30))}, {sql_val(datetime_str(YEAR, 1, 1))}, {sql_val(datetime_str(YEAR, 3, 30))});"
    )

lines.append("")

# ============================================================================
# 20. EXECUTIVE SCORECARDS (quarterly)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- EXECUTIVE SCORECARDS")
lines.append("-- ============================================================================")

esc_counter = 100
for qi, (q_name, q_start, q_end, q_status) in enumerate(quarters):
    esc_counter += 1
    esid = f"scorecard-meth-{esc_counter:03d}"
    
    overall = round(random.uniform(72, 88), 1)
    financial = round(overall * random.uniform(0.95, 1.10), 1)
    operational = round(overall * random.uniform(0.90, 1.05), 1)
    customer = round(overall * random.uniform(0.85, 1.05), 1)
    growth = round(overall * random.uniform(0.88, 1.08), 1)
    
    rag = "green" if overall >= 80 else ("amber" if overall >= 65 else "red")
    green_cnt = random.randint(3, 5)
    amber_cnt = random.randint(0, 2)
    red_cnt = 5 - green_cnt - amber_cnt
    
    sc_status = "published" if qi <= 1 else "draft"
    
    lines.append(
        f"INSERT OR IGNORE INTO executive_scorecards (id, company_id, name, description, scorecard_type, status, period, period_start, period_end, overall_score, overall_rag, financial_score, operational_score, customer_score, growth_score, total_kpis, green_count, amber_count, red_count, highlights, lowlights, actions, published_by, created_by, created_at, updated_at) "
        f"VALUES ({sql_val(esid)}, {sql_val(COMPANY_ID)}, {sql_val(f'Methodist {q_name} {YEAR} Scorecard')}, {sql_val(f'{q_name} executive scorecard')}, 'quarterly', {sql_val(sc_status)}, {sql_val(f'{YEAR}-{q_name}')}, {sql_val(q_start)}, {sql_val(q_end)}, {overall}, {sql_val(rag)}, {financial}, {operational}, {customer}, {growth}, 5, {green_cnt}, {amber_cnt}, {red_cnt}, {sql_val(f'Strong {q_name} performance across key metrics')}, {sql_val(f'Budget deployment velocity needs improvement in {q_name}')}, {sql_val(f'Accelerate promotional pipeline for {q_name}')}, 'user-meth-admin-001', 'user-meth-analyst-001', {sql_val(datetime_str(YEAR, int(q_end[5:7]), 28))}, {sql_val(datetime_str(YEAR, int(q_end[5:7]), 28))});"
    )

lines.append("")

# ============================================================================
# 21. CAMPAIGNS (monthly)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- CAMPAIGNS")
lines.append("-- ============================================================================")

camp_defs = [
    ("New Year Health Drive", "seasonal", 1, 2), ("Back to School", "seasonal", 2, 2),
    ("Easter Mega Campaign", "seasonal", 3, 4), ("Autumn Harvest", "thematic", 4, 5),
    ("Winter Warmer National", "seasonal", 5, 7), ("Mid-Year Stock Push", "tactical", 6, 6),
    ("Heritage Celebration", "seasonal", 9, 9), ("Spring Refresh", "thematic", 10, 10),
    ("Black Friday Blitz", "promotional", 11, 11), ("Festive Season Extravaganza", "seasonal", 12, 12),
]

camp_counter = 100
for camp_name, camp_type, start_m, end_m in camp_defs:
    camp_counter += 1
    cpid = f"camp-meth-{camp_counter:03d}"
    
    status = "completed" if end_m <= 3 else ("active" if start_m <= 6 else "planned")
    budget = round(random.uniform(200000, 800000), 2)
    spent = round(budget * random.uniform(0.5, 0.9), 2) if status != "planned" else 0
    target_rev = round(budget * random.uniform(3, 6), 2)
    actual_rev = round(target_rev * random.uniform(0.6, 1.1), 2) if status != "planned" else 0
    target_vol = int(target_rev / 45)
    actual_vol = int(actual_rev / 45) if status != "planned" else 0
    
    end_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][end_m - 1]
    
    lines.append(
        f"INSERT OR IGNORE INTO campaigns (id, company_id, name, description, campaign_type, status, start_date, end_date, budget_amount, spent_amount, target_revenue, actual_revenue, target_volume, actual_volume, created_by, approved_by, created_at, updated_at) "
        f"VALUES ({sql_val(cpid)}, {sql_val(COMPANY_ID)}, {sql_val(f'Methodist {camp_name}')}, {sql_val(f'{camp_name} campaign')}, {sql_val(camp_type)}, {sql_val(status)}, {sql_val(date_str(YEAR, start_m, 1))}, {sql_val(date_str(YEAR, end_m, end_day))}, {budget}, {spent}, {target_rev}, {actual_rev}, {target_vol}, {actual_vol}, 'user-meth-manager-001', 'user-meth-admin-001', {sql_val(datetime_str(YEAR, max(1,start_m-1), 15))}, {sql_val(datetime_str(YEAR, start_m, 1))});"
    )

lines.append("")

# ============================================================================
# 22. ACTIVITIES (audit trail - throughout the year)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- ACTIVITIES (audit trail)")
lines.append("-- ============================================================================")

act_counter = 100
activity_templates = [
    ("create", "promotion", "Created promotion"),
    ("approve", "promotion", "Approved promotion"),
    ("create", "trade_spend", "Created trade spend"),
    ("approve", "trade_spend", "Approved trade spend"),
    ("create", "claim", "Created claim"),
    ("approve", "claim", "Approved claim"),
    ("settle", "settlement", "Settled claim"),
    ("publish", "pnl_report", "Published P&L report"),
    ("create", "scenario", "Created scenario analysis"),
    ("update", "budget", "Updated budget allocation"),
]

for month in range(1, 13):
    for action, entity_type, desc in activity_templates:
        act_counter += 1
        aid = f"act-meth-{act_counter:03d}"
        
        user_map = {"create": "user-meth-kam-001", "approve": "user-meth-manager-001", "settle": "user-meth-manager-001", "publish": "user-meth-analyst-001", "update": "user-meth-manager-001"}
        user_id = user_map.get(action, "user-meth-kam-001")
        
        day = random.randint(1, 28)
        
        lines.append(
            f"INSERT OR IGNORE INTO activities (id, company_id, user_id, action, entity_type, entity_id, description, created_at) "
            f"VALUES ({sql_val(aid)}, {sql_val(COMPANY_ID)}, {sql_val(user_id)}, {sql_val(action)}, {sql_val(entity_type)}, {sql_val(f'{entity_type}-meth-{100 + month:03d}')}, {sql_val(f'{desc} - Month {month}')}, {sql_val(datetime_str(YEAR, month, day))});"
        )

lines.append("")

# ============================================================================
# 23. NOTIFICATIONS
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- NOTIFICATIONS")
lines.append("-- ============================================================================")

notif_counter = 100
notif_templates = [
    ("New Claim Pending Approval", "approval", "high", "user-meth-manager-001"),
    ("Budget Alert: Utilization Low", "warning", "medium", "user-meth-manager-001"),
    ("Promotion Approved", "info", "low", "user-meth-kam-001"),
    ("Settlement Completed", "info", "low", "user-meth-kam-001"),
    ("Deduction Requires Review", "alert", "medium", "user-meth-kam-001"),
]

for month in range(1, 13):
    for title, ntype, priority, user_id in notif_templates:
        notif_counter += 1
        nid = f"notif-meth-{notif_counter:03d}"
        is_read = 1 if month <= 3 else 0
        day = random.randint(1, 28)
        
        lines.append(
            f"INSERT OR IGNORE INTO notifications (id, company_id, user_id, title, message, type, priority, status, read, created_at) "
            f"VALUES ({sql_val(nid)}, {sql_val(COMPANY_ID)}, {sql_val(user_id)}, {sql_val(f'{title} - Month {month}')}, {sql_val(f'{title} for Methodist')}, {sql_val(ntype)}, {sql_val(priority)}, 'active', {is_read}, {sql_val(datetime_str(YEAR, month, day))});"
        )

lines.append("")

# ============================================================================
# 24. TRADING TERMS (per major customer)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- TRADING TERMS")
lines.append("-- ============================================================================")

tt_counter = 100
term_defs = [
    ("Volume Rebate", "volume_rebate", "percentage", 2.5, "quarterly", "net_sales"),
    ("Growth Incentive", "growth_incentive", "percentage", 3.0, "annual", "yoy_growth"),
    ("Listing Fee", "listing_fee", "fixed", 45000, "one_time", "fixed"),
    ("Promotional Allowance", "promotional_allowance", "percentage", 5.0, "monthly", "promotional_sales"),
]

for ci in range(6):  # Top 6 customers
    for term_name, term_type, rate_type, rate, freq, calc_basis in term_defs:
        tt_counter += 1
        tid = f"term-meth-{tt_counter:03d}"
        cust_id = CUSTOMERS[ci][0]
        cust_name = CUSTOMERS[ci][1]
        
        threshold = round(ANNUAL_REVENUE * CUSTOMER_WEIGHTS[cust_id] * 0.25, 2) if term_type != "listing_fee" else 0
        cap = round(threshold * rate / 100 * 1.5, 2) if rate_type == "percentage" else rate
        
        lines.append(
            f"INSERT OR IGNORE INTO trading_terms (id, company_id, name, description, term_type, status, customer_id, start_date, end_date, rate, rate_type, threshold, cap, payment_frequency, calculation_basis, created_by, approved_by, created_at, updated_at) "
            f"VALUES ({sql_val(tid)}, {sql_val(COMPANY_ID)}, {sql_val(f'{cust_name} {term_name} {YEAR}')}, {sql_val(f'{term_name} for {cust_name}')}, {sql_val(term_type)}, 'active', {sql_val(cust_id)}, '2026-01-01', '2026-12-31', {rate}, {sql_val(rate_type)}, {threshold}, {cap}, {sql_val(freq)}, {sql_val(calc_basis)}, 'user-meth-kam-001', 'user-meth-manager-001', {sql_val(datetime_str(YEAR, 1, 5))}, {sql_val(datetime_str(YEAR, 1, 5))});"
        )

lines.append("")

# ============================================================================
# 25. REBATES
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- REBATES")
lines.append("-- ============================================================================")

reb_counter = 100
for ci in range(6):
    for qi in range(4):
        reb_counter += 1
        rid = f"rebate-meth-{reb_counter:03d}"
        cust_id = CUSTOMERS[ci][0]
        cust_name = CUSTOMERS[ci][1]
        q_name = quarters[qi][0]
        q_start = quarters[qi][1]
        q_end = quarters[qi][2]
        
        status = "settled" if qi == 0 else ("active" if qi <= 1 else "pending")
        rate = round(random.uniform(1.5, 4.0), 2)
        threshold = round(ANNUAL_REVENUE * CUSTOMER_WEIGHTS[cust_id] / 4 * 0.8, 2)
        cap = round(threshold * rate / 100 * 1.2, 2)
        accrued = round(threshold * rate / 100, 2) if qi <= 1 else 0
        settled_amt = accrued if status == "settled" else 0
        
        lines.append(
            f"INSERT OR IGNORE INTO rebates (id, company_id, name, description, rebate_type, status, customer_id, start_date, end_date, rate, rate_type, threshold, cap, accrued_amount, settled_amount, calculation_basis, settlement_frequency, created_by, approved_by, created_at, updated_at) "
            f"VALUES ({sql_val(rid)}, {sql_val(COMPANY_ID)}, {sql_val(f'{cust_name} {q_name} Rebate')}, {sql_val(f'{q_name} volume rebate for {cust_name}')}, 'volume', {sql_val(status)}, {sql_val(cust_id)}, {sql_val(q_start)}, {sql_val(q_end)}, {rate}, 'percentage', {threshold}, {cap}, {accrued}, {settled_amt}, 'net_sales', 'quarterly', 'user-meth-kam-001', 'user-meth-manager-001', {sql_val(datetime_str(YEAR, 1, 5))}, {sql_val(datetime_str(YEAR, 1, 5))});"
        )

lines.append("")

# ============================================================================
# 26. TRADE FUNDS
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- TRADE FUNDS")
lines.append("-- ============================================================================")

tf_counter = 100
fund_defs = [
    ("National Trade Fund", "national", 5000000, None, None),
    ("Shoprite Customer Fund", "customer", 1500000, "cust-meth-001", "Shoprite Holdings"),
    ("Pick n Pay Customer Fund", "customer", 1200000, "cust-meth-002", "Pick n Pay"),
    ("Woolworths Premium Fund", "customer", 800000, "cust-meth-003", "Woolworths"),
    ("Spar Regional Fund", "regional", 900000, "cust-meth-004", "Spar Group"),
    ("Promotional Innovation Fund", "innovation", 600000, None, None),
]

for fund_name, fund_type, original, cust_id, cust_name in fund_defs:
    tf_counter += 1
    tfid = f"tfund-meth-{tf_counter:03d}"
    
    allocated = original
    drawn = round(original * random.uniform(0.20, 0.45), 2)
    committed = round(original * random.uniform(0.10, 0.25), 2)
    remaining = round(original - drawn - committed, 2)
    
    cust_val = sql_val(cust_id) if cust_id else "NULL"
    cust_name_val = sql_val(cust_name) if cust_name else "NULL"
    
    lines.append(
        f"INSERT OR IGNORE INTO trade_funds (id, company_id, fund_name, fund_code, fund_type, budget_id, fiscal_year, currency, original_amount, allocated_amount, drawn_amount, remaining_amount, committed_amount, status, owner_id, owner_name, customer_id, customer_name, effective_date, expiry_date, created_by, created_at, updated_at) "
        f"VALUES ({sql_val(tfid)}, {sql_val(COMPANY_ID)}, {sql_val(f'Methodist {fund_name} {YEAR}')}, {sql_val(f'METH-{fund_type[:3].upper()}-{YEAR}')}, {sql_val(fund_type)}, 'budget-meth-001', {YEAR}, 'ZAR', {original}, {allocated}, {drawn}, {remaining}, {committed}, 'active', 'user-meth-manager-001', 'Emily Brown', {cust_val}, {cust_name_val}, '2026-01-01', '2026-12-31', 'user-meth-admin-001', {sql_val(datetime_str(YEAR, 1, 5))}, {sql_val(datetime_str(YEAR, 3, 30))});"
    )

lines.append("")

# ============================================================================
# 27. APPROVALS (throughout the year)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- APPROVALS")
lines.append("-- ============================================================================")

appr_counter = 100
for month in range(1, 13):
    for entity_type in ["promotion", "claim", "trade_spend"]:
        appr_counter += 1
        apid = f"appr-meth-{appr_counter:03d}"
        
        status = "approved" if month <= 6 else ("pending" if month <= 9 else "draft")
        amount = round(random.uniform(50000, 300000), 2)
        entity_id = f"{entity_type.replace('_', '-')}-meth-{100 + month:03d}"
        
        approved_by = "'user-meth-manager-001'" if status == "approved" else "NULL"
        approved_at = f"'{datetime_str(YEAR, month, 15)}'" if status == "approved" else "NULL"
        
        lines.append(
            f"INSERT OR IGNORE INTO approvals (id, company_id, entity_type, entity_id, entity_name, amount, status, priority, requested_by, requested_at, assigned_to, approved_by, approved_at, created_at, updated_at) "
            f"VALUES ({sql_val(apid)}, {sql_val(COMPANY_ID)}, {sql_val(entity_type)}, {sql_val(entity_id)}, {sql_val(f'{entity_type} - Month {month}')}, {amount}, {sql_val(status)}, 'medium', 'user-meth-kam-001', {sql_val(datetime_str(YEAR, month, 5))}, 'user-meth-manager-001', {approved_by}, {approved_at}, {sql_val(datetime_str(YEAR, month, 5))}, {sql_val(datetime_str(YEAR, month, 5))});"
        )

lines.append("")

# ============================================================================
# 28. DOCUMENTS
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- DOCUMENTS")
lines.append("-- ============================================================================")

doc_counter = 100
doc_templates = [
    ("Monthly P&L Report", "report", "financial", "pdf"),
    ("Trade Spend Summary", "report", "trade", "xlsx"),
    ("Campaign Brief", "brief", "marketing", "docx"),
    ("Customer Review Deck", "presentation", "customer", "pptx"),
]

for month in range(1, 13):
    for doc_name, doc_type, doc_cat, file_type in doc_templates:
        doc_counter += 1
        did = f"doc-meth-{doc_counter:03d}"
        
        file_name_clean = doc_name.replace(" ", "_")
        file_name_full = f"Methodist_{file_name_clean}_{month:02d}_{YEAR}.{file_type}"
        
        lines.append(
            f"INSERT OR IGNORE INTO documents (id, company_id, name, description, document_type, category, status, file_name, file_type, file_size, version, is_latest, access_level, download_count, uploaded_by, created_at, updated_at) "
            f"VALUES ({sql_val(did)}, {sql_val(COMPANY_ID)}, {sql_val(f'Methodist {doc_name} - {month:02d}/{YEAR}')}, {sql_val(f'{doc_name} for month {month}')}, {sql_val(doc_type)}, {sql_val(doc_cat)}, 'published', {sql_val(file_name_full)}, {sql_val(file_type)}, {random.randint(50000, 500000)}, 1, 1, 'company', {random.randint(2, 25)}, 'user-meth-analyst-001', {sql_val(datetime_str(YEAR, month, 28))}, {sql_val(datetime_str(YEAR, month, 28))});"
        )

lines.append("")

# ============================================================================
# 29. INTEGRATIONS
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- INTEGRATIONS")
lines.append("-- ============================================================================")

integ_defs = [
    ("SAP ERP - Sales Orders", "inbound", "sap", "erp", "daily", 1250),
    ("SAP ERP - Customer Master", "inbound", "sap", "erp", "weekly", 45),
    ("SAP ERP - Settlement Export", "outbound", "sap", "erp", "on_demand", 15),
    ("SAP ERP - Product Master", "inbound", "sap", "erp", "weekly", 10),
    ("Power BI - Analytics Feed", "outbound", "power_bi", "analytics", "daily", 5000),
    ("Shoprite EDI - Orders", "inbound", "edi", "retailer", "daily", 800),
    ("Pick n Pay Portal", "inbound", "api", "retailer", "daily", 600),
]

integ_counter = 100
for int_name, int_type, provider, category, freq, records in integ_defs:
    integ_counter += 1
    iid = f"integ-meth-{integ_counter:03d}"
    
    lines.append(
        f"INSERT OR IGNORE INTO integrations (id, company_id, name, description, integration_type, provider, category, status, endpoint_url, auth_type, sync_frequency, last_sync_at, sync_status, record_count, error_count, created_by, created_at, updated_at) "
        f"VALUES ({sql_val(iid)}, {sql_val(COMPANY_ID)}, {sql_val(int_name)}, {sql_val(f'{int_name} integration')}, {sql_val(int_type)}, {sql_val(provider)}, {sql_val(category)}, 'active', {sql_val(f'https://api.methodist.co.za/v1/{provider}/{category}')}, 'api_key', {sql_val(freq)}, {sql_val(datetime_str(YEAR, 3, 29))}, 'success', {records}, 0, 'user-meth-admin-001', {sql_val(datetime_str(YEAR, 1, 5))}, {sql_val(datetime_str(YEAR, 3, 30))});"
    )

lines.append("")

# ============================================================================
# 30. CUSTOMER ASSIGNMENTS
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- CUSTOMER ASSIGNMENTS")
lines.append("-- ============================================================================")

ca_counter = 100
for ci in range(len(CUSTOMERS)):
    ca_counter += 1
    caid = f"ca-meth-{ca_counter:03d}"
    cust_id = CUSTOMERS[ci][0]
    
    lines.append(
        f"INSERT OR IGNORE INTO customer_assignments (id, company_id, customer_id, user_id, role, status, created_at, updated_at) "
        f"VALUES ({sql_val(caid)}, {sql_val(COMPANY_ID)}, {sql_val(cust_id)}, 'user-meth-kam-001', 'kam', 'active', {sql_val(datetime_str(YEAR, 1, 1))}, {sql_val(datetime_str(YEAR, 1, 1))});"
    )

lines.append("")

# ============================================================================
# 31. ALERTS
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- ALERTS")
lines.append("-- ============================================================================")

alert_counter = 100
alert_templates = [
    ("Budget threshold exceeded", "budget_alert", "high"),
    ("Claim settlement overdue", "settlement_alert", "high"),
    ("Promotion performance below target", "performance_alert", "medium"),
    ("Deduction pending resolution", "deduction_alert", "medium"),
    ("KPI target missed", "kpi_alert", "low"),
]

for month in range(1, 10):
    for title, alert_type, severity in alert_templates:
        alert_counter += 1
        alid = f"alert-meth-{alert_counter:03d}"
        status = "resolved" if month <= 3 else ("acknowledged" if month <= 6 else "active")
        
        lines.append(
            f"INSERT OR IGNORE INTO alerts (id, company_id, alert_type, severity, status, title, message, created_at, updated_at) "
            f"VALUES ({sql_val(alid)}, {sql_val(COMPANY_ID)}, {sql_val(alert_type)}, {sql_val(severity)}, {sql_val(status)}, {sql_val(f'{title} - Month {month}')}, {sql_val(f'{title} for Methodist operations')}, {sql_val(datetime_str(YEAR, month, random.randint(5, 25)))}, {sql_val(datetime_str(YEAR, month, 28))});"
        )

lines.append("")

# ============================================================================
# 32. TRANSACTIONS (financial)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- TRANSACTIONS (financial)")
lines.append("-- ============================================================================")

txn_counter = 100
txn_types = ["credit_note", "debit_note", "payment", "accrual", "reversal"]
for month in range(1, 13):
    for ti in range(3):
        txn_counter += 1
        tid = f"txn-meth-{txn_counter:03d}"
        ttype = txn_types[ti % len(txn_types)]
        status = "completed" if month <= 6 else "pending"
        
        cust_idx = (month + ti) % len(CUSTOMERS)
        cust_id = CUSTOMERS[cust_idx][0]
        amount = round(random.uniform(10000, 150000), 2)
        
        lines.append(
            f"INSERT OR IGNORE INTO transactions (id, company_id, transaction_number, transaction_type, status, customer_id, amount, description, created_by, created_at, updated_at) "
            f"VALUES ({sql_val(tid)}, {sql_val(COMPANY_ID)}, {sql_val(f'TXN-{YEAR}-{txn_counter:03d}')}, {sql_val(ttype)}, {sql_val(status)}, {sql_val(cust_id)}, {amount}, {sql_val(f'{ttype} - Month {month}')}, 'user-meth-manager-001', {sql_val(datetime_str(YEAR, month, 15))}, {sql_val(datetime_str(YEAR, month, 15))});"
        )

lines.append("")

# ============================================================================
# 33. REPORT TEMPLATES
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- REPORT TEMPLATES")
lines.append("-- ============================================================================")

rpt_defs = [
    ("Monthly P&L Summary", "financial", "pnl_summary", "pnl_reports"),
    ("Trade Spend by Customer", "trade", "trade_spend_analysis", "trade_spends"),
    ("Promotion ROI Analysis", "analytics", "promotion_roi", "promotions"),
    ("Claims Aging Report", "settlement", "claims_aging", "claims"),
    ("Budget Utilization", "financial", "budget_utilization", "budgets"),
    ("Customer Profitability", "analytics", "customer_profitability", "customer_360_profiles"),
    ("KPI Dashboard", "executive", "kpi_dashboard", "kpi_actuals"),
    ("Demand Forecast Accuracy", "analytics", "forecast_accuracy", "forecasts"),
]

rpt_counter = 100
for rpt_name, rpt_cat, rpt_type, data_source in rpt_defs:
    rpt_counter += 1
    rid = f"rpt-tpl-meth-{rpt_counter:03d}"
    
    lines.append(
        f"INSERT OR IGNORE INTO report_templates (id, company_id, name, description, report_category, report_type, data_source, is_system, is_shared, schedule_enabled, run_count, created_by, version, status, created_at, updated_at) "
        f"VALUES ({sql_val(rid)}, {sql_val(COMPANY_ID)}, {sql_val(rpt_name)}, {sql_val(f'{rpt_name} report template')}, {sql_val(rpt_cat)}, {sql_val(rpt_type)}, {sql_val(data_source)}, 1, 1, 1, {random.randint(3, 20)}, 'user-meth-admin-001', 1, 'active', {sql_val(datetime_str(YEAR, 1, 5))}, {sql_val(datetime_str(YEAR, 3, 30))});"
    )

lines.append("")

# ============================================================================
# 34. SALES HISTORY (monthly aggregates)
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- SALES HISTORY (monthly aggregates)")
lines.append("-- ============================================================================")

sh_counter = 100
for month in range(1, 13):
    season = SEASONALITY[month]
    for ci in range(len(CUSTOMERS)):
        for pi in range(len(PRODUCTS)):
            sh_counter += 1
            shid = f"sh-meth-{sh_counter:05d}"
            
            cust_id = CUSTOMERS[ci][0]
            prod_id = PRODUCTS[pi][0]
            cust_weight = CUSTOMER_WEIGHTS[cust_id]
            unit_price = PRODUCTS[pi][5]
            cost_price = PRODUCTS[pi][6]
            
            base_qty = int(200 * cust_weight * season * random.uniform(0.6, 1.4))
            qty = max(5, base_qty)
            gross = round(qty * unit_price, 2)
            discount = round(gross * random.uniform(0.02, 0.08), 2)
            net = round(gross - discount, 2)
            cost = round(qty * cost_price, 2)
            
            period = date_str(YEAR, month, 1)
            
            end_day = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
            period_end = date_str(YEAR, month, end_day)
            is_promoted = 1 if random.random() < 0.3 else 0
            
            lines.append(
                f"INSERT OR IGNORE INTO sales_history (id, company_id, customer_id, product_id, period_start, period_end, granularity, volume, revenue, units, cost, is_promoted, channel, created_at) "
                f"VALUES ({sql_val(shid)}, {sql_val(COMPANY_ID)}, {sql_val(cust_id)}, {sql_val(prod_id)}, {sql_val(period)}, {sql_val(period_end)}, 'monthly', {qty}, {net}, {qty}, {cost}, {is_promoted}, {sql_val(CUSTOMERS[ci][3])}, {sql_val(datetime_str(YEAR, month, 28))});"
            )

lines.append("")

# ============================================================================
# FOOTER
# ============================================================================
lines.append("-- ============================================================================")
lines.append("-- SEED COMPLETE: Methodist company fully populated with 12 months of data")
lines.append("-- ============================================================================")

# Write to file
output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'migrations', '0071_seed_methodist_full_year.sql')
with open(output_path, "w") as f:
    f.write("\n".join(lines))

# Print stats
total_inserts = sum(1 for l in lines if l.startswith("INSERT"))
print(f"Generated {total_inserts} INSERT statements")
print(f"Written to {output_path}")
print(f"File size: {len('\\n'.join(lines)) / 1024:.1f} KB")
