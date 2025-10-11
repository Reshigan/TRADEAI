"""
Budget CRUD operations
"""

from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.crud.base import CRUDBase
from app.models.budget import Budget
from app.schemas.budget import BudgetCreate, BudgetUpdate


class CRUDBudget(CRUDBase[Budget, BudgetCreate, BudgetUpdate]):
    async def get_multi_by_tenant(
        self,
        db: AsyncSession,
        tenant_id: UUID,
        skip: int = 0,
        limit: int = 100,
        **filters
    ) -> List[Budget]:
        """Get budgets by tenant with optional filters"""
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
                    self.model.description.ilike(search_term)
                )
            )
        
        if "budget_type" in filters and filters["budget_type"]:
            query = query.where(self.model.budget_type == filters["budget_type"])
        
        if "status" in filters and filters["status"]:
            query = query.where(self.model.status == filters["status"])
        
        if "period" in filters and filters["period"]:
            query = query.where(self.model.period == filters["period"])
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_by_tenant(
        self, db: AsyncSession, id: UUID, tenant_id: UUID
    ) -> Optional[Budget]:
        """Get budget by ID and tenant"""
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
        self, db: AsyncSession, obj_in: BudgetCreate, tenant_id: UUID
    ) -> Budget:
        """Create budget with tenant"""
        obj_data = obj_in.model_dump()
        obj_data["tenant_id"] = tenant_id
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_by_code(
        self, db: AsyncSession, code: str, tenant_id: UUID
    ) -> Optional[Budget]:
        """Get budget by code and tenant"""
        query = select(self.model).where(
            and_(
                self.model.code == code,
                self.model.tenant_id == tenant_id,
                self.model.deleted_at.is_(None)
            )
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()


budget = CRUDBudget(Budget)