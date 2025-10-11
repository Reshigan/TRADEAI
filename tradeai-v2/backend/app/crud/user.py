"""
CRUD operations for User
"""

from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_by_email(
        self, 
        db: AsyncSession, 
        *, 
        email: str,
        tenant_id: Optional[UUID] = None
    ) -> Optional[User]:
        """Get user by email"""
        return await self.get_by_field(db=db, field="email", value=email, tenant_id=tenant_id)
    
    async def create(
        self, 
        db: AsyncSession, 
        *, 
        obj_in: UserCreate,
        tenant_id: Optional[UUID] = None,
        created_by: Optional[UUID] = None
    ) -> User:
        """Create user with hashed password"""
        # Hash the password
        hashed_password = pwd_context.hash(obj_in.password)
        
        # Create user data without password
        user_data = obj_in.dict(exclude={"password"})
        user_data["hashed_password"] = hashed_password
        
        # Create the user
        db_obj = User(**user_data)
        
        # Add tenant_id if provided
        if tenant_id:
            db_obj.tenant_id = tenant_id
        
        # Add created_by if provided
        if created_by:
            db_obj.created_by = created_by
            db_obj.updated_by = created_by
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    
    async def authenticate(
        self, 
        db: AsyncSession, 
        *, 
        email: str, 
        password: str,
        tenant_id: Optional[UUID] = None
    ) -> Optional[User]:
        """Authenticate user by email and password"""
        user = await self.get_by_email(db, email=email, tenant_id=tenant_id)
        if not user:
            return None
        if not pwd_context.verify(password, user.hashed_password):
            return None
        return user
    
    async def update_password(
        self,
        db: AsyncSession,
        *,
        user: User,
        new_password: str,
        updated_by: Optional[UUID] = None
    ) -> User:
        """Update user password"""
        hashed_password = pwd_context.hash(new_password)
        user.hashed_password = hashed_password
        
        if updated_by:
            user.updated_by = updated_by
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    
    async def update_last_login(
        self,
        db: AsyncSession,
        *,
        user: User
    ) -> User:
        """Update user's last login timestamp"""
        from datetime import datetime
        user.last_login = datetime.utcnow()
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    
    async def email_exists(
        self,
        db: AsyncSession,
        *,
        email: str,
        tenant_id: Optional[UUID] = None,
        exclude_id: Optional[UUID] = None
    ) -> bool:
        """Check if email already exists"""
        return await self.exists(
            db=db, 
            field="email", 
            value=email, 
            tenant_id=tenant_id,
            exclude_id=exclude_id
        )


user = CRUDUser(User)