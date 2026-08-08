from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.rbac.user_job_scope import UserJobScope
from app.schemas.user import CEOSignup, LoginSchema
from app.schemas.composite import UserDetail
from app.crud.user import create_ceo, get_user_by_email
from app.utils.security import verify_password, create_access_token, get_current_user, get_user_permissions, hash_password

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.post("/signup")
def signup(data: CEOSignup, db: Session = Depends(get_db)):
    user = get_user_by_email(db, data.email)

    if user:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered."
        )

    if data.password != data.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match."
        )

    new_user = create_ceo(db, data)

    return {
        "message": "Signup request submitted for admin review.",
        "user_id": new_user.id
    }


@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = get_user_by_email(db, data.email)

    if not user:
        raise HTTPException(status_code=400, detail="The email is incorrect.")

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=400, detail="The password is incorrect.")

    if user.role == "ceo" and user.status != "active":
        if user.status == "pending":
            raise HTTPException(status_code=403, detail="Your company account is pending SuperAdmin approval.")
        elif user.status == "inactive":
            raise HTTPException(status_code=403, detail="Your company account has been deactivated.")
        elif user.status == "rejected":
            raise HTTPException(status_code=403, detail="Your company registration request was rejected.")
        else:
            raise HTTPException(status_code=403, detail="Your account is not active.")

    if user.status == "inactive":
        raise HTTPException(
            status_code=403,
            detail="Your account is inactive."
        )

    token = create_access_token({
        "user_id": user.id,
        "role": user.role,
        "company_id": user.company_id,
        "email": user.email
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name
    }


class SelfUpdatePayload(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    old_password: Optional[str] = None
    password: Optional[str] = None


@router.get("/me", response_model=UserDetail)
def get_current_user_detail(
    current_user_dict: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .options(
            joinedload(User.company),
            joinedload(User.job_scopes).joinedload(UserJobScope.job)
        )
        .filter(User.id == current_user_dict["user_id"])
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    permissions = get_user_permissions(db, user.role, user.company_id)
    user.permissions = permissions
    return user


@router.put("/me")
def update_current_user_detail(
    data: SelfUpdatePayload,
    current_user_dict: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == current_user_dict["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    if data.full_name:
        user.full_name = data.full_name

    if data.company_name and user.company:
        if user.role in ("ceo"):
            user.company.name = data.company_name
        else:
            raise HTTPException(status_code=403, detail="Only company administrators can modify the company name.")

    if data.password:
        if data.old_password:
            if not verify_password(data.old_password, user.password):
                raise HTTPException(status_code=400, detail="Current password is incorrect.")
        user.password = hash_password(data.password)

    db.commit()
    db.refresh(user)

    return {
        "message": "Settings updated successfully",
        "full_name": user.full_name,
        "email": user.email,
        "company_name": user.company.name if user.company else ""
    }