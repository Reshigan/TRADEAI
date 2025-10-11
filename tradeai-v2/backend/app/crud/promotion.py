"""
CRUD operations for Promotion
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import date
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.promotion import Promotion
from app.schemas.promotion import PromotionCreate, PromotionUpdate


class CRUDPromotion(CRUDBase[Promotion, PromotionCreate, PromotionUpdate]):
    async def get_by_code(
        self, 
        db: AsyncSession, 
        *, 
        code: str,
        tenant_id: Optional[UUID] = None
    ) -> Optional[Promotion]:
        """Get promotion by code"""
        return await self.get_by_field(db=db, field="code", value=code, tenant_id=tenant_id)
    
    async def get_active_promotions(
        self,
        db: AsyncSession,
        *,
        tenant_id: Optional[UUID] = None,
        customer_id: Optional[UUID] = None,
        product_id: Optional[UUID] = None,
        region: Optional[str] = None
    ) -> List[Promotion]:
        """Get active promotions with optional filtering"""
        today = date.today()
        
        query = select(Promotion).where(
            and_(
                Promotion.status == "active",
                Promotion.start_date <= today,
                Promotion.end_date >= today
            )
        )
        
        # Add tenant filtering
        if tenant_id:
            query = query.where(Promotion.tenant_id == tenant_id)
        
        # Add soft delete filtering
        query = query.where(Promotion.deleted_at.is_(None))
        
        # Filter by customer eligibility
        if customer_id:
            query = query.where(
                or_(
                    Promotion.eligible_customers.is_(None),
                    Promotion.eligible_customers.contains([str(customer_id)]),
                    Promotion.eligible_customers.contains(["all"])
                )
            )
        
        # Filter by product eligibility
        if product_id:
            query = query.where(
                or_(
                    Promotion.eligible_products.is_(None),
                    Promotion.eligible_products.contains([str(product_id)])
                )
            )
        
        # Filter by region eligibility
        if region:
            query = query.where(
                or_(
                    Promotion.eligible_regions.is_(None),
                    Promotion.eligible_regions.contains([region])
                )
            )
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_promotions_by_owner(
        self,
        db: AsyncSession,
        *,
        owner_id: UUID,
        tenant_id: Optional[UUID] = None,
        status: Optional[str] = None
    ) -> List[Promotion]:
        """Get promotions by owner"""
        filters = {"owner_id": owner_id}
        if status:
            filters["status"] = status
        
        return await self.get_multi(
            db=db,
            tenant_id=tenant_id,
            filters=filters,
            order_by="-created_at"
        )
    
    async def get_promotions_by_date_range(
        self,
        db: AsyncSession,
        *,
        start_date: date,
        end_date: date,
        tenant_id: Optional[UUID] = None
    ) -> List[Promotion]:
        """Get promotions within date range"""
        query = select(Promotion).where(
            or_(
                and_(
                    Promotion.start_date >= start_date,
                    Promotion.start_date <= end_date
                ),
                and_(
                    Promotion.end_date >= start_date,
                    Promotion.end_date <= end_date
                ),
                and_(
                    Promotion.start_date <= start_date,
                    Promotion.end_date >= end_date
                )
            )
        )
        
        if tenant_id:
            query = query.where(Promotion.tenant_id == tenant_id)
        
        query = query.where(Promotion.deleted_at.is_(None))
        query = query.order_by(Promotion.start_date)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def update_performance(
        self,
        db: AsyncSession,
        *,
        promotion_id: UUID,
        volume_delta: float = 0,
        revenue_delta: float = 0,
        spend_delta: float = 0,
        redemptions_delta: int = 0,
        tenant_id: Optional[UUID] = None
    ) -> Optional[Promotion]:
        """Update promotion performance metrics"""
        promotion = await self.get(db=db, id=promotion_id, tenant_id=tenant_id)
        if not promotion:
            return None
        
        # Update metrics
        promotion.actual_volume += volume_delta
        promotion.actual_revenue += revenue_delta
        promotion.budget_spent += spend_delta
        promotion.total_redemptions += redemptions_delta
        
        db.add(promotion)
        await db.commit()
        await db.refresh(promotion)
        return promotion
    
    async def approve_promotion(
        self,
        db: AsyncSession,
        *,
        promotion_id: UUID,
        approved_by: UUID,
        tenant_id: Optional[UUID] = None
    ) -> Optional[Promotion]:
        """Approve a promotion"""
        from datetime import datetime
        
        promotion = await self.get(db=db, id=promotion_id, tenant_id=tenant_id)
        if not promotion:
            return None
        
        promotion.approved_by = approved_by
        promotion.approved_at = datetime.utcnow()
        promotion.status = "active"
        promotion.updated_by = approved_by
        
        db.add(promotion)
        await db.commit()
        await db.refresh(promotion)
        return promotion
    
    async def code_exists(
        self,
        db: AsyncSession,
        *,
        code: str,
        tenant_id: Optional[UUID] = None,
        exclude_id: Optional[UUID] = None
    ) -> bool:
        """Check if promotion code already exists"""
        return await self.exists(
            db=db, 
            field="code", 
            value=code, 
            tenant_id=tenant_id,
            exclude_id=exclude_id
        )


promotion = CRUDPromotion(Promotion)