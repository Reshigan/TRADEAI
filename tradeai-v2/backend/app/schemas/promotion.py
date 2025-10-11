"""
Promotion Pydantic schemas
"""

from typing import Optional, Dict, Any, List
from datetime import date, datetime
from pydantic import Field, validator
import uuid

from .base import BaseCreateSchema, BaseUpdateSchema, BaseResponseSchema


class PromotionCreate(BaseCreateSchema):
    """Schema for creating a promotion"""
    
    name: str = Field(..., min_length=1, max_length=255, description="Promotion name")
    code: str = Field(..., min_length=1, max_length=50, description="Promotion code")
    description: Optional[str] = Field(None, description="Promotion description")
    
    # Promotion type and mechanics
    promotion_type: str = Field(..., description="Promotion type")
    promotion_mechanic: str = Field(..., description="Promotion mechanic")
    
    # Dates
    start_date: date = Field(..., description="Start date")
    end_date: date = Field(..., description="End date")
    
    # Eligibility criteria
    eligible_customers: Optional[List[str]] = Field(None, description="Eligible customer IDs")
    eligible_products: Optional[List[str]] = Field(None, description="Eligible product IDs")
    eligible_regions: Optional[List[str]] = Field(None, description="Eligible regions")
    
    # Promotion rules
    minimum_purchase_amount: Optional[float] = Field(None, ge=0, description="Minimum purchase amount")
    minimum_purchase_quantity: Optional[int] = Field(None, ge=1, description="Minimum purchase quantity")
    maximum_discount_amount: Optional[float] = Field(None, ge=0, description="Maximum discount amount")
    usage_limit_per_customer: Optional[int] = Field(None, ge=1, description="Usage limit per customer")
    total_usage_limit: Optional[int] = Field(None, ge=1, description="Total usage limit")
    
    # Discount/Benefit structure
    discount_percentage: Optional[float] = Field(None, ge=0, le=100, description="Discount percentage")
    discount_amount: Optional[float] = Field(None, ge=0, description="Fixed discount amount")
    discount_tiers: Optional[Dict[str, Any]] = Field(None, description="Tiered discount structure")
    
    # Budget and financial
    budget_allocated: Optional[float] = Field(None, ge=0, description="Allocated budget")
    currency: str = Field("USD", description="Currency code")
    
    # Performance targets
    target_volume: Optional[float] = Field(None, ge=0, description="Target volume")
    target_revenue: Optional[float] = Field(None, ge=0, description="Target revenue")
    
    # Ownership
    owner_id: uuid.UUID = Field(..., description="Owner user ID")
    
    # Metadata
    attributes: Optional[Dict[str, Any]] = Field(None, description="Additional attributes")
    
    @validator('promotion_type')
    def validate_promotion_type(cls, v):
        valid_types = ['discount', 'rebate', 'bogo', 'volume_bonus', 'cashback', 'free_goods']
        if v not in valid_types:
            raise ValueError(f'Promotion type must be one of: {", ".join(valid_types)}')
        return v
    
    @validator('promotion_mechanic')
    def validate_promotion_mechanic(cls, v):
        valid_mechanics = ['percentage', 'fixed_amount', 'tiered', 'buy_x_get_y']
        if v not in valid_mechanics:
            raise ValueError(f'Promotion mechanic must be one of: {", ".join(valid_mechanics)}')
        return v
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v


