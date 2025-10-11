"""
Customer Pydantic schemas
"""

from typing import Optional, Dict, Any
from pydantic import Field, validator
import uuid

from .base import BaseCreateSchema, BaseUpdateSchema, BaseResponseSchema


class CustomerCreate(BaseCreateSchema):
    """Schema for creating a customer"""
    
    name: str = Field(..., min_length=1, max_length=255, description="Customer name")
    code: str = Field(..., min_length=1, max_length=50, description="Customer code")
    customer_type: str = Field(..., description="Customer type (retailer, distributor, etc.)")
    status: str = Field(default="active", description="Customer status")
    
    is_active: bool = Field(True, description="Whether customer is active")
    
    # Contact information
    contact_person: Optional[str] = Field(None, max_length=255, description="Contact person")
    email: Optional[str] = Field(None, max_length=255, description="Email address")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    
    # Address
    address: Optional[str] = Field(None, description="Address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    state: Optional[str] = Field(None, max_length=100, description="State/Province")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    postal_code: Optional[str] = Field(None, max_length=20, description="Postal code")
    
    # Business details
    tax_id: Optional[str] = Field(None, max_length=50, description="Tax ID")
    credit_limit: Optional[float] = Field(None, ge=0, description="Credit limit")
    payment_terms: Optional[str] = Field(None, max_length=100, description="Payment terms")
    
    # Hierarchy
    parent_id: Optional[uuid.UUID] = Field(None, description="Parent customer ID")
    
    # Metadata
    attributes: Optional[Dict[str, Any]] = Field(None, description="Additional attributes")
    
    @validator('customer_type')
    def validate_customer_type(cls, v):
        valid_types = ['retailer', 'distributor', 'wholesaler', 'end_customer', 'other']
        if v not in valid_types:
            raise ValueError(f'Customer type must be one of: {", ".join(valid_types)}')
        return v


class CustomerUpdate(BaseUpdateSchema):
    """Schema for updating a customer"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Customer name")
    type: Optional[str] = Field(None, description="Customer type")
    is_active: Optional[bool] = Field(None, description="Whether customer is active")
    
    # Contact information
    contact_person: Optional[str] = Field(None, max_length=255, description="Contact person")
    email: Optional[str] = Field(None, max_length=255, description="Email address")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    
    # Address
    address: Optional[str] = Field(None, description="Address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    state: Optional[str] = Field(None, max_length=100, description="State/Province")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    postal_code: Optional[str] = Field(None, max_length=20, description="Postal code")
    
    # Business details
    tax_id: Optional[str] = Field(None, max_length=50, description="Tax ID")
    credit_limit: Optional[float] = Field(None, ge=0, description="Credit limit")
    payment_terms: Optional[str] = Field(None, max_length=100, description="Payment terms")
    
    # Hierarchy
    parent_id: Optional[uuid.UUID] = Field(None, description="Parent customer ID")
    
    # Metadata
    attributes: Optional[Dict[str, Any]] = Field(None, description="Additional attributes")


class Customer(BaseResponseSchema):
    """Schema for customer response"""
    
    tenant_id: uuid.UUID
    name: str
    code: str
    customer_type: str
    status: str
    
    # Contact information
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    
    # Address
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    
    # Business details
    tax_id: Optional[str] = None
    credit_limit: Optional[float] = None
    currency: Optional[str] = None
    payment_terms: Optional[str] = None
    
    # Hierarchy
    parent_customer_id: Optional[uuid.UUID] = None
    
    # Metadata
    attributes: Optional[Dict[str, Any]] = None


class CustomerSummary(BaseResponseSchema):
    """Schema for customer summary"""
    
    name: str
    code: str
    type: str
    is_active: bool
    city: Optional[str] = None
    country: Optional[str] = None


class CustomerHierarchy(BaseResponseSchema):
    """Schema for customer hierarchy"""
    
    name: str
    code: str
    type: str
    parent_id: Optional[uuid.UUID] = None
    children: Optional[list["CustomerHierarchy"]] = None