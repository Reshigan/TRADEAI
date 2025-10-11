"""
Activity grid schemas for request/response validation
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class ActivityGridItemBase(BaseModel):
    """Base activity grid item schema"""
    activity_name: str = Field(..., description="Activity name")
    description: Optional[str] = Field(None, description="Activity description")
    planned_cost: Optional[Decimal] = Field(None, description="Planned cost", ge=0)
    actual_cost: Optional[Decimal] = Field(None, description="Actual cost", ge=0)
    status: str = Field(default="planned", description="Activity status")
    start_date: Optional[datetime] = Field(None, description="Start date")
    end_date: Optional[datetime] = Field(None, description="End date")
    responsible_party: Optional[str] = Field(None, description="Responsible party")


class ActivityGridItemCreate(ActivityGridItemBase):
    """Schema for creating activity grid item"""
    pass


class ActivityGridItemUpdate(BaseModel):
    """Schema for updating activity grid item"""
    activity_name: Optional[str] = None
    description: Optional[str] = None
    planned_cost: Optional[Decimal] = Field(None, ge=0)
    actual_cost: Optional[Decimal] = Field(None, ge=0)
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    responsible_party: Optional[str] = None


class ActivityGridItem(ActivityGridItemBase):
    """Schema for activity grid item response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    activity_grid_id: UUID
    created_at: datetime
    updated_at: datetime


class ActivityGridBase(BaseModel):
    """Base activity grid schema"""
    name: str = Field(..., description="Grid name")
    description: Optional[str] = Field(None, description="Grid description")
    customer_id: Optional[UUID] = Field(None, description="Customer ID")
    product_id: Optional[UUID] = Field(None, description="Product ID")
    promotion_id: Optional[UUID] = Field(None, description="Promotion ID")
    period_start: datetime = Field(..., description="Period start date")
    period_end: datetime = Field(..., description="Period end date")
    status: str = Field(default="draft", description="Grid status")
    total_planned_cost: Optional[Decimal] = Field(None, description="Total planned cost", ge=0)
    total_actual_cost: Optional[Decimal] = Field(None, description="Total actual cost", ge=0)


class ActivityGridCreate(ActivityGridBase):
    """Schema for creating activity grid"""
    items: Optional[List[ActivityGridItemCreate]] = Field(default=[], description="Grid items")


class ActivityGridUpdate(BaseModel):
    """Schema for updating activity grid"""
    name: Optional[str] = None
    description: Optional[str] = None
    customer_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    promotion_id: Optional[UUID] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    status: Optional[str] = None
    total_planned_cost: Optional[Decimal] = Field(None, ge=0)
    total_actual_cost: Optional[Decimal] = Field(None, ge=0)


class ActivityGrid(ActivityGridBase):
    """Schema for activity grid response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime
    items: List[ActivityGridItem] = Field(default=[], description="Grid items")


class ActivityGridSummary(BaseModel):
    """Schema for activity grid summary"""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str
    status: str
    period_start: datetime
    period_end: datetime
    total_planned_cost: Optional[Decimal] = None
    total_actual_cost: Optional[Decimal] = None
    items_count: int = 0