class PromotionUpdate(BaseUpdateSchema):
    """Schema for updating a promotion"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Promotion name")
    description: Optional[str] = Field(None, description="Promotion description")
    
    # Dates
    start_date: Optional[date] = Field(None, description="Start date")
    end_date: Optional[date] = Field(None, description="End date")
    
    # Eligibility criteria
    eligible_customers: Optional[List[str]] = Field(None, description="Eligible customer IDs")
    eligible_products: Optional[List[str]] = Field(None, description="Eligible product IDs")
    eligible_regions: Optional[List[str]] = Field(None, description="Eligible regions")
    
    # Promotion rules
    minimum_purchase_amount: Optional[float] = Field(None, ge=0, description="Minimum purchase amount")
    minimum_purchase_quantity: Optional[int] = Field(None, ge=1, description="Minimum purchase quantity")
    maximum_discount_amount: Optional[float] = Field(None, ge=0, description="Maximum discount amount")
    usage_limit_per_customer: Optional[int] = Field(None, ge=1, description="Usage limit per customer")
    total_usage_limit: Optional[int] = Field(None, ge=1, description="Total usage limit")
    
    # Discount/Benefit structure
    discount_percentage: Optional[float] = Field(None, ge=0, le=100, description="Discount percentage")
    discount_amount: Optional[float] = Field(None, ge=0, description="Fixed discount amount")
    discount_tiers: Optional[Dict[str, Any]] = Field(None, description="Tiered discount structure")
    
    # Budget and financial
    budget_allocated: Optional[float] = Field(None, ge=0, description="Allocated budget")
    
    # Performance targets
    target_volume: Optional[float] = Field(None, ge=0, description="Target volume")
    target_revenue: Optional[float] = Field(None, ge=0, description="Target revenue")
    
    # Metadata
    attributes: Optional[Dict[str, Any]] = Field(None, description="Additional attributes")


class PromotionResponse(BaseResponseSchema):
    """Schema for promotion response"""
    
    tenant_id: uuid.UUID
    name: str
    code: str
    description: Optional[str] = None
    
    # Promotion type and mechanics
    promotion_type: str
    promotion_mechanic: str
    
    # Status and dates
    status: str
    start_date: date
    end_date: date
    
    # Eligibility criteria
    eligible_customers: Optional[List[str]] = None
    eligible_products: Optional[List[str]] = None
    eligible_regions: Optional[List[str]] = None
    
    # Promotion rules
    minimum_purchase_amount: Optional[float] = None
    minimum_purchase_quantity: Optional[int] = None
    maximum_discount_amount: Optional[float] = None
    usage_limit_per_customer: Optional[int] = None
    total_usage_limit: Optional[int] = None
    
    # Discount/Benefit structure
    discount_percentage: Optional[float] = None
    discount_amount: Optional[float] = None
    discount_tiers: Optional[Dict[str, Any]] = None
    
    # Budget and financial
    budget_allocated: Optional[float] = None
    budget_spent: float
    currency: str
    
    # Performance tracking
    target_volume: Optional[float] = None
    actual_volume: float
    target_revenue: Optional[float] = None
    actual_revenue: float
    
    # Usage tracking
    total_redemptions: int
    unique_customers: int
    
    # Approval and ownership
    approved_by: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None
    owner_id: uuid.UUID
    
    # Metadata
    attributes: Optional[Dict[str, Any]] = None
    
    # Computed properties
    @property
    def is_active(self) -> bool:
        from datetime import date
        today = date.today()
        return self.status == "active" and self.start_date <= today <= self.end_date
    
    @property
    def budget_utilization(self) -> float:
        if not self.budget_allocated or self.budget_allocated == 0:
            return 0.0
        return (self.budget_spent / self.budget_allocated) * 100
    
    @property
    def volume_performance(self) -> float:
        if not self.target_volume or self.target_volume == 0:
            return 0.0
        return (self.actual_volume / self.target_volume) * 100


class PromotionSummary(BaseResponseSchema):
    """Schema for promotion summary"""
    
    name: str
    code: str
    promotion_type: str
    status: str
    start_date: date
    end_date: date
    budget_allocated: Optional[float] = None
    budget_spent: float
    
    @property
    def is_active(self) -> bool:
        from datetime import date
        today = date.today()
        return self.status == "active" and self.start_date <= today <= self.end_date


class PromotionPerformance(BaseResponseSchema):
    """Schema for promotion performance metrics"""
    
    name: str
    code: str
    status: str
    
    # Financial performance
    budget_allocated: Optional[float] = None
    budget_spent: float
    budget_utilization: float
    
    # Volume performance
    target_volume: Optional[float] = None
    actual_volume: float
    volume_performance: float
    
    # Revenue performance
    target_revenue: Optional[float] = None
    actual_revenue: float
    revenue_performance: float
    
    # Usage metrics
    total_redemptions: int
    unique_customers: int
    average_discount_per_redemption: float