"""
Comprehensive API endpoint tests for TRADEAI v2.0
"""

import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.core.config import settings


class TestAPIEndpoints:
    """Test all API endpoints"""
    
    @pytest.fixture
    def client(self):
        """Test client fixture"""
        return TestClient(app)
    
    @pytest.fixture
    def headers(self):
        """Common headers for API requests"""
        return {
            "X-Tenant-Slug": "test-tenant",
            "Content-Type": "application/json"
        }
    
    def test_health_endpoint(self, client, headers):
        """Test health check endpoint"""
        response = client.get("/api/v1/health/", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "TRADEAI v2.0"
    
    def test_detailed_health_endpoint(self, client, headers):
        """Test detailed health check"""
        response = client.get("/api/v1/health/detailed", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "database" in data
        assert "version" in data
    
    def test_auth_endpoints_structure(self, client, headers):
        """Test authentication endpoints structure"""
        # Test login endpoint exists (will fail without credentials, but endpoint should exist)
        response = client.post("/api/v1/auth/login", headers=headers, json={})
        assert response.status_code in [400, 422]  # Bad request or validation error, not 404
        
        # Test refresh endpoint exists
        response = client.post("/api/v1/auth/refresh", headers=headers)
        assert response.status_code in [400, 401, 422]  # Not 404
    
    def test_customers_endpoints(self, client, headers):
        """Test customer endpoints"""
        # Test GET customers (should require auth but endpoint exists)
        response = client.get("/api/v1/customers/", headers=headers)
        assert response.status_code in [401, 403]  # Unauthorized, not 404
        
        # Test POST customers
        response = client.post("/api/v1/customers/", headers=headers, json={})
        assert response.status_code in [400, 401, 403, 422]  # Not 404
    
    def test_products_endpoints(self, client, headers):
        """Test product endpoints"""
        response = client.get("/api/v1/products/", headers=headers)
        assert response.status_code in [401, 403]  # Unauthorized, not 404
        
        response = client.post("/api/v1/products/", headers=headers, json={})
        assert response.status_code in [400, 401, 403, 422]  # Not 404
    
    def test_budgets_endpoints(self, client, headers):
        """Test budget endpoints"""
        response = client.get("/api/v1/budgets/", headers=headers)
        assert response.status_code in [401, 403]  # Unauthorized, not 404
        
        response = client.post("/api/v1/budgets/", headers=headers, json={})
        assert response.status_code in [400, 401, 403, 422]  # Not 404
    
    def test_trade_spend_endpoints(self, client, headers):
        """Test trade spend endpoints"""
        response = client.get("/api/v1/trade-spend/", headers=headers)
        assert response.status_code in [401, 403]  # Unauthorized, not 404
        
        response = client.post("/api/v1/trade-spend/", headers=headers, json={})
        assert response.status_code in [400, 401, 403, 422]  # Not 404
    
    def test_trading_terms_endpoints(self, client, headers):
        """Test trading terms endpoints"""
        response = client.get("/api/v1/trading-terms/", headers=headers)
        assert response.status_code in [401, 403]  # Unauthorized, not 404
        
        response = client.post("/api/v1/trading-terms/", headers=headers, json={})
        assert response.status_code in [400, 401, 403, 422]  # Not 404
    
    def test_activity_grids_endpoints(self, client, headers):
        """Test activity grids endpoints"""
        response = client.get("/api/v1/activity-grids/", headers=headers)
        assert response.status_code in [401, 403]  # Unauthorized, not 404
        
        response = client.post("/api/v1/activity-grids/", headers=headers, json={})
        assert response.status_code in [400, 401, 403, 422]  # Not 404
    
    def test_promotions_endpoints(self, client, headers):
        """Test promotions endpoints"""
        response = client.get("/api/v1/promotions/", headers=headers)
        assert response.status_code in [401, 403]  # Unauthorized, not 404
        
        response = client.post("/api/v1/promotions/", headers=headers, json={})
        assert response.status_code in [400, 401, 403, 422]  # Not 404
    
    def test_analytics_endpoints(self, client, headers):
        """Test analytics endpoints"""
        response = client.get("/api/v1/analytics/", headers=headers)
        assert response.status_code in [401, 403]  # Unauthorized, not 404
    
    def test_reports_endpoints(self, client, headers):
        """Test reports endpoints"""
        response = client.get("/api/v1/reports/", headers=headers)
        assert response.status_code in [401, 403]  # Unauthorized, not 404
    
    def test_tenant_header_validation(self, client):
        """Test that tenant header is required"""
        # Request without tenant header should fail
        response = client.get("/api/v1/customers/")
        assert response.status_code == 400
        assert "Tenant slug header" in response.json()["detail"]
    
    def test_openapi_spec(self, client):
        """Test OpenAPI specification is available"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        spec = response.json()
        assert "paths" in spec
        assert "info" in spec
        assert spec["info"]["title"] == "TRADEAI v2.0 API"
    
    def test_docs_endpoint(self, client):
        """Test API documentation endpoint"""
        response = client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]


class TestDataValidation:
    """Test data validation and error handling"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    @pytest.fixture
    def headers(self):
        return {
            "X-Tenant-Slug": "test-tenant",
            "Content-Type": "application/json"
        }
    
    def test_invalid_json_handling(self, client, headers):
        """Test handling of invalid JSON"""
        response = client.post(
            "/api/v1/customers/", 
            headers=headers, 
            data="invalid json"
        )
        assert response.status_code == 422
    
    def test_missing_required_fields(self, client, headers):
        """Test validation of required fields"""
        # Try to create customer without required fields
        response = client.post(
            "/api/v1/customers/",
            headers=headers,
            json={"description": "Missing required fields"}
        )
        assert response.status_code in [400, 401, 403, 422]
    
    def test_invalid_field_types(self, client, headers):
        """Test validation of field types"""
        response = client.post(
            "/api/v1/customers/",
            headers=headers,
            json={
                "name": "Test Customer",
                "code": "TEST001",
                "credit_limit": "not_a_number"  # Should be numeric
            }
        )
        assert response.status_code in [400, 401, 403, 422]


class TestEndpointCoverage:
    """Test endpoint coverage and completeness"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_all_expected_endpoints_exist(self, client):
        """Test that all expected endpoints are registered"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        
        spec = response.json()
        paths = spec["paths"]
        
        # Expected endpoint patterns
        expected_patterns = [
            "/api/v1/health/",
            "/api/v1/auth/login",
            "/api/v1/customers/",
            "/api/v1/products/",
            "/api/v1/budgets/",
            "/api/v1/trade-spend/",
            "/api/v1/trading-terms/",
            "/api/v1/activity-grids/",
            "/api/v1/promotions/",
            "/api/v1/analytics/",
            "/api/v1/reports/"
        ]
        
        for pattern in expected_patterns:
            assert any(pattern in path for path in paths.keys()), f"Missing endpoint: {pattern}"
    
    def test_crud_endpoints_completeness(self, client):
        """Test that CRUD endpoints are complete for main entities"""
        response = client.get("/openapi.json")
        spec = response.json()
        paths = spec["paths"]
        
        # Entities that should have full CRUD
        crud_entities = [
            "customers",
            "products", 
            "budgets",
            "trade-spend",
            "trading-terms",
            "activity-grids",
            "promotions"
        ]
        
        for entity in crud_entities:
            # Check for list/create endpoint
            list_endpoint = f"/api/v1/{entity}/"
            assert any(list_endpoint in path for path in paths.keys()), f"Missing list endpoint for {entity}"
            
            # Check for get/update/delete endpoint pattern
            detail_pattern = f"/api/v1/{entity}/"
            detail_endpoints = [path for path in paths.keys() if detail_pattern in path and "{" in path]
            assert len(detail_endpoints) > 0, f"Missing detail endpoints for {entity}"


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])