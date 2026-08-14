from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Query, Session, joinedload
from typing import Dict, Any, List
from pydantic import BaseModel

from app.database import get_db
from app.models.job import Job
from app.models.rbac import UserJobScope
from app.domain.enums import JobStatus
from app.schemas.job import JobCreate, JobUpdate
from app.schemas.composite import JobDetail
from app.utils.security import (
    get_current_user,
    require_permissions,
    get_scoped_jobs_query,
    get_job_or_403,
    get_user_permissions,
    user_has_permission,
)
from app.agents.job_distribution_agent import SUPPORTED_BOARDS
from app.services.job_service import (
    publish_job_service,
    submit_pending_job_service,
    update_job_service,
    assign_user_to_job_service,
    list_jobs_service,
    delete_job_service
)

router = APIRouter(prefix="/jobs", tags=["Jobs"])


class JobAssignUserPayload(BaseModel):
    user_id: int


# ──── Supported Distribution Boards ────
@router.get("/boards")
def get_supported_boards():
    return {"boards": SUPPORTED_BOARDS}


# ──── Job Create (Approve vs Create Status Resolution) ────
@router.post("", dependencies=[Depends(require_permissions(["job:create"]))])
def create_job(
    data: JobCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_role = current_user.get("role")
    company_id = current_user.get("company_id")
    user_permissions = get_user_permissions(db, user_role, company_id)
    user_perm_set = set(user_permissions)

    can_approve = (
        user_has_permission("job:approve", user_perm_set)
        or user_has_permission("job:*", user_perm_set)
    )

    if can_approve:
        new_job = publish_job_service(db, data, creator_id=current_user["user_id"], company_id=company_id)
    else:
        new_job = submit_pending_job_service(db, data, creator_id=current_user["user_id"], company_id=company_id)

    return new_job


# ──── Assign User to Job Scope ────
@router.post(
    "/{job_id}/assign",
    dependencies=[Depends(require_permissions(["job:assign_recruiter"]))]
)
def assign_user_to_job(
    job_id: int,
    payload: JobAssignUserPayload,
    job: Job = Depends(get_job_or_403),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return assign_user_to_job_service(
        db=db,
        job=job,
        target_user_id=payload.user_id,
        company_id=current_user.get("company_id"),
        creator_id=current_user["user_id"]
    )


# ──── Scoped Jobs List ────
@router.get("", dependencies=[Depends(require_permissions(["job:view"]))])
def get_jobs(
    db: Session = Depends(get_db),
    jobs_query: Query = Depends(get_scoped_jobs_query)
):
    return list_jobs_service(db=db, jobs_query=jobs_query)


# ──── Single Scoped Job Detail ────
@router.get("/{job_id}", response_model=JobDetail, dependencies=[Depends(require_permissions(["job:view"]))])
def get_job(
    job: Job = Depends(get_job_or_403),
    db: Session = Depends(get_db)
):
    job_detail = (
        db.query(Job)
        .options(
            joinedload(Job.creator),
            joinedload(Job.job_scopes).joinedload(UserJobScope.user)
        )
        .filter(Job.id == job.id)
        .first()
    )
    return job_detail or job


# ──── Scoped Job Update ────
@router.put(
    "/{job_id}",
    response_model=JobDetail,
    dependencies=[Depends(require_permissions(["job:create"]))]
)
def update_job(
    job_id: int,
    payload: JobUpdate,
    job: Job = Depends(get_job_or_403),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_role = current_user.get("role")
    company_id = current_user.get("company_id")
    user_permissions = get_user_permissions(db, user_role, company_id)
    user_perm_set = set(user_permissions)

    if payload.status in ("published", JobStatus.PUBLISHED):
        can_approve = (
            user_has_permission("job:approve", user_perm_set)
            or user_has_permission("job:*", user_perm_set)
        )
        if not can_approve:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied. You do not have authority to approve and publish job requisitions."
            )

    return update_job_service(
        db=db,
        job=job,
        payload=payload,
        user_id=current_user["user_id"],
        company_id=current_user["company_id"]
    )


# ──── Scoped Job Approve & Publish ────
@router.post(
    "/{job_id}/approve",
    response_model=JobDetail,
    dependencies=[Depends(require_permissions(["job:approve"]))]
)
def approve_job(
    job_id: int,
    job: Job = Depends(get_job_or_403),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    job.status = "published"
    job.updated_by = current_user["user_id"]
    db.commit()
    db.refresh(job)
    return job


# ──── Scoped Job Delete ────
@router.delete(
    "/{job_id}",
    dependencies=[Depends(require_permissions(["job:create"]))]
)
def delete_job(
    job: Job = Depends(get_job_or_403),
    db: Session = Depends(get_db)
):
    return delete_job_service(db=db, job=job)


# ──── Public Unauthenticated Jobs ────
@router.get("/public/all")
def get_public_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.status == "published").all()
    result = []
    for job in jobs:
        result.append({
            "id": job.id,
            "title": job.title,
            "department": job.department,
            "employment_type": job.employment_type,
            "experience": job.experience,
            "skills": job.skills,
            "salary_range": job.salary_range,
            "company_name": job.company.name if job.company else "",
            "full_description": job.full_description,
            "created_at": job.created_at
        })
    return {"total": len(result), "jobs": result}


# ──── Single Public Unauthenticated Job ────
@router.get("/public/{job_id}")
def get_public_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": job.id,
        "title": job.title,
        "department": job.department,
        "employment_type": job.employment_type,
        "experience": job.experience,
        "skills": job.skills,
        "salary_range": job.salary_range,
        "company_name": job.company.name if job.company else "",
        "full_description": job.full_description,
        "created_at": job.created_at
    }
