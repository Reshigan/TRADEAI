"""
Comprehensive Role Simulation for TradeAI System
This script simulates a full week of activities for all user roles
Tests positive and negative scenarios, tracks bugs, and validates UI/UX
"""

import asyncio
import json
import os
from datetime import datetime, timedelta
from playwright.async_api import async_playwright, Page, Browser
from typing import Dict, List, Any
import traceback

# Configuration
BASE_URL = "https://tradeai.gonxt.tech"
SCREENSHOT_DIR = "/workspace/project/simulation_screenshots"
BUG_REPORT_FILE = "/workspace/project/bug_report.json"
UXUI_REPORT_FILE = "/workspace/project/uxui_improvements.json"

# Test users with credentials
TEST_USERS = {
    "super_admin": {"email": "admin@trade-ai.com", "password": "Admin@123"},
    "sales_manager": {"email": "salesmanager@trade-ai.com", "password": "Sales@123"},
    "kam": {"email": "kam@trade-ai.com", "password": "KAM@1234"},
    "finance_manager": {"email": "finance@trade-ai.com", "password": "Finance@123"},
    "inventory_manager": {"email": "inventory@trade-ai.com", "password": "Inventory@123"},
    "analyst": {"email": "analyst@trade-ai.com", "password": "Analyst@123"},
}

# Bug and UX tracking
bugs_found = []
ux_issues = []

def log_bug(severity, category, description, role, screenshot_path=None):
    """Log a bug with details"""
    bug = {
        "id": f"BUG-{len(bugs_found) + 100}",
        "timestamp": datetime.now().isoformat(),
        "severity": severity,  # critical, high, medium, low
        "category": category,  # ui, functionality, data, performance
        "description": description,
        "role": role,
        "screenshot": screenshot_path,
        "status": "open"
    }
    bugs_found.append(bug)
    print(f"🐛 {bug['id']} [{severity}] {description}")
    return bug['id']

def log_ux_issue(priority, category, description, improvement, screenshot_path=None):
    """Log a UX/UI improvement opportunity"""
    issue = {
        "id": f"UX-{len(ux_issues) + 100}",
        "timestamp": datetime.now().isoformat(),
        "priority": priority,  # high, medium, low
        "category": category,  # navigation, layout, workflow, accessibility
        "description": description,
        "improvement": improvement,
        "screenshot": screenshot_path
    }
    ux_issues.append(issue)
    print(f"💡 {issue['id']} [{priority}] {description}")
    return issue['id']

async def take_screenshot(page: Page, name: str):
    """Take a screenshot for debugging"""
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    path = f"{SCREENSHOT_DIR}/{datetime.now().strftime('%Y%m%d_%H%M%S')}_{name}.png"
    await page.screenshot(path=path)
    return path

async def login(page: Page, email: str, password: str) -> bool:
    """Login to the application"""
    try:
        print(f"🔐 Logging in as {email}")
        await page.goto(BASE_URL)
        await page.wait_for_load_state("networkidle")
        
        # Fill login form
        await page.fill('input[type="email"]', email)
        await page.fill('input[type="password"]', password)
        await page.click('button[type="submit"]')
        
        # Wait for dashboard
        await page.wait_for_url(f"{BASE_URL}/dashboard", timeout=10000)
        await page.wait_for_load_state("networkidle")
        
        print(f"✅ Successfully logged in as {email}")
        return True
    except Exception as e:
        print(f"❌ Login failed for {email}: {str(e)}")
        await take_screenshot(page, f"login_failed_{email}")
        return False

async def logout(page: Page):
    """Logout from the application"""
    try:
        # Click user profile dropdown
        await page.click('button[aria-label="Open settings"]')
        await page.wait_for_timeout(500)
        
        # Click logout
        await page.click('text=Logout')
        await page.wait_for_url(BASE_URL, timeout=5000)
        print("👋 Logged out successfully")
    except Exception as e:
        print(f"⚠️ Logout warning: {str(e)}")

