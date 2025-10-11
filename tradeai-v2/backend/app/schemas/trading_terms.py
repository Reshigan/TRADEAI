"""
Trading terms schemas for request/response validation
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class TradingTermsBase(BaseModel):
    """Base trading terms schema"""
    customer_id: UUID = Field(..., description="Customer ID")
    product_id: Optional[UUID] = Field(None, description="Product ID")
    term_type: str = Field(..., description="Type of trading term")
    term_name: str = Field(..., description="Name of the trading term")
    description: Optional[str] = Field(None, description="Term description")
    rate: Optional[Decimal] = Field(None, description="Rate or percentage", ge=0)
    amount: Optional[Decimal] = Field(None, description="Fixed amount", ge=0)
    currency: str = Field(default="USD", description="Currency code")
    effective_date: datetime = Field(..., description="Effective start date")
    expiry_date: Optional[datetime] = Field(None, description="Expiry date")
    status: str = Field(default="active", description="Term status")
    payment_terms: Optional[str] = Field(None, description="Payment terms")
    volume_threshold: Optional[Decimal] = Field(None, description="Volume threshold", ge=0)


class TradingTermsCreate(TradingTermsBase):
    """Schema for creating trading terms"""
    pass


class TradingTermsUpdate(BaseModel):
    """Schema for updating trading terms"""
    customer_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    term_type: Optional[str] = None
    term_name: Optional[str] = None
    description: Optional[str] = None
    rate: Optional[Decimal] = Field(None, ge=0)
    amount: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = None
    effective_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    status: Optional[str] = None
    payment_terms: Optional[str] = None
    volume_threshold: Optional[Decimal] = Field(None, ge=0)


class TradingTerms(TradingTermsBase):
    """Schema for trading terms response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime