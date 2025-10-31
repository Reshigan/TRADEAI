#!/usr/bin/env python3
"""
TRADEAI Backend API Explorer
Comprehensive backend API discovery and documentation tool
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, List, Optional
import os

API_BASE_URL = os.getenv("API_URL", "https://tradeai.gonxt.tech/api")
OUTPUT_DIR = "backend-api-exploration"

class APIExplorer:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        self.discoveries = []
        
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
    def log(self, message: str, level: str = "INFO"):
        colors = {
            "INFO": "\033[0;34m",
            "SUCCESS": "\033[0;32m",
            "WARNING": "\033[1;33m",
            "ERROR": "\033[0;31m",
        }
        reset = "\033[0m"
        print(f"{colors.get(level, '')}{level}{reset} {message}")
        
    def test_endpoint(self, method: str, path: str, data: Optional[Dict] = None, 
                     auth_required: bool = True, description: str = "") -> Dict:
        """Test an API endpoint and return results"""
        url = f"{self.base_url}{path}"
        headers = {"Content-Type": "application/json"}
        
        if auth_required and self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                timeout=10
            )
            
            result = {
                "method": method,
                "path": path,
                "status": response.status_code,
                "description": description,
                "timestamp": datetime.now().isoformat(),
                "success": 200 <= response.status_code < 300,
                "auth_required": auth_required,
            }
            
            try:
                result["response"] = response.json()
            except:
                result["response"] = response.text[:200]
            
            self.discoveries.append(result)
            
            status_color = "SUCCESS" if result["success"] else "WARNING" if response.status_code == 401 else "ERROR"
            self.log(f"{method} {path} → HTTP {response.status_code}", status_color)
            
            return result
            
        except Exception as e:
            self.log(f"{method} {path} → ERROR: {str(e)}", "ERROR")
            return {
                "method": method,
                "path": path,
                "status": 0,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def explore_public_endpoints(self):
        """Explore endpoints that don't require authentication"""
        self.log("\n=== Exploring Public Endpoints ===", "INFO")
        
        public_endpoints = [
            ("GET", "/health", None, False, "Health check"),
            ("GET", "/", None, False, "Root endpoint"),
            ("GET", "/api", None, False, "API root"),
            ("GET", "/api/docs", None, False, "API documentation"),
            ("GET", "/swagger", None, False, "Swagger docs"),
            ("GET", "/openapi.json", None, False, "OpenAPI spec"),
        ]
        
        for method, path, data, auth, desc in public_endpoints:
            self.test_endpoint(method, path, data, auth, desc)
    
    def explore_auth_endpoints(self):
        """Explore authentication endpoints"""
        self.log("\n=== Exploring Authentication Endpoints ===", "INFO")
        
        # Try various auth endpoints
        auth_tests = [
            ("POST", "/auth/login", {"email": "test@example.com", "password": "password"}, False, "Login attempt"),
            ("POST", "/auth/register", {"email": "test@example.com", "password": "Test123!@#", "name": "Test"}, False, "Registration"),
            ("GET", "/auth/me", None, True, "Get current user"),
            ("POST", "/auth/refresh", None, False, "Refresh token"),
            ("POST", "/auth/logout", None, True, "Logout"),
        ]
        
        for method, path, data, auth, desc in auth_tests:
            self.test_endpoint(method, path, data, auth, desc)
    
    def try_login(self, email: str = None, password: str = None):
        """Attempt to login with provided or default credentials"""
        self.log("\n=== Attempting Login ===", "INFO")
        
        if not email:
            email = input("Enter email (or press Enter for demo@example.com): ") or "demo@example.com"
        if not password:
            password = input("Enter password (or press Enter to skip login): ")
            
        if not password:
            self.log("Skipping login - will only test public endpoints", "WARNING")
            return False
        
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={"email": email, "password": password},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "data" in data and "accessToken" in data["data"]:
                    self.access_token = data["data"]["accessToken"]
                    self.refresh_token = data["data"].get("refreshToken")
                    self.log(f"Login successful! Token: {self.access_token[:20]}...", "SUCCESS")
                    return True
                elif "accessToken" in data:
                    self.access_token = data["accessToken"]
                    self.refresh_token = data.get("refreshToken")
                    self.log(f"Login successful! Token: {self.access_token[:20]}...", "SUCCESS")
                    return True
            
            self.log(f"Login failed: HTTP {response.status_code} - {response.text[:100]}", "ERROR")
            return False
            
        except Exception as e:
            self.log(f"Login error: {str(e)}", "ERROR")
            return False
    
    def explore_protected_endpoints(self):
        """Explore endpoints that require authentication"""
        if not self.access_token:
            self.log("\n=== Skipping Protected Endpoints (Not Authenticated) ===", "WARNING")
            return
        
        self.log("\n=== Exploring Protected Endpoints ===", "INFO")
        
        # Resource endpoints to test
        resources = [
            # Customers
            ("GET", "/customers", None, "List customers"),
            ("GET", "/customers/1", None, "Get customer by ID"),
            ("GET", "/customers/stats", None, "Customer statistics"),
            
            # Products
            ("GET", "/products", None, "List products"),
            ("GET", "/products/1", None, "Get product by ID"),
            ("GET", "/products/categories", None, "Product categories"),
            
            # Orders
            ("GET", "/orders", None, "List orders"),
            ("GET", "/orders/stats", None, "Order statistics"),
            
            # Budgets
            ("GET", "/budgets", None, "List budgets"),
            
            # Promotions
            ("GET", "/promotions", None, "List promotions"),
            
            # Rebates
            ("GET", "/rebates", None, "List rebates"),
            
            # Analytics
            ("GET", "/analytics", None, "Analytics dashboard"),
            ("GET", "/analytics/revenue", None, "Revenue analytics"),
            ("GET", "/analytics/customers", None, "Customer analytics"),
            
            # Reports
            ("GET", "/reports", None, "List reports"),
            
            # Admin
            ("GET", "/admin/dashboard", None, "Admin dashboard"),
            ("GET", "/admin/users", None, "Admin users"),
            ("GET", "/admin/settings", None, "System settings"),
            
            # Users
            ("GET", "/users", None, "List users"),
            ("GET", "/users/me", None, "Current user"),
            
            # Notifications
            ("GET", "/notifications", None, "List notifications"),
            
            # Integrations
            ("GET", "/integrations", None, "List integrations"),
            
            # ML/AI
            ("GET", "/ml/models", None, "ML models"),
            ("GET", "/ml/predictions", None, "Predictions"),
        ]
        
        for method, path, data, desc in resources:
            self.test_endpoint(method, path, data, True, desc)
    
    def generate_report(self):
        """Generate comprehensive discovery report"""
        self.log("\n=== Generating Report ===", "INFO")
        
        # Group by status code
        by_status = {}
        for discovery in self.discoveries:
            status = discovery.get("status", 0)
            if status not in by_status:
                by_status[status] = []
            by_status[status].append(discovery)
        
        # Generate markdown report
        report = f"""# TRADEAI Backend API Discovery Report

**Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**API Base URL**: {self.base_url}  
**Total Endpoints Tested**: {len(self.discoveries)}  
**Authenticated**: {"Yes" if self.access_token else "No"}

---

## Summary Statistics

"""
        
        for status in sorted(by_status.keys()):
            count = len(by_status[status])
            status_name = {
                200: "Success",
                201: "Created",
                204: "No Content",
                400: "Bad Request",
                401: "Unauthorized",
                403: "Forbidden",
                404: "Not Found",
                429: "Rate Limited",
                500: "Server Error"
            }.get(status, f"HTTP {status}")
            
            report += f"- **{status_name}** (HTTP {status}): {count} endpoints\n"
        
        report += "\n---\n\n## Endpoint Details\n\n"
        report += "| Method | Path | Status | Description |\n"
        report += "|--------|------|--------|-------------|\n"
        
        for discovery in sorted(self.discoveries, key=lambda x: (x.get("status", 999), x.get("path", ""))):
            method = discovery.get("method", "")
            path = discovery.get("path", "")
            status = discovery.get("status", "")
            desc = discovery.get("description", "")
            report += f"| {method} | {path} | {status} | {desc} |\n"
        
        report += "\n---\n\n## Working Endpoints\n\n"
        
        working = [d for d in self.discoveries if d.get("success")]
        if working:
            for endpoint in working:
                report += f"### {endpoint['method']} {endpoint['path']}\n\n"
                report += f"**Status**: {endpoint['status']}  \n"
                report += f"**Description**: {endpoint['description']}  \n\n"
                
                if "response" in endpoint and endpoint["response"]:
                    report += "**Response**:\n```json\n"
                    report += json.dumps(endpoint["response"], indent=2)[:500]
                    report += "\n```\n\n"
        else:
            report += "*No working endpoints discovered (authentication may be required)*\n\n"
        
        report += "\n---\n\n## Recommendations\n\n"
        
        if not self.access_token:
            report += "- ❗ Authentication required for most endpoints\n"
            report += "- 📝 Obtain valid credentials to explore protected endpoints\n"
        else:
            report += "- ✅ Authentication successful\n"
            report += "- 📊 Review endpoint responses to understand data structures\n"
        
        report += "- 📋 Create user stories based on discovered endpoints\n"
        report += "- 🎨 Design frontend components to match API capabilities\n"
        report += "- 🧪 Implement integration tests for each endpoint\n"
        
        # Save report
        report_path = os.path.join(OUTPUT_DIR, "API_DISCOVERY_REPORT.md")
        with open(report_path, "w") as f:
            f.write(report)
        
        # Save JSON
        json_path = os.path.join(OUTPUT_DIR, "discoveries.json")
        with open(json_path, "w") as f:
            json.dump(self.discoveries, f, indent=2)
        
        self.log(f"Report saved to: {report_path}", "SUCCESS")
        self.log(f"JSON data saved to: {json_path}", "SUCCESS")
        
        return report

def main():
    print("\n" + "="*50)
    print("  TRADEAI Backend API Explorer")
    print("="*50 + "\n")
    
    explorer = APIExplorer(API_BASE_URL)
    
    # Explore public endpoints
    explorer.explore_public_endpoints()
    
    # Try to login
    if "--no-login" not in sys.argv:
        if "--auto-login" in sys.argv:
            explorer.try_login("demo@example.com", "password123")
        else:
            explorer.try_login()
    
    # Explore auth endpoints
    explorer.explore_auth_endpoints()
    
    # Explore protected endpoints if authenticated
    explorer.explore_protected_endpoints()
    
    # Generate report
    report = explorer.generate_report()
    
    print("\n" + "="*50)
    print("  Discovery Complete!")
    print("="*50 + "\n")
    
    print(f"Total endpoints tested: {len(explorer.discoveries)}")
    print(f"Authenticated: {'Yes' if explorer.access_token else 'No'}")
    print(f"\nResults saved to: {OUTPUT_DIR}/")
    print("\nNext steps:")
    print("1. Review API_DISCOVERY_REPORT.md")
    print("2. Check discoveries.json for detailed responses")
    print("3. Create user stories based on findings")
    print("4. Build frontend to match backend capabilities")

if __name__ == "__main__":
    main()
