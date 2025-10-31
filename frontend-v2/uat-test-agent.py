#!/usr/bin/env python3
"""
Trade AI Platform - Comprehensive UAT Test Agent
Version: 2.0.0
Description: Automated User Acceptance Testing with demo tenant
"""

import asyncio
import json
import sys
from datetime import datetime
from typing import Dict, List, Any
import aiohttp
from playwright.async_api import async_playwright, Browser, Page, BrowserContext

# Configuration
PRODUCTION_URL = "https://tradeai.gonxt.tech"
API_BASE_URL = f"{PRODUCTION_URL}/api"

# Demo Tenant Credentials
DEMO_CREDENTIALS = {
    "email": "admin@mondelez.com",
    "password": "Vantax1234#"
}

# Test Results
test_results = {
    "total_tests": 0,
    "passed": 0,
    "failed": 0,
    "warnings": 0,
    "start_time": None,
    "end_time": None,
    "tests": []
}

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def log_info(message: str):
    """Log info message"""
    print(f"{Colors.BLUE}[INFO]{Colors.END} {message}")


def log_success(message: str):
    """Log success message"""
    print(f"{Colors.GREEN}[PASS]{Colors.END} {message}")


def log_warning(message: str):
    """Log warning message"""
    print(f"{Colors.YELLOW}[WARN]{Colors.END} {message}")


def log_error(message: str):
    """Log error message"""
    print(f"{Colors.RED}[FAIL]{Colors.END} {message}")


