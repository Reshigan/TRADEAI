"""
Activity Grid model for planning and tracking activities
"""

from typing import Optional, List, Dict, Any
from datetime import date, datetime
from sqlalchemy import String, Boolean, ForeignKey, Text, JSON, Numeric, Date, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from .base import BaseModel


class ActivityGrid(BaseModel):
    """Activity Grid model for planning and tracking marketing/trade activities"""
    
    __tablename__ = "activity_grids"
    
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
    
    # Grid configuration
    grid_type: Mapped[str] = mapped_column(String(50), nullable=False)  # annual, quarterly, monthly, campaign
    planning_period: Mapped[str] = mapped_column(String(20), nullable=False)  # 2024, 2024-Q1, 2024-01, etc.
    
    # Status and dates
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)  # draft, active, locked, completed
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Ownership and approval
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Budget allocation
    total_budget: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    allocated_budget: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    spent_budget: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    
    # Grid structure - flexible JSON structure for different grid types
    grid_structure: Mapped[dict] = mapped_column(JSON, nullable=False)
    # Example structure:
    # {
    #   "dimensions": ["customer", "product", "channel", "time"],
    #   "rows": [customer_ids],
    #   "columns": [time_periods],
    #   "cells": {
    #     "customer1_2024-01": {
    #       "activities": [...],
    #       "budget": 10000,
    #       "status": "planned"
    #     }
    #   }
    # }
    
    # Performance metrics
    total_activities: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_activities: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    in_progress_activities: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Metadata
    attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant")
    owner: Mapped["User"] = relationship("User", foreign_keys=[owner_id])
    approver: Mapped[Optional["User"]] = relationship("User", foreign_keys=[approved_by])
    
    @property
    def completion_percentage(self) -> float:
        """Calculate completion percentage"""
        if self.total_activities == 0:
            return 0.0
        return float((self.completed_activities / self.total_activities) * 100)
    
    @property
    def budget_utilization(self) -> float:
        """Calculate budget utilization percentage"""
        if not self.total_budget or self.total_budget == 0:
            return 0.0
        return float((self.spent_budget / self.total_budget) * 100)
    
    @property
    def available_budget(self) -> float:
        """Calculate available budget"""
        if not self.total_budget:
            return 0.0
        return float(self.total_budget - self.allocated_budget)
    
    def get_cell_data(self, row_key: str, col_key: str) -> Optional[Dict[str, Any]]:
        """Get data for a specific grid cell"""
        cell_key = f"{row_key}_{col_key}"
        return self.grid_structure.get("cells", {}).get(cell_key)
    
    def update_cell_data(self, row_key: str, col_key: str, data: Dict[str, Any]) -> None:
        """Update data for a specific grid cell"""
        cell_key = f"{row_key}_{col_key}"
        if "cells" not in self.grid_structure:
            self.grid_structure["cells"] = {}
        self.grid_structure["cells"][cell_key] = data
    
    def get_row_total(self, row_key: str, metric: str = "budget") -> float:
        """Get total for a specific row"""
        total = 0.0
        cells = self.grid_structure.get("cells", {})
        for cell_key, cell_data in cells.items():
            if cell_key.startswith(f"{row_key}_"):
                total += float(cell_data.get(metric, 0))
        return total
    
    def get_column_total(self, col_key: str, metric: str = "budget") -> float:
        """Get total for a specific column"""
        total = 0.0
        cells = self.grid_structure.get("cells", {})
        for cell_key, cell_data in cells.items():
            if cell_key.endswith(f"_{col_key}"):
                total += float(cell_data.get(metric, 0))
        return total
    
    def __repr__(self) -> str:
        return f"<ActivityGrid(name='{self.name}', period='{self.planning_period}', status='{self.status}')>"


class ActivityGridItem(BaseModel):
    """Individual activity item within an activity grid"""
    
    __tablename__ = "activity_grid_items"
    
    # Tenant relationship
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id"),
        nullable=False,
        index=True
    )
    
    # Grid relationship
    activity_grid_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("activity_grids.id"),
        nullable=False,
        index=True
    )
    
    # Grid position
    row_key: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    column_key: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    cell_key: Mapped[str] = mapped_column(String(200), nullable=False, index=True)  # row_key_column_key
    
    # Activity details
    activity_name: Mapped[str] = mapped_column(String(255), nullable=False)
    activity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # promotion, event, campaign, etc.
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Status and dates
    status: Mapped[str] = mapped_column(String(20), default="planned", nullable=False)  # planned, in_progress, completed, cancelled
    planned_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    planned_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Financial
    planned_budget: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    actual_spend: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    
    # Performance
    target_metric: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # volume, revenue, reach
    target_value: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    actual_value: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    
    # Relationships
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id"),
        nullable=True,
        index=True
    )
    
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=True,
        index=True
    )
    
    promotion_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("promotions.id"),
        nullable=True,
        index=True
    )
    
    # Ownership
    responsible_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    
    # Metadata
    attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant")
    activity_grid: Mapped["ActivityGrid"] = relationship("ActivityGrid")
    customer: Mapped[Optional["Customer"]] = relationship("Customer")
    product: Mapped[Optional["Product"]] = relationship("Product")
    promotion: Mapped[Optional["Promotion"]] = relationship("Promotion")
    responsible_user: Mapped[Optional["User"]] = relationship("User")
    
    @property
    def budget_variance(self) -> float:
        """Calculate budget variance"""
        if not self.planned_budget:
            return 0.0
        return float(self.actual_spend - self.planned_budget)
    
    @property
    def performance_percentage(self) -> float:
        """Calculate performance percentage"""
        if not self.target_value or self.target_value == 0:
            return 0.0
        if not self.actual_value:
            return 0.0
        return float((self.actual_value / self.target_value) * 100)
    
    def __repr__(self) -> str:
        return f"<ActivityGridItem(name='{self.activity_name}', cell='{self.cell_key}', status='{self.status}')>"