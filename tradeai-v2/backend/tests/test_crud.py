"""
Comprehensive CRUD operations tests for TRADEAI v2.0
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import tenant, user, customer, product, budget, trade_spend, trading_terms, activity_grid
from app.schemas.tenant import TenantCreate, TenantUpdate
from app.schemas.user import UserCreate, UserUpdate
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.budget import BudgetCreate, BudgetUpdate
from app.schemas.trade_spend import TradeSpendCreate, TradeSpendUpdate
from app.schemas.trading_terms import TradingTermsCreate, TradingTermsUpdate
from app.schemas.activity_grid import ActivityGridCreate, ActivityGridUpdate


class TestTenantCRUD:
    """Test Tenant CRUD operations"""
    
    @pytest.mark.asyncio
    async def test_create_tenant(self, test_db: AsyncSession):
        """Test tenant creation"""
        tenant_data = TenantCreate(
            name="Test Tenant",
            slug="test-tenant",
            description="Test tenant description",
            status="active"
        )
        
        created_tenant = await tenant.create(test_db, obj_in=tenant_data)
        
        assert created_tenant.id is not None
        assert created_tenant.name == "Test Tenant"
        assert created_tenant.slug == "test-tenant"
        assert created_tenant.status == "active"
    
    @pytest.mark.asyncio
    async def test_get_tenant(self, test_db: AsyncSession):
        """Test tenant retrieval"""
        tenant_data = TenantCreate(
            name="Get Test Tenant",
            slug="get-test-tenant",
            status="active"
        )
        created_tenant = await tenant.create(test_db, obj_in=tenant_data)
        
        retrieved_tenant = await tenant.get(test_db, id=created_tenant.id)
        
        assert retrieved_tenant is not None
        assert retrieved_tenant.id == created_tenant.id
        assert retrieved_tenant.name == "Get Test Tenant"
    
    @pytest.mark.asyncio
    async def test_update_tenant(self, test_db: AsyncSession):
        """Test tenant update"""
        tenant_data = TenantCreate(
            name="Update Test Tenant",
            slug="update-test-tenant",
            status="active"
        )
        created_tenant = await tenant.create(test_db, obj_in=tenant_data)
        
        update_data = TenantUpdate(
            name="Updated Tenant Name",
            description="Updated description"
        )
        updated_tenant = await tenant.update(
            test_db, db_obj=created_tenant, obj_in=update_data
        )
        
        assert updated_tenant.name == "Updated Tenant Name"
        assert updated_tenant.description == "Updated description"
        assert updated_tenant.slug == "update-test-tenant"  # Should not change
    
    @pytest.mark.asyncio
    async def test_delete_tenant(self, test_db: AsyncSession):
        """Test tenant deletion"""
        tenant_data = TenantCreate(
            name="Delete Test Tenant",
            slug="delete-test-tenant",
            status="active"
        )
        created_tenant = await tenant.create(test_db, obj_in=tenant_data)
        
        deleted_tenant = await tenant.remove(test_db, id=created_tenant.id)
        
        assert deleted_tenant.id == created_tenant.id
        
        # Verify it's deleted
        retrieved_tenant = await tenant.get(test_db, id=created_tenant.id)
        assert retrieved_tenant is None
    
    @pytest.mark.asyncio
    async def test_get_multi_tenants(self, test_db: AsyncSession):
        """Test multiple tenant retrieval"""
        tenant_data_1 = TenantCreate(name="Tenant 1", slug="tenant-1", status="active")
        tenant_data_2 = TenantCreate(name="Tenant 2", slug="tenant-2", status="active")
        
        await tenant.create(test_db, obj_in=tenant_data_1)
        await tenant.create(test_db, obj_in=tenant_data_2)
        
        tenants = await tenant.get_multi(test_db, skip=0, limit=10)
        
        assert len(tenants) >= 2
        tenant_names = [t.name for t in tenants]
        assert "Tenant 1" in tenant_names
        assert "Tenant 2" in tenant_names


class TestCustomerCRUD:
    """Test Customer CRUD operations"""
    
    @pytest.fixture
    async def test_tenant(self, test_db: AsyncSession):
        """Create a test tenant"""
        tenant_data = TenantCreate(
            name="Test Tenant",
            slug="test-tenant",
            status="active"
        )
        return await tenant.create(test_db, obj_in=tenant_data)
    
    @pytest.mark.asyncio
    async def test_create_customer(self, test_db: AsyncSession, test_tenant):
        """Test customer creation"""
        customer_data = CustomerCreate(
            name="Test Customer",
            code="CUST001",
            email="customer@example.com",
            customer_type="retail",
            status="active",
            credit_limit=10000.00
        )
        
        created_customer = await customer.create(
            test_db, obj_in=customer_data, tenant_id=test_tenant.id
        )
        
        assert created_customer.id is not None
        assert created_customer.name == "Test Customer"
        assert created_customer.code == "CUST001"
        assert created_customer.tenant_id == test_tenant.id
    
    @pytest.mark.asyncio
    async def test_get_customer_by_tenant(self, test_db: AsyncSession, test_tenant):
        """Test customer retrieval with tenant isolation"""
        customer_data = CustomerCreate(
            name="Tenant Customer",
            code="TCUST001",
            customer_type="retail",
            status="active"
        )
        
        created_customer = await customer.create(
            test_db, obj_in=customer_data, tenant_id=test_tenant.id
        )
        
        retrieved_customer = await customer.get(
            test_db, id=created_customer.id, tenant_id=test_tenant.id
        )
        
        assert retrieved_customer is not None
        assert retrieved_customer.tenant_id == test_tenant.id
    
    @pytest.mark.asyncio
    async def test_customer_hierarchy(self, test_db: AsyncSession, test_tenant):
        """Test customer parent-child relationships"""
        parent_data = CustomerCreate(
            name="Parent Customer",
            code="PARENT001",
            customer_type="corporate",
            status="active"
        )
        parent_customer = await customer.create(
            test_db, obj_in=parent_data, tenant_id=test_tenant.id
        )
        
        child_data = CustomerCreate(
            name="Child Customer",
            code="CHILD001",
            customer_type="retail",
            status="active",
            parent_customer_id=parent_customer.id
        )
        child_customer = await customer.create(
            test_db, obj_in=child_data, tenant_id=test_tenant.id
        )
        
        # Test hierarchy retrieval
        hierarchy = await customer.get_customer_hierarchy(
            test_db, customer_id=parent_customer.id, tenant_id=test_tenant.id
        )
        
        assert len(hierarchy) >= 1
        child_ids = [c.id for c in hierarchy]
        assert child_customer.id in child_ids


class TestProductCRUD:
    """Test Product CRUD operations"""
    
    @pytest.fixture
    async def test_tenant(self, test_db: AsyncSession):
        """Create a test tenant"""
        tenant_data = TenantCreate(
            name="Test Tenant",
            slug="test-tenant",
            status="active"
        )
        return await tenant.create(test_db, obj_in=tenant_data)
    
    @pytest.mark.asyncio
    async def test_create_product(self, test_db: AsyncSession, test_tenant):
        """Test product creation"""
        product_data = ProductCreate(
            name="Test Product",
            sku="PROD001",
            description="Test product description",
            category="Electronics",
            unit_price=99.99,
            cost_price=50.00,
            currency="USD",
            status="active"
        )
        
        created_product = await product.create(
            test_db, obj_in=product_data, tenant_id=test_tenant.id
        )
        
        assert created_product.id is not None
        assert created_product.name == "Test Product"
        assert created_product.sku == "PROD001"
        assert created_product.unit_price == 99.99
    
    @pytest.mark.asyncio
    async def test_search_products(self, test_db: AsyncSession, test_tenant):
        """Test product search functionality"""
        product_data_1 = ProductCreate(
            name="Electronics Product",
            sku="ELEC001",
            category="Electronics",
            currency="USD",
            status="active"
        )
        product_data_2 = ProductCreate(
            name="Clothing Product",
            sku="CLOTH001",
            category="Clothing",
            currency="USD",
            status="active"
        )
        
        await product.create(test_db, obj_in=product_data_1, tenant_id=test_tenant.id)
        await product.create(test_db, obj_in=product_data_2, tenant_id=test_tenant.id)
        
        # Search by category
        electronics_products = await product.search_products(
            test_db, tenant_id=test_tenant.id, category="Electronics"
        )
        
        assert len(electronics_products) >= 1
        assert all(p.category == "Electronics" for p in electronics_products)


class TestBudgetCRUD:
    """Test Budget CRUD operations"""
    
    @pytest.fixture
    async def test_tenant(self, test_db: AsyncSession):
        """Create a test tenant"""
        tenant_data = TenantCreate(
            name="Test Tenant",
            slug="test-tenant",
            status="active"
        )
        return await tenant.create(test_db, obj_in=tenant_data)
    
    @pytest.mark.asyncio
    async def test_create_budget(self, test_db: AsyncSession, test_tenant):
        """Test budget creation"""
        budget_data = BudgetCreate(
            name="Test Budget",
            budget_type="marketing",
            total_amount=50000.00,
            currency="USD",
            period_start="2025-01-01",
            period_end="2025-12-31"
        )
        
        created_budget = await budget.create(
            test_db, obj_in=budget_data, tenant_id=test_tenant.id
        )
        
        assert created_budget.id is not None
        assert created_budget.name == "Test Budget"
        assert created_budget.total_amount == 50000.00
        assert created_budget.status == "draft"
        assert created_budget.approval_status == "pending"
    
    @pytest.mark.asyncio
    async def test_approve_budget(self, test_db: AsyncSession, test_tenant):
        """Test budget approval"""
        budget_data = BudgetCreate(
            name="Approval Test Budget",
            budget_type="marketing",
            total_amount=25000.00,
            currency="USD",
            period_start="2025-01-01",
            period_end="2025-12-31"
        )
        
        created_budget = await budget.create(
            test_db, obj_in=budget_data, tenant_id=test_tenant.id
        )
        
        approved_budget = await budget.approve_budget(
            test_db, budget_id=created_budget.id, tenant_id=test_tenant.id
        )
        
        assert approved_budget.approval_status == "approved"
        assert approved_budget.status == "active"


class TestTradeSpendCRUD:
    """Test TradeSpend CRUD operations"""
    
    @pytest.fixture
    async def test_setup(self, test_db: AsyncSession):
        """Create test tenant and customer"""
        tenant_data = TenantCreate(
            name="Test Tenant",
            slug="test-tenant",
            status="active"
        )
        test_tenant = await tenant.create(test_db, obj_in=tenant_data)
        
        customer_data = CustomerCreate(
            name="Test Customer",
            code="CUST001",
            customer_type="retail",
            status="active"
        )
        test_customer = await customer.create(
            test_db, obj_in=customer_data, tenant_id=test_tenant.id
        )
        
        return test_tenant, test_customer
    
    @pytest.mark.asyncio
    async def test_create_trade_spend(self, test_db: AsyncSession, test_setup):
        """Test trade spend creation"""
        test_tenant, test_customer = test_setup
        
        trade_spend_data = TradeSpendCreate(
            customer_id=test_customer.id,
            spend_type="promotion",
            amount=5000.00,
            description="Test trade spend"
        )
        
        created_spend = await trade_spend.create(
            test_db, obj_in=trade_spend_data, tenant_id=test_tenant.id
        )
        
        assert created_spend.id is not None
        assert created_spend.customer_id == test_customer.id
        assert created_spend.amount == 5000.00
        assert created_spend.status == "pending"
    
    @pytest.mark.asyncio
    async def test_approve_trade_spend(self, test_db: AsyncSession, test_setup):
        """Test trade spend approval"""
        test_tenant, test_customer = test_setup
        
        trade_spend_data = TradeSpendCreate(
            customer_id=test_customer.id,
            spend_type="promotion",
            amount=3000.00,
            description="Approval test spend"
        )
        
        created_spend = await trade_spend.create(
            test_db, obj_in=trade_spend_data, tenant_id=test_tenant.id
        )
        
        approved_spend = await trade_spend.approve_trade_spend(
            test_db, trade_spend_id=created_spend.id, tenant_id=test_tenant.id
        )
        
        assert approved_spend.status == "approved"
    
    @pytest.mark.asyncio
    async def test_get_spend_summary(self, test_db: AsyncSession, test_setup):
        """Test trade spend summary"""
        test_tenant, test_customer = test_setup
        
        # Create multiple trade spends
        spend_data_1 = TradeSpendCreate(
            customer_id=test_customer.id,
            spend_type="promotion",
            amount=2000.00
        )
        spend_data_2 = TradeSpendCreate(
            customer_id=test_customer.id,
            spend_type="advertising",
            amount=3000.00
        )
        
        await trade_spend.create(test_db, obj_in=spend_data_1, tenant_id=test_tenant.id)
        await trade_spend.create(test_db, obj_in=spend_data_2, tenant_id=test_tenant.id)
        
        summary = await trade_spend.get_spend_summary(
            test_db, tenant_id=test_tenant.id
        )
        
        assert summary["total_amount"] >= 5000.00
        assert summary["total_count"] >= 2


class TestTradingTermsCRUD:
    """Test TradingTerms CRUD operations"""
    
    @pytest.fixture
    async def test_setup(self, test_db: AsyncSession):
        """Create test tenant and customer"""
        tenant_data = TenantCreate(
            name="Test Tenant",
            slug="test-tenant",
            status="active"
        )
        test_tenant = await tenant.create(test_db, obj_in=tenant_data)
        
        customer_data = CustomerCreate(
            name="Test Customer",
            code="CUST001",
            customer_type="retail",
            status="active"
        )
        test_customer = await customer.create(
            test_db, obj_in=customer_data, tenant_id=test_tenant.id
        )
        
        return test_tenant, test_customer
    
    @pytest.mark.asyncio
    async def test_create_trading_terms(self, test_db: AsyncSession, test_setup):
        """Test trading terms creation"""
        test_tenant, test_customer = test_setup
        
        terms_data = TradingTermsCreate(
            customer_id=test_customer.id,
            term_type="discount",
            term_name="Volume Discount",
            rate=5.0,
            currency="USD",
            effective_date="2025-01-01",
            expiry_date="2025-12-31"
        )
        
        created_terms = await trading_terms.create(
            test_db, obj_in=terms_data, tenant_id=test_tenant.id
        )
        
        assert created_terms.id is not None
        assert created_terms.term_name == "Volume Discount"
        assert created_terms.rate == 5.0
        assert created_terms.status == "active"
    
    @pytest.mark.asyncio
    async def test_get_expiring_terms(self, test_db: AsyncSession, test_setup):
        """Test getting expiring trading terms"""
        test_tenant, test_customer = test_setup
        
        # Create terms expiring soon
        expiring_terms_data = TradingTermsCreate(
            customer_id=test_customer.id,
            term_type="discount",
            term_name="Expiring Discount",
            rate=3.0,
            currency="USD",
            effective_date="2025-01-01",
            expiry_date=(datetime.utcnow() + timedelta(days=15)).strftime("%Y-%m-%d")
        )
        
        await trading_terms.create(
            test_db, obj_in=expiring_terms_data, tenant_id=test_tenant.id
        )
        
        expiring_terms = await trading_terms.get_expiring_terms(
            test_db, tenant_id=test_tenant.id, days_ahead=30
        )
        
        assert len(expiring_terms) >= 1
        assert any(term.term_name == "Expiring Discount" for term in expiring_terms)


class TestActivityGridCRUD:
    """Test ActivityGrid CRUD operations"""
    
    @pytest.fixture
    async def test_tenant(self, test_db: AsyncSession):
        """Create a test tenant"""
        tenant_data = TenantCreate(
            name="Test Tenant",
            slug="test-tenant",
            status="active"
        )
        return await tenant.create(test_db, obj_in=tenant_data)
    
    @pytest.mark.asyncio
    async def test_create_activity_grid_with_items(self, test_db: AsyncSession, test_tenant):
        """Test activity grid creation with items"""
        grid_data = ActivityGridCreate(
            name="Test Activity Grid",
            description="Test grid description",
            period_start="2025-01-01",
            period_end="2025-03-31",
            items=[
                {
                    "activity_name": "Marketing Campaign",
                    "planned_cost": 10000.00,
                    "status": "planned"
                },
                {
                    "activity_name": "Trade Show",
                    "planned_cost": 15000.00,
                    "status": "planned"
                }
            ]
        )
        
        created_grid = await activity_grid.create_with_items(
            test_db, obj_in=grid_data, tenant_id=test_tenant.id
        )
        
        assert created_grid.id is not None
        assert created_grid.name == "Test Activity Grid"
        assert len(created_grid.items) == 2
        assert created_grid.total_planned_cost == 25000.00
    
    @pytest.mark.asyncio
    async def test_recalculate_grid_totals(self, test_db: AsyncSession, test_tenant):
        """Test activity grid total recalculation"""
        grid_data = ActivityGridCreate(
            name="Recalc Test Grid",
            period_start="2025-01-01",
            period_end="2025-03-31",
            items=[
                {
                    "activity_name": "Activity 1",
                    "planned_cost": 5000.00,
                    "actual_cost": 4500.00,
                    "status": "completed"
                }
            ]
        )
        
        created_grid = await activity_grid.create_with_items(
            test_db, obj_in=grid_data, tenant_id=test_tenant.id
        )
        
        recalculated_grid = await activity_grid.recalculate_totals(
            test_db, activity_grid_id=created_grid.id, tenant_id=test_tenant.id
        )
        
        assert recalculated_grid.total_planned_cost == 5000.00
        assert recalculated_grid.total_actual_cost == 4500.00
    
    @pytest.mark.asyncio
    async def test_get_grid_summary(self, test_db: AsyncSession, test_tenant):
        """Test activity grid summary"""
        # Create multiple grids
        grid_data_1 = ActivityGridCreate(
            name="Grid 1",
            period_start="2025-01-01",
            period_end="2025-03-31",
            items=[{"activity_name": "Activity 1", "planned_cost": 10000.00}]
        )
        grid_data_2 = ActivityGridCreate(
            name="Grid 2",
            period_start="2025-01-01",
            period_end="2025-03-31",
            items=[{"activity_name": "Activity 2", "planned_cost": 15000.00}]
        )
        
        await activity_grid.create_with_items(test_db, obj_in=grid_data_1, tenant_id=test_tenant.id)
        await activity_grid.create_with_items(test_db, obj_in=grid_data_2, tenant_id=test_tenant.id)
        
        summary = await activity_grid.get_summary(
            test_db, tenant_id=test_tenant.id
        )
        
        assert summary["total_grids"] >= 2
        assert summary["total_planned_cost"] >= 25000.00