async def test_admin_role(page: Page):
    """Simulate admin activities for a week"""
    print("\n" + "="*80)
    print("🧪 TESTING ADMIN ROLE - Week Simulation")
    print("="*80)
    
    role = "super_admin"
    
    if not await login(page, TEST_USERS[role]["email"], TEST_USERS[role]["password"]):
        log_bug("critical", "functionality", "Admin login failed", role)
        return
    
    # DAY 1: Budget Management
    print("\n📅 Day 1: Budget Management")
    await test_admin_budgets(page, role)
    
    # DAY 2: Product Management
    print("\n📅 Day 2: Product Management")
    await test_admin_products(page, role)
    
    # DAY 3: Customer Management
    print("\n📅 Day 3: Customer Management")
    await test_admin_customers(page, role)
    
    # DAY 4: Promotion Management
    print("\n📅 Day 4: Promotion Management")
    await test_admin_promotions(page, role)
    
    # DAY 5: User & Settings Management
    print("\n📅 Day 5: User & Settings Management")
    await test_admin_settings(page, role)
    
    await logout(page)

async def test_admin_budgets(page: Page, role: str):
    """Test budget creation and management"""
    try:
        print("💰 Testing Budget Creation...")
        await page.goto(f"{BASE_URL}/budgets")
        await page.wait_for_load_state("networkidle")
        
        # Check if page loaded
        try:
            await page.wait_for_selector('text=/Marketing Budget|Budgets/i', timeout=5000)
        except:
            log_bug("high", "ui", "Budget page heading not found or page didn't load properly", role)
            await take_screenshot(page, "budget_page_load_issue")
        
        # Test: Create new budget
        print("  → Creating new budget...")
        await page.click('button:has-text("Create Budget")')
        await page.wait_for_timeout(1000)
        
        # Fill budget form
        current_year = datetime.now().year + 1
        await page.select_option('select#year', str(current_year))
        
        # Check if customers dropdown is populated
        customers = await page.query_selector_all('select[name="customer_id"] option')
        if len(customers) <= 1:  # Only "Select Customer" option
            log_bug("high", "data", "No customers available in budget creation dropdown", role)
            log_ux_issue("high", "workflow", "Cannot create budget without customers", 
                        "Show helpful message and link to create customers first")
        
        # Test negative scenario: Submit empty form
        print("  → Testing validation (negative test)...")
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(500)
        
        # Check for validation messages
        validation_present = await page.query_selector('text=/required|cannot be empty/i')
        if not validation_present:
            log_bug("medium", "functionality", "Form validation not working for budget creation", role)
        
        # Cancel and go back
        await page.click('button:has-text("Cancel")')
        await page.wait_for_timeout(500)
        
        print("✅ Budget management tests completed")
        
    except Exception as e:
        log_bug("high", "functionality", f"Budget testing failed: {str(e)}", role)
        await take_screenshot(page, "budget_test_error")
        print(f"❌ Error in budget testing: {str(e)}")

async def test_admin_products(page: Page, role: str):
    """Test product management"""
    try:
        print("📦 Testing Product Management...")
        await page.goto(f"{BASE_URL}/products")
        await page.wait_for_load_state("networkidle")
        
        # Check page load
        await page.wait_for_selector('h1:has-text("Products")', timeout=5000)
        
        # Check if products are displayed
        products = await page.query_selector_all('[role="row"]')
        print(f"  → Found {len(products)} products in the list")
        
        if len(products) > 1:  # More than just header row
            # Click on first product to view details
            await page.click('[role="row"]:nth-child(2)')
            await page.wait_for_timeout(1000)
            
            # Check product detail page
            try:
                await page.wait_for_selector('text=/Product Details|Product Information/i', timeout=3000)
                print("  → Product detail page loaded successfully")
            except:
                log_bug("high", "ui", "Product detail page not loading properly", role)
            
            # Go back to products list
            await page.go_back()
            await page.wait_for_load_state("networkidle")
        
        # Test product creation
        print("  → Testing new product creation...")
        await page.click('button:has-text("Add Product")')
        await page.wait_for_timeout(1000)
        
        # Test validation
        await page.click('button:has-text("Create")')
        await page.wait_for_timeout(500)
        
        # Close dialog
        await page.click('button:has-text("Cancel")')
        
        print("✅ Product management tests completed")
        
    except Exception as e:
        log_bug("high", "functionality", f"Product testing failed: {str(e)}", role)
        await take_screenshot(page, "product_test_error")
        print(f"❌ Error in product testing: {str(e)}")

