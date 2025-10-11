"""
Base CRUD operations
"""

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from uuid import UUID
from datetime import datetime

from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy import select, update, delete, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.base import BaseModel as DBBaseModel

ModelType = TypeVar("ModelType", bound=DBBaseModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        """
        CRUD object with default methods to Create, Read, Update, Delete (CRUD).
        
        **Parameters**
        
        * `model`: A SQLAlchemy model class
        * `schema`: A Pydantic model (schema) class
        """
        self.model = model

    async def get(
        self, 
        db: AsyncSession, 
        id: UUID,
        tenant_id: Optional[UUID] = None
    ) -> Optional[ModelType]:
        """Get a single record by ID"""
        query = select(self.model).where(self.model.id == id)
        
        # Add tenant filtering if model has tenant_id and tenant_id is provided
        if hasattr(self.model, 'tenant_id') and tenant_id:
            query = query.where(self.model.tenant_id == tenant_id)
        
        # Add soft delete filtering
        if hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))
        
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        tenant_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[str] = None
    ) -> List[ModelType]:
        """Get multiple records with filtering and pagination"""
        query = select(self.model)
        
        # Add tenant filtering
        if hasattr(self.model, 'tenant_id') and tenant_id:
            query = query.where(self.model.tenant_id == tenant_id)
        
        # Add soft delete filtering
        if hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))
        
        # Apply filters
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    column = getattr(self.model, key)
                    if isinstance(value, str) and key in ['name', 'description', 'code']:
                        # String search with ILIKE
                        query = query.where(column.ilike(f"%{value}%"))
                    elif isinstance(value, list):
                        # IN clause for lists
                        query = query.where(column.in_(value))
                    else:
                        # Exact match
                        query = query.where(column == value)
        
        # Apply ordering
        if order_by:
            if order_by.startswith('-'):
                # Descending order
                column_name = order_by[1:]
                if hasattr(self.model, column_name):
                    query = query.order_by(getattr(self.model, column_name).desc())
            else:
                # Ascending order
                if hasattr(self.model, order_by):
                    query = query.order_by(getattr(self.model, order_by))
        else:
            # Default ordering by created_at desc
            if hasattr(self.model, 'created_at'):
                query = query.order_by(self.model.created_at.desc())
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()

    async def count(
        self,
        db: AsyncSession,
        *,
        tenant_id: Optional[UUID] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> int:
        """Count records with filtering"""
        query = select(func.count(self.model.id))
        
        # Add tenant filtering
        if hasattr(self.model, 'tenant_id') and tenant_id:
            query = query.where(self.model.tenant_id == tenant_id)
        
        # Add soft delete filtering
        if hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))
        
        # Apply filters
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    column = getattr(self.model, key)
                    if isinstance(value, str) and key in ['name', 'description', 'code']:
                        query = query.where(column.ilike(f"%{value}%"))
                    elif isinstance(value, list):
                        query = query.where(column.in_(value))
                    else:
                        query = query.where(column == value)
        
        result = await db.execute(query)
        return result.scalar()

    async def create(
        self, 
        db: AsyncSession, 
        *, 
        obj_in: CreateSchemaType,
        tenant_id: Optional[UUID] = None,
        created_by: Optional[UUID] = None
    ) -> ModelType:
        """Create a new record"""
        obj_in_data = jsonable_encoder(obj_in)
        
        # Add tenant_id if model supports it
        if hasattr(self.model, 'tenant_id') and tenant_id:
            obj_in_data["tenant_id"] = tenant_id
        
        # Add created_by if model supports it
        if hasattr(self.model, 'created_by') and created_by:
            obj_in_data["created_by"] = created_by
            obj_in_data["updated_by"] = created_by
        
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]],
        updated_by: Optional[UUID] = None
    ) -> ModelType:
        """Update an existing record"""
        obj_data = jsonable_encoder(db_obj)
        
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        # Add updated_by if model supports it
        if hasattr(self.model, 'updated_by') and updated_by:
            update_data["updated_by"] = updated_by
        
        # Update updated_at timestamp
        if hasattr(self.model, 'updated_at'):
            update_data["updated_at"] = datetime.utcnow()
        
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(
        self, 
        db: AsyncSession, 
        *, 
        id: UUID,
        tenant_id: Optional[UUID] = None,
        hard_delete: bool = False,
        deleted_by: Optional[UUID] = None
    ) -> Optional[ModelType]:
        """Remove a record (soft delete by default)"""
        obj = await self.get(db=db, id=id, tenant_id=tenant_id)
        if not obj:
            return None
        
        if hard_delete or not hasattr(self.model, 'deleted_at'):
            # Hard delete
            await db.delete(obj)
        else:
            # Soft delete
            obj.deleted_at = datetime.utcnow()
            if hasattr(self.model, 'updated_by') and deleted_by:
                obj.updated_by = deleted_by
            db.add(obj)
        
        await db.commit()
        return obj

    async def restore(
        self,
        db: AsyncSession,
        *,
        id: UUID,
        tenant_id: Optional[UUID] = None,
        restored_by: Optional[UUID] = None
    ) -> Optional[ModelType]:
        """Restore a soft-deleted record"""
        if not hasattr(self.model, 'deleted_at'):
            return None
        
        query = select(self.model).where(
            and_(
                self.model.id == id,
                self.model.deleted_at.is_not(None)
            )
        )
        
        if hasattr(self.model, 'tenant_id') and tenant_id:
            query = query.where(self.model.tenant_id == tenant_id)
        
        result = await db.execute(query)
        obj = result.scalar_one_or_none()
        
        if obj:
            obj.deleted_at = None
            if hasattr(self.model, 'updated_by') and restored_by:
                obj.updated_by = restored_by
            if hasattr(self.model, 'updated_at'):
                obj.updated_at = datetime.utcnow()
            
            db.add(obj)
            await db.commit()
            await db.refresh(obj)
        
        return obj

    async def get_by_field(
        self,
        db: AsyncSession,
        *,
        field: str,
        value: Any,
        tenant_id: Optional[UUID] = None
    ) -> Optional[ModelType]:
        """Get a record by a specific field"""
        if not hasattr(self.model, field):
            return None
        
        query = select(self.model).where(getattr(self.model, field) == value)
        
        # Add tenant filtering
        if hasattr(self.model, 'tenant_id') and tenant_id:
            query = query.where(self.model.tenant_id == tenant_id)
        
        # Add soft delete filtering
        if hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))
        
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def exists(
        self,
        db: AsyncSession,
        *,
        field: str,
        value: Any,
        tenant_id: Optional[UUID] = None,
        exclude_id: Optional[UUID] = None
    ) -> bool:
        """Check if a record exists with the given field value"""
        if not hasattr(self.model, field):
            return False
        
        query = select(func.count(self.model.id)).where(getattr(self.model, field) == value)
        
        # Add tenant filtering
        if hasattr(self.model, 'tenant_id') and tenant_id:
            query = query.where(self.model.tenant_id == tenant_id)
        
        # Add soft delete filtering
        if hasattr(self.model, 'deleted_at'):
            query = query.where(self.model.deleted_at.is_(None))
        
        # Exclude specific ID (useful for updates)
        if exclude_id:
            query = query.where(self.model.id != exclude_id)
        
        result = await db.execute(query)
        count = result.scalar()
        return count > 0