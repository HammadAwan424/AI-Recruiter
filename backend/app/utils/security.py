from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, Query

from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db
from app.models.job import Job
from app.models.application import Application
from app.models.interview import InterviewModel
from app.models.offer import Offer
from app.models.user import User
from app.models.rbac import Role, RolePermission, UserJobScope

pwd_context = CryptContext(
    schemes=["sha256_crypt"],
    deprecated="auto"
)


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalid or expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        role: str = payload.get("role")
        company_id: int = payload.get("company_id")
        if user_id is None:
            raise credentials_exception
        return {"user_id": user_id, "role": role, "company_id": company_id}
    except JWTError:
        raise credentials_exception


def require_roles(allowed_roles: list[str]):
    def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Role '{user_role}' is not authorized. Allowed roles: {allowed_roles}"
            )
        return current_user

    return role_checker


# ─────────────────────────────────────────────────────────────
# 1. GRANULAR PERMISSION DEPENDENCY FACTORY & WILDCARD MATCHING
# ─────────────────────────────────────────────────────────────
def user_has_permission(requested_key: str, user_permission_keys: set) -> bool:
    """
    Checks if any prefix stored in user_permission_keys grants access to requested_key.
    Supports:
    1. Global wildcard '*'
    2. Direct prefix matching (e.g. 'user:' or 'job:' matches 'user:view', 'job:create')
    3. Exact key match (e.g. 'user:view')
    """
    if "*" in user_permission_keys or requested_key in user_permission_keys:
        return True

    return any(requested_key.startswith(perm) for perm in user_permission_keys)


def get_user_permissions(db: Session, user_role_name: str, company_id: Optional[int] = None) -> List[str]:
    """Helper to resolve all permission keys for a given user role."""
    if not user_role_name:
        return []
    role_obj = db.query(Role).filter(
        Role.name == user_role_name,
        (Role.company_id == company_id) | (Role.company_id.is_(None))
    ).first()
    if not role_obj:
        return []
    user_permissions = (
        db.query(RolePermission.permission_key)
        .filter(RolePermission.role_id == role_obj.id)
        .all()
    )
    return [rp[0] for rp in user_permissions]


def require_permissions(required_keys: List[str]):
    def permission_checker(
        current_user: dict = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        user_role_name = current_user.get("role")
        user_company_id = current_user.get("company_id")

        if not user_role_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User role not found"
            )

        permission_list = get_user_permissions(db, user_role_name, user_company_id)
        user_permission_keys = set(permission_list)

        missing_keys = [
            key for key in required_keys if not user_has_permission(key, user_permission_keys)
        ]
        if missing_keys:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Missing required permission(s): {missing_keys}"
            )

        return current_user

    return permission_checker


# ─────────────────────────────────────────────────────────────
# 2. CENTRALIZED ROLE SCOPE & QUERY SCOPERS
# ─────────────────────────────────────────────────────────────
def get_job_scope(db: Session, user_role_name: str, company_id: Optional[int] = None) -> str:
    """Returns 'own' or 'all' for a user role based on Role.job_scope setting in database."""
    if not user_role_name:
        return "own"
    role_obj = db.query(Role).filter(
        Role.name == user_role_name,
        (Role.company_id == company_id) | (Role.company_id.is_(None))
    ).first()
    return role_obj.job_scope if role_obj and role_obj.job_scope else "own"


def get_scoped_jobs_query(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Query:
    company_id = current_user.get("company_id")
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")

    q = db.query(Job).filter(Job.company_id == company_id)
    if get_job_scope(db, user_role, company_id) != "all":
        q = q.join(UserJobScope, UserJobScope.job_id == Job.id).filter(UserJobScope.user_id == user_id)
    return q


def get_scoped_users_query(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Query:
    company_id = current_user.get("company_id")
    return db.query(User).filter(User.company_id == company_id)


def get_scoped_applications_query(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Query:
    company_id = current_user.get("company_id")
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")

    q = db.query(Application).join(Job, Application.job_id == Job.id).filter(Job.company_id == company_id)
    if get_job_scope(db, user_role, company_id) != "all":
        q = q.join(UserJobScope, UserJobScope.job_id == Job.id).filter(UserJobScope.user_id == user_id)
    return q


def get_scoped_offers_query(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Query:
    company_id = current_user.get("company_id")
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")

    q = db.query(Offer).join(Application, Offer.application_id == Application.id).join(Job, Application.job_id == Job.id)
    q = q.filter(Job.company_id == company_id)
    if get_job_scope(db, user_role, company_id) != "all":
        q = q.join(UserJobScope, UserJobScope.job_id == Job.id).filter(UserJobScope.user_id == user_id)
    return q


def get_scoped_interviews_query(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Query:
    company_id = current_user.get("company_id")
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")

    q = db.query(InterviewModel).join(Application, InterviewModel.application_id == Application.id).join(Job, Application.job_id == Job.id)
    q = q.filter(Job.company_id == company_id)
    if get_job_scope(db, user_role, company_id) != "all":
        q = q.join(UserJobScope, UserJobScope.job_id == Job.id).filter(UserJobScope.user_id == user_id)
    return q


# ─────────────────────────────────────────────────────────────
# 3. SINGLE-RECORD DEPENDENCY GUARDS
# ─────────────────────────────────────────────────────────────
def get_job_or_403(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Job:
    company_id = current_user.get("company_id")
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")

    q = db.query(Job).filter(Job.id == job_id, Job.company_id == company_id)
    if get_job_scope(db, user_role, company_id) != "all":
        q = q.join(UserJobScope, UserJobScope.job_id == Job.id).filter(UserJobScope.user_id == user_id)

    job = q.first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job position not found"
        )
    return job


def get_application_or_403(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Application:
    company_id = current_user.get("company_id")
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")

    q = db.query(Application).join(Job, Application.job_id == Job.id)
    q = q.filter(Application.id == application_id, Job.company_id == company_id)
    if get_job_scope(db, user_role, company_id) != "all":
        q = q.join(UserJobScope, UserJobScope.job_id == Job.id).filter(UserJobScope.user_id == user_id)

    app = q.first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app


def get_interview_or_403(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> InterviewModel:
    company_id = current_user.get("company_id")
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")

    q = db.query(InterviewModel).join(Application, InterviewModel.application_id == Application.id).join(Job, Application.job_id == Job.id)
    q = q.filter(InterviewModel.id == interview_id, Job.company_id == company_id)
    if get_job_scope(db, user_role, company_id) != "all":
        q = q.join(UserJobScope, UserJobScope.job_id == Job.id).filter(UserJobScope.user_id == user_id)

    interview = q.first()
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")
    return interview


def get_offer_or_403(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Offer:
    company_id = current_user.get("company_id")
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")

    q = db.query(Offer).join(Application, Offer.application_id == Application.id).join(Job, Application.job_id == Job.id)
    q = q.filter(Offer.id == offer_id, Job.company_id == company_id)
    if get_job_scope(db, user_role, company_id) != "all":
        q = q.join(UserJobScope, UserJobScope.job_id == Job.id).filter(UserJobScope.user_id == user_id)

    offer = q.first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")
    return offer


def get_user_or_403(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> User:
    company_id = current_user.get("company_id")
    user = db.query(User).filter(User.id == user_id, User.company_id == company_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in your company"
        )
    return user