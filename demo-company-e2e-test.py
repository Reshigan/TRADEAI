#!/usr/bin/env python3
"""
TRADEAI v2.0 - Comprehensive Demo Company End-to-End Testing Suite
================================================================

This script creates a complete Mondelez South Africa demo company with 6 months
of realistic data and runs comprehensive end-to-end tests across all modules.

Test Coverage:
- Company setup and tenant creation
- User management and authentication
- Product catalog management
- Customer relationship management
- Budget planning and allocation
- Trade spend tracking and approval
- Trading terms and contracts
- Activity grid management
- Promotion lifecycle management
- Workflow automation
- Reporting and analytics
- Data integrity validation
"""

import asyncio
import aiohttp
import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any
import uuid

class MondelezDemoCompanyTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
        self.tenant_slug = "mondelez-sa"
        self.auth_token = None
        self.test_results = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "test_details": []
        }
        
        # Demo company data
        self.company_data = {
            "name": "Mondelez South Africa",
            "slug": "mondelez-sa",
            "description": "Leading snacking company in South Africa",
            "industry": "Food & Beverages",
            "country": "South Africa",
            "currency": "ZAR",
            "fiscal_year_start": "01-01",
            "timezone": "Africa/Johannesburg"
        }
        
        # Sample products (Mondelez brands)
        self.products = [
            {"name": "Oreo Original", "sku": "ORE-001", "category": "Biscuits", "price": 25.99},
            {"name": "Cadbury Dairy Milk", "sku": "CDM-001", "category": "Chocolate", "price": 18.50},
            {"name": "Halls Menthol", "sku": "HAL-001", "category": "Confectionery", "price": 12.99},
            {"name": "Trident Gum", "sku": "TRI-001", "category": "Gum", "price": 8.99},
            {"name": "Toblerone", "sku": "TOB-001", "category": "Chocolate", "price": 45.00},
            {"name": "Belvita Breakfast", "sku": "BEL-001", "category": "Biscuits", "price": 32.50},
            {"name": "Chips Ahoy!", "sku": "CHA-001", "category": "Cookies", "price": 28.99},
            {"name": "Sour Patch Kids", "sku": "SPK-001", "category": "Confectionery", "price": 15.99},
            {"name": "Swedish Fish", "sku": "SWF-001", "category": "Confectionery", "price": 14.50},
            {"name": "Ritz Crackers", "sku": "RTZ-001", "category": "Crackers", "price": 22.99}
        ]
        
        # Sample customers (South African retailers)
        self.customers = [
            {"name": "Pick n Pay", "email": "procurement@pnp.co.za", "type": "Retail Chain"},
            {"name": "Shoprite Holdings", "email": "buying@shoprite.co.za", "type": "Retail Chain"},
            {"name": "Woolworths", "email": "suppliers@woolworths.co.za", "type": "Premium Retail"},
            {"name": "SPAR Group", "email": "purchasing@spar.co.za", "type": "Retail Chain"},
            {"name": "Checkers", "email": "procurement@checkers.co.za", "type": "Retail Chain"},
            {"name": "Food Lover's Market", "email": "buying@flm.co.za", "type": "Specialty Retail"},
            {"name": "Makro", "email": "suppliers@makro.co.za", "type": "Wholesale"},
            {"name": "Game Stores", "email": "procurement@game.co.za", "type": "General Retail"},
            {"name": "OK Foods", "email": "buying@okfoods.co.za", "type": "Convenience"},
            {"name": "Boxer Superstores", "email": "suppliers@boxer.co.za", "type": "Discount Retail"}
        ]

    async def setup_session(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()

    async def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> Dict:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        default_headers = {
            "Content-Type": "application/json",
            "X-Tenant-Slug": self.tenant_slug
        }
        
        if self.auth_token:
            default_headers["Authorization"] = f"Bearer {self.auth_token}"
            
        if headers:
            default_headers.update(headers)
        
        try:
            async with self.session.request(
                method, url, 
                json=data if data else None, 
                headers=default_headers
            ) as response:
                response_data = await response.json()
                return {
                    "status": response.status,
                    "data": response_data,
                    "success": 200 <= response.status < 300
                }
        except Exception as e:
            return {
                "status": 500,
                "data": {"error": str(e)},
                "success": False
            }

    def log_test_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        self.test_results["total_tests"] += 1
        if success:
            self.test_results["passed_tests"] += 1
            status = "✅ PASS"
        else:
            self.test_results["failed_tests"] += 1
            status = "❌ FAIL"
            
        self.test_results["test_details"].append({
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
        print(f"{status}: {test_name}")
        if details:
            print(f"    Details: {details}")

    async def test_health_check(self):
        """Test API health check"""
        print("\n🏥 TESTING API HEALTH CHECK...")
        
        response = await self.make_request("GET", "/api/v1/health/")
        success = response["success"] and response["data"].get("status") == "healthy"
        
        self.log_test_result(
            "API Health Check",
            success,
            f"Status: {response['data'].get('status', 'unknown')}"
        )
        
        return success

    async def test_detailed_health_check(self):
        """Test detailed health check"""
        print("\n🔍 TESTING DETAILED HEALTH CHECK...")
        
        response = await self.make_request("GET", "/api/v1/health/detailed")
        success = response["success"]
        
        self.log_test_result(
            "Detailed Health Check",
            success,
            f"Database: {response['data'].get('database', 'unknown')}"
        )
        
        return success

    async def create_demo_tenant(self):
        """Create demo tenant for Mondelez SA"""
        print("\n🏢 CREATING DEMO TENANT...")
        
        tenant_data = {
            "name": self.company_data["name"],
            "slug": self.company_data["slug"],
            "description": self.company_data["description"],
            "settings": {
                "industry": self.company_data["industry"],
                "country": self.company_data["country"],
                "currency": self.company_data["currency"],
                "fiscal_year_start": self.company_data["fiscal_year_start"],
                "timezone": self.company_data["timezone"]
            }
        }
        
        response = await self.make_request("POST", "/api/v1/tenants/", tenant_data)
        success = response["success"]
        
        self.log_test_result(
            "Create Demo Tenant",
            success,
            f"Tenant: {self.company_data['name']}"
        )
        
        return success

    async def create_demo_user(self):
        """Create demo user and authenticate"""
        print("\n👤 CREATING DEMO USER...")
        
        user_data = {
            "email": "demo@mondelez.co.za",
            "password": "MondelezDemo2024!",
            "first_name": "Demo",
            "last_name": "User",
            "role": "admin"
        }
        
        # Create user
        response = await self.make_request("POST", "/api/v1/users/", user_data)
        user_created = response["success"]
        
        self.log_test_result(
            "Create Demo User",
            user_created,
            f"User: {user_data['email']}"
        )
        
        if not user_created:
            return False
        
        # Authenticate user
        auth_data = {
            "username": user_data["email"],
            "password": user_data["password"]
        }
        
        auth_response = await self.make_request("POST", "/api/v1/auth/login", auth_data)
        auth_success = auth_response["success"]
        
        if auth_success:
            self.auth_token = auth_response["data"].get("access_token")
        
        self.log_test_result(
            "User Authentication",
            auth_success,
            f"Token received: {'Yes' if self.auth_token else 'No'}"
        )
        
        return auth_success

    async def create_demo_products(self):
        """Create demo products"""
        print("\n📦 CREATING DEMO PRODUCTS...")
        
        created_products = []
        
        for product in self.products:
            product_data = {
                "name": product["name"],
                "sku": product["sku"],
                "description": f"Premium {product['category'].lower()} product from Mondelez",
                "category": product["category"],
                "price": product["price"],
                "currency": "ZAR",
                "status": "active",
                "metadata": {
                    "brand": "Mondelez",
                    "origin": "South Africa",
                    "shelf_life": "12 months"
                }
            }
            
            response = await self.make_request("POST", "/api/v1/products/", product_data)
            success = response["success"]
            
            if success:
                created_products.append(response["data"])
            
            self.log_test_result(
                f"Create Product: {product['name']}",
                success,
                f"SKU: {product['sku']}, Price: R{product['price']}"
            )
        
        return created_products

    async def create_demo_customers(self):
        """Create demo customers"""
        print("\n🏪 CREATING DEMO CUSTOMERS...")
        
        created_customers = []
        
        for customer in self.customers:
            customer_data = {
                "name": customer["name"],
                "email": customer["email"],
                "phone": f"+27{random.randint(100000000, 999999999)}",
                "type": customer["type"],
                "status": "active",
                "address": {
                    "street": f"{random.randint(1, 999)} Main Street",
                    "city": random.choice(["Cape Town", "Johannesburg", "Durban", "Pretoria"]),
                    "province": random.choice(["Western Cape", "Gauteng", "KwaZulu-Natal"]),
                    "postal_code": f"{random.randint(1000, 9999)}",
                    "country": "South Africa"
                },
                "metadata": {
                    "industry": "Retail",
                    "size": random.choice(["Small", "Medium", "Large", "Enterprise"]),
                    "established": random.randint(1980, 2020)
                }
            }
            
            response = await self.make_request("POST", "/api/v1/customers/", customer_data)
            success = response["success"]
            
            if success:
                created_customers.append(response["data"])
            
            self.log_test_result(
                f"Create Customer: {customer['name']}",
                success,
                f"Type: {customer['type']}, Email: {customer['email']}"
            )
        
        return created_customers

    async def create_demo_budgets(self):
        """Create demo budgets"""
        print("\n💰 CREATING DEMO BUDGETS...")
        
        current_year = datetime.now().year
        budgets = [
            {
                "name": f"Q1 {current_year} Marketing Budget",
                "description": "First quarter marketing and promotional budget",
                "total_amount": 2500000.00,
                "period_start": f"{current_year}-01-01",
                "period_end": f"{current_year}-03-31"
            },
            {
                "name": f"Q2 {current_year} Trade Spend",
                "description": "Second quarter trade spending allocation",
                "total_amount": 3200000.00,
                "period_start": f"{current_year}-04-01",
                "period_end": f"{current_year}-06-30"
            },
            {
                "name": f"H2 {current_year} Promotional Budget",
                "description": "Second half promotional activities budget",
                "total_amount": 4800000.00,
                "period_start": f"{current_year}-07-01",
                "period_end": f"{current_year}-12-31"
            }
        ]
        
        created_budgets = []
        
        for budget in budgets:
            budget_data = {
                "name": budget["name"],
                "description": budget["description"],
                "total_amount": budget["total_amount"],
                "currency": "ZAR",
                "period_start": budget["period_start"],
                "period_end": budget["period_end"],
                "status": "active",
                "metadata": {
                    "department": "Marketing",
                    "approval_required": True,
                    "auto_rollover": False
                }
            }
            
            response = await self.make_request("POST", "/api/v1/budgets/", budget_data)
            success = response["success"]
            
            if success:
                created_budgets.append(response["data"])
            
            self.log_test_result(
                f"Create Budget: {budget['name']}",
                success,
                f"Amount: R{budget['total_amount']:,.2f}"
            )
        
        return created_budgets

    async def create_demo_trade_spend(self, customers: List[Dict], products: List[Dict]):
        """Create demo trade spend records"""
        print("\n💸 CREATING DEMO TRADE SPEND...")
        
        if not customers or not products:
            self.log_test_result("Create Trade Spend", False, "No customers or products available")
            return []
        
        created_trade_spend = []
        
        # Generate 6 months of trade spend data
        start_date = datetime.now() - timedelta(days=180)
        
        for i in range(20):  # Create 20 trade spend records
            spend_date = start_date + timedelta(days=random.randint(0, 180))
            customer = random.choice(customers)
            product = random.choice(products)
            
            trade_spend_data = {
                "customer_id": customer["id"],
                "product_id": product["id"],
                "amount": round(random.uniform(5000, 50000), 2),
                "currency": "ZAR",
                "spend_date": spend_date.strftime("%Y-%m-%d"),
                "category": random.choice(["Promotional", "Display", "Advertising", "Rebate"]),
                "description": f"Trade spend for {product['name']} at {customer['name']}",
                "status": random.choice(["pending", "approved", "completed"]),
                "metadata": {
                    "campaign": f"Campaign {i+1}",
                    "channel": random.choice(["In-store", "Online", "Print", "Digital"]),
                    "roi_target": random.uniform(1.2, 3.5)
                }
            }
            
            response = await self.make_request("POST", "/api/v1/trade-spend/", trade_spend_data)
            success = response["success"]
            
            if success:
                created_trade_spend.append(response["data"])
            
            self.log_test_result(
                f"Create Trade Spend #{i+1}",
                success,
                f"Customer: {customer['name']}, Amount: R{trade_spend_data['amount']:,.2f}"
            )
        
        return created_trade_spend

    async def test_workflow_automation(self):
        """Test workflow automation features"""
        print("\n⚙️ TESTING WORKFLOW AUTOMATION...")
        
        # Test workflow endpoints
        workflows_to_test = [
            "/api/v1/workflows/budget-approval",
            "/api/v1/workflows/trade-spend-processing",
            "/api/v1/workflows/promotion-lifecycle",
            "/api/v1/workflows/activity-grid-management"
        ]
        
        workflow_results = []
        
        for workflow_endpoint in workflows_to_test:
            response = await self.make_request("GET", workflow_endpoint)
            success = response["success"]
            
            workflow_name = workflow_endpoint.split("/")[-1].replace("-", " ").title()
            
            self.log_test_result(
                f"Workflow: {workflow_name}",
                success,
                f"Status: {response['status']}"
            )
            
            workflow_results.append(success)
        
        return all(workflow_results)

    async def test_reporting_analytics(self):
        """Test reporting and analytics features"""
        print("\n📊 TESTING REPORTING & ANALYTICS...")
        
        # Test various report endpoints
        reports_to_test = [
            ("/api/v1/reports/dashboard", "Dashboard Summary"),
            ("/api/v1/reports/trade-spend-summary", "Trade Spend Summary"),
            ("/api/v1/reports/customer-analysis", "Customer Analysis"),
            ("/api/v1/reports/product-performance", "Product Performance"),
            ("/api/v1/reports/budget-utilization", "Budget Utilization")
        ]
        
        report_results = []
        
        for endpoint, report_name in reports_to_test:
            response = await self.make_request("GET", endpoint)
            success = response["success"]
            
            self.log_test_result(
                f"Report: {report_name}",
                success,
                f"Status: {response['status']}"
            )
            
            report_results.append(success)
        
        return all(report_results)

    async def test_data_integrity(self):
        """Test data integrity across modules"""
        print("\n🔍 TESTING DATA INTEGRITY...")
        
        # Test data consistency
        integrity_tests = [
            ("/api/v1/products/", "Products Data Integrity"),
            ("/api/v1/customers/", "Customers Data Integrity"),
            ("/api/v1/budgets/", "Budgets Data Integrity"),
            ("/api/v1/trade-spend/", "Trade Spend Data Integrity")
        ]
        
        integrity_results = []
        
        for endpoint, test_name in integrity_tests:
            response = await self.make_request("GET", endpoint)
            success = response["success"]
            
            if success:
                data = response["data"]
                count = len(data) if isinstance(data, list) else data.get("count", 0)
                details = f"Records found: {count}"
            else:
                details = f"Error: {response['data'].get('error', 'Unknown')}"
            
            self.log_test_result(test_name, success, details)
            integrity_results.append(success)
        
        return all(integrity_results)

    async def test_performance_benchmarks(self):
        """Test performance benchmarks"""
        print("\n⚡ TESTING PERFORMANCE BENCHMARKS...")
        
        import time
        
        # Test response times for key endpoints
        performance_tests = [
            "/api/v1/health/",
            "/api/v1/products/",
            "/api/v1/customers/",
            "/api/v1/budgets/"
        ]
        
        performance_results = []
        
        for endpoint in performance_tests:
            start_time = time.time()
            response = await self.make_request("GET", endpoint)
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000  # Convert to milliseconds
            success = response["success"] and response_time < 1000  # Under 1 second
            
            endpoint_name = endpoint.split("/")[-2] if endpoint.endswith("/") else endpoint.split("/")[-1]
            
            self.log_test_result(
                f"Performance: {endpoint_name.title()}",
                success,
                f"Response time: {response_time:.2f}ms"
            )
            
            performance_results.append(success)
        
        return all(performance_results)

    async def run_comprehensive_tests(self):
        """Run comprehensive end-to-end tests"""
        print("🚀 STARTING COMPREHENSIVE DEMO COMPANY E2E TESTS")
        print("=" * 60)
        
        await self.setup_session()
        
        try:
            # Phase 1: Basic Health Checks
            print("\n📋 PHASE 1: BASIC HEALTH CHECKS")
            await self.test_health_check()
            await self.test_detailed_health_check()
            
            # Phase 2: Demo Company Setup
            print("\n📋 PHASE 2: DEMO COMPANY SETUP")
            await self.create_demo_tenant()
            await self.create_demo_user()
            
            # Phase 3: Master Data Creation
            print("\n📋 PHASE 3: MASTER DATA CREATION")
            products = await self.create_demo_products()
            customers = await self.create_demo_customers()
            budgets = await self.create_demo_budgets()
            
            # Phase 4: Transactional Data
            print("\n📋 PHASE 4: TRANSACTIONAL DATA")
            trade_spend = await self.create_demo_trade_spend(customers, products)
            
            # Phase 5: Workflow Testing
            print("\n📋 PHASE 5: WORKFLOW TESTING")
            await self.test_workflow_automation()
            
            # Phase 6: Reporting & Analytics
            print("\n📋 PHASE 6: REPORTING & ANALYTICS")
            await self.test_reporting_analytics()
            
            # Phase 7: Data Integrity
            print("\n📋 PHASE 7: DATA INTEGRITY")
            await self.test_data_integrity()
            
            # Phase 8: Performance Testing
            print("\n📋 PHASE 8: PERFORMANCE TESTING")
            await self.test_performance_benchmarks()
            
        finally:
            await self.cleanup_session()
        
        # Generate final report
        self.generate_final_report()

    def generate_final_report(self):
        """Generate final test report"""
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE E2E TEST RESULTS")
        print("=" * 60)
        
        total = self.test_results["total_tests"]
        passed = self.test_results["passed_tests"]
        failed = self.test_results["failed_tests"]
        success_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"📈 SUMMARY:")
        print(f"   Total Tests: {total}")
        print(f"   Passed: {passed}")
        print(f"   Failed: {failed}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print(f"\n🏆 EXCELLENT: Demo company is production-ready!")
        elif success_rate >= 80:
            print(f"\n🥇 GOOD: Demo company meets requirements with minor issues")
        elif success_rate >= 70:
            print(f"\n🥈 ACCEPTABLE: Demo company needs some improvements")
        else:
            print(f"\n⚠️ NEEDS WORK: Demo company requires significant fixes")
        
        print(f"\n📋 DETAILED RESULTS:")
        for result in self.test_results["test_details"]:
            print(f"   {result['status']}: {result['test']}")
            if result["details"]:
                print(f"      {result['details']}")
        
        print("\n" + "=" * 60)
        print("🎯 MONDELEZ SA DEMO COMPANY TESTING COMPLETE")
        print("=" * 60)
        
        # Save results to file
        with open("demo-company-test-results.json", "w") as f:
            json.dump(self.test_results, f, indent=2)
        
        print("📄 Test results saved to: demo-company-test-results.json")

async def main():
    """Main execution function"""
    tester = MondelezDemoCompanyTester()
    await tester.run_comprehensive_tests()

if __name__ == "__main__":
    asyncio.run(main())