async def test_admin_customers(page: Page, role: str):
    """Test customer management"""
    try:
        print("👥 Testing Customer Management...")
        await page.goto(f"{BASE_URL}/customers")
        await page.wait_for_load_state("networkidle")
        
        # Check page load
        await page.wait_for_selector('h1:has-text("Customers")', timeout=5000)
        
        # Check if customers are displayed
        customers = await page.query_selector_all('[role="row"]')
        print(f"  → Found {len(customers)} customers")
        
        if len(customers) <= 1:  # Only header row
            log_bug("high", "data", "No customers in the system - data seeding issue", role)
            log_ux_issue("high", "ui", "Empty state not helpful", 
                        "Show onboarding message with 'Import Customers' or 'Add First Customer' CTA")
        
        # Test customer creation
        print("  → Testing new customer creation...")
        await page.click('button:has-text("Add Customer")')
        await page.wait_for_timeout(1000)
        
        # Close dialog
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(500)
        
        print("✅ Customer management tests completed")
        
    except Exception as e:
        log_bug("high", "functionality", f"Customer testing failed: {str(e)}", role)
        await take_screenshot(page, "customer_test_error")
        print(f"❌ Error in customer testing: {str(e)}")

async def test_admin_promotions(page: Page, role: str):
    """Test promotion management"""
    try:
        print("🎯 Testing Promotion Management...")
        await page.goto(f"{BASE_URL}/promotions")
        await page.wait_for_load_state("networkidle")
        
        await page.wait_for_selector('h1:has-text("Promotions")', timeout=5000)
        
        # Check promotions list
        promotions = await page.query_selector_all('[role="row"]')
        print(f"  → Found {len(promotions)} promotions")
        
        # Test promotion creation
        await page.click('button:has-text("Create Promotion")')
        await page.wait_for_timeout(1000)
        
        # Close dialog
        await page.keyboard.press('Escape')
        
        print("✅ Promotion management tests completed")
        
    except Exception as e:
        log_bug("high", "functionality", f"Promotion testing failed: {str(e)}", role)
        await take_screenshot(page, "promotion_test_error")

async def test_admin_settings(page: Page, role: str):
    """Test settings and user management"""
    try:
        print("⚙️ Testing Settings & User Management...")
        await page.goto(f"{BASE_URL}/users")
        await page.wait_for_load_state("networkidle")
        
        # Check users page
        await page.wait_for_selector('text=/Users|User Management/i', timeout=5000)
        
        users = await page.query_selector_all('[role="row"]')
        print(f"  → Found {len(users)} users")
        
        # Test settings page
        await page.goto(f"{BASE_URL}/settings")
        await page.wait_for_load_state("networkidle")
        
        print("✅ Settings tests completed")
        
    except Exception as e:
        log_bug("medium", "functionality", f"Settings testing failed: {str(e)}", role)
        await take_screenshot(page, "settings_test_error")

async def test_sales_manager_role(page: Page):
    """Simulate sales manager activities"""
    print("\n" + "="*80)
    print("🧪 TESTING SALES MANAGER ROLE - Week Simulation")
    print("="*80)
    
    role = "sales_manager"
    
    if not await login(page, TEST_USERS[role]["email"], TEST_USERS[role]["password"]):
        log_bug("critical", "functionality", "Sales Manager login failed", role)
        return
    
    print("\n📅 Day 1: Dashboard & Analytics Review")
    await test_dashboard_navigation(page, role)
    
    print("\n📅 Day 2: Trade Spend Planning")
    await test_trade_spends(page, role)
    
    print("\n📅 Day 3: Promotion Planning")
    await test_promotions_workflow(page, role)
    
    print("\n📅 Day 4: Budget Review")
    await test_budget_review(page, role)
    
    print("\n📅 Day 5: Reports & Analytics")
    await test_reports_and_analytics(page, role)
    
    await logout(page)

