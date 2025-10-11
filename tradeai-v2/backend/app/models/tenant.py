"""
Tenant model for multi-tenancy
"""

from typing import Optional, List
from sqlalchemy import String, Boolean, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel


class Tenant(BaseModel):
    """Tenant model for multi-tenancy"""
    
    __tablename__ = "tenants"
    
    # Basic information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    domain: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_trial: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Configuration
    settings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    features: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Contact information
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Address
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="tenant")
    customers: Mapped[List["Customer"]] = relationship("Customer", back_populates="tenant")
    products: Mapped[List["Product"]] = relationship("Product", back_populates="tenant")
    budgets: Mapped[List["Budget"]] = relationship("Budget", back_populates="tenant")
    trade_spends: Mapped[List["TradeSpend"]] = relationship("TradeSpend", back_populates="tenant")
    trading_terms: Mapped[List["TradingTerms"]] = relationship("TradingTerms", back_populates="tenant")
    promotions: Mapped[List["Promotion"]] = relationship("Promotion", back_populates="tenant")
    activity_grids: Mapped[List["ActivityGrid"]] = relationship("ActivityGrid", back_populates="tenant")
    
    def __repr__(self) -> str:
        return f"<Tenant(name='{self.name}', slug='{self.slug}')>"