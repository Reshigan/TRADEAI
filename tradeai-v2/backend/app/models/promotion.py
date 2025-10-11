"""
Promotion model
"""

from typing import Optional, List
from datetime import date, datetime
from sqlalchemy import String, Boolean, ForeignKey, Text, JSON, Numeric, Date, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from .base import BaseModel


class Promotion(BaseModel):
    """Promotion model for marketing campaigns and trade promotions"""
    
    __tablename__ = "promotions"
    
    # Tenant relationship
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id"),
        nullable=False,
        index=True
    )
    
    # Basic information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Promotion type and mechanics
    promotion_type: Mapped[str] = mapped_column(String(50), nullable=False)  # discount, rebate, bogo, volume_bonus
    promotion_mechanic: Mapped[str] = mapped_column(String(50), nullable=False)  # percentage, fixed_amount, tiered
    
    # Status and dates
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)  # draft, active, paused, completed, cancelled
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Eligibility criteria
    eligible_customers: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)  # customer IDs or "all"
    eligible_products: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)  # product IDs or categories
    eligible_regions: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)  # region codes
    
    # Promotion rules
    minimum_purchase_amount: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    minimum_purchase_quantity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    maximum_discount_amount: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    usage_limit_per_customer: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_usage_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Discount/Benefit structure
    discount_percentage: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    discount_amount: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    discount_tiers: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {threshold: benefit}
    
    # Budget and financial
    budget_allocated: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    budget_spent: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    
    # Performance tracking
    target_volume: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    actual_volume: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    target_revenue: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    actual_revenue: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    
    # Usage tracking
    total_redemptions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    unique_customers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Approval and ownership
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    
    # Metadata
    attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant")
    owner: Mapped["User"] = relationship("User", foreign_keys=[owner_id])
    approver: Mapped[Optional["User"]] = relationship("User", foreign_keys=[approved_by])
    
    @property
    def is_active(self) -> bool:
        """Check if promotion is currently active"""
        from datetime import date
        today = date.today()
        return (
            self.status == "active" and
            self.start_date <= today <= self.end_date
        )
    
    @property
    def budget_utilization(self) -> float:
        """Calculate budget utilization percentage"""
        if not self.budget_allocated or self.budget_allocated == 0:
            return 0.0
        return float((self.budget_spent / self.budget_allocated) * 100)
    
    @property
    def volume_performance(self) -> float:
        """Calculate volume performance percentage"""
        if not self.target_volume or self.target_volume == 0:
            return 0.0
        return float((self.actual_volume / self.target_volume) * 100)
    
    @property
    def revenue_performance(self) -> float:
        """Calculate revenue performance percentage"""
        if not self.target_revenue or self.target_revenue == 0:
            return 0.0
        return float((self.actual_revenue / self.target_revenue) * 100)
    
    def calculate_discount(self, purchase_amount: float, purchase_quantity: int = 1) -> float:
        """Calculate discount amount for given purchase"""
        if not self.is_active:
            return 0.0
        
        # Check minimum requirements
        if self.minimum_purchase_amount and purchase_amount < self.minimum_purchase_amount:
            return 0.0
        if self.minimum_purchase_quantity and purchase_quantity < self.minimum_purchase_quantity:
            return 0.0
        
        discount = 0.0
        
        if self.promotion_mechanic == "percentage" and self.discount_percentage:
            discount = purchase_amount * (self.discount_percentage / 100)
        elif self.promotion_mechanic == "fixed_amount" and self.discount_amount:
            discount = self.discount_amount
        elif self.promotion_mechanic == "tiered" and self.discount_tiers:
            # Find applicable tier
            for threshold, benefit in sorted(self.discount_tiers.items(), key=lambda x: float(x[0]), reverse=True):
                if purchase_amount >= float(threshold):
                    if isinstance(benefit, dict):
                        if "percentage" in benefit:
                            discount = purchase_amount * (float(benefit["percentage"]) / 100)
                        elif "amount" in benefit:
                            discount = float(benefit["amount"])
                    else:
                        discount = float(benefit)
                    break
        
        # Apply maximum discount limit
        if self.maximum_discount_amount:
            discount = min(discount, self.maximum_discount_amount)
        
        return discount
    
    def __repr__(self) -> str:
        return f"<Promotion(name='{self.name}', type='{self.promotion_type}', status='{self.status}')>"