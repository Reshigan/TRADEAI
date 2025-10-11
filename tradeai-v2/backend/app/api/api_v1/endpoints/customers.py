"""
Customer management endpoints
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_tenant
from app.crud import customer as crud_customer
from app.models.tenant import Tenant
from app.schemas.customer import Customer, CustomerCreate, CustomerUpdate

router = APIRouter()


@router.get("/", response_model=List[Customer])
async def list_customers(
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    customer_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    """List customers with filtering and pagination"""
    filters = {}
    if search:
        filters["search"] = search
    if customer_type:
        filters["customer_type"] = customer_type
    if status:
        filters["status"] = status
    
    customers = await crud_customer.customer.get_multi_by_tenant(
        db=db, tenant_id=tenant.id, skip=skip, limit=limit, **filters
    )
    return customers


@router.post("/", response_model=Customer, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_in: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Create a new customer"""
    customer = await crud_customer.customer.create_with_tenant(
        db=db, obj_in=customer_in, tenant_id=tenant.id
    )
    return customer


@router.get("/{customer_id}", response_model=Customer)
async def get_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get customer by ID"""
    customer = await crud_customer.customer.get_by_tenant(
        db=db, id=customer_id, tenant_id=tenant.id
    )
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    return customer


@router.put("/{customer_id}", response_model=Customer)
async def update_customer(
    customer_id: UUID,
    customer_in: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Update customer"""
    customer = await crud_customer.customer.get_by_tenant(
        db=db, id=customer_id, tenant_id=tenant.id
    )
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    customer = await crud_customer.customer.update(
        db=db, db_obj=customer, obj_in=customer_in
    )
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Delete customer (soft delete)"""
    customer = await crud_customer.customer.get_by_tenant(
        db=db, id=customer_id, tenant_id=tenant.id
    )
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    await crud_customer.customer.remove(db=db, id=customer_id)


@router.get("/{customer_id}/hierarchy", response_model=List[Customer])
async def get_customer_hierarchy(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get customer hierarchy (parent and children)"""
    customer = await crud_customer.customer.get_by_tenant(
        db=db, id=customer_id, tenant_id=tenant.id
    )
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Get children customers
    children = await crud_customer.customer.get_multi_by_tenant(
        db=db, tenant_id=tenant.id, parent_customer_id=customer_id
    )
    return children