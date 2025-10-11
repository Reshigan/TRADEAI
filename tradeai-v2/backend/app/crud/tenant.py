"""
CRUD operations for Tenant
"""

from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate, TenantUpdate


class CRUDTenant(CRUDBase[Tenant, TenantCreate, TenantUpdate]):
    async def get_by_slug(
        self, 
        db: AsyncSession, 
        *, 
        slug: str
    ) -> Optional[Tenant]:
        """Get tenant by slug"""
        return await self.get_by_field(db=db, field="slug", value=slug)
    
    async def get_by_domain(
        self, 
        db: AsyncSession, 
        *, 
        domain: str
    ) -> Optional[Tenant]:
        """Get tenant by domain"""
        return await self.get_by_field(db=db, field="domain", value=domain)
    
    async def slug_exists(
        self,
        db: AsyncSession,
        *,
        slug: str,
        exclude_id: Optional[UUID] = None
    ) -> bool:
        """Check if slug already exists"""
        return await self.exists(db=db, field="slug", value=slug, exclude_id=exclude_id)


tenant = CRUDTenant(Tenant)