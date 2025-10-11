"""
Budget model
"""

from typing import Optional, List
from sqlalchemy import String, Boolean, ForeignKey, Text, JSON, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from .base import BaseModel


class Budget(BaseModel):
    """Budget model"""
    
    __tablename__ = "budgets"
    
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
    
    # Period
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    period_type: Mapped[str] = mapped_column(String(20), default="annual", nullable=False)  # annual, quarterly, monthly
    
    # Status
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)  # draft, active, locked, closed
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Amounts
    total_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    allocated_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    spent_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    committed_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    
    # Currency
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    
    # Hierarchy
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("budgets.id"),
        nullable=True
    )
    
    # Ownership
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    
    # Metadata
    attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="budgets")
    parent: Mapped[Optional["Budget"]] = relationship("Budget", remote_side="Budget.id")
    
    @property
    def available_amount(self) -> float:
        """Calculate available budget amount"""
        return float(self.total_amount - self.allocated_amount)
    
    @property
    def utilization_percentage(self) -> float:
        """Calculate budget utilization percentage"""
        if self.total_amount == 0:
            return 0.0
        return float((self.spent_amount / self.total_amount) * 100)
    
    def __repr__(self) -> str:
        return f"<Budget(name='{self.name}', year={self.year})>"