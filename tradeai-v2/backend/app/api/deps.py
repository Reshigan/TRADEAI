"""
API dependencies
"""

from typing import Generator, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session
from app.crud import tenant as crud_tenant
from app.models.tenant import Tenant


async def get_db() -> AsyncSession:
    """Get database session"""
    async with async_session() as session:
        yield session


async def get_current_tenant(
    db: AsyncSession = Depends(get_db),
    x_tenant_slug: Optional[str] = Header(None, description="Tenant slug")
) -> Tenant:
    """Get current tenant from header"""
    if not x_tenant_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant slug header (X-Tenant-Slug) is required"
        )
    
    tenant = await crud_tenant.get_by_slug(db=db, slug=x_tenant_slug)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    if not tenant.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant is not active"
        )
    
    return tenant


# Import get_current_user from auth endpoints to avoid circular imports
def get_current_user():
    """Import get_current_user function"""
    from app.api.api_v1.endpoints.auth import get_current_user
    return get_current_user