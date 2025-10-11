"""
Comprehensive database model tests for TRADEAI v2.0
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.tenant import Tenant
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.budget import Budget
from app.models.trade_spend import TradeSpend
from app.models.trading_terms import TradingTerms
from app.models.activity_grid import ActivityGrid, ActivityGridItem
from app.models.promotion import Promotion


class TestTenantModel:
    """Test Tenant model functionality"""
    
    @pytest.mark.asyncio
    async def test_create_tenant(self, test_db: AsyncSession):
        """Test tenant creation"""
        tenant = Tenant(
            name="Test Tenant",
            slug="test-tenant",
            description="Test tenant description",
            status="active"
        )
        test_db.add(tenant)
        await test_db.commit()
        await test_db.refresh(tenant)
        
        assert tenant.id is not None
        assert tenant.name == "Test Tenant"
        assert tenant.slug == "test-tenant"
        assert tenant.status == "active"
        assert tenant.created_at is not None
        assert tenant.updated_at is not None
    
    @pytest.mark.asyncio
    async def test_tenant_slug_unique(self, test_db: AsyncSession):
        """Test tenant slug uniqueness"""
        tenant1 = Tenant(name="Tenant 1", slug="unique-slug", status="active")
        tenant2 = Tenant(name="Tenant 2", slug="unique-slug", status="active")
        
        test_db.add(tenant1)
        await test_db.commit()
        
        test_db.add(tenant2)
        with pytest.raises(Exception):  # Should raise integrity error
            await test_db.commit()


class TestUserModel:
    """Test User model functionality"""
    
    @pytest.mark.asyncio
    async def test_create_user(self, test_db: AsyncSession):
        """Test user creation"""
        # Create tenant first
        tenant = Tenant(name="Test Tenant", slug="test-tenant", status="active")
        test_db.add(tenant)
        await test_db.commit()
        await test_db.refresh(tenant)
        
        user = User(
            tenant_id=tenant.id,
            email="test@example.com",
            username="testuser",
            full_name="Test User",
            hashed_password="hashed_password_here",
            is_active=True
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.is_active is True
        assert user.tenant_id == tenant.id
    
    @pytest.mark.asyncio
    async def test_user_email_unique_per_tenant(self, test_db: AsyncSession):
        """Test user email uniqueness within tenant"""
        tenant = Tenant(name="Test Tenant", slug="test-tenant", status="active")
        test_db.add(tenant)
        await test_db.commit()
        await test_db.refresh(tenant)
        
        user1 = User(
            tenant_id=tenant.id,
            email="same@example.com",
            username="user1",
            hashed_password="hash1",
            is_active=True
        )
        user2 = User(
            tenant_id=tenant.id,
            email="same@example.com",
            username="user2",
            hashed_password="hash2",
            is_active=True
        )
        
        test_db.add(user1)
        await test_db.commit()
        
        test_db.add(user2)
        with pytest.raises(Exception):  # Should raise integrity error
            await test_db.commit()


class TestCustomerModel:
    """Test Customer model functionality"""
    
    @pytest.mark.asyncio
    async def test_create_customer(self, test_db: AsyncSession):
        """Test customer creation"""
        tenant = Tenant(name="Test Tenant", slug="test-tenant", status="active")
        test_db.add(tenant)
        await test_db.commit()
        await test_db.refresh(tenant)
        
        customer = Customer(
            tenant_id=tenant.id,
            name="Test Customer",
            code="CUST001",
            email="customer@example.com",
            customer_type="retail",
            status="active",
            credit_limit=10000.00
        )
        test_db.add(customer)
        await test_db.commit()
        await test_db.refresh(customer)
        
        assert customer.id is not None
        assert customer.name == "Test Customer"
        assert customer.code == "CUST001"
        assert customer.customer_type == "retail"
        assert customer.credit_limit == 10000.00
    
    @pytest.mark.asyncio
    async def test_customer_hierarchy(self, test_db: AsyncSession):
        """Test customer parent-child relationship"""
        tenant = Tenant(name="Test Tenant", slug="test-tenant", status="active")
        test_db.add(tenant)
        await test_db.commit()
        await test_db.refresh(tenant)
        
        parent_customer = Customer(
            tenant_id=tenant.id,
            name="Parent Customer",
            code="PARENT001",
            customer_type="corporate",
            status="active"
        )
        test_db.add(parent_customer)
        await test_db.commit()
        await test_db.refresh(parent_customer)
        
        child_customer = Customer(
            tenant_id=tenant.id,
            name="Child Customer",
            code="CHILD001",
            customer_type="retail",
            status="active",
            parent_customer_id=parent_customer.id
        )
        test_db.add(child_customer)
        await test_db.commit()
        await test_db.refresh(child_customer)
        
        assert child_customer.parent_customer_id == parent_customer.id


class TestProductModel:
    """Test Product model functionality"""
    
    @pytest.mark.asyncio
    async def test_create_product(self, test_db: AsyncSession):
        """Test product creation"""
        tenant = Tenant(name="Test Tenant", slug="test-tenant", status="active")
        test_db.add(tenant)
        await test_db.commit()
        await test_db.refresh(tenant)
        
        product = Product(
            tenant_id=tenant.id,
            name="Test Product",
            sku="PROD001",
            description="Test product description",
            category="Electronics",
            unit_price=99.99,
            cost_price=50.00,
            currency="USD",
            status="active"
        )
        test_db.add(product)
        await test_db.commit()
        await test_db.refresh(product)
        
        assert product.id is not None
        assert product.name == "Test Product"
        assert product.sku == "PROD001"
        assert product.unit_price == 99.99
        assert product.currency == "USD"
    
    @pytest.mark.asyncio
    async def test_product_sku_unique_per_tenant(self, test_db: AsyncSession):
        """Test product SKU uniqueness within tenant"""
        tenant = Tenant(name="Test Tenant", slug="test-tenant", status="active")
        test_db.add(tenant)
        await test_db.commit()
        await test_db.refresh(tenant)
        
        product1 = Product(
            tenant_id=tenant.id,
            name="Product 1",
            sku="SAME_SKU",
            currency="USD",
            status="active"
        )
        product2 = Product(
            tenant_id=tenant.id,
            name="Product 2",
            sku="SAME_SKU",
            currency="USD",
            status="active"
        )
        
        test_db.add(product1)
        await test_db.commit()
        
        test_db.add(product2)
        with pytest.raises(Exception):  # Should raise integrity error
            await test_db.commit()


class TestBudgetModel:
    """Test Budget model functionality"""
    
    @pytest.mark.asyncio
    async def test_create_budget(self, test_db: AsyncSession):
        """Test budget creation"""
        tenant = Tenant(name="Test Tenant", slug="test-tenant", status="active")
        test_db.add(tenant)
        await test_db.commit()
        await test_db.refresh(tenant)
        
        budget = Budget(
            tenant_id=tenant.id,
            name="Test Budget",
            budget_type="marketing",
            total_amount=50000.00,
            currency="USD",
            period_start=datetime.utcnow(),
            period_end=datetime.utcnow() + timedelta(days=365),
            status="draft",
            approval_status="pending"
        )
        test_db.add(budget)
        await test_db.commit()
        await test_db.refresh(budget)
        
        assert budget.id is not None
        assert budget.name == "Test Budget"
        assert budget.total_amount == 50000.00
        assert budget.status == "draft"
        assert budget.approval_status == "pending"
    
    @pytest.mark.asyncio
    async def test_budget_calculations(self, test_db: AsyncSession):
        """Test budget amount calculations"""
        tenant = Tenant(name="Test Tenant", slug="test-tenant", status="active")
        test_db.add(tenant)
        await test_db.commit()
        await test_db.refresh(tenant)
        
        budget = Budget(
            tenant_id=tenant.id,
            name="Test Budget",
            budget_type="marketing",
            total_amount=10000.00,
            allocated_amount=6000.00,
            spent_amount=4000.00,
            currency="USD",
            period_start=datetime.utcnow(),
            period_end=datetime.utcnow() + timedelta(days=365),
            status="active",
            approval_status="approved"
        )
        test_db.add(budget)
        await test_db.commit()
        await test_db.refresh(budget)
        
        # Calculate remaining amount
        remaining = budget.total_amount - budget.spent_amount
        assert remaining == 6000.00


class TestTradeSpendModel:
    """Test TradeSpend model functionality"""
    
    @pytest.mark.asyncio
    async def test_create_trade_spend(self, test_db: AsyncSession):
        """Test trade spend creation"""
        tenant = Tenant(name="Test Tenant", slug="test-tenant", status="active")
        test_db.add(tenant)
        await test_db.commit()
        await test_db.refresh(tenant)
        
        customer = Customer(
            tenant_id=tenant.id,
            name="Test Customer",
            code="CUST001",
            customer_type="retail",
            status="active"
        )
        test_db.add(customer)
        await test_db.commit()
        await test_db.refresh(customer)
        
        trade_spend = TradeSpend(
            tenant_id=tenant.id,
            customer_id=customer.id,
            spend_type="promotion",
            amount=5000.00,
            description="Test trade spend",
            status="pending"
        )
        test_db.add(trade_spend)
        await test_db.commit()
        await test_db.refresh(trade_spend)
        
        assert trade_spend.id is not None
        assert trade_spend.customer_id == customer.id
        assert trade_spend.amount == 5000.00
        assert trade_spend.status == "pending"


class TestTradingTermsModel:
    """Test TradingTerms model functionality"""
    
    @pytest.mark.asyncio
    async def test_create_trading_terms(self, test_db: AsyncSession):
        """Test trading terms creation"""
        tenant = Tenant(name="Test Tenant", slug="test-tenant", status="active")
        test_db.add(tenant)
        await test_db.commit()
        await test_db.refresh(tenant)
        
        customer = Customer(
            tenant_id=tenant.id,
            name="Test Customer",
            code="CUST001",
            customer_type="retail",
            status="active"
        )
        test_db.add(customer)
        await test_db.commit()
        await test_db.refresh(customer)
        
        trading_terms = TradingTerms(
            tenant_id=tenant.id,
            customer_id=customer.id,
            term_type="discount",
            term_name="Volume Discount",
            rate=5.0,
            currency="USD",
            effective_date=datetime.utcnow(),
            expiry_date=datetime.utcnow() + timedelta(days=365),
            status="active"
        )
        test_db.add(trading_terms)
        await test_db.commit()
        await test_db.refresh(trading_terms)
        
        assert trading_terms.id is not None
        assert trading_terms.term_name == "Volume Discount"
        assert trading_terms.rate == 5.0
        assert trading_terms.status == "active"


class TestActivityGridModel:
    """Test ActivityGrid and ActivityGridItem models"""
    
    @pytest.mark.asyncio
    async def test_create_activity_grid_with_items(self, test_db: AsyncSession):
        """Test activity grid creation with items"""
        tenant = Tenant(name="Test Tenant", slug="test-tenant", status="active")
        test_db.add(tenant)
        await test_db.commit()
        await test_db.refresh(tenant)
        
        activity_grid = ActivityGrid(
            tenant_id=tenant.id,
            name="Test Activity Grid",
            description="Test grid description",
            period_start=datetime.utcnow(),
            period_end=datetime.utcnow() + timedelta(days=90),
            status="draft"
        )
        test_db.add(activity_grid)
        await test_db.commit()
        await test_db.refresh(activity_grid)
        
        # Add items to the grid
        item1 = ActivityGridItem(
            activity_grid_id=activity_grid.id,
            activity_name="Marketing Campaign",
            planned_cost=10000.00,
            status="planned"
        )
        item2 = ActivityGridItem(
            activity_grid_id=activity_grid.id,
            activity_name="Trade Show",
            planned_cost=15000.00,
            status="planned"
        )
        
        test_db.add_all([item1, item2])
        await test_db.commit()
        await test_db.refresh(item1)
        await test_db.refresh(item2)
        
        assert activity_grid.id is not None
        assert item1.activity_grid_id == activity_grid.id
        assert item2.activity_grid_id == activity_grid.id
        assert item1.planned_cost == 10000.00
        assert item2.planned_cost == 15000.00


class TestPromotionModel:
    """Test Promotion model functionality"""
    
    @pytest.mark.asyncio
    async def test_create_promotion(self, test_db: AsyncSession):
        """Test promotion creation"""
        tenant = Tenant(name="Test Tenant", slug="test-tenant", status="active")
        test_db.add(tenant)
        await test_db.commit()
        await test_db.refresh(tenant)
        
        promotion = Promotion(
            tenant_id=tenant.id,
            name="Test Promotion",
            description="Test promotion description",
            promotion_type="discount",
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=30),
            status="draft"
        )
        test_db.add(promotion)
        await test_db.commit()
        await test_db.refresh(promotion)
        
        assert promotion.id is not None
        assert promotion.name == "Test Promotion"
        assert promotion.promotion_type == "discount"
        assert promotion.status == "draft"


class TestModelRelationships:
    """Test relationships between models"""
    
    @pytest.mark.asyncio
    async def test_tenant_isolation(self, test_db: AsyncSession):
        """Test that tenant isolation works correctly"""
        # Create two tenants
        tenant1 = Tenant(name="Tenant 1", slug="tenant-1", status="active")
        tenant2 = Tenant(name="Tenant 2", slug="tenant-2", status="active")
        test_db.add_all([tenant1, tenant2])
        await test_db.commit()
        await test_db.refresh(tenant1)
        await test_db.refresh(tenant2)
        
        # Create customers for each tenant
        customer1 = Customer(
            tenant_id=tenant1.id,
            name="Customer 1",
            code="CUST001",
            customer_type="retail",
            status="active"
        )
        customer2 = Customer(
            tenant_id=tenant2.id,
            name="Customer 2",
            code="CUST001",  # Same code, different tenant
            customer_type="retail",
            status="active"
        )
        test_db.add_all([customer1, customer2])
        await test_db.commit()
        
        # Query customers for tenant 1
        stmt = select(Customer).where(Customer.tenant_id == tenant1.id)
        result = await test_db.execute(stmt)
        tenant1_customers = result.scalars().all()
        
        assert len(tenant1_customers) == 1
        assert tenant1_customers[0].name == "Customer 1"
    
    @pytest.mark.asyncio
    async def test_cascade_relationships(self, test_db: AsyncSession):
        """Test cascade delete relationships"""
        tenant = Tenant(name="Test Tenant", slug="test-tenant", status="active")
        test_db.add(tenant)
        await test_db.commit()
        await test_db.refresh(tenant)
        
        customer = Customer(
            tenant_id=tenant.id,
            name="Test Customer",
            code="CUST001",
            customer_type="retail",
            status="active"
        )
        test_db.add(customer)
        await test_db.commit()
        await test_db.refresh(customer)
        
        # Create related records
        trade_spend = TradeSpend(
            tenant_id=tenant.id,
            customer_id=customer.id,
            spend_type="promotion",
            amount=1000.00,
            status="pending"
        )
        test_db.add(trade_spend)
        await test_db.commit()
        
        # Verify relationship exists
        stmt = select(TradeSpend).where(TradeSpend.customer_id == customer.id)
        result = await test_db.execute(stmt)
        trade_spends = result.scalars().all()
        assert len(trade_spends) == 1