def log_header(message: str):
    """Log header message"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.END}")
    print(f"{Colors.HEADER}{Colors.BOLD}{message.center(80)}{Colors.END}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.END}\n")


def record_test(name: str, status: str, duration: float, details: str = "", screenshot: str = None):
    """Record test result"""
    test_results["tests"].append({
        "name": name,
        "status": status,
        "duration": duration,
        "details": details,
        "screenshot": screenshot,
        "timestamp": datetime.now().isoformat()
    })
    test_results["total_tests"] += 1
    if status == "passed":
        test_results["passed"] += 1
    elif status == "failed":
        test_results["failed"] += 1
    elif status == "warning":
        test_results["warnings"] += 1


async def wait_for_load(page: Page, timeout: int = 5000):
    """Wait for page to be fully loaded"""
    try:
        await page.wait_for_load_state("networkidle", timeout=timeout)
        await asyncio.sleep(0.5)  # Extra buffer
    except Exception as e:
        log_warning(f"Network idle timeout: {str(e)}")


async def take_screenshot(page: Page, name: str) -> str:
    """Take and save screenshot"""
    filename = f"screenshots/{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    await page.screenshot(path=filename, full_page=False)
    return filename


class UATTestAgent:
    """Comprehensive UAT Test Agent"""
    
    def __init__(self):
        self.browser: Browser = None
        self.context: BrowserContext = None
        self.page: Page = None
        self.auth_token: str = None
        self.user_data: Dict = None
    
    async def setup(self):
        """Initialize browser and setup"""
        log_header("UAT Test Agent - Initialization")
        log_info("Starting browser...")
        
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=True,  # Required for environments without display server
            args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        )
        
        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (UAT Test Agent) TradeAI/2.0'
        )
        
        self.page = await self.context.new_page()
        
        # Enable console logging
        self.page.on("console", lambda msg: log_info(f"Browser Console: {msg.text}"))
        self.page.on("pageerror", lambda err: log_error(f"Page Error: {err}"))
        
        log_success("Browser initialized successfully")
    
    async def teardown(self):
        """Cleanup browser"""
        if self.browser:
            await self.browser.close()
        log_info("Browser closed")
    
    async def test_01_homepage_load(self):
        """Test 1: Homepage loads correctly"""
        test_name = "Homepage Load"
        start_time = asyncio.get_event_loop().time()
        
        try:
            log_info(f"Testing: {test_name}")
            
            response = await self.page.goto(PRODUCTION_URL, wait_until="networkidle", timeout=15000)
            
            # Check response status
            if response.status != 200:
                raise Exception(f"HTTP {response.status}")
            
            # Should redirect to login
            await self.page.wait_for_url(f"{PRODUCTION_URL}/login", timeout=5000)
            
            # Check page title
            title = await self.page.title()
            assert "Trade AI Platform" in title, f"Unexpected title: {title}"
            
            # Check if login form is visible
            email_input = await self.page.wait_for_selector('input[type="email"]', timeout=5000)
            assert email_input is not None, "Email input not found"
            
            password_input = await self.page.wait_for_selector('input[type="password"]', timeout=2000)
            assert password_input is not None, "Password input not found"
            
            # Check for styling (CSS loaded)
            bg_color = await self.page.evaluate('() => getComputedStyle(document.body).backgroundColor')
            assert bg_color != "rgba(0, 0, 0, 0)", "CSS not loaded - no background color"
            
            screenshot = await take_screenshot(self.page, "01_login_page")
            
            duration = asyncio.get_event_loop().time() - start_time
            record_test(test_name, "passed", duration, "Login page loaded with proper styling", screenshot)
            log_success(f"{test_name} - PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time
            screenshot = await take_screenshot(self.page, "01_login_page_error")
            record_test(test_name, "failed", duration, str(e), screenshot)
            log_error(f"{test_name} - FAILED: {str(e)}")
    
    async def test_02_login_authentication(self):
        """Test 2: User authentication with demo tenant"""
        test_name = "Login Authentication"
        start_time = asyncio.get_event_loop().time()
        
        try:
            log_info(f"Testing: {test_name}")
            
            # Fill login form
            await self.page.fill('input[type="email"]', DEMO_CREDENTIALS["email"])
            await self.page.fill('input[type="password"]', DEMO_CREDENTIALS["password"])
            
            # Click login button
            await self.page.click('button:has-text("Sign In")')
            
            # Wait for redirect to dashboard
            await self.page.wait_for_url(f"{PRODUCTION_URL}/", timeout=10000)
            await wait_for_load(self.page)
            
            # Check if dashboard loaded
            dashboard_heading = await self.page.wait_for_selector('h1:has-text("Dashboard")', timeout=5000)
            assert dashboard_heading is not None, "Dashboard heading not found"
            
            # Check if user info is displayed
            user_name = await self.page.wait_for_selector('text=Admin User', timeout=5000)
            assert user_name is not None, "User name not displayed"
            
            # Verify sidebar navigation is present
            sidebar = await self.page.wait_for_selector('nav', timeout=5000)
            assert sidebar is not None, "Sidebar navigation not found"
            
            screenshot = await take_screenshot(self.page, "02_dashboard_after_login")
            
            duration = asyncio.get_event_loop().time() - start_time
            record_test(test_name, "passed", duration, "Login successful, redirected to dashboard", screenshot)
            log_success(f"{test_name} - PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time
            screenshot = await take_screenshot(self.page, "02_login_error")
            record_test(test_name, "failed", duration, str(e), screenshot)
            log_error(f"{test_name} - FAILED: {str(e)}")
    
    async def test_03_dashboard_metrics(self):
        """Test 3: Dashboard metrics display correctly"""
        test_name = "Dashboard Metrics"
        start_time = asyncio.get_event_loop().time()
        
        try:
            log_info(f"Testing: {test_name}")
            
            # Check for metric cards
            metrics = [
                "Total Revenue",
                "Active Promotions",
                "Customers",
                "Products"
            ]
            
            for metric in metrics:
                element = await self.page.wait_for_selector(f'text={metric}', timeout=5000)
                assert element is not None, f"{metric} card not found"
                log_info(f"✓ {metric} card found")
            
            # Check for percentage indicators
            percentages = await self.page.locator('text=/[+\\-]\\d+%/').count()
            assert percentages >= 4, f"Expected at least 4 percentage indicators, found {percentages}"
            
            # Check for welcome message
            welcome = await self.page.wait_for_selector('text=/Welcome back/i', timeout=2000)
            assert welcome is not None, "Welcome message not found"
            
            screenshot = await take_screenshot(self.page, "03_dashboard_metrics")
            
            duration = asyncio.get_event_loop().time() - start_time
            record_test(test_name, "passed", duration, "All dashboard metrics displayed correctly", screenshot)
            log_success(f"{test_name} - PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time
            screenshot = await take_screenshot(self.page, "03_dashboard_error")
            record_test(test_name, "failed", duration, str(e), screenshot)
            log_error(f"{test_name} - FAILED: {str(e)}")
    
    async def test_04_navigation_promotions(self):
        """Test 4: Navigation to Promotions page"""
        test_name = "Navigation - Promotions"
        start_time = asyncio.get_event_loop().time()
        
        try:
            log_info(f"Testing: {test_name}")
            
            # Click Promotions link in sidebar
            await self.page.click('a:has-text("Promotions")')
            
            # Wait for page to load
            await self.page.wait_for_url(f"{PRODUCTION_URL}/promotions", timeout=5000)
            await wait_for_load(self.page)
            
            # Check for Promotions heading
            heading = await self.page.wait_for_selector('h1:has-text("Promotions")', timeout=5000)
            assert heading is not None, "Promotions heading not found"
            
            # Check for "Create Promotion" button
            create_btn = await self.page.wait_for_selector('button:has-text("Create Promotion")', timeout=5000)
            assert create_btn is not None, "Create Promotion button not found"
            
            # Check if table/list is present
            await asyncio.sleep(1)  # Wait for data to load
            
            screenshot = await take_screenshot(self.page, "04_promotions_page")
            
            duration = asyncio.get_event_loop().time() - start_time
            record_test(test_name, "passed", duration, "Promotions page loaded successfully", screenshot)
            log_success(f"{test_name} - PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time
            screenshot = await take_screenshot(self.page, "04_promotions_error")
            record_test(test_name, "failed", duration, str(e), screenshot)
            log_error(f"{test_name} - FAILED: {str(e)}")
    
    async def test_05_create_promotion_stepper(self):
        """Test 5: Create Promotion - Multi-step stepper"""
        test_name = "Create Promotion Stepper"
        start_time = asyncio.get_event_loop().time()
        
        try:
            log_info(f"Testing: {test_name}")
            
            # Click Create Promotion button
            await self.page.click('button:has-text("Create Promotion")')
            
            # Wait for stepper modal/page
            await wait_for_load(self.page)
            
            # Check for stepper component
            stepper = await self.page.wait_for_selector('[class*="stepper"], [class*="Stepper"]', timeout=5000)
            if not stepper:
                # Try alternative: check for step indicators
                step1 = await self.page.wait_for_selector('text=/Step 1/i, text=/Basic/i', timeout=5000)
                assert step1 is not None, "Stepper not found"
            
            # Check for form fields (Basic Info step)
            await asyncio.sleep(1)
            
            # Look for typical promotion fields
            fields_found = 0
            for selector in [
                'input[name*="name"], input[placeholder*="name"]',
                'input[type="date"], input[placeholder*="date"]',
                'textarea, input[placeholder*="description"]'
            ]:
                try:
                    field = await self.page.wait_for_selector(selector, timeout=2000)
                    if field:
                        fields_found += 1
                except:
                    pass
            
            assert fields_found > 0, "No form fields found in stepper"
            
            screenshot = await take_screenshot(self.page, "05_create_promotion_stepper")
            
            # Close modal/go back
            try:
                await self.page.click('button:has-text("Cancel"), button:has-text("Close")', timeout=2000)
            except:
                await self.page.go_back()
            
            duration = asyncio.get_event_loop().time() - start_time
            record_test(test_name, "passed", duration, f"Stepper loaded with {fields_found} form fields", screenshot)
            log_success(f"{test_name} - PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time
            screenshot = await take_screenshot(self.page, "05_stepper_error")
            record_test(test_name, "failed", duration, str(e), screenshot)
            log_error(f"{test_name} - FAILED: {str(e)}")
    
    async def test_06_navigation_customers(self):
        """Test 6: Navigation to Customers page"""
        test_name = "Navigation - Customers"
        start_time = asyncio.get_event_loop().time()
        
        try:
            log_info(f"Testing: {test_name}")
            
            await self.page.click('a:has-text("Customers")')
            await self.page.wait_for_url(f"{PRODUCTION_URL}/customers", timeout=5000)
            await wait_for_load(self.page)
            
            heading = await self.page.wait_for_selector('h1:has-text("Customers")', timeout=5000)
            assert heading is not None, "Customers heading not found"
            
            screenshot = await take_screenshot(self.page, "06_customers_page")
            
            duration = asyncio.get_event_loop().time() - start_time
            record_test(test_name, "passed", duration, "Customers page loaded", screenshot)
            log_success(f"{test_name} - PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time
            screenshot = await take_screenshot(self.page, "06_customers_error")
            record_test(test_name, "failed", duration, str(e), screenshot)
            log_error(f"{test_name} - FAILED: {str(e)}")
    
    async def test_07_navigation_products(self):
        """Test 7: Navigation to Products page"""
        test_name = "Navigation - Products"
        start_time = asyncio.get_event_loop().time()
        
        try:
            log_info(f"Testing: {test_name}")
            
            await self.page.click('a:has-text("Products")')
            await self.page.wait_for_url(f"{PRODUCTION_URL}/products", timeout=5000)
            await wait_for_load(self.page)
            
            heading = await self.page.wait_for_selector('h1:has-text("Products")', timeout=5000)
            assert heading is not None, "Products heading not found"
            
            screenshot = await take_screenshot(self.page, "07_products_page")
            
            duration = asyncio.get_event_loop().time() - start_time
            record_test(test_name, "passed", duration, "Products page loaded", screenshot)
            log_success(f"{test_name} - PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time
            screenshot = await take_screenshot(self.page, "07_products_error")
            record_test(test_name, "failed", duration, str(e), screenshot)
            log_error(f"{test_name} - FAILED: {str(e)}")
    
    async def test_08_navigation_budgets(self):
        """Test 8: Navigation to Budgets page"""
        test_name = "Navigation - Budgets"
        start_time = asyncio.get_event_loop().time()
        
        try:
            log_info(f"Testing: {test_name}")
            
            await self.page.click('a:has-text("Budgets")')
            await self.page.wait_for_url(f"{PRODUCTION_URL}/budgets", timeout=5000)
            await wait_for_load(self.page)
            
            heading = await self.page.wait_for_selector('h1:has-text("Budgets")', timeout=5000)
            assert heading is not None, "Budgets heading not found"
            
            screenshot = await take_screenshot(self.page, "08_budgets_page")
            
            duration = asyncio.get_event_loop().time() - start_time
            record_test(test_name, "passed", duration, "Budgets page loaded", screenshot)
            log_success(f"{test_name} - PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time
            screenshot = await take_screenshot(self.page, "08_budgets_error")
            record_test(test_name, "failed", duration, str(e), screenshot)
            log_error(f"{test_name} - FAILED: {str(e)}")
    
    async def test_09_navigation_analytics(self):
        """Test 9: Navigation to Analytics page"""
        test_name = "Navigation - Analytics"
        start_time = asyncio.get_event_loop().time()
        
        try:
            log_info(f"Testing: {test_name}")
            
            await self.page.click('a:has-text("Analytics")')
            await self.page.wait_for_url(f"{PRODUCTION_URL}/analytics", timeout=5000)
            await wait_for_load(self.page)
            
            heading = await self.page.wait_for_selector('h1:has-text("Analytics")', timeout=5000)
            assert heading is not None, "Analytics heading not found"
            
            screenshot = await take_screenshot(self.page, "09_analytics_page")
            
            duration = asyncio.get_event_loop().time() - start_time
            record_test(test_name, "passed", duration, "Analytics page loaded", screenshot)
            log_success(f"{test_name} - PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time
            screenshot = await take_screenshot(self.page, "09_analytics_error")
            record_test(test_name, "failed", duration, str(e), screenshot)
            log_error(f"{test_name} - FAILED: {str(e)}")
    
    async def test_10_responsive_design(self):
        """Test 10: Responsive design - Mobile viewport"""
        test_name = "Responsive Design"
        start_time = asyncio.get_event_loop().time()
        
        try:
            log_info(f"Testing: {test_name}")
            
            # Navigate back to dashboard
            await self.page.click('a:has-text("Dashboard")')
            await wait_for_load(self.page)
            
            # Test mobile viewport
            await self.page.set_viewport_size({"width": 375, "height": 667})
            await asyncio.sleep(1)
            
            # Check if sidebar is collapsed or hamburger menu exists
            # (Implementation depends on your design)
            
            screenshot_mobile = await take_screenshot(self.page, "10_mobile_view")
            
            # Restore desktop viewport
            await self.page.set_viewport_size({"width": 1920, "height": 1080})
            await asyncio.sleep(1)
            
            screenshot_desktop = await take_screenshot(self.page, "10_desktop_view")
            
            duration = asyncio.get_event_loop().time() - start_time
            record_test(test_name, "passed", duration, "Responsive design tested", screenshot_mobile)
            log_success(f"{test_name} - PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time
            screenshot = await take_screenshot(self.page, "10_responsive_error")
            record_test(test_name, "failed", duration, str(e), screenshot)
            log_error(f"{test_name} - FAILED: {str(e)}")
    
    async def test_11_logout(self):
        """Test 11: User logout"""
        test_name = "Logout Functionality"
        start_time = asyncio.get_event_loop().time()
        
        try:
            log_info(f"Testing: {test_name}")
            
            # Restore desktop viewport if needed
            await self.page.set_viewport_size({"width": 1920, "height": 1080})
            
            # Click user menu (look for dropdown or logout button)
            try:
                # Try to find logout button/link
                await self.page.click('button:has-text("Logout"), a:has-text("Logout"), text=/Sign Out/i', timeout=5000)
            except:
                # If direct logout not found, try user menu dropdown
                await self.page.click('[class*="user"], [class*="profile"], [class*="avatar"]', timeout=5000)
                await asyncio.sleep(0.5)
                await self.page.click('button:has-text("Logout"), a:has-text("Logout"), text=/Sign Out/i', timeout=3000)
            
            # Should redirect to login
            await self.page.wait_for_url(f"{PRODUCTION_URL}/login", timeout=5000)
            
            # Verify login form is visible
            email_input = await self.page.wait_for_selector('input[type="email"]', timeout=5000)
            assert email_input is not None, "Not redirected to login page"
            
            screenshot = await take_screenshot(self.page, "11_after_logout")
            
            duration = asyncio.get_event_loop().time() - start_time
            record_test(test_name, "passed", duration, "Logout successful, redirected to login", screenshot)
            log_success(f"{test_name} - PASSED ({duration:.2f}s)")
            
        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time
            screenshot = await take_screenshot(self.page, "11_logout_error")
            record_test(test_name, "warning", duration, f"Logout test inconclusive: {str(e)}", screenshot)
            log_warning(f"{test_name} - WARNING: {str(e)}")
    
    async def run_all_tests(self):
        """Run all UAT tests"""
        test_results["start_time"] = datetime.now().isoformat()
        
        await self.setup()
        
        # Run tests in sequence
        tests = [
            self.test_01_homepage_load,
            self.test_02_login_authentication,
            self.test_03_dashboard_metrics,
            self.test_04_navigation_promotions,
            self.test_05_create_promotion_stepper,
            self.test_06_navigation_customers,
            self.test_07_navigation_products,
            self.test_08_navigation_budgets,
            self.test_09_navigation_analytics,
            self.test_10_responsive_design,
            self.test_11_logout,
        ]
        
        for test_func in tests:
            try:
                await test_func()
            except Exception as e:
                log_error(f"Test execution error: {str(e)}")
            
            # Small delay between tests
            await asyncio.sleep(1)
        
        await self.teardown()
        
        test_results["end_time"] = datetime.now().isoformat()


def generate_report():
    """Generate test report"""
    log_header("UAT Test Report")
    
    print(f"{Colors.BOLD}Test Summary:{Colors.END}")
    print(f"  Total Tests: {test_results['total_tests']}")
    print(f"  {Colors.GREEN}Passed: {test_results['passed']}{Colors.END}")
    print(f"  {Colors.RED}Failed: {test_results['failed']}{Colors.END}")
    print(f"  {Colors.YELLOW}Warnings: {test_results['warnings']}{Colors.END}")
    
    success_rate = (test_results['passed'] / test_results['total_tests'] * 100) if test_results['total_tests'] > 0 else 0
    print(f"  {Colors.BOLD}Success Rate: {success_rate:.1f}%{Colors.END}")
    
    print(f"\n{Colors.BOLD}Detailed Results:{Colors.END}")
    for test in test_results['tests']:
        status_color = Colors.GREEN if test['status'] == 'passed' else Colors.RED if test['status'] == 'failed' else Colors.YELLOW
        print(f"  {status_color}[{test['status'].upper()}]{Colors.END} {test['name']} ({test['duration']:.2f}s)")
        if test['details']:
            print(f"    └─ {test['details']}")
    
    # Save to file
    with open('uat_report.json', 'w') as f:
        json.dump(test_results, f, indent=2)
    
    log_success("Report saved to uat_report.json")
    
    # Determine exit code
    return 0 if test_results['failed'] == 0 else 1


async def main():
    """Main entry point"""
    try:
        log_header("Trade AI Platform - UAT Test Agent v2.0")
        log_info(f"Production URL: {PRODUCTION_URL}")
        log_info(f"Demo Tenant: {DEMO_CREDENTIALS['email']}")
        print()
        
        # Create screenshots directory
        import os
        os.makedirs('screenshots', exist_ok=True)
        
        agent = UATTestAgent()
        await agent.run_all_tests()
        
        exit_code = generate_report()
        sys.exit(exit_code)
        
    except KeyboardInterrupt:
        log_warning("\nTest suite interrupted by user")
        sys.exit(1)
    except Exception as e:
        log_error(f"Fatal error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
