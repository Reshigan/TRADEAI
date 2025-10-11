"""
CRUD operations for activity grids
"""

from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.activity_grid import ActivityGrid, ActivityGridItem
from app.schemas.activity_grid import ActivityGridCreate, ActivityGridUpdate


class CRUDActivityGrid(CRUDBase[ActivityGrid, ActivityGridCreate, ActivityGridUpdate]):
    async def create_with_tenant(
        self, db: AsyncSession, *, obj_in: ActivityGridCreate, tenant_id: UUID
    ) -> ActivityGrid:
        """Create activity grid with tenant and items"""
        # Extract items from the input
        items_data = obj_in.items if obj_in.items else []
        obj_data = obj_in.model_dump(exclude={"items"})
        
        # Create the activity grid
        db_obj = self.model(**obj_data, tenant_id=tenant_id)
        db.add(db_obj)
        await db.flush()  # Get the ID
        
        # Create items if provided
        for item_data in items_data:
            item_obj = ActivityGridItem(
                **item_data.model_dump(),
                activity_grid_id=db_obj.id
            )
            db.add(item_obj)
        
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_multi_by_tenant(
        self,
        db: AsyncSession,
        *,
        tenant_id: UUID,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        status: Optional[str] = None,
        customer_id: Optional[UUID] = None,
        include_items: bool = False,
    ) -> List[ActivityGrid]:
        """Get multiple activity grids with filtering"""
        query = select(self.model).where(self.model.tenant_id == tenant_id)
        
        if include_items:
            query = query.options(selectinload(self.model.items))
        
        if search:
            query = query.where(
                self.model.name.ilike(f"%{search}%") |
                self.model.description.ilike(f"%{search}%")
            )
        
        if status:
            query = query.where(self.model.status == status)
            
        if customer_id:
            query = query.where(self.model.customer_id == customer_id)
        
        query = query.offset(skip).limit(limit).order_by(self.model.created_at.desc())
        result = await db.execute(query)
        return result.scalars().all()

    async def get_by_tenant_with_items(
        self, db: AsyncSession, *, id: UUID, tenant_id: UUID
    ) -> Optional[ActivityGrid]:
        """Get activity grid by ID with items"""
        query = select(self.model).options(selectinload(self.model.items)).where(
            self.model.id == id, self.model.tenant_id == tenant_id
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_summary_by_tenant(
        self, db: AsyncSession, *, tenant_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get activity grid summaries with item counts"""
        query = select(
            self.model.id,
            self.model.name,
            self.model.status,
            self.model.period_start,
            self.model.period_end,
            self.model.total_planned_cost,
            self.model.total_actual_cost,
            func.count(ActivityGridItem.id).label("items_count")
        ).outerjoin(ActivityGridItem).where(
            self.model.tenant_id == tenant_id
        ).group_by(self.model.id).offset(skip).limit(limit).order_by(
            self.model.created_at.desc()
        )
        
        result = await db.execute(query)
        return [dict(row._mapping) for row in result]

    async def update_totals(
        self, db: AsyncSession, *, activity_grid_id: UUID
    ) -> Optional[ActivityGrid]:
        """Update total costs based on items"""
        # Get the activity grid with items
        activity_grid = await self.get_by_tenant_with_items(
            db, id=activity_grid_id, tenant_id=None  # We'll check tenant in the calling code
        )
        
        if not activity_grid:
            return None
        
        # Calculate totals
        total_planned = sum(
            item.planned_cost or 0 for item in activity_grid.items
        )
        total_actual = sum(
            item.actual_cost or 0 for item in activity_grid.items
        )
        
        # Update the activity grid
        activity_grid.total_planned_cost = total_planned
        activity_grid.total_actual_cost = total_actual
        
        await db.commit()
        await db.refresh(activity_grid)
        return activity_grid


class CRUDActivityGridItem(CRUDBase[ActivityGridItem, Any, Any]):
    async def get_by_grid(
        self, db: AsyncSession, *, activity_grid_id: UUID
    ) -> List[ActivityGridItem]:
        """Get all items for an activity grid"""
        query = select(self.model).where(
            self.model.activity_grid_id == activity_grid_id
        ).order_by(self.model.created_at.asc())
        
        result = await db.execute(query)
        return result.scalars().all()

    async def create_for_grid(
        self, db: AsyncSession, *, obj_in: Dict[str, Any], activity_grid_id: UUID
    ) -> ActivityGridItem:
        """Create item for activity grid"""
        db_obj = self.model(**obj_in, activity_grid_id=activity_grid_id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj


activity_grid = CRUDActivityGrid(ActivityGrid)
activity_grid_item = CRUDActivityGridItem(ActivityGridItem)