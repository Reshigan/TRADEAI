"""
Budget Pydantic schemas
"""

from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal

from pydantic import Field

from app.schemas.base import BaseCreateSchema, BaseUpdateSchema, BaseResponseSchema


class BudgetCreate(BaseCreateSchema):
    """Schema for creating a budget"""
    
    name: str = Field(..., min_length=1, max_length=255, description="Budget name")
    code: str = Field(..., min_length=1, max_length=50, description="Budget code")
    description: Optional[str] = Field(None, description="Budget description")
    budget_type: str = Field(..., max_length=50, description="Budget type")
    period: str = Field(..., max_length=20, description="Budget period")
    status: str = Field(default="draft", max_length=20, description="Budget status")
    
    # Financial details
    total_amount: Decimal = Field(..., ge=0, decimal_places=2, description="Total budget amount")
    allocated_amount: Decimal = Field(default=0, ge=0, decimal_places=2, description="Allocated amount")
    spent_amount: Decimal = Field(default=0, ge=0, decimal_places=2, description="Spent amount")
    currency: str = Field(default="USD", max_length=3, description="Currency")
    
    # Dates
    start_date: date = Field(..., description="Budget start date")
    end_date: date = Field(..., description="Budget end date")
    
    # Ownership
    owner_id: UUID = Field(..., description="Budget owner user ID")
    approved_by: Optional[UUID] = Field(None, description="Approved by user ID")
    approved_at: Optional[datetime] = Field(None, description="Approval timestamp")
    
    # Metadata
    attributes: Optional[Dict[str, Any]] = Field(None, description="Additional attributes")


class BudgetUpdate(BaseUpdateSchema):
    """Schema for updating a budget"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Budget name")
    description: Optional[str] = Field(None, description="Budget description")
    budget_type: Optional[str] = Field(None, max_length=50, description="Budget type")
    period: Optional[str] = Field(None, max_length=20, description="Budget period")
    status: Optional[str] = Field(None, max_length=20, description="Budget status")
    
    # Financial details
    total_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Total budget amount")
    allocated_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Allocated amount")
    spent_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Spent amount")
    currency: Optional[str] = Field(None, max_length=3, description="Currency")
    
    # Dates
    start_date: Optional[date] = Field(None, description="Budget start date")
    end_date: Optional[date] = Field(None, description="Budget end date")
    
    # Ownership
    owner_id: Optional[UUID] = Field(None, description="Budget owner user ID")
    approved_by: Optional[UUID] = Field(None, description="Approved by user ID")
    approved_at: Optional[datetime] = Field(None, description="Approval timestamp")
    
    # Metadata
    attributes: Optional[Dict[str, Any]] = Field(None, description="Additional attributes")


class Budget(BaseResponseSchema):
    """Schema for budget response"""
    
    tenant_id: UUID
    name: str
    code: str
    description: Optional[str] = None
    budget_type: str
    period: str
    status: str
    
    # Financial details
    total_amount: Decimal
    allocated_amount: Decimal
    spent_amount: Decimal
    currency: str
    
    # Dates
    start_date: date
    end_date: date
    
    # Ownership
    owner_id: UUID
    approved_by: Optional[UUID] = None
    approved_at: Optional[datetime] = None
    
    # Metadata
    attributes: Optional[Dict[str, Any]] = None