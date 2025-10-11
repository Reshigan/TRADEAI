"""
Budget management endpoints
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_tenant
from app.crud import budget as crud_budget
from app.models.tenant import Tenant
from app.schemas.budget import Budget, BudgetCreate, BudgetUpdate

router = APIRouter()


@router.get("/", response_model=List[Budget])
async def list_budgets(
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    budget_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    period: Optional[str] = Query(None),
):
    """List budgets with filtering and pagination"""
    filters = {}
    if search:
        filters["search"] = search
    if budget_type:
        filters["budget_type"] = budget_type
    if status:
        filters["status"] = status
    if period:
        filters["period"] = period
    
    budgets = await crud_budget.budget.get_multi_by_tenant(
        db=db, tenant_id=tenant.id, skip=skip, limit=limit, **filters
    )
    return budgets


@router.post("/", response_model=Budget, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget_in: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Create a new budget"""
    budget = await crud_budget.budget.create_with_tenant(
        db=db, obj_in=budget_in, tenant_id=tenant.id
    )
    return budget


@router.get("/{budget_id}", response_model=Budget)
async def get_budget(
    budget_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get budget by ID"""
    budget = await crud_budget.budget.get_by_tenant(
        db=db, id=budget_id, tenant_id=tenant.id
    )
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    return budget


@router.put("/{budget_id}", response_model=Budget)
async def update_budget(
    budget_id: UUID,
    budget_in: BudgetUpdate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Update budget"""
    budget = await crud_budget.budget.get_by_tenant(
        db=db, id=budget_id, tenant_id=tenant.id
    )
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    budget = await crud_budget.budget.update(
        db=db, db_obj=budget, obj_in=budget_in
    )
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Delete budget (soft delete)"""
    budget = await crud_budget.budget.get_by_tenant(
        db=db, id=budget_id, tenant_id=tenant.id
    )
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    await crud_budget.budget.remove(db=db, id=budget_id)


@router.post("/{budget_id}/approve", response_model=Budget)
async def approve_budget(
    budget_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Approve budget"""
    budget = await crud_budget.budget.get_by_tenant(
        db=db, id=budget_id, tenant_id=tenant.id
    )
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    # Update status to approved
    budget_update = BudgetUpdate(status="approved")
    budget = await crud_budget.budget.update(
        db=db, db_obj=budget, obj_in=budget_update
    )
    return budget