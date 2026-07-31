from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


# ──── Role Schemas ────
class RoleBase(BaseModel):
    name: str
    company_id: Optional[int] = None
    description: Optional[str] = None


class RoleCreate(RoleBase):
    pass


class RoleResponse(RoleBase):
    id: int
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ──── RolePermission Schemas ────
class RolePermissionBase(BaseModel):
    role_id: int
    permission_key: str


class RolePermissionCreate(RolePermissionBase):
    pass


class RolePermissionResponse(RolePermissionBase):
    id: int
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