async def test_dashboard_navigation(page: Page, role: str):
    """Test dashboard and navigation"""
    try:
        print("📊 Testing Dashboard...")
        await page.goto(f"{BASE_URL}/dashboard")
        await page.wait_for_load_state("networkidle")
        
        # Check key metrics
        await page.wait_for_selector('text=/Total Budget/i', timeout=5000)
        await page.wait_for_selector('text=/Active Promotions/i', timeout=5000)
        
        # Check if data is displayed
        budget_text = await page.text_content('text=/Total Budget/i >> xpath=../../..')
        if "$0" in budget_text or "0" in budget_text:
            log_ux_issue("medium", "data", "Dashboard showing zero budget", 
                        "Show meaningful message when no budgets are allocated")
        
        # Test navigation menu
        menu_items = await page.query_selector_all('nav a')
        print(f"  → Found {len(menu_items)} navigation items")
        
        if len(menu_items) < 5:
            log_ux_issue("medium", "navigation", "Limited navigation options visible", 
                        "Ensure all relevant sections are accessible from main menu")
        
        print("✅ Dashboard tests completed")
        
    except Exception as e:
        log_bug("high", "ui", f"Dashboard testing failed: {str(e)}", role)
        await take_screenshot(page, "dashboard_test_error")

async def test_trade_spends(page: Page, role: str):
    """Test trade spend functionality"""
    try:
        print("💸 Testing Trade Spends...")
        await page.goto(f"{BASE_URL}/trade-spends")
        await page.wait_for_load_state("networkidle")
        
        await page.wait_for_selector('h1:has-text("Trade Spends")', timeout=5000)
        
        # Check if trade spends are displayed
        items = await page.query_selector_all('[role="row"]')
        print(f"  → Found {len(items)} trade spend records")
        
        # Test creation
        await page.click('button:has-text("Create Trade Spend")')
        await page.wait_for_timeout(1000)
        
        # Close dialog
        await page.keyboard.press('Escape')
        
        print("✅ Trade spend tests completed")
        
    except Exception as e:
        log_bug("high", "functionality", f"Trade spend testing failed: {str(e)}", role)
        await take_screenshot(page, "trade_spend_test_error")

async def test_promotions_workflow(page: Page, role: str):
    """Test promotions workflow"""
    try:
        print("🎯 Testing Promotions Workflow...")
        await page.goto(f"{BASE_URL}/promotions")
        await page.wait_for_load_state("networkidle")
        
        await page.wait_for_selector('h1:has-text("Promotions")', timeout=5000)
        
        # Test filters
        filters = await page.query_selector_all('select, input[type="date"]')
        print(f"  → Found {len(filters)} filter controls")
        
        if len(filters) < 2:
            log_ux_issue("medium", "workflow", "Limited filtering options", 
                        "Add more filters for status, date range, customer, product")
        
        print("✅ Promotions workflow tests completed")
        
    except Exception as e:
        log_bug("high", "functionality", f"Promotions workflow testing failed: {str(e)}", role)
        await take_screenshot(page, "promotions_workflow_error")

async def test_budget_review(page: Page, role: str):
    """Test budget review functionality"""
    try:
        print("💰 Testing Budget Review...")
        await page.goto(f"{BASE_URL}/budgets")
        await page.wait_for_load_state("networkidle")
        
        await page.wait_for_selector('h1:has-text("Marketing Budget")', timeout=5000)
        
        budgets = await page.query_selector_all('[role="row"]')
        print(f"  → Found {len(budgets)} budgets")
        
        print("✅ Budget review tests completed")
        
    except Exception as e:
        log_bug("medium", "functionality", f"Budget review testing failed: {str(e)}", role)

async def test_reports_and_analytics(page: Page, role: str):
    """Test reports and analytics"""
    try:
        print("📈 Testing Reports & Analytics...")
        
        # Test Analytics page
        await page.goto(f"{BASE_URL}/analytics")
        await page.wait_for_load_state("networkidle")
        
        await page.wait_for_selector('h1:has-text("Analytics")', timeout=5000)
        
        # Test Reports page
        await page.goto(f"{BASE_URL}/reports")
        await page.wait_for_load_state("networkidle")
        
        await page.wait_for_selector('h1:has-text("Reports")', timeout=5000)
        
        print("✅ Reports & analytics tests completed")
        
    except Exception as e:
        log_bug("medium", "functionality", f"Reports/analytics testing failed: {str(e)}", role)

async def test_kam_role(page: Page):
    """Simulate KAM activities"""
    print("\n" + "="*80)
    print("🧪 TESTING KAM ROLE - Week Simulation")
    print("="*80)
    
    role = "kam"
    
    if not await login(page, TEST_USERS[role]["email"], TEST_USERS[role]["password"]):
        log_bug("critical", "functionality", "KAM login failed", role)
        return
    
    print("\n📅 Testing KAM workflows...")
    await test_dashboard_navigation(page, role)
    await test_customer_management_kam(page, role)
    await test_trade_spends(page, role)
    
    await logout(page)

async def test_customer_management_kam(page: Page, role: str):
    """Test KAM customer management"""
    try:
        print("👥 Testing KAM Customer Management...")
        await page.goto(f"{BASE_URL}/customers")
        await page.wait_for_load_state("networkidle")
        
        # KAMs should only see their assigned customers
        customers = await page.query_selector_all('[role="row"]')
        print(f"  → KAM can see {len(customers)} customers")
        
        # Check if "Add Customer" button is visible for KAM
        new_button = await page.query_selector('button:has-text("Add Customer")')
        if not new_button:
            log_ux_issue("low", "ui", "KAM cannot create customers", 
                        "Consider allowing KAMs to request new customer additions")
        
        print("✅ KAM customer management tests completed")
        
    except Exception as e:
        log_bug("medium", "functionality", f"KAM customer management failed: {str(e)}", role)

async def test_finance_manager_role(page: Page):
    """Simulate finance manager activities"""
    print("\n" + "="*80)
    print("🧪 TESTING FINANCE MANAGER ROLE - Week Simulation")
    print("="*80)
    
    role = "finance_manager"
    
    if not await login(page, TEST_USERS[role]["email"], TEST_USERS[role]["password"]):
        log_bug("critical", "functionality", "Finance Manager login failed", role)
        return
    
    print("\n📅 Testing Finance Manager workflows...")
    await test_budget_approval_workflow(page, role)
    await test_financial_reports(page, role)
    
    await logout(page)

async def test_budget_approval_workflow(page: Page, role: str):
    """Test budget approval workflow"""
    try:
        print("✅ Testing Budget Approval Workflow...")
        await page.goto(f"{BASE_URL}/budgets")
        await page.wait_for_load_state("networkidle")
        
        # Check for pending approvals
        pending = await page.query_selector('text=/pending|approval/i')
        if not pending:
            print("  → No pending approvals found")
        
        print("✅ Budget approval workflow tests completed")
        
    except Exception as e:
        log_bug("medium", "functionality", f"Budget approval workflow failed: {str(e)}", role)

async def test_financial_reports(page: Page, role: str):
    """Test financial reports"""
    try:
        print("📊 Testing Financial Reports...")
        await page.goto(f"{BASE_URL}/reports")
        await page.wait_for_load_state("networkidle")
        
        # Check report filters and options
        print("  → Checking report generation options")
        
        print("✅ Financial reports tests completed")
        
    except Exception as e:
        log_bug("medium", "functionality", f"Financial reports testing failed: {str(e)}", role)

async def test_analyst_role(page: Page):
    """Simulate analyst activities"""
    print("\n" + "="*80)
    print("🧪 TESTING ANALYST ROLE - Week Simulation")
    print("="*80)
    
    role = "analyst"
    
    if not await login(page, TEST_USERS[role]["email"], TEST_USERS[role]["password"]):
        log_bug("critical", "functionality", "Analyst login failed", role)
        return
    
    print("\n📅 Testing Analyst workflows...")
    await test_analytics_dashboards(page, role)
    await test_simulation_tools(page, role)
    
    await logout(page)

