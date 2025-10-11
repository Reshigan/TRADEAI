"""
Customer CRUD operations
"""

from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.crud.base import CRUDBase
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


class CRUDCustomer(CRUDBase[Customer, CustomerCreate, CustomerUpdate]):
    async def get_multi_by_tenant(
        self,
        db: AsyncSession,
        tenant_id: UUID,
        skip: int = 0,
        limit: int = 100,
        **filters
    ) -> List[Customer]:
        """Get customers by tenant with optional filters"""
        query = select(self.model).where(
            and_(
                self.model.tenant_id == tenant_id,
                self.model.deleted_at.is_(None)
            )
        )
        
        # Apply filters
        if "search" in filters and filters["search"]:
            search_term = f"%{filters['search']}%"
            query = query.where(
                or_(
                    self.model.name.ilike(search_term),
                    self.model.code.ilike(search_term),
                    self.model.email.ilike(search_term)
                )
            )
        
        if "customer_type" in filters and filters["customer_type"]:
            query = query.where(self.model.customer_type == filters["customer_type"])
        
        if "status" in filters and filters["status"]:
            query = query.where(self.model.status == filters["status"])
        
        if "parent_customer_id" in filters and filters["parent_customer_id"]:
            query = query.where(self.model.parent_customer_id == filters["parent_customer_id"])
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_by_tenant(
        self, db: AsyncSession, id: UUID, tenant_id: UUID
    ) -> Optional[Customer]:
        """Get customer by ID and tenant"""
        query = select(self.model).where(
            and_(
                self.model.id == id,
                self.model.tenant_id == tenant_id,
                self.model.deleted_at.is_(None)
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def create_with_tenant(
        self, db: AsyncSession, obj_in: CustomerCreate, tenant_id: UUID
    ) -> Customer:
        """Create customer with tenant"""
        obj_data = obj_in.model_dump()
        obj_data["tenant_id"] = tenant_id
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_by_code(
        self, db: AsyncSession, code: str, tenant_id: UUID
    ) -> Optional[Customer]:
        """Get customer by code and tenant"""
        query = select(self.model).where(
            and_(
                self.model.code == code,
                self.model.tenant_id == tenant_id,
                self.model.deleted_at.is_(None)
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_hierarchy(
        self, db: AsyncSession, customer_id: UUID, tenant_id: UUID
    ) -> List[Customer]:
        """Get customer hierarchy (children)"""
        query = select(self.model).where(
            and_(
                self.model.parent_customer_id == customer_id,
                self.model.tenant_id == tenant_id,
                self.model.deleted_at.is_(None)
            )
        )
        result = await db.execute(query)
        return result.scalars().all()


customer = CRUDCustomer(Customer)