from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, Query

from app.database import get_db
from app.models.job import Job
from app.models.application import Application
from app.models.interview import InterviewModel
from app.models.offer import Offer
from app.models.rbac import Role, RolePermission, UserJobScope

pwd_context = CryptContext(
    schemes=["sha256_crypt"],
    deprecated="auto"
)


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

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
    """Checks exact key match or domain wildcard match (e.g. 'job:*' or '*')."""
    if "*" in user_permission_keys or requested_key in user_permission_keys:
        return True
    if ":" in requested_key:
        domain, _ = requested_key.split(":", 1)
        if f"{domain}:*" in user_permission_keys:
            return True
    return False


def get_user_permissions(db: Session, user_id: int, user_role_name: str) -> List[str]:
    """Helper to resolve all permission keys for a given user role."""
    role_obj = db.query(Role).filter(Role.name == user_role_name).first()
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

        role_obj = db.query(Role).filter(
            Role.name == user_role_name,
            (Role.company_id == user_company_id) | (Role.company_id.is_(None))
        ).first()

        if not role_obj:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user_role_name}' is not registered in security system"
            )

        user_permissions = (
            db.query(RolePermission.permission_key)
            .filter(RolePermission.role_id == role_obj.id)
            .all()
        )
        user_permission_keys = {rp[0] for rp in user_permissions}

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
# 2. CENTRALIZED COLLECTION QUERY SCOPERS
# ─────────────────────────────────────────────────────────────
def scoped_jobs_query(db: Session, current_user: dict) -> Query:
    company_id = current_user.get("company_id")
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")

    q = db.query(Job).filter(Job.company_id == company_id)

    if user_role in ("hiring_manager", "interviewer"):
        q = q.join(UserJobScope, UserJobScope.job_id == Job.id).filter(UserJobScope.user_id == user_id)

    return q


def scoped_offers_query(db: Session, current_user: dict) -> Query:
    company_id = current_user.get("company_id")
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")

    q = db.query(Offer).join(Application, Offer.application_id == Application.id).join(Job, Application.job_id == Job.id)
    q = q.filter(Job.company_id == company_id)

    if user_role in ("hiring_manager", "interviewer"):
        q = q.join(UserJobScope, UserJobScope.job_id == Job.id).filter(UserJobScope.user_id == user_id)

    return q


def scoped_interviews_query(db: Session, current_user: dict) -> Query:
    company_id = current_user.get("company_id")
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")

    q = db.query(InterviewModel).join(Application, InterviewModel.application_id == Application.id).join(Job, Application.job_id == Job.id)
    q = q.filter(Job.company_id == company_id)

    if user_role in ("hiring_manager", "interviewer"):
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

    job_query = db.query(Job).filter(Job.id == job_id, Job.company_id == company_id)

    job = job_query.first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job position not found"
        )

    if user_role in ("hiring_manager", "interviewer"):
        in_scope = db.query(UserJobScope).filter_by(
            user_id=user_id,
            job_id=job_id
        ).first()
        if not in_scope:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: job position is outside your assigned user scope."
            )

    return job


def get_application_or_403(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Application:
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    job = db.query(Job).filter(Job.id == app.job_id).first()
    if not job or job.company_id != current_user.get("company_id"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if current_user.get("role") in ("hiring_manager", "interviewer"):
        in_scope = db.query(UserJobScope).filter_by(
            user_id=current_user.get("user_id"),
            job_id=app.job_id
        ).first()
        if not in_scope:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: application is outside your assigned job scope.")

    return app


def get_interview_or_403(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> InterviewModel:
    interview = db.query(InterviewModel).filter(InterviewModel.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

    app = interview.application
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated application not found")

    job = db.query(Job).filter(Job.id == app.job_id).first()
    if not job or job.company_id != current_user.get("company_id"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

    if current_user.get("role") in ("hiring_manager", "interviewer"):
        in_scope = db.query(UserJobScope).filter_by(
            user_id=current_user.get("user_id"),
            job_id=app.job_id
        ).first()
        if not in_scope:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: interview is outside your assigned job scope.")

    return interview


def get_offer_or_403(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Offer:
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    app = offer.application
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated application not found")

    job = db.query(Job).filter(Job.id == app.job_id).first()
    if not job or job.company_id != current_user.get("company_id"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    if current_user.get("role") in ("hiring_manager", "interviewer"):
        in_scope = db.query(UserJobScope).filter_by(
            user_id=current_user.get("user_id"),
            job_id=app.job_id
        ).first()
        if not in_scope:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: offer is outside your assigned job scope.")

    return offer