"""
Trade spend schemas for request/response validation
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class TradeSpendBase(BaseModel):
    """Base trade spend schema"""
    customer_id: UUID = Field(..., description="Customer ID")
    product_id: Optional[UUID] = Field(None, description="Product ID")
    spend_type: str = Field(..., description="Type of trade spend")
    amount: Decimal = Field(..., description="Spend amount", ge=0)
    description: Optional[str] = Field(None, description="Spend description")
    status: str = Field(default="pending", description="Approval status")
    period_start: Optional[datetime] = Field(None, description="Period start date")
    period_end: Optional[datetime] = Field(None, description="Period end date")


class TradeSpendCreate(TradeSpendBase):
    """Schema for creating trade spend"""
    pass


class TradeSpendUpdate(BaseModel):
    """Schema for updating trade spend"""
    customer_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    spend_type: Optional[str] = None
    amount: Optional[Decimal] = Field(None, ge=0)
    description: Optional[str] = None
    status: Optional[str] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None


class TradeSpend(TradeSpendBase):
    """Schema for trade spend response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime