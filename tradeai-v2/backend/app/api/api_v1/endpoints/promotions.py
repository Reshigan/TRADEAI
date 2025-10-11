"""
Promotion endpoints
"""

from typing import Any, List, Optional
from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_tenant, get_current_user
from app.crud import promotion as crud_promotion
from app.models.tenant import Tenant
from app.schemas.base import PaginatedResponse, PaginationParams
from app.schemas.promotion import (
    PromotionCreate, 
    PromotionUpdate, 
    PromotionResponse, 
    PromotionSummary,
    PromotionPerformance
)
from app.schemas.user import UserResponse

router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def read_promotions(
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: UserResponse = Depends(get_current_user),
    pagination: PaginationParams = Depends(),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    promotion_type: Optional[str] = Query(None, description="Filter by promotion type"),
    owner_id: Optional[UUID] = Query(None, description="Filter by owner"),
    search: Optional[str] = Query(None, description="Search in name, code, description")
) -> Any:
    """Retrieve promotions with filtering and pagination"""
    
    # Build filters
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    if promotion_type:
        filters["promotion_type"] = promotion_type
    if owner_id:
        filters["owner_id"] = owner_id
    if search:
        filters["search"] = search
    
    # Get promotions and count
    promotions = await crud_promotion.promotion.get_multi(
        db=db,
        tenant_id=tenant.id,
        skip=pagination.offset,
        limit=pagination.size,
        filters=filters
    )
    
    total = await crud_promotion.promotion.count(
        db=db,
        tenant_id=tenant.id,
        filters=filters
    )
    
    # Convert to response models
    promotion_responses = [PromotionResponse.from_orm(p) for p in promotions]
    
    return PaginatedResponse.create(
        items=promotion_responses,
        total=total,
        page=pagination.page,
        size=pagination.size
    )


@router.post("/", response_model=PromotionResponse)
async def create_promotion(
    *,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: UserResponse = Depends(get_current_user),
    promotion_in: PromotionCreate
) -> Any:
    """Create new promotion"""
    
    # Check if code already exists
    if await crud_promotion.promotion.code_exists(
        db=db, code=promotion_in.code, tenant_id=tenant.id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Promotion code already exists"
        )
    
    # Create promotion
    promotion = await crud_promotion.promotion.create(
        db=db,
        obj_in=promotion_in,
        tenant_id=tenant.id,
        created_by=current_user.id
    )
    
    return PromotionResponse.from_orm(promotion)


@router.get("/{promotion_id}", response_model=PromotionResponse)
async def read_promotion(
    *,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: UserResponse = Depends(get_current_user),
    promotion_id: UUID
) -> Any:
    """Get promotion by ID"""
    
    promotion = await crud_promotion.promotion.get(
        db=db, id=promotion_id, tenant_id=tenant.id
    )
    
    if not promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promotion not found"
        )
    
    return PromotionResponse.from_orm(promotion)


@router.put("/{promotion_id}", response_model=PromotionResponse)
async def update_promotion(
    *,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: UserResponse = Depends(get_current_user),
    promotion_id: UUID,
    promotion_in: PromotionUpdate
) -> Any:
    """Update promotion"""
    
    promotion = await crud_promotion.promotion.get(
        db=db, id=promotion_id, tenant_id=tenant.id
    )
    
    if not promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promotion not found"
        )
    
    # Check permissions (only owner or admin can update)
    if promotion.owner_id != current_user.id and current_user.role not in ["super_admin", "tenant_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    promotion = await crud_promotion.promotion.update(
        db=db,
        db_obj=promotion,
        obj_in=promotion_in,
        updated_by=current_user.id
    )
    
    return PromotionResponse.from_orm(promotion)


@router.delete("/{promotion_id}")
async def delete_promotion(
    *,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: UserResponse = Depends(get_current_user),
    promotion_id: UUID
) -> Any:
    """Delete promotion"""
    
    promotion = await crud_promotion.promotion.get(
        db=db, id=promotion_id, tenant_id=tenant.id
    )
    
    if not promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promotion not found"
        )
    
    # Check permissions (only owner or admin can delete)
    if promotion.owner_id != current_user.id and current_user.role not in ["super_admin", "tenant_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    await crud_promotion.promotion.remove(
        db=db,
        id=promotion_id,
        tenant_id=tenant.id,
        deleted_by=current_user.id
    )
    
    return {"message": "Promotion deleted successfully"}


@router.get("/active/list", response_model=List[PromotionSummary])
async def read_active_promotions(
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: UserResponse = Depends(get_current_user),
    customer_id: Optional[UUID] = Query(None, description="Filter by customer eligibility"),
    product_id: Optional[UUID] = Query(None, description="Filter by product eligibility"),
    region: Optional[str] = Query(None, description="Filter by region eligibility")
) -> Any:
    """Get active promotions with optional filtering"""
    
    promotions = await crud_promotion.promotion.get_active_promotions(
        db=db,
        tenant_id=tenant.id,
        customer_id=customer_id,
        product_id=product_id,
        region=region
    )
    
    return [PromotionSummary.from_orm(p) for p in promotions]


@router.get("/by-code/{code}", response_model=PromotionResponse)
async def read_promotion_by_code(
    *,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: UserResponse = Depends(get_current_user),
    code: str
) -> Any:
    """Get promotion by code"""
    
    promotion = await crud_promotion.promotion.get_by_code(
        db=db, code=code, tenant_id=tenant.id
    )
    
    if not promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promotion not found"
        )
    
    return PromotionResponse.from_orm(promotion)


@router.get("/date-range/list", response_model=List[PromotionSummary])
async def read_promotions_by_date_range(
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: UserResponse = Depends(get_current_user),
    start_date: date = Query(..., description="Start date"),
    end_date: date = Query(..., description="End date")
) -> Any:
    """Get promotions within date range"""
    
    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )
    
    promotions = await crud_promotion.promotion.get_promotions_by_date_range(
        db=db,
        start_date=start_date,
        end_date=end_date,
        tenant_id=tenant.id
    )
    
    return [PromotionSummary.from_orm(p) for p in promotions]


@router.post("/{promotion_id}/approve", response_model=PromotionResponse)
async def approve_promotion(
    *,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: UserResponse = Depends(get_current_user),
    promotion_id: UUID
) -> Any:
    """Approve a promotion"""
    
    # Check permissions (only managers and admins can approve)
    if current_user.role not in ["super_admin", "tenant_admin", "finance_manager", "trade_manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to approve promotions"
        )
    
    promotion = await crud_promotion.promotion.approve_promotion(
        db=db,
        promotion_id=promotion_id,
        approved_by=current_user.id,
        tenant_id=tenant.id
    )
    
    if not promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promotion not found"
        )
    
    return PromotionResponse.from_orm(promotion)


@router.get("/{promotion_id}/performance", response_model=PromotionPerformance)
async def read_promotion_performance(
    *,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    current_user: UserResponse = Depends(get_current_user),
    promotion_id: UUID
) -> Any:
    """Get promotion performance metrics"""
    
    promotion = await crud_promotion.promotion.get(
        db=db, id=promotion_id, tenant_id=tenant.id
    )
    
    if not promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promotion not found"
        )
    
    # Calculate performance metrics
    budget_utilization = 0.0
    if promotion.budget_allocated and promotion.budget_allocated > 0:
        budget_utilization = (promotion.budget_spent / promotion.budget_allocated) * 100
    
    volume_performance = 0.0
    if promotion.target_volume and promotion.target_volume > 0:
        volume_performance = (promotion.actual_volume / promotion.target_volume) * 100
    
    revenue_performance = 0.0
    if promotion.target_revenue and promotion.target_revenue > 0:
        revenue_performance = (promotion.actual_revenue / promotion.target_revenue) * 100
    
    average_discount = 0.0
    if promotion.total_redemptions > 0:
        average_discount = promotion.budget_spent / promotion.total_redemptions
    
    return PromotionPerformance(
        id=promotion.id,
        created_at=promotion.created_at,
        updated_at=promotion.updated_at,
        name=promotion.name,
        code=promotion.code,
        status=promotion.status,
        budget_allocated=promotion.budget_allocated,
        budget_spent=promotion.budget_spent,
        budget_utilization=budget_utilization,
        target_volume=promotion.target_volume,
        actual_volume=promotion.actual_volume,
        volume_performance=volume_performance,
        target_revenue=promotion.target_revenue,
        actual_revenue=promotion.actual_revenue,
        revenue_performance=revenue_performance,
        total_redemptions=promotion.total_redemptions,
        unique_customers=promotion.unique_customers,
        average_discount_per_redemption=average_discount
    )