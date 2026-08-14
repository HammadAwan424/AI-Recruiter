from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import RoleJobScope, RoleName


class RoleBase(BaseModel):
    name: RoleName
    description: Optional[str] = None
    job_scope: RoleJobScope = RoleJobScope.OWN


class RoleCreate(RoleBase):
    """company_id is assigned from the authenticated tenant context."""


class RoleResponse(RoleBase):
    id: int
    company_id: Optional[int] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RolePermissionBase(BaseModel):
    role_id: int
    permission_key: str = Field(min_length=1)


class RolePermissionCreate(RolePermissionBase):
    pass


class RolePermissionResponse(RolePermissionBase):
    id: int
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
