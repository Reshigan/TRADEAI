"""
User Pydantic schemas
"""

from typing import Optional
from pydantic import Field, EmailStr, validator
import uuid

from .base import BaseCreateSchema, BaseUpdateSchema, BaseResponseSchema


class UserCreate(BaseCreateSchema):
    """Schema for creating a user"""
    
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    
    role: str = Field("user", description="User role")
    is_active: bool = Field(True, description="Whether user is active")
    
    # Optional fields
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    department: Optional[str] = Field(None, max_length=100, description="Department")
    job_title: Optional[str] = Field(None, max_length=100, description="Job title")
    
    @validator('role')
    def validate_role(cls, v):
        valid_roles = [
            'super_admin', 'tenant_admin', 'finance_manager', 'trade_manager',
            'brand_manager', 'sales_manager', 'analyst', 'user'
        ]
        if v not in valid_roles:
            raise ValueError(f'Role must be one of: {", ".join(valid_roles)}')
        return v


class UserUpdate(BaseUpdateSchema):
    """Schema for updating a user"""
    
    first_name: Optional[str] = Field(None, min_length=1, max_length=100, description="First name")
    last_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Last name")
    
    role: Optional[str] = Field(None, description="User role")
    is_active: Optional[bool] = Field(None, description="Whether user is active")
    
    # Optional fields
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    department: Optional[str] = Field(None, max_length=100, description="Department")
    job_title: Optional[str] = Field(None, max_length=100, description="Job title")
    
    @validator('role')
    def validate_role(cls, v):
        if v is None:
            return v
        valid_roles = [
            'super_admin', 'tenant_admin', 'finance_manager', 'trade_manager',
            'brand_manager', 'sales_manager', 'analyst', 'user'
        ]
        if v not in valid_roles:
            raise ValueError(f'Role must be one of: {", ".join(valid_roles)}')
        return v


class UserPasswordUpdate(BaseUpdateSchema):
    """Schema for updating user password"""
    
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")
    confirm_password: str = Field(..., description="Confirm new password")
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


class UserResponse(BaseResponseSchema):
    """Schema for user response"""
    
    tenant_id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    last_login: Optional[str] = None
    
    # Optional fields
    phone: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class UserSummary(BaseResponseSchema):
    """Schema for user summary (minimal info)"""
    
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class UserLogin(BaseCreateSchema):
    """Schema for user login"""
    
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., description="User password")


class UserLoginResponse(BaseResponseSchema):
    """Schema for login response"""
    
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserSummary