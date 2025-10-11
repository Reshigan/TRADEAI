"""
CRUD operations for trading terms
"""

from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.trading_terms import TradingTerms
from app.schemas.trading_terms import TradingTermsCreate, TradingTermsUpdate


class CRUDTradingTerms(CRUDBase[TradingTerms, TradingTermsCreate, TradingTermsUpdate]):
    async def get_multi_by_tenant(
        self,
        db: AsyncSession,
        *,
        tenant_id: UUID,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        term_type: Optional[str] = None,
        status: Optional[str] = None,
        customer_id: Optional[UUID] = None,
    ) -> List[TradingTerms]:
        """Get multiple trading terms with filtering"""
        query = select(self.model).where(self.model.tenant_id == tenant_id)
        
        if search:
            query = query.where(
                self.model.term_name.ilike(f"%{search}%") |
                self.model.description.ilike(f"%{search}%")
            )
        
        if term_type:
            query = query.where(self.model.term_type == term_type)
            
        if status:
            query = query.where(self.model.status == status)
            
        if customer_id:
            query = query.where(self.model.customer_id == customer_id)
        
        query = query.offset(skip).limit(limit).order_by(self.model.created_at.desc())
        result = await db.execute(query)
        return result.scalars().all()

    async def get_active_terms_by_customer(
        self, db: AsyncSession, *, tenant_id: UUID, customer_id: UUID
    ) -> List[TradingTerms]:
        """Get active trading terms for a specific customer"""
        query = select(self.model).where(
            self.model.tenant_id == tenant_id,
            self.model.customer_id == customer_id,
            self.model.status == "active"
        ).order_by(self.model.effective_date.desc())
        
        result = await db.execute(query)
        return result.scalars().all()

    async def get_expiring_terms(
        self, db: AsyncSession, *, tenant_id: UUID, days_ahead: int = 30
    ) -> List[TradingTerms]:
        """Get terms expiring within specified days"""
        from datetime import datetime, timedelta
        
        expiry_threshold = datetime.utcnow() + timedelta(days=days_ahead)
        
        query = select(self.model).where(
            self.model.tenant_id == tenant_id,
            self.model.status == "active",
            self.model.expiry_date <= expiry_threshold,
            self.model.expiry_date >= datetime.utcnow()
        ).order_by(self.model.expiry_date.asc())
        
        result = await db.execute(query)
        return result.scalars().all()


trading_terms = CRUDTradingTerms(TradingTerms)