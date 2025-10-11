"""
Trade spend model
"""

from typing import Optional, List
from datetime import date
from sqlalchemy import String, Boolean, ForeignKey, Text, JSON, Numeric, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from .base import BaseModel


class TradeSpend(BaseModel):
    """Trade spend model"""
    
    __tablename__ = "trade_spend"
    
    # Tenant relationship
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id"),
        nullable=False,
        index=True
    )
    
    # Basic information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    reference_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Type and category
    spend_type: Mapped[str] = mapped_column(String(50), nullable=False)  # promotion, rebate, allowance, etc.
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    sub_category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)  # draft, approved, active, completed, cancelled
    
    # Relationships
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id"),
        nullable=False,
        index=True
    )
    
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=True,
        index=True
    )
    
    budget_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("budgets.id"),
        nullable=True,
        index=True
    )
    
    # Dates
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Financial details
    planned_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    actual_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    accrued_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    
    # Performance metrics
    target_volume: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    actual_volume: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    roi_percentage: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    
    # Approval
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    
    # Metadata
    attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant")
    customer: Mapped["Customer"] = relationship("Customer")
    product: Mapped[Optional["Product"]] = relationship("Product")
    budget: Mapped[Optional["Budget"]] = relationship("Budget")
    
    @property
    def variance_amount(self) -> float:
        """Calculate variance between planned and actual"""
        return float(self.actual_amount - self.planned_amount)
    
    @property
    def variance_percentage(self) -> float:
        """Calculate variance percentage"""
        if self.planned_amount == 0:
            return 0.0
        return float((self.variance_amount / self.planned_amount) * 100)
    
    def __repr__(self) -> str:
        return f"<TradeSpend(name='{self.name}', status='{self.status}')>"