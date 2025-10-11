"""
Trading terms management endpoints
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_tenant
from app.crud import trading_terms as crud_trading_terms
from app.models.tenant import Tenant
from app.schemas.trading_terms import TradingTerms, TradingTermsCreate, TradingTermsUpdate

router = APIRouter()


@router.get("/", response_model=List[TradingTerms])
async def list_trading_terms(
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    term_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    customer_id: Optional[UUID] = Query(None),
):
    """List trading terms with filtering and pagination"""
    filters = {}
    if search:
        filters["search"] = search
    if term_type:
        filters["term_type"] = term_type
    if status:
        filters["status"] = status
    if customer_id:
        filters["customer_id"] = customer_id
    
    trading_terms = await crud_trading_terms.trading_terms.get_multi_by_tenant(
        db=db, tenant_id=tenant.id, skip=skip, limit=limit, **filters
    )
    return trading_terms


@router.post("/", response_model=TradingTerms, status_code=status.HTTP_201_CREATED)
async def create_trading_terms(
    trading_terms_in: TradingTermsCreate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Create new trading terms"""
    trading_terms = await crud_trading_terms.trading_terms.create_with_tenant(
        db=db, obj_in=trading_terms_in, tenant_id=tenant.id
    )
    return trading_terms


@router.get("/{trading_terms_id}", response_model=TradingTerms)
async def get_trading_terms(
    trading_terms_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get trading terms by ID"""
    trading_terms = await crud_trading_terms.trading_terms.get_by_tenant(
        db=db, id=trading_terms_id, tenant_id=tenant.id
    )
    if not trading_terms:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trading terms not found"
        )
    return trading_terms


@router.put("/{trading_terms_id}", response_model=TradingTerms)
async def update_trading_terms(
    trading_terms_id: UUID,
    trading_terms_in: TradingTermsUpdate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Update trading terms"""
    trading_terms = await crud_trading_terms.trading_terms.get_by_tenant(
        db=db, id=trading_terms_id, tenant_id=tenant.id
    )
    if not trading_terms:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trading terms not found"
        )
    
    trading_terms = await crud_trading_terms.trading_terms.update(
        db=db, db_obj=trading_terms, obj_in=trading_terms_in
    )
    return trading_terms


@router.delete("/{trading_terms_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trading_terms(
    trading_terms_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Delete trading terms (soft delete)"""
    trading_terms = await crud_trading_terms.trading_terms.get_by_tenant(
        db=db, id=trading_terms_id, tenant_id=tenant.id
    )
    if not trading_terms:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trading terms not found"
        )
    
    await crud_trading_terms.trading_terms.remove(db=db, id=trading_terms_id)


@router.get("/customer/{customer_id}/active", response_model=List[TradingTerms])
async def get_active_terms_by_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get active trading terms for a specific customer"""
    trading_terms = await crud_trading_terms.trading_terms.get_active_terms_by_customer(
        db=db, tenant_id=tenant.id, customer_id=customer_id
    )
    return trading_terms


@router.get("/expiring/", response_model=List[TradingTerms])
async def get_expiring_terms(
    days_ahead: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get trading terms expiring within specified days"""
    trading_terms = await crud_trading_terms.trading_terms.get_expiring_terms(
        db=db, tenant_id=tenant.id, days_ahead=days_ahead
    )
    return trading_terms


@router.post("/{trading_terms_id}/activate", response_model=TradingTerms)
async def activate_trading_terms(
    trading_terms_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Activate trading terms"""
    trading_terms = await crud_trading_terms.trading_terms.get_by_tenant(
        db=db, id=trading_terms_id, tenant_id=tenant.id
    )
    if not trading_terms:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trading terms not found"
        )
    
    # Update status to active
    trading_terms_update = TradingTermsUpdate(status="active")
    trading_terms = await crud_trading_terms.trading_terms.update(
        db=db, db_obj=trading_terms, obj_in=trading_terms_update
    )
    return trading_terms


@router.post("/{trading_terms_id}/deactivate", response_model=TradingTerms)
async def deactivate_trading_terms(
    trading_terms_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Deactivate trading terms"""
    trading_terms = await crud_trading_terms.trading_terms.get_by_tenant(
        db=db, id=trading_terms_id, tenant_id=tenant.id
    )
    if not trading_terms:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trading terms not found"
        )
    
    # Update status to inactive
    trading_terms_update = TradingTermsUpdate(status="inactive")
    trading_terms = await crud_trading_terms.trading_terms.update(
        db=db, db_obj=trading_terms, obj_in=trading_terms_update
    )
    return trading_terms