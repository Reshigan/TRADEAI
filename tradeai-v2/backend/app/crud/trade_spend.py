"""
CRUD operations for trade spend
"""

from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.trade_spend import TradeSpend
from app.schemas.trade_spend import TradeSpendCreate, TradeSpendUpdate


class CRUDTradeSpend(CRUDBase[TradeSpend, TradeSpendCreate, TradeSpendUpdate]):
    async def get_multi_by_tenant(
        self,
        db: AsyncSession,
        *,
        tenant_id: UUID,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        spend_type: Optional[str] = None,
        status: Optional[str] = None,
        customer_id: Optional[UUID] = None,
    ) -> List[TradeSpend]:
        """Get multiple trade spend records with filtering"""
        query = select(self.model).where(self.model.tenant_id == tenant_id)
        
        if search:
            query = query.where(
                self.model.description.ilike(f"%{search}%")
            )
        
        if spend_type:
            query = query.where(self.model.spend_type == spend_type)
            
        if status:
            query = query.where(self.model.status == status)
            
        if customer_id:
            query = query.where(self.model.customer_id == customer_id)
        
        query = query.offset(skip).limit(limit).order_by(self.model.created_at.desc())
        result = await db.execute(query)
        return result.scalars().all()

    async def get_summary_by_customer(
        self, db: AsyncSession, *, tenant_id: UUID
    ) -> List[Dict[str, Any]]:
        """Get trade spend summary grouped by customer"""
        query = select(
            self.model.customer_id,
            func.sum(self.model.amount).label("total_amount"),
            func.count(self.model.id).label("record_count")
        ).where(
            self.model.tenant_id == tenant_id
        ).group_by(self.model.customer_id)
        
        result = await db.execute(query)
        return [
            {
                "customer_id": str(row.customer_id),
                "total_amount": float(row.total_amount or 0),
                "record_count": row.record_count
            }
            for row in result
        ]


trade_spend = CRUDTradeSpend(TradeSpend)