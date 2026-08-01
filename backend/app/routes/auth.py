from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User
from app.models.rbac.user_job_scope import UserJobScope
from app.schemas.user import CEOSignup, LoginSchema, UserDetail
from app.crud.user import create_ceo, get_user_by_email
from app.utils.security import verify_password, create_access_token, get_current_user, get_user_permissions

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


@router.get("/me", response_model=UserDetail)
def get_current_user_detail(
    current_user_dict: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .options(
            joinedload(User.job_scopes).joinedload(UserJobScope.job)
        )
        .filter(User.id == current_user_dict["user_id"])
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    permissions = get_user_permissions(db, user.id, user.role)
    user.permissions = permissions
    return user