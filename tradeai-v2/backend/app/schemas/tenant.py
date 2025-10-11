"""
Tenant Pydantic schemas
"""

from typing import Optional
from pydantic import Field, validator
import uuid

from .base import BaseCreateSchema, BaseUpdateSchema, BaseResponseSchema


class TenantCreate(BaseCreateSchema):
    """Schema for creating a tenant"""
    
    name: str = Field(..., min_length=1, max_length=255, description="Tenant name")
    slug: str = Field(..., min_length=1, max_length=100, description="Unique tenant slug")
    domain: Optional[str] = Field(None, max_length=255, description="Tenant domain")
    is_active: bool = Field(True, description="Whether tenant is active")
    
    # Contact information
    contact_email: Optional[str] = Field(None, max_length=255, description="Contact email")
    contact_phone: Optional[str] = Field(None, max_length=50, description="Contact phone")
    
    # Address
    address: Optional[str] = Field(None, description="Address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    state: Optional[str] = Field(None, max_length=100, description="State/Province")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    postal_code: Optional[str] = Field(None, max_length=20, description="Postal code")
    
    @validator('slug')
    def validate_slug(cls, v):
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Slug must contain only alphanumeric characters, hyphens, and underscores')
        return v.lower()


class TenantUpdate(BaseUpdateSchema):
    """Schema for updating a tenant"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Tenant name")
    domain: Optional[str] = Field(None, max_length=255, description="Tenant domain")
    is_active: Optional[bool] = Field(None, description="Whether tenant is active")
    
    # Contact information
    contact_email: Optional[str] = Field(None, max_length=255, description="Contact email")
    contact_phone: Optional[str] = Field(None, max_length=50, description="Contact phone")
    
    # Address
    address: Optional[str] = Field(None, description="Address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    state: Optional[str] = Field(None, max_length=100, description="State/Province")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    postal_code: Optional[str] = Field(None, max_length=20, description="Postal code")


class TenantResponse(BaseResponseSchema):
    """Schema for tenant response"""
    
    name: str
    slug: str
    domain: Optional[str] = None
    is_active: bool
    
    # Contact information
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    
    # Address
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None


class TenantSummary(BaseResponseSchema):
    """Schema for tenant summary (minimal info)"""
    
    name: str
    slug: str
    is_active: bool