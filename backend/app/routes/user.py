from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, Query
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.models.rbac import Role, RolePermission
from app.schemas.user import (
    UserCreateByCEO,
    UserRoleUpdate,
    RolePermissionUpdate
)
from app.permissions import normalize_permissions
from app.utils.security import (
    get_current_user,
    require_permissions,
    get_user_or_403,
    get_scoped_users_query,
    hash_password
)

router = APIRouter(
    prefix="/users",
    tags=["Users & Permissions"]
)


# ─────────────────────────────────────────────────────────────
# 1. COMPANY USER MANAGEMENT (COMPANY SCOPED WITH ROLE FILTERING)
# ─────────────────────────────────────────────────────────────
@router.post(
    "",
    dependencies=[Depends(require_permissions(["user:change_permissions"]))]
)
def create_company_user(
    data: UserCreateByCEO,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    company_id = current_user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="Account has no associated company")

    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already registered.")

    new_user = User(
        full_name=data.full_name,
        email=data.email,
        password=hash_password(data.password),
        role=data.role,
        company_id=company_id,
        department=data.department,
        phone=data.phone,
        status="active"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully!",
        "user_id": new_user.id,
        "full_name": new_user.full_name,
        "email": new_user.email,
        "role": new_user.role,
        "company_id": new_user.company_id
    }


@router.get("", 
    dependencies=[Depends(require_permissions(["user:view"]))]
)
def get_company_users(
    role: Optional[str] = None,
    users_query: Query = Depends(get_scoped_users_query),
    current_user: dict = Depends(get_current_user),
):
    query = users_query
    if role:
        query = query.filter(User.role == role)

    users = query.all()
    return {
        "company_id": current_user.get("company_id"),
        "total_users": len(users),
        "users": [
            {
                "id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "phone": u.phone,
                "role": u.role,
                "department": u.department,
                "status": u.status,
                "joining_date": u.joining_date
            }
            for u in users
        ]
    }


@router.put(
    "/{user_id}/role",
    dependencies=[Depends(require_permissions(["user:change_permissions"]))]
)
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    user: User = Depends(get_user_or_403),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if user.role == "superadmin":
        raise HTTPException(status_code=403, detail="Cannot modify SuperAdmin accounts")

    user.role = payload.role
    user.updated_by = current_user["user_id"]
    db.commit()
    db.refresh(user)

    return {
        "message": f"User role updated to '{user.role}' successfully!",
        "user_id": user.id,
        "role": user.role
    }


# ─────────────────────────────────────────────────────────────
# 2. ROLE PERMISSION MANAGEMENT (COMPANY SCOPED)
# ─────────────────────────────────────────────────────────────
@router.get(
    "/roles",
    dependencies=[Depends(require_permissions(["user:view"]))]
)
def get_company_roles(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    company_id = current_user.get("company_id")

    roles = db.query(Role).filter(
        (Role.company_id == company_id) | (Role.company_id.is_(None))
    ).all()

    results = []
    for r in roles:
        permissions = db.query(RolePermission.permission_key).filter(RolePermission.role_id == r.id).all()
        perm_keys = [p[0] for p in permissions]

        results.append({
            "id": r.id,
            "name": r.name,
            "company_id": r.company_id,
            "description": r.description,
            "job_scope": r.job_scope,
            "permissions": perm_keys
        })

    return {
        "company_id": company_id,
        "roles": results
    }


@router.put(
    "/roles/{role_id}/permissions",
    dependencies=[Depends(require_permissions(["user:change_permissions"]))]
)
def update_role_permissions(
    role_id: int,
    payload: RolePermissionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    company_id = current_user.get("company_id")

    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role.name == "superadmin":
        raise HTTPException(status_code=403, detail="Cannot modify SuperAdmin permissions")

    if role.company_id and role.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied: role belongs to another company")

    if payload.job_scope is not None:
        if payload.job_scope in ("own", "all"):
            role.job_scope = payload.job_scope

    normalized_keys = normalize_permissions(payload.permission_keys)

    db.query(RolePermission).filter(RolePermission.role_id == role_id).delete(synchronize_session=False)

    for perm_key in normalized_keys:
        rp = RolePermission(
            role_id=role_id,
            permission_key=perm_key,
            created_by=current_user["user_id"]
        )
        db.add(rp)

    db.commit()

    return {
        "message": f"Role '{role.name}' permissions updated successfully!",
        "role_id": role_id,
        "job_scope": role.job_scope,
        "permissions": normalized_keys
    }


# ─────────────────────────────────────────────────────────────
# 3. USER PROFILE MANAGEMENT (REQUIRES user:view / profile:update PERMISSIONS)
# ─────────────────────────────────────────────────────────────
@router.get(
    "/{user_id}/profile",
    dependencies=[Depends(require_permissions(["user:view"]))]
)
def get_user_profile(
    user: User = Depends(get_user_or_403),
    db: Session = Depends(get_db)
):
    return {
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "department": user.department,
        "company_name": user.company.name if user.company else "",
    }


@router.put(
    "/{user_id}/profile",
    dependencies=[Depends(require_permissions(["profile:update"]))]
)
def update_user_profile(
    user_id: int,
    data: dict,
    user: User = Depends(get_user_or_403),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if "full_name" in data and data["full_name"]:
        user.full_name = data["full_name"]
    if "password" in data and data["password"]:
        user.password = hash_password(data["password"])

    user.updated_by = current_user["user_id"]
    db.commit()

    return {
        "message": "User profile updated successfully.",
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "company_name": user.company.name if user.company else "",
    }