"""
Product management endpoints
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_tenant
from app.crud import product as crud_product
from app.models.tenant import Tenant
from app.schemas.product import Product, ProductCreate, ProductUpdate

router = APIRouter()


@router.get("/", response_model=List[Product])
async def list_products(
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    """List products with filtering and pagination"""
    filters = {}
    if search:
        filters["search"] = search
    if category:
        filters["category"] = category
    if status:
        filters["status"] = status
    
    products = await crud_product.product.get_multi_by_tenant(
        db=db, tenant_id=tenant.id, skip=skip, limit=limit, **filters
    )
    return products


@router.post("/", response_model=Product, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_in: ProductCreate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Create a new product"""
    product = await crud_product.product.create_with_tenant(
        db=db, obj_in=product_in, tenant_id=tenant.id
    )
    return product


@router.get("/{product_id}", response_model=Product)
async def get_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Get product by ID"""
    product = await crud_product.product.get_by_tenant(
        db=db, id=product_id, tenant_id=tenant.id
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product


@router.put("/{product_id}", response_model=Product)
async def update_product(
    product_id: UUID,
    product_in: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Update product"""
    product = await crud_product.product.get_by_tenant(
        db=db, id=product_id, tenant_id=tenant.id
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    product = await crud_product.product.update(
        db=db, db_obj=product, obj_in=product_in
    )
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Delete product (soft delete)"""
    product = await crud_product.product.get_by_tenant(
        db=db, id=product_id, tenant_id=tenant.id
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    await crud_product.product.remove(db=db, id=product_id)