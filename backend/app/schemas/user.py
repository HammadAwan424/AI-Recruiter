from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional, List


# CEO Signup Schema
class CEOSignup(BaseModel):
    full_name: str
    email: EmailStr
    company_name: str
    password: str
    confirm_password: str


# Login Schema
class LoginSchema(BaseModel):
    email: EmailStr
    password: str


# Employee Create Schema
class EmployeeCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    department: str
    joining_date: date
    password: str


# Company User Create Schema
class UserCreateByCEO(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str  # recruiter | hiring_manager | interviewer | employee
    department: Optional[str] = None
    phone: Optional[str] = None


# Role Update Schema
class UserRoleUpdate(BaseModel):
    role: str


# Role Permission Update Schema
class RolePermissionUpdate(BaseModel):
    permission_keys: List[str]


# User Job Scope Update Schema
class UserJobScopeUpdate(BaseModel):
    job_ids: List[int]