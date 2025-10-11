"""
Test configuration and fixtures for TRADEAI v2.0
"""

import pytest
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient

from app.main import app
from app.db.database import Base
from app.core.config import settings


# Test database URL (in-memory SQLite for testing)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        future=True
    )
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Clean up
    await engine.dispose()


@pytest.fixture
async def test_db(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session"""
    TestSessionLocal = sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTP client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def test_tenant_headers():
    """Common test headers with tenant"""
    return {
        "X-Tenant-Slug": "test-tenant",
        "Content-Type": "application/json"
    }


@pytest.fixture
def sample_customer_data():
    """Sample customer data for testing"""
    return {
        "name": "Test Customer",
        "code": "TEST001",
        "email": "test@customer.com",
        "phone": "+1234567890",
        "customer_type": "retail",
        "status": "active",
        "credit_limit": 10000.00,
        "currency": "USD"
    }


@pytest.fixture
def sample_product_data():
    """Sample product data for testing"""
    return {
        "name": "Test Product",
        "sku": "PROD001",
        "description": "Test product description",
        "category": "Electronics",
        "brand": "TestBrand",
        "unit_price": 99.99,
        "cost_price": 50.00,
        "currency": "USD",
        "status": "active"
    }


@pytest.fixture
def sample_budget_data():
    """Sample budget data for testing"""
    return {
        "name": "Test Budget",
        "description": "Test budget description",
        "budget_type": "marketing",
        "total_amount": 50000.00,
        "currency": "USD",
        "period_start": "2025-01-01",
        "period_end": "2025-12-31"
    }


@pytest.fixture
def sample_trade_spend_data():
    """Sample trade spend data for testing"""
    return {
        "customer_id": "test-customer-id",
        "spend_type": "promotion",
        "amount": 5000.00,
        "description": "Test trade spend",
        "period_start": "2025-01-01",
        "period_end": "2025-03-31"
    }


@pytest.fixture
def sample_trading_terms_data():
    """Sample trading terms data for testing"""
    return {
        "customer_id": "test-customer-id",
        "term_type": "discount",
        "term_name": "Volume Discount",
        "description": "Volume-based discount terms",
        "rate": 5.0,
        "currency": "USD",
        "effective_date": "2025-01-01",
        "expiry_date": "2025-12-31"
    }


@pytest.fixture
def sample_activity_grid_data():
    """Sample activity grid data for testing"""
    return {
        "name": "Test Activity Grid",
        "description": "Test activity grid description",
        "period_start": "2025-01-01",
        "period_end": "2025-03-31",
        "items": [
            {
                "activity_name": "Marketing Campaign",
                "description": "Digital marketing campaign",
                "planned_cost": 10000.00,
                "status": "planned"
            }
        ]
    }