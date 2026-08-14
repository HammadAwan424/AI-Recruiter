from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.domain.enums import RoleJobScope, RoleName, UserStatus


class CEOSignup(BaseModel):
    full_name: str = Field(min_length=1)
    email: EmailStr
    company_name: str = Field(min_length=1)
    password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("password and confirm_password must match")
        return self


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class EmployeeCreate(BaseModel):
    full_name: str = Field(min_length=1)
    email: EmailStr
    phone: str
    department: str
    joining_date: date
    password: str = Field(min_length=8)


class UserCreateByCEO(BaseModel):
    full_name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=8)
    role: RoleName
    department: Optional[str] = None
    phone: Optional[str] = None


class UserRoleUpdate(BaseModel):
    role: RoleName


class RolePermissionUpdate(BaseModel):
    permission_keys: list[str] = Field(default_factory=list)
    job_scope: Optional[RoleJobScope] = None


class CompanyMinimalResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: RoleName
    company_id: Optional[int] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    joining_date: Optional[date] = None
    status: UserStatus

    model_config = ConfigDict(from_attributes=True)
