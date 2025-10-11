"""
Trade spend management endpoints
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_tenant
from app.crud import trade_spend as crud_trade_spend
from app.models.tenant import Tenant
from app.schemas.trade_spend import TradeSpend, TradeSpendCreate, TradeSpendUpdate

router = APIRouter()


@router.get("/", response_model=List[TradeSpend])
async def list_trade_spend(
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    spend_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    customer_id: Optional[UUID] = Query(None),
):
    """List trade spend records with filtering and pagination"""
    filters = {}
    if search:
        filters["search"] = search
    if spend_type:
        filters["spend_type"] = spend_type
    if status:
        filters["status"] = status
    if customer_id:
        filters["customer_id"] = customer_id
    
    trade_spends = await crud_trade_spend.trade_spend.get_multi_by_tenant(
        db=db, tenant_id=tenant.id, skip=skip, limit=limit, **filters
    )
    return trade_spends


@router.post("/", response_model=TradeSpend, status_code=status.HTTP_201_CREATED)
async def create_trade_spend(
    trade_spend_in: TradeSpendCreate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Create a new trade spend record"""
    trade_spend = await crud_trade_spend.trade_spend.create_with_tenant(
        db=db, obj_in=trade_spend_in, tenant_id=tenant.id
    )
    return trade_spend


@router.get("/{trade_spend_id}", response_model=TradeSpend)
async def get_trade_spend(
    trade_spend_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get trade spend record by ID"""
    trade_spend = await crud_trade_spend.trade_spend.get_by_tenant(
        db=db, id=trade_spend_id, tenant_id=tenant.id
    )
    if not trade_spend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade spend record not found"
        )
    return trade_spend


@router.put("/{trade_spend_id}", response_model=TradeSpend)
async def update_trade_spend(
    trade_spend_id: UUID,
    trade_spend_in: TradeSpendUpdate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Update trade spend record"""
    trade_spend = await crud_trade_spend.trade_spend.get_by_tenant(
        db=db, id=trade_spend_id, tenant_id=tenant.id
    )
    if not trade_spend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade spend record not found"
        )
    
    trade_spend = await crud_trade_spend.trade_spend.update(
        db=db, db_obj=trade_spend, obj_in=trade_spend_in
    )
    return trade_spend


@router.delete("/{trade_spend_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trade_spend(
    trade_spend_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Delete trade spend record (soft delete)"""
    trade_spend = await crud_trade_spend.trade_spend.get_by_tenant(
        db=db, id=trade_spend_id, tenant_id=tenant.id
    )
    if not trade_spend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade spend record not found"
        )
    
    await crud_trade_spend.trade_spend.remove(db=db, id=trade_spend_id)


@router.post("/{trade_spend_id}/approve", response_model=TradeSpend)
async def approve_trade_spend(
    trade_spend_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Approve trade spend record"""
    trade_spend = await crud_trade_spend.trade_spend.get_by_tenant(
        db=db, id=trade_spend_id, tenant_id=tenant.id
    )
    if not trade_spend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade spend record not found"
        )
    
    # Update status to approved
    trade_spend_update = TradeSpendUpdate(status="approved")
    trade_spend = await crud_trade_spend.trade_spend.update(
        db=db, db_obj=trade_spend, obj_in=trade_spend_update
    )
    return trade_spend


@router.get("/summary/by-customer", response_model=List[dict])
async def get_trade_spend_summary_by_customer(
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get trade spend summary grouped by customer"""
    # This would typically involve a more complex query
    # For now, return basic structure
    return await crud_trade_spend.trade_spend.get_summary_by_customer(
        db=db, tenant_id=tenant.id
    )