async def test_analytics_dashboards(page: Page, role: str):
    """Test analytics dashboards"""
    try:
        print("📈 Testing Analytics Dashboards...")
        await page.goto(f"{BASE_URL}/analytics")
        await page.wait_for_load_state("networkidle")
        
        # Check for charts and visualizations
        charts = await page.query_selector_all('canvas, svg')
        print(f"  → Found {len(charts)} charts/visualizations")
        
        if len(charts) < 2:
            log_ux_issue("high", "ui", "Limited visualizations on analytics page", 
                        "Add more charts for trend analysis, comparisons, and insights")
        
        print("✅ Analytics dashboards tests completed")
        
    except Exception as e:
        log_bug("high", "functionality", f"Analytics dashboards testing failed: {str(e)}", role)

async def test_simulation_tools(page: Page, role: str):
    """Test simulation tools"""
    try:
        print("🎮 Testing Simulation Tools...")
        await page.goto(f"{BASE_URL}/simulations")
        await page.wait_for_load_state("networkidle")
        
        # Check simulation interface
        await page.wait_for_selector('text=/simulation/i', timeout=5000)
        
        print("✅ Simulation tools tests completed")
        
    except Exception as e:
        log_bug("medium", "functionality", f"Simulation tools testing failed: {str(e)}", role)

async def save_reports():
    """Save bug and UX reports to files"""
    # Save bug report
    with open(BUG_REPORT_FILE, 'w') as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "total_bugs": len(bugs_found),
            "critical": len([b for b in bugs_found if b['severity'] == 'critical']),
            "high": len([b for b in bugs_found if b['severity'] == 'high']),
            "medium": len([b for b in bugs_found if b['severity'] == 'medium']),
            "low": len([b for b in bugs_found if b['severity'] == 'low']),
            "bugs": bugs_found
        }, f, indent=2)
    
    # Save UX report
    with open(UXUI_REPORT_FILE, 'w') as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "total_issues": len(ux_issues),
            "high": len([u for u in ux_issues if u['priority'] == 'high']),
            "medium": len([u for u in ux_issues if u['priority'] == 'medium']),
            "low": len([u for u in ux_issues if u['priority'] == 'low']),
            "issues": ux_issues
        }, f, indent=2)
    
    print("\n" + "="*80)
    print("📄 REPORTS SAVED")
    print("="*80)
    print(f"Bugs: {BUG_REPORT_FILE}")
    print(f"UX/UI: {UXUI_REPORT_FILE}")

async def main():
    """Main test execution"""
    print("\n" + "="*80)
    print("🚀 COMPREHENSIVE TRADEAI ROLE SIMULATION")
    print("="*80)
    print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        )
        
        page = await context.new_page()
        
        try:
            # Test all roles
            await test_admin_role(page)
            await test_sales_manager_role(page)
            await test_kam_role(page)
            await test_finance_manager_role(page)
            await test_analyst_role(page)
            
        except Exception as e:
            print(f"\n❌ Fatal error: {str(e)}")
            traceback.print_exc()
        
        finally:
            await browser.close()
    
    # Save reports
    await save_reports()
    
    # Print summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    print(f"Total Bugs Found: {len(bugs_found)}")
    print(f"  Critical: {len([b for b in bugs_found if b['severity'] == 'critical'])}")
    print(f"  High: {len([b for b in bugs_found if b['severity'] == 'high'])}")
    print(f"  Medium: {len([b for b in bugs_found if b['severity'] == 'medium'])}")
    print(f"  Low: {len([b for b in bugs_found if b['severity'] == 'low'])}")
    print(f"\nTotal UX/UI Issues: {len(ux_issues)}")
    print(f"  High Priority: {len([u for u in ux_issues if u['priority'] == 'high'])}")
    print(f"  Medium Priority: {len([u for u in ux_issues if u['priority'] == 'medium'])}")
    print(f"  Low Priority: {len([u for u in ux_issues if u['priority'] == 'low'])}")
    print("="*80)
    print(f"End Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

if __name__ == "__main__":
    asyncio.run(main())
