"""
Product Pydantic schemas
"""

from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from pydantic import Field

from app.schemas.base import BaseCreateSchema, BaseUpdateSchema, BaseResponseSchema


class ProductCreate(BaseCreateSchema):
    """Schema for creating a product"""
    
    name: str = Field(..., min_length=1, max_length=255, description="Product name")
    code: str = Field(..., min_length=1, max_length=50, description="Product code")
    description: Optional[str] = Field(None, description="Product description")
    category: str = Field(..., max_length=100, description="Product category")
    subcategory: Optional[str] = Field(None, max_length=100, description="Product subcategory")
    brand: Optional[str] = Field(None, max_length=100, description="Product brand")
    status: str = Field(default="active", max_length=20, description="Product status")
    
    # Pricing
    unit_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Unit price")
    cost_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Cost price")
    currency: str = Field(default="USD", max_length=3, description="Currency")
    
    # Physical attributes
    unit_of_measure: Optional[str] = Field(None, max_length=20, description="Unit of measure")
    weight: Optional[Decimal] = Field(None, ge=0, decimal_places=3, description="Weight")
    volume: Optional[Decimal] = Field(None, ge=0, decimal_places=3, description="Volume")
    
    # Metadata
    attributes: Optional[Dict[str, Any]] = Field(None, description="Additional attributes")


class ProductUpdate(BaseUpdateSchema):
    """Schema for updating a product"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Product name")
    description: Optional[str] = Field(None, description="Product description")
    category: Optional[str] = Field(None, max_length=100, description="Product category")
    subcategory: Optional[str] = Field(None, max_length=100, description="Product subcategory")
    brand: Optional[str] = Field(None, max_length=100, description="Product brand")
    status: Optional[str] = Field(None, max_length=20, description="Product status")
    
    # Pricing
    unit_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Unit price")
    cost_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Cost price")
    currency: Optional[str] = Field(None, max_length=3, description="Currency")
    
    # Physical attributes
    unit_of_measure: Optional[str] = Field(None, max_length=20, description="Unit of measure")
    weight: Optional[Decimal] = Field(None, ge=0, decimal_places=3, description="Weight")
    volume: Optional[Decimal] = Field(None, ge=0, decimal_places=3, description="Volume")
    
    # Metadata
    attributes: Optional[Dict[str, Any]] = Field(None, description="Additional attributes")


class Product(BaseResponseSchema):
    """Schema for product response"""
    
    tenant_id: UUID
    name: str
    code: str
    description: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    status: str
    
    # Pricing
    unit_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    currency: str
    
    # Physical attributes
    unit_of_measure: Optional[str] = None
    weight: Optional[Decimal] = None
    volume: Optional[Decimal] = None
    
    # Metadata
    attributes: Optional[Dict[str, Any]] = None