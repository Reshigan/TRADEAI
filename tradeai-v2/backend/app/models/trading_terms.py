"""
Trading Terms model
"""

from typing import Optional, List
from datetime import date
from sqlalchemy import String, Boolean, ForeignKey, Text, JSON, Numeric, Date, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from .base import BaseModel


class TradingTerms(BaseModel):
    """Trading Terms model for customer-specific commercial agreements"""
    
    __tablename__ = "trading_terms"
    
    # Tenant relationship
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id"),
        nullable=False,
        index=True
    )
    
    # Customer relationship
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id"),
        nullable=False,
        index=True
    )
    
    # Basic information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Status and dates
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)  # active, inactive, expired
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Payment terms
    payment_terms_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), default="net", nullable=False)  # net, cod, prepaid
    early_payment_discount: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    early_payment_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Credit terms
    credit_limit: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    credit_currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    credit_check_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Discount structure
    volume_discount_tiers: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {volume: discount_percent}
    category_discounts: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {category: discount_percent}
    seasonal_discounts: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {period: discount_percent}
    
    # Rebate terms
    rebate_percentage: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    rebate_threshold: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    rebate_frequency: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # monthly, quarterly, annual
    
    # Delivery terms
    delivery_terms: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # FOB, CIF, DDP, etc.
    minimum_order_value: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    minimum_order_quantity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Contract terms
    contract_type: Mapped[str] = mapped_column(String(50), default="standard", nullable=False)
    auto_renewal: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    renewal_notice_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Metadata
    attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant")
    customer: Mapped["Customer"] = relationship("Customer")
    
    @property
    def is_active(self) -> bool:
        """Check if trading terms are currently active"""
        from datetime import date
        today = date.today()
        if self.status != "active":
            return False
        if today < self.effective_date:
            return False
        if self.expiry_date and today > self.expiry_date:
            return False
        return True
    
    def calculate_discount(self, volume: float, category: str = None) -> float:
        """Calculate applicable discount based on volume and category"""
        total_discount = 0.0
        
        # Volume discount
        if self.volume_discount_tiers:
            for tier_volume, discount in sorted(self.volume_discount_tiers.items(), reverse=True):
                if volume >= float(tier_volume):
                    total_discount += float(discount)
                    break
        
        # Category discount
        if category and self.category_discounts and category in self.category_discounts:
            total_discount += float(self.category_discounts[category])
        
        return min(total_discount, 100.0)  # Cap at 100%
    
    def __repr__(self) -> str:
        return f"<TradingTerms(customer='{self.customer_id}', code='{self.code}')>"