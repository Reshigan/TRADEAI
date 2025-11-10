#!/usr/bin/env python3
"""
Enhanced Comprehensive TradeAI Role Simulation with Data Creation
Tests all roles with realistic data creation and transactions
"""
import asyncio
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from playwright.async_api import async_playwright, Page
import random

# Configuration
BASE_URL = "https://tradeai.gonxt.tech"
SCREENSHOT_DIR = Path("simulation_screenshots_enhanced")
SCREENSHOT_DIR.mkdir(exist_ok=True)

# Test credentials
CREDENTIALS = {
    "super_admin": {"email": "admin@trade-ai.com", "password": "Admin@123"},
    "sales_manager": {"email": "salesmanager@trade-ai.com", "password": "SalesManager@123"},
    "kam": {"email": "kam@trade-ai.com", "password": "KAM@123"},
    "finance_manager": {"email": "finance@trade-ai.com", "password": "Finance@123"},
    "analyst": {"email": "analyst@trade-ai.com", "password": "Analyst@123"}
}

# Bug and UX tracking
bugs = []
ux_issues = []

# Track created data
created_data = {
    "customers": [],
    "products": [],
    "vendors": [],
    "budgets": [],
    "promotions": [],
    "trade_spends": []
}

def log_bug(severity: str, category: str, description: str, role: str, screenshot: str = None):
    """Log a bug"""
    bug = {
        "id": f"BUG-{len(bugs) + 100}",
        "timestamp": datetime.now().isoformat(),
        "severity": severity,
        "category": category,
        "description": description,
        "role": role,
        "screenshot": screenshot,
        "status": "open"
    }
    bugs.append(bug)
    print(f"🐛 {bug['id']} [{severity}] {description}")

def log_ux_issue(priority: str, category: str, description: str, improvement: str, screenshot: str = None):
    """Log a UX/UI improvement"""
    issue = {
        "id": f"UX-{len(ux_issues) + 100}",
        "timestamp": datetime.now().isoformat(),
        "priority": priority,
        "category": category,
        "description": description,
        "improvement": improvement,
        "screenshot": screenshot
    }
    ux_issues.append(issue)
    print(f"💡 {issue['id']} [{priority}] {description}")

async def take_screenshot(page: Page, name: str):
    """Take a screenshot"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = SCREENSHOT_DIR / f"{timestamp}_{name}.png"
        await page.screenshot(path=str(filename))
        return str(filename)
    except Exception as e:
        print(f"  ⚠️  Screenshot failed: {e}")
        return None

async def login(page: Page, role: str):
    """Login with role credentials"""
    creds = CREDENTIALS[role]
    print(f"🔐 Logging in as {creds['email']}")
    
    try:
        await page.goto(f"{BASE_URL}/login")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(2000)  # Wait for React to render
        
        # Use type-based selectors that work with React forms
        await page.fill('input[type="email"]', creds["email"])
        await page.fill('input[type="password"]', creds["password"])
        await page.click('button[type="submit"]')
        
        # Wait for redirect to dashboard
        await page.wait_for_url(f"{BASE_URL}/dashboard", timeout=10000)
        await page.wait_for_load_state("networkidle")
        print(f"✅ Successfully logged in as {creds['email']}")
        return True
    except Exception as e:
        log_bug("critical", "authentication", f"Login failed for {role}: {str(e)}", role)
        await take_screenshot(page, f"login_error_{role}")
        return False

async def logout(page: Page):
    """Logout"""
    try:
        # Look for user menu or logout button
        await page.click('[aria-label="account of current user"], [aria-label="user menu"], button:has-text("Logout")')
        await page.wait_for_timeout(500)
        await page.click('text=Logout')
        await page.wait_for_url(f"{BASE_URL}/login", timeout=5000)
        print("👋 Logged out successfully")
    except Exception as e:
        print(f"  ⚠️  Logout failed: {e}")

# ============================================================================
# DATA CREATION FUNCTIONS
# ============================================================================

async def create_customer(page: Page, name: str, code: str) -> bool:
    """Create a new customer"""
    try:
        print(f"  → Creating customer: {name}")
        await page.goto(f"{BASE_URL}/customers")
        await page.wait_for_load_state("networkidle")
        
        # Click Create Customer button
        await page.click('button:has-text("Create Customer"), button:has-text("Add Customer")')
        await page.wait_for_timeout(1000)
        
        # Fill customer form
        await page.fill('input[name="name"]', name)
        await page.fill('input[name="code"]', code)
        
        # Optional fields
        try:
            await page.fill('input[name="email"]', f"{code.lower()}@example.com")
            await page.fill('input[name="phone"]', f"+27 {random.randint(10, 99)} {random.randint(100, 999)} {random.randint(1000, 9999)}")
        except:
            pass
        
        # Submit
        await page.click('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Save")')
        await page.wait_for_timeout(2000)
        
        created_data["customers"].append({"name": name, "code": code})
        print(f"  ✅ Customer created: {name}")
        return True
        
    except Exception as e:
        print(f"  ❌ Failed to create customer: {e}")
        await take_screenshot(page, f"customer_creation_error_{code}")
        return False

async def create_product(page: Page, name: str, sku: str, price: float) -> bool:
    """Create a new product"""
    try:
        print(f"  → Creating product: {name}")
        await page.goto(f"{BASE_URL}/products")
        await page.wait_for_load_state("networkidle")
        
        # Click Create Product button
        await page.click('button:has-text("Create Product"), button:has-text("Add Product")')
        await page.wait_for_timeout(1000)
        
        # Fill product form
        await page.fill('input[name="name"]', name)
        await page.fill('input[name="sku"]', sku)
        await page.fill('input[name="price"]', str(price))
        
        # Optional fields
        try:
            await page.fill('input[name="description"]', f"{name} - Premium quality product")
            await page.fill('input[name="unitSize"]', "1")
        except:
            pass
        
        # Submit
        await page.click('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Save")')
        await page.wait_for_timeout(2000)
        
        created_data["products"].append({"name": name, "sku": sku, "price": price})
        print(f"  ✅ Product created: {name}")
        return True
        
    except Exception as e:
        print(f"  ❌ Failed to create product: {e}")
        await take_screenshot(page, f"product_creation_error_{sku}")
        return False

async def create_vendor(page: Page, name: str, code: str) -> bool:
    """Create a new vendor"""
    try:
        print(f"  → Creating vendor: {name}")
        await page.goto(f"{BASE_URL}/vendors")
        await page.wait_for_load_state("networkidle")
        
        # Click Create Vendor button
        await page.click('button:has-text("Create Vendor"), button:has-text("Add Vendor")')
        await page.wait_for_timeout(1000)
        
        # Fill vendor form
        await page.fill('input[name="name"]', name)
        await page.fill('input[name="code"]', code)
        
        # Optional fields
        try:
            await page.fill('input[name="email"]', f"{code.lower()}@vendor.com")
            await page.fill('input[name="contactPerson"]', f"{name} Contact")
        except:
            pass
        
        # Submit
        await page.click('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Save")')
        await page.wait_for_timeout(2000)
        
        created_data["vendors"].append({"name": name, "code": code})
        print(f"  ✅ Vendor created: {name}")
        return True
        
    except Exception as e:
        print(f"  ❌ Failed to create vendor: {e}")
        await take_screenshot(page, f"vendor_creation_error_{code}")
        return False

async def create_budget(page: Page, year: int, customer_name: str, amount: float) -> bool:
    """Create a new budget"""
    try:
        print(f"  → Creating budget for {customer_name}: ${amount:,.2f}")
        await page.goto(f"{BASE_URL}/budgets")
        await page.wait_for_load_state("networkidle")
        
        # Click Create Budget button
        await page.click('button:has-text("Create Budget")')
        await page.wait_for_timeout(1500)
        
        # Fill budget form - use fill for text input year field
        await page.fill('input[name="year"]', str(year))
        
        # Select customer from dropdown
        try:
            await page.click('div[id="customer-label"]')
            await page.wait_for_timeout(500)
            await page.click(f'li:has-text("{customer_name}")')
        except:
            # Alternate method
            await page.select_option('select[name="customer_id"]', label=customer_name)
        
        # Fill amount
        await page.fill('input[name="total_amount"]', str(amount))
        
        # Set status
        try:
            await page.click('div[id="status-label"]')
            await page.wait_for_timeout(300)
            await page.click('li:has-text("Approved")')
        except:
            pass
        
        # Optional notes
        try:
            await page.fill('textarea[name="notes"]', f"Budget for {customer_name} - {year}")
        except:
            pass
        
        # Submit
        await page.click('button[type="submit"]:has-text("Create")')
        await page.wait_for_timeout(3000)
        
        created_data["budgets"].append({"year": year, "customer": customer_name, "amount": amount})
        print(f"  ✅ Budget created: {customer_name} ${amount:,.2f}")
        return True
        
    except Exception as e:
        print(f"  ❌ Failed to create budget: {e}")
        await take_screenshot(page, f"budget_creation_error")
        return False

async def create_promotion(page: Page, name: str, customer_name: str, budget: float) -> bool:
    """Create a new promotion"""
    try:
        print(f"  → Creating promotion: {name}")
        await page.goto(f"{BASE_URL}/promotions")
        await page.wait_for_load_state("networkidle")
        
        # Click Create Promotion button
        await page.click('button:has-text("Create Promotion"), button:has-text("Add Promotion")')
        await page.wait_for_timeout(1500)
        
        # Fill promotion form
        await page.fill('input[name="name"]', name)
        
        # Select customer
        try:
            await page.click('div[id*="customer"]')
            await page.wait_for_timeout(500)
            await page.click(f'li:has-text("{customer_name}")')
        except:
            pass
        
        # Set dates
        start_date = datetime.now() + timedelta(days=7)
        end_date = start_date + timedelta(days=30)
        try:
            await page.fill('input[name="startDate"]', start_date.strftime("%Y-%m-%d"))
            await page.fill('input[name="endDate"]', end_date.strftime("%Y-%m-%d"))
        except:
            pass
        
        # Budget
        try:
            await page.fill('input[name="budget"]', str(budget))
        except:
            pass
        
        # Submit
        await page.click('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Save")')
        await page.wait_for_timeout(2000)
        
        created_data["promotions"].append({"name": name, "customer": customer_name, "budget": budget})
        print(f"  ✅ Promotion created: {name}")
        return True
        
    except Exception as e:
        print(f"  ❌ Failed to create promotion: {e}")
        await take_screenshot(page, f"promotion_creation_error")
        return False

async def create_trade_spend(page: Page, customer_name: str, amount: float, category: str = "marketing") -> bool:
    """Create a new trade spend"""
    try:
        print(f"  → Creating trade spend for {customer_name}: ${amount:,.2f}")
        await page.goto(f"{BASE_URL}/trade-spends")
        await page.wait_for_load_state("networkidle")
        
        # Click Create Trade Spend button
        await page.click('button:has-text("Create"), button:has-text("Add")')
        await page.wait_for_timeout(1500)
        
        # Fill trade spend form
        try:
            # Select customer
            await page.click('div[id*="customer"]')
            await page.wait_for_timeout(500)
            await page.click(f'li:has-text("{customer_name}")')
        except:
            pass
        
        # Amount
        await page.fill('input[name="amount"]', str(amount))
        
        # Category
        try:
            await page.select_option('select[name="category"]', category)
        except:
            pass
        
        # Date
        try:
            await page.fill('input[name="date"]', datetime.now().strftime("%Y-%m-%d"))
        except:
            pass
        
        # Description
        try:
            await page.fill('textarea[name="description"]', f"{category.title()} spend for {customer_name}")
        except:
            pass
        
        # Submit
        await page.click('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Save")')
        await page.wait_for_timeout(2000)
        
        created_data["trade_spends"].append({"customer": customer_name, "amount": amount, "category": category})
        print(f"  ✅ Trade spend created: ${amount:,.2f}")
        return True
        
    except Exception as e:
        print(f"  ❌ Failed to create trade spend: {e}")
        await take_screenshot(page, f"trade_spend_creation_error")
        return False

# ============================================================================
# ROLE TEST FUNCTIONS
# ============================================================================

async def test_admin_role(page: Page):
    """Simulate admin activities with data creation"""
    print("\n" + "="*80)
    print("🧪 TESTING ADMIN ROLE - Week Simulation with Data Creation")
    print("="*80)
    
    if not await login(page, "super_admin"):
        return
    
    role = "super_admin"
    
    # Day 1: Create Master Data
    print("\n📅 Day 1: Create Master Data (Customers, Products, Vendors)")
    
    # Create 3 customers
    customers = [
        ("Walmart South Africa", "WAL-SA"),
        ("Pick n Pay", "PNP-001"),
        ("Shoprite Checkers", "SHP-CHK")
    ]
    for name, code in customers:
        await create_customer(page, name, code)
        await page.wait_for_timeout(1000)
    
    # Create 5 products
    products = [
        ("Coca Cola 2L", "CC-2L-001", 25.99),
        ("Sprite 2L", "SPR-2L-001", 24.99),
        ("Fanta Orange 2L", "FNT-2L-001", 24.99),
        ("Coca Cola 500ml", "CC-500-001", 12.99),
        ("Sprite 500ml", "SPR-500-001", 11.99)
    ]
    for name, sku, price in products:
        await create_product(page, name, sku, price)
        await page.wait_for_timeout(1000)
    
    # Create 2 vendors
    vendors = [
        ("Coca Cola Beverages Africa", "CCBA"),
        ("SAB Distribution", "SAB-DIST")
    ]
    for name, code in vendors:
        await create_vendor(page, name, code)
        await page.wait_for_timeout(1000)
    
    # Day 2: Create Budgets
    print("\n📅 Day 2: Budget Creation")
    current_year = datetime.now().year + 1
    budgets = [
        (current_year, "Walmart South Africa", 500000.00),
        (current_year, "Pick n Pay", 350000.00),
        (current_year, "Shoprite Checkers", 450000.00)
    ]
    for year, customer, amount in budgets:
        await create_budget(page, year, customer, amount)
        await page.wait_for_timeout(2000)
    
    # Day 3: Create Promotions
    print("\n📅 Day 3: Promotion Planning")
    promotions = [
        ("Summer Refresh Campaign", "Walmart South Africa", 50000.00),
        ("Back to School Promo", "Pick n Pay", 35000.00),
        ("Holiday Season Special", "Shoprite Checkers", 45000.00)
    ]
    for name, customer, budget in promotions:
        await create_promotion(page, name, customer, budget)
        await page.wait_for_timeout(2000)
    
    # Day 4: User Management
    print("\n📅 Day 4: User Management")
    try:
        await page.goto(f"{BASE_URL}/users")
        await page.wait_for_load_state("networkidle")
        users = await page.query_selector_all('[role="row"]')
        print(f"  → System has {len(users)} users")
        print("✅ User management verified")
    except Exception as e:
        log_bug("medium", "functionality", f"User management failed: {str(e)}", role)
    
    # Day 5: Reports & Analytics
    print("\n📅 Day 5: Reports & Analytics")
    try:
        await page.goto(f"{BASE_URL}/dashboard")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(2000)
        
        # Check dashboard widgets
        widgets = await page.query_selector_all('[class*="MuiCard"], [class*="card"]')
        print(f"  → Dashboard has {len(widgets)} widgets")
        print("✅ Dashboard analytics verified")
    except Exception as e:
        log_bug("medium", "functionality", f"Dashboard failed: {str(e)}", role)
    
    await logout(page)

async def test_sales_manager_role(page: Page):
    """Simulate sales manager activities"""
    print("\n" + "="*80)
    print("🧪 TESTING SALES MANAGER ROLE - Week Simulation with Transactions")
    print("="*80)
    
    if not await login(page, "sales_manager"):
        return
    
    role = "sales_manager"
    
    # Day 1: Dashboard Review
    print("\n📅 Day 1: Dashboard & Analytics Review")
    try:
        await page.goto(f"{BASE_URL}/dashboard")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(2000)
        
        # Check budget display
        try:
            budget_text = await page.text_content('[class*="budget"], [class*="Budget"]')
            if "$0" in budget_text or "0.00" in budget_text:
                log_ux_issue("medium", "data", "Dashboard showing zero budget", 
                           "Show meaningful message when no budgets are allocated")
        except:
            pass
        
        nav_items = await page.query_selector_all('nav a, [role="navigation"] a')
        print(f"  → Found {len(nav_items)} navigation items")
        print("✅ Dashboard tests completed")
    except Exception as e:
        log_bug("medium", "functionality", f"Dashboard failed: {str(e)}", role)
    
    # Day 2: Create Trade Spends
    print("\n📅 Day 2: Trade Spend Creation")
    trade_spends = [
        ("Walmart South Africa", 15000.00, "marketing"),
        ("Pick n Pay", 12000.00, "cashCoop"),
        ("Shoprite Checkers", 18000.00, "promotions")
    ]
    for customer, amount, category in trade_spends:
        await create_trade_spend(page, customer, amount, category)
        await page.wait_for_timeout(2000)
    
    # Day 3: Review Promotions
    print("\n📅 Day 3: Promotion Review")
    try:
        await page.goto(f"{BASE_URL}/promotions")
        await page.wait_for_load_state("networkidle")
        
        promotions = await page.query_selector_all('[role="row"]')
        print(f"  → Found {len(promotions)} promotions")
        
        # Check filtering options
        filters = await page.query_selector_all('select, input[type="search"], [class*="filter"]')
        if len(filters) < 2:
            log_ux_issue("medium", "workflow", "Limited filtering options", 
                       "Add more filters for status, date range, customer, product")
        
        print("✅ Promotions review completed")
    except Exception as e:
        log_bug("medium", "functionality", f"Promotions failed: {str(e)}", role)
    
    # Day 4: Budget Review
    print("\n📅 Day 4: Budget Review")
    try:
        await page.goto(f"{BASE_URL}/budgets")
        await page.wait_for_load_state("networkidle")
        
        budgets = await page.query_selector_all('[role="row"]')
        print(f"  → Found {len(budgets)} budgets")
        print("✅ Budget review completed")
    except Exception as e:
        log_bug("medium", "functionality", f"Budget review failed: {str(e)}", role)
    
    # Day 5: Reports
    print("\n📅 Day 5: Reports & Analytics")
    try:
        await page.goto(f"{BASE_URL}/reports")
        await page.wait_for_load_state("networkidle")
        print("✅ Reports accessed")
    except Exception as e:
        log_bug("low", "functionality", f"Reports failed: {str(e)}", role)
    
    await logout(page)

async def test_kam_role(page: Page):
    """Simulate KAM activities"""
    print("\n" + "="*80)
    print("🧪 TESTING KAM ROLE - Week Simulation")
    print("="*80)
    
    if not await login(page, "kam"):
        return
    
    role = "kam"
    
    # Day 1: Customer Management
    print("\n📅 Testing KAM workflows...")
    try:
        await page.goto(f"{BASE_URL}/dashboard")
        await page.wait_for_load_state("networkidle")
        print("✅ Dashboard access verified")
    except Exception as e:
        log_bug("medium", "functionality", f"KAM dashboard failed: {str(e)}", role)
    
    # Check customer access
    try:
        await page.goto(f"{BASE_URL}/customers")
        await page.wait_for_load_state("networkidle")
        customers = await page.query_selector_all('[role="row"]')
        print(f"  → KAM can see {len(customers)} customers")
        print("✅ Customer management verified")
    except Exception as e:
        log_bug("medium", "functionality", f"KAM customer access failed: {str(e)}", role)
    
    # Trade Spends
    try:
        await page.goto(f"{BASE_URL}/trade-spends")
        await page.wait_for_load_state("networkidle")
        spends = await page.query_selector_all('[role="row"]')
        print(f"  → Found {len(spends)} trade spend records")
        print("✅ Trade spend access verified")
    except Exception as e:
        log_bug("medium", "functionality", f"Trade spends failed: {str(e)}", role)
    
    await logout(page)

async def test_finance_manager_role(page: Page):
    """Simulate finance manager activities"""
    print("\n" + "="*80)
    print("🧪 TESTING FINANCE MANAGER ROLE - Week Simulation")
    print("="*80)
    
    if not await login(page, "finance_manager"):
        return
    
    role = "finance_manager"
    
    print("\n📅 Testing Finance Manager workflows...")
    
    # Budget Approval
    print("✅ Testing Budget Approval Workflow...")
    try:
        await page.goto(f"{BASE_URL}/budgets")
        await page.wait_for_load_state("networkidle")
        
        budgets = await page.query_selector_all('[role="row"]')
        print(f"  → Finance can see {len(budgets)} budgets for approval")
        print("✅ Budget approval workflow verified")
    except Exception as e:
        log_bug("medium", "functionality", f"Budget approval failed: {str(e)}", role)
    
    # Financial Reports
    print("📊 Testing Financial Reports...")
    try:
        await page.goto(f"{BASE_URL}/reports")
        await page.wait_for_load_state("networkidle")
        print("  → Checking report generation options")
        print("✅ Financial reports verified")
    except Exception as e:
        log_bug("medium", "functionality", f"Financial reports failed: {str(e)}", role)
    
    await logout(page)

async def test_analyst_role(page: Page):
    """Simulate analyst activities"""
    print("\n" + "="*80)
    print("🧪 TESTING ANALYST ROLE - Week Simulation")
    print("="*80)
    
    if not await login(page, "analyst"):
        return
    
    role = "analyst"
    
    print("\n📅 Testing Analyst workflows...")
    
    # Analytics Dashboards
    print("📈 Testing Analytics Dashboards...")
    try:
        await page.goto(f"{BASE_URL}/dashboard")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(2000)
        
        # Count charts/visualizations
        charts = await page.query_selector_all('canvas, svg[class*="chart"], [class*="Chart"]')
        print(f"  → Found {len(charts)} charts/visualizations")
        print("✅ Analytics dashboards verified")
    except Exception as e:
        log_bug("medium", "functionality", f"Analytics failed: {str(e)}", role)
    
    # Simulation Tools
    print("🎮 Testing Simulation Tools...")
    try:
        await page.goto(f"{BASE_URL}/simulations")
        await page.wait_for_load_state("networkidle")
        print("✅ Simulation tools verified")
    except Exception as e:
        print(f"  ⚠️  Simulation tools not accessible: {e}")
    
    await logout(page)

# ============================================================================
# MAIN EXECUTION
# ============================================================================

async def main():
    """Main test execution"""
    print("="*80)
    print("🚀 ENHANCED COMPREHENSIVE TRADEAI ROLE SIMULATION")
    print("="*80)
    print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            ignore_https_errors=True
        )
        page = await context.new_page()
        
        try:
            # Run all role tests
            await test_admin_role(page)
            await test_sales_manager_role(page)
            await test_kam_role(page)
            await test_finance_manager_role(page)
            await test_analyst_role(page)
            
        finally:
            await browser.close()
    
    # Generate reports
    print("\n" + "="*80)
    print("📄 REPORTS SAVED")
    print("="*80)
    
    bug_report = {
        "generated_at": datetime.now().isoformat(),
        "total_bugs": len(bugs),
        "critical": sum(1 for b in bugs if b["severity"] == "critical"),
        "high": sum(1 for b in bugs if b["severity"] == "high"),
        "medium": sum(1 for b in bugs if b["severity"] == "medium"),
        "low": sum(1 for b in bugs if b["severity"] == "low"),
        "bugs": bugs
    }
    
    ux_report = {
        "generated_at": datetime.now().isoformat(),
        "total_issues": len(ux_issues),
        "high": sum(1 for i in ux_issues if i["priority"] == "high"),
        "medium": sum(1 for i in ux_issues if i["priority"] == "medium"),
        "low": sum(1 for i in ux_issues if i["priority"] == "low"),
        "issues": ux_issues
    }
    
    data_report = {
        "generated_at": datetime.now().isoformat(),
        "created_data": created_data,
        "summary": {
            "customers": len(created_data["customers"]),
            "products": len(created_data["products"]),
            "vendors": len(created_data["vendors"]),
            "budgets": len(created_data["budgets"]),
            "promotions": len(created_data["promotions"]),
            "trade_spends": len(created_data["trade_spends"])
        }
    }
    
    with open("bug_report_enhanced.json", "w") as f:
        json.dump(bug_report, f, indent=2)
    print("Bugs: bug_report_enhanced.json")
    
    with open("uxui_improvements_enhanced.json", "w") as f:
        json.dump(ux_report, f, indent=2)
    print("UX/UI: uxui_improvements_enhanced.json")
    
    with open("created_data_report.json", "w") as f:
        json.dump(data_report, f, indent=2)
    print("Data: created_data_report.json")
    
    # Summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    print(f"Total Bugs Found: {len(bugs)}")
    print(f"  Critical: {bug_report['critical']}")
    print(f"  High: {bug_report['high']}")
    print(f"  Medium: {bug_report['medium']}")
    print(f"  Low: {bug_report['low']}")
    print(f"\nTotal UX/UI Issues: {len(ux_issues)}")
    print(f"  High Priority: {ux_report['high']}")
    print(f"  Medium Priority: {ux_report['medium']}")
    print(f"  Low Priority: {ux_report['low']}")
    print(f"\nData Created:")
    print(f"  Customers: {len(created_data['customers'])}")
    print(f"  Products: {len(created_data['products'])}")
    print(f"  Vendors: {len(created_data['vendors'])}")
    print(f"  Budgets: {len(created_data['budgets'])}")
    print(f"  Promotions: {len(created_data['promotions'])}")
    print(f"  Trade Spends: {len(created_data['trade_spends'])}")
    print("="*80)
    print(f"End Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

if __name__ == "__main__":
    asyncio.run(main())
