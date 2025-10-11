"""
Activity grid management endpoints
"""

from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_tenant
from app.crud import activity_grid as crud_activity_grid
from app.models.tenant import Tenant
from app.schemas.activity_grid import (
    ActivityGrid, ActivityGridCreate, ActivityGridUpdate, ActivityGridSummary,
    ActivityGridItem, ActivityGridItemCreate, ActivityGridItemUpdate
)

router = APIRouter()


@router.get("/", response_model=List[ActivityGrid])
async def list_activity_grids(
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    customer_id: Optional[UUID] = Query(None),
    include_items: bool = Query(False),
):
    """List activity grids with filtering and pagination"""
    filters = {}
    if search:
        filters["search"] = search
    if status:
        filters["status"] = status
    if customer_id:
        filters["customer_id"] = customer_id
    
    activity_grids = await crud_activity_grid.activity_grid.get_multi_by_tenant(
        db=db, tenant_id=tenant.id, skip=skip, limit=limit, 
        include_items=include_items, **filters
    )
    return activity_grids


@router.get("/summary", response_model=List[ActivityGridSummary])
async def list_activity_grids_summary(
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """List activity grids summary with item counts"""
    summaries = await crud_activity_grid.activity_grid.get_summary_by_tenant(
        db=db, tenant_id=tenant.id, skip=skip, limit=limit
    )
    return summaries


@router.post("/", response_model=ActivityGrid, status_code=status.HTTP_201_CREATED)
async def create_activity_grid(
    activity_grid_in: ActivityGridCreate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Create new activity grid with items"""
    activity_grid = await crud_activity_grid.activity_grid.create_with_tenant(
        db=db, obj_in=activity_grid_in, tenant_id=tenant.id
    )
    return activity_grid


@router.get("/{activity_grid_id}", response_model=ActivityGrid)
async def get_activity_grid(
    activity_grid_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get activity grid by ID with items"""
    activity_grid = await crud_activity_grid.activity_grid.get_by_tenant_with_items(
        db=db, id=activity_grid_id, tenant_id=tenant.id
    )
    if not activity_grid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity grid not found"
        )
    return activity_grid


@router.put("/{activity_grid_id}", response_model=ActivityGrid)
async def update_activity_grid(
    activity_grid_id: UUID,
    activity_grid_in: ActivityGridUpdate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Update activity grid"""
    activity_grid = await crud_activity_grid.activity_grid.get_by_tenant(
        db=db, id=activity_grid_id, tenant_id=tenant.id
    )
    if not activity_grid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity grid not found"
        )
    
    activity_grid = await crud_activity_grid.activity_grid.update(
        db=db, db_obj=activity_grid, obj_in=activity_grid_in
    )
    return activity_grid


@router.delete("/{activity_grid_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity_grid(
    activity_grid_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Delete activity grid (soft delete)"""
    activity_grid = await crud_activity_grid.activity_grid.get_by_tenant(
        db=db, id=activity_grid_id, tenant_id=tenant.id
    )
    if not activity_grid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity grid not found"
        )
    
    await crud_activity_grid.activity_grid.remove(db=db, id=activity_grid_id)


# Activity Grid Items endpoints
@router.get("/{activity_grid_id}/items", response_model=List[ActivityGridItem])
async def list_activity_grid_items(
    activity_grid_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """List items for an activity grid"""
    # Verify grid exists and belongs to tenant
    activity_grid = await crud_activity_grid.activity_grid.get_by_tenant(
        db=db, id=activity_grid_id, tenant_id=tenant.id
    )
    if not activity_grid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity grid not found"
        )
    
    items = await crud_activity_grid.activity_grid_item.get_by_grid(
        db=db, activity_grid_id=activity_grid_id
    )
    return items


@router.post("/{activity_grid_id}/items", response_model=ActivityGridItem, status_code=status.HTTP_201_CREATED)
async def create_activity_grid_item(
    activity_grid_id: UUID,
    item_in: ActivityGridItemCreate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Create new item for activity grid"""
    # Verify grid exists and belongs to tenant
    activity_grid = await crud_activity_grid.activity_grid.get_by_tenant(
        db=db, id=activity_grid_id, tenant_id=tenant.id
    )
    if not activity_grid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity grid not found"
        )
    
    item = await crud_activity_grid.activity_grid_item.create_for_grid(
        db=db, obj_in=item_in.model_dump(), activity_grid_id=activity_grid_id
    )
    
    # Update grid totals
    await crud_activity_grid.activity_grid.update_totals(
        db=db, activity_grid_id=activity_grid_id
    )
    
    return item


@router.put("/{activity_grid_id}/items/{item_id}", response_model=ActivityGridItem)
async def update_activity_grid_item(
    activity_grid_id: UUID,
    item_id: UUID,
    item_in: ActivityGridItemUpdate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Update activity grid item"""
    # Verify grid exists and belongs to tenant
    activity_grid = await crud_activity_grid.activity_grid.get_by_tenant(
        db=db, id=activity_grid_id, tenant_id=tenant.id
    )
    if not activity_grid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity grid not found"
        )
    
    # Get and update item
    item = await crud_activity_grid.activity_grid_item.get(db=db, id=item_id)
    if not item or item.activity_grid_id != activity_grid_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity grid item not found"
        )
    
    item = await crud_activity_grid.activity_grid_item.update(
        db=db, db_obj=item, obj_in=item_in
    )
    
    # Update grid totals
    await crud_activity_grid.activity_grid.update_totals(
        db=db, activity_grid_id=activity_grid_id
    )
    
    return item


@router.delete("/{activity_grid_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity_grid_item(
    activity_grid_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Delete activity grid item"""
    # Verify grid exists and belongs to tenant
    activity_grid = await crud_activity_grid.activity_grid.get_by_tenant(
        db=db, id=activity_grid_id, tenant_id=tenant.id
    )
    if not activity_grid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity grid not found"
        )
    
    # Get and delete item
    item = await crud_activity_grid.activity_grid_item.get(db=db, id=item_id)
    if not item or item.activity_grid_id != activity_grid_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity grid item not found"
        )
    
    await crud_activity_grid.activity_grid_item.remove(db=db, id=item_id)
    
    # Update grid totals
    await crud_activity_grid.activity_grid.update_totals(
        db=db, activity_grid_id=activity_grid_id
    )


@router.post("/{activity_grid_id}/recalculate", response_model=ActivityGrid)
async def recalculate_activity_grid_totals(
    activity_grid_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Recalculate activity grid totals from items"""
    # Verify grid exists and belongs to tenant
    activity_grid = await crud_activity_grid.activity_grid.get_by_tenant(
        db=db, id=activity_grid_id, tenant_id=tenant.id
    )
    if not activity_grid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity grid not found"
        )
    
    updated_grid = await crud_activity_grid.activity_grid.update_totals(
        db=db, activity_grid_id=activity_grid_id
    )
    return updated_grid