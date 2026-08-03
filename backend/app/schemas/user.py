from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import date
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.job import JobResponse


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
    job_scope: Optional[str] = None  # "own" | "all"


# User Response Schema
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    company_id: Optional[int] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    joining_date: Optional[date] = None
    status: str

    model_config = ConfigDict(from_attributes=True)


# User Detail Schema (for /auth/me or user detail views)
class UserDetail(UserResponse):
    permissions: List[str] = []
    assigned_jobs: List["JobResponse"] = []