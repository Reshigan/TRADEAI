"""
Product model
"""

from typing import Optional, List
from sqlalchemy import String, Boolean, ForeignKey, Text, JSON, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from .base import BaseModel


class Product(BaseModel):
    """Product model"""
    
    __tablename__ = "products"
    
    # Tenant relationship
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id"),
        nullable=False,
        index=True
    )
    
    # Basic information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    barcode: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Categorization
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    brand: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    sub_brand: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Hierarchy
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=True
    )
    
    # Pricing
    unit_cost: Mapped[Optional[float]] = mapped_column(Numeric(15, 4), nullable=True)
    unit_price: Mapped[Optional[float]] = mapped_column(Numeric(15, 4), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    
    # Physical attributes
    weight: Mapped[Optional[float]] = mapped_column(Numeric(10, 3), nullable=True)
    volume: Mapped[Optional[float]] = mapped_column(Numeric(10, 3), nullable=True)
    dimensions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Packaging
    pack_size: Mapped[Optional[int]] = mapped_column(nullable=True)
    unit_of_measure: Mapped[str] = mapped_column(String(20), default="EA", nullable=False)
    
    # Metadata
    attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="products")
    parent: Mapped[Optional["Product"]] = relationship("Product", remote_side="Product.id")
    
    def __repr__(self) -> str:
        return f"<Product(name='{self.name}', sku='{self.sku}')>"