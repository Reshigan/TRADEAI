"""
Base Pydantic schemas
"""

from typing import Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict
import uuid


class BaseSchema(BaseModel):
    """Base schema with common configuration"""
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
    )


class BaseCreateSchema(BaseSchema):
    """Base schema for create operations"""
    pass


class BaseUpdateSchema(BaseSchema):
    """Base schema for update operations"""
    pass


class BaseResponseSchema(BaseSchema):
    """Base schema for response operations"""
    
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    created_by: Optional[uuid.UUID] = None
    updated_by: Optional[uuid.UUID] = None


class PaginationParams(BaseSchema):
    """Pagination parameters"""
    
    page: int = 1
    size: int = 50
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size


class PaginatedResponse(BaseSchema):
    """Paginated response wrapper"""
    
    items: list[Any]
    total: int
    page: int
    size: int
    pages: int
    
    @classmethod
    def create(cls, items: list[Any], total: int, page: int, size: int):
        pages = (total + size - 1) // size  # Ceiling division
        return cls(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages
        )


class FilterParams(BaseSchema):
    """Base filter parameters"""
    
    search: Optional[str] = None
    is_active: Optional[bool] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    updated_after: Optional[datetime] = None
    updated_before: Optional[datetime] = None


class SortParams(BaseSchema):
    """Sort parameters"""
    
    sort_by: str = "created_at"
    sort_order: str = "desc"  # asc or desc
    
    def get_order_by(self) -> str:
        """Get SQLAlchemy order by clause"""
        direction = "ASC" if self.sort_order.lower() == "asc" else "DESC"
        return f"{self.sort_by} {direction}"