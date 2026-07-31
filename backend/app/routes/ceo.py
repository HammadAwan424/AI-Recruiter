from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import Application
from app.models.rbac import Role, RolePermission
from app.schemas.user import (
    EmployeeCreate,
    UserCreateByCEO,
    UserRoleUpdate,
    RolePermissionUpdate
)
from app.crud.user import create_employee, get_employees_by_company
from app.utils.security import (
    get_current_user,
    require_permissions,
    hash_password
)

router = APIRouter(
    prefix="/ceo",
    tags=["CEO & User Management"]
)


def require_ceo(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ceo":
        raise HTTPException(status_code=403, detail="Only the CEO can perform this action.")
    return current_user


# ─────────────────────────────────────────────────────────────
# 1. COMPANY USER MANAGEMENT (COMPANY SCOPED)
# ─────────────────────────────────────────────────────────────
@router.post(
    "/users",
    dependencies=[Depends(require_permissions(["change_permissions"]))]
)
def create_company_user(
    data: UserCreateByCEO,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    company_id = current_user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="Executive account has no associated company")

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


@router.get("/users")
def get_company_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    company_id = current_user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="Executive account has no associated company")

    users = db.query(User).filter(User.company_id == company_id).all()
    return {
        "company_id": company_id,
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
    "/users/{user_id}/role",
    dependencies=[Depends(require_permissions(["change_permissions"]))]
)
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    company_id = current_user.get("company_id")

    user = db.query(User).filter(User.id == user_id, User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in your company")

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
    dependencies=[Depends(require_permissions(["change_permissions"]))]
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
            "permissions": perm_keys
        })

    return {
        "company_id": company_id,
        "roles": results
    }


@router.put(
    "/roles/{role_id}/permissions",
    dependencies=[Depends(require_permissions(["change_permissions"]))]
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

    db.query(RolePermission).filter(RolePermission.role_id == role_id).delete(synchronize_session=False)

    for perm_key in payload.permission_keys:
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
        "permissions": payload.permission_keys
    }


# ─────────────────────────────────────────────────────────────
# 3. EXECUTIVE PROFILE MANAGEMENT
# ─────────────────────────────────────────────────────────────
@router.get("/profile")
def get_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_ceo)
):
    ceo = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not ceo:
        raise HTTPException(status_code=404, detail="The CEO was not found.")
    return {
        "full_name": ceo.full_name,
        "email": ceo.email,
        "company_name": ceo.company.name if ceo.company else "",
    }


@router.put("/profile")
def update_profile(
    data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_ceo)
):
    ceo = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not ceo:
        raise HTTPException(status_code=404, detail="The CEO was not found.")

    if "full_name" in data and data["full_name"]:
        ceo.full_name = data["full_name"]
    if "password" in data and data["password"]:
        ceo.password = hash_password(data["password"])

    db.commit()

    return {
        "message": "The profile has been updated successfully.",
        "full_name": ceo.full_name,
        "company_name": ceo.company.name if ceo.company else "",
    }


# ─────────────────────────────────────────────────────────────
# 4. EXECUTIVE DASHBOARD STATS
# ─────────────────────────────────────────────────────────────
@router.get("/dashboard-stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_ceo)
):
    company_id = current_user.get("company_id")
    jobs = db.query(Job).filter(Job.company_id == company_id).all() if company_id else []
    job_ids = [j.id for j in jobs]

    total_jobs = len(jobs)

    total_applied = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.current_status == "applied"
    ).count() if job_ids else 0

    total_screening = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.current_status == "screening"
    ).count() if job_ids else 0

    total_interviews = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.current_status == "interview"
    ).count() if job_ids else 0

    total_offer = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.current_status.in_(["offer_approval", "offer_sent"])
    ).count() if job_ids else 0

    total_hired = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.current_status == "hired"
    ).count() if job_ids else 0

    dept_list = list(set([j.department for j in jobs if j.department]))

    return {
        "total_employees": total_hired,
        "total_departments": len(dept_list),
        "active_openings": total_jobs,
        "pipeline": {
            "applied": total_applied,
            "screening": total_screening,
            "interviews": total_interviews,
            "offer": total_offer,
            "hired": total_hired
        }
    }