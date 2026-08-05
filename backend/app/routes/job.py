from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Query, Session, joinedload
from typing import Dict, Any, List
from pydantic import BaseModel

from app.database import get_db
from app.models.company import Company
from app.models.user import User
from app.models.job import Job
from app.models.job_distribution import JobDistribution
from app.models.interview import InterviewModel, InterviewFeedback
from app.models.application import Application
from app.models.rbac import UserJobScope
from app.schemas.job import JobCreate, JobUpdate
from app.schemas.composite import JobDetail
from app.utils.security import (
    get_current_user,
    require_permissions,
    get_scoped_jobs_query,
    get_job_scope,
    get_job_or_403
)
from app.agents.jd_generator import generate_job_description
from app.agents.job_distribution_agent import distribute_job

router = APIRouter(prefix="/jobs", tags=["Jobs"])


# ──── Supported distribution boards ────
@router.get("/boards")
def get_supported_boards():
    return {"boards": SUPPORTED_BOARDS}

def require_ceo(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ceo":
        raise HTTPException(status_code=403, detail="Sirf CEO yeh kaam kar sakta hai")
    return current_user
class JobAssignUserPayload(BaseModel):
    user_id: int


def to_string(value) -> str:
    if isinstance(value, str):
        return value
    elif isinstance(value, dict):
        parts = []
        for v in value.values():
            if isinstance(v, str):
                parts.append(v)
            elif isinstance(v, list):
                parts.extend([str(i) for i in v])
        return " ".join(parts)
    elif isinstance(value, list):
        return " ".join([str(i) for i in value])
    return str(value) if value else ""


# ──── Job Create & Auto UserJobScope Assignment ────
@router.post("", dependencies=[Depends(require_permissions(["job:create"]))])
def create_job(
    data: JobCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    company_id = current_user.get("company_id")
    user_obj = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user_obj:
        raise HTTPException(status_code=404, detail="User account not found")

    additional_info = getattr(data, "additional_info", "")
    jd_result = generate_job_description(
        title=data.title, department=data.department,
        employment_type=data.employment_type, experience=data.experience,
        skills=data.skills, salary_range=data.salary_range,
        company_name=(user_obj.company.name if user_obj.company else "Company"),
        additional_info=additional_info, ceo_email=user_obj.email
    )

    full_description = to_string(jd_result.get("full_description", ""))
    keywords = to_string(jd_result.get("keywords", ""))

    new_job = Job(
        company_id=company_id or user_obj.company_id,
        title=data.title,
        department=data.department,
        employment_type=data.employment_type,
        experience=data.experience,
        skills=data.skills,
        salary_range=data.salary_range,
        full_description=full_description,
        keywords=keywords,
        status="published",
        created_by=current_user["user_id"]
    )
    db.add(new_job)
    db.flush()

    # Automatically assign creator, hiring manager, and interviewers to UserJobScope
    hiring_manager_id = getattr(data, "hiring_manager_id", None)
    recruiter_ids = getattr(data, "recruiter_ids", None) or getattr(data, "interviewer_ids", None)
    target_scopes: List[int] = [current_user["user_id"]]

    if hiring_manager_id:
        hm_user = db.query(User).filter_by(id=hiring_manager_id, company_id=company_id).first()
        if hm_user and hm_user.id not in target_scopes:
            target_scopes.append(hm_user.id)

    if recruiter_ids:
        recruiter_users = db.query(User).filter(
            User.id.in_(recruiter_ids),
            User.company_id == company_id
        ).all()
        for u in recruiter_users:
            if u.id not in target_scopes:
                target_scopes.append(u.id)

    for uid in target_scopes:
        target_user = db.query(User).filter(User.id == uid).first()
        target_role = target_user.role if target_user else "hiring_manager"
        if get_job_scope(db, target_role, company_id) != "all":
            existing_scope = db.query(UserJobScope).filter_by(user_id=uid, job_id=new_job.id).first()
            if not existing_scope:
                creator_scope = UserJobScope(
                    user_id=uid,
                    job_id=new_job.id,
                    created_by=current_user["user_id"]
                )
                db.add(creator_scope)

    db.commit()
    db.refresh(new_job)

    # Job Multi-Board Distribution
    boards = getattr(data, "boards", [])
    distribution_records = []
    if boards:
        distribution_results = distribute_job(new_job.id, new_job.title, boards)
        for result in distribution_results:
            dist_record = JobDistribution(
                job_id=new_job.id,
                board=result["board"],
                status=result["status"],
                external_ref=result.get("external_ref"),
                error=result.get("error"),
                created_by=current_user["user_id"]
            )
            db.add(dist_record)
            distribution_records.append(result)
        db.commit()

    return {
        "message": "Job successfully created!",
        "job_id": new_job.id,
        "title": new_job.title,
        "full_description": new_job.full_description,
        "keywords": new_job.keywords,
        "distributions": distribution_records
    }

# TODO: move to utility
def _distributions_for(db: Session, job_id: int) -> list[dict]:
    records = db.query(JobDistribution).filter(JobDistribution.job_id == job_id).all()
    return [{
        "board": d.board,
        "status": d.status,
        "external_ref": d.external_ref,
        "error": d.error
    } for d in records]

# ──── Assign User to Job (Adds row to UserJobScope with 1 HM constraint) ────
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
    target_user = db.query(User).filter(
        User.id == payload.user_id,
        User.company_id == current_user.get("company_id")
    ).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found in your company."
        )

    # 1. If target_user is a hiring_manager, strictly 1 Hiring Manager is allowed per job
    if target_user.role == "hiring_manager":
        existing_hm_scopes = (
            db.query(UserJobScope)
            .join(User, UserJobScope.user_id == User.id)
            .filter(UserJobScope.job_id == job.id, User.role == "hiring_manager")
            .all()
        )
        for old_scope in existing_hm_scopes:
            db.delete(old_scope)
        db.flush()

    # 2. Check if target_user is already scoped for this job
    existing_scope = db.query(UserJobScope).filter_by(
        user_id=payload.user_id,
        job_id=job.id
    ).first()

    if existing_scope:
        return {
            "message": f"User '{target_user.full_name}' is already assigned to this job.",
            "job_id": job.id,
            "user_id": payload.user_id
        }

    new_scope = UserJobScope(
        user_id=payload.user_id,
        job_id=job.id,
        created_by=current_user["user_id"]
    )
    db.add(new_scope)
    db.commit()

    return {
        "message": f"User '{target_user.full_name}' ({target_user.role}) assigned to job scope successfully!",
        "job_id": job.id,
        "user_id": payload.user_id
    }


# ──── Scoped Jobs List ────
@router.get("", dependencies=[Depends(require_permissions(["job:view"]))])
def get_jobs(
    db: Session = Depends(get_db),
    jobs_query: Query = Depends(get_scoped_jobs_query)
):
    jobs = jobs_query.filter(Job.status == "published").all()
    results = []

    for j in jobs:
        scopes = db.query(UserJobScope).filter(UserJobScope.job_id == j.id).all()
        user_ids = [s.user_id for s in scopes]
        scoped_users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []

        hm = next((u for u in scoped_users if u.role == "hiring_manager"), None)
        recruiters = [u for u in scoped_users if u.role == "recruiter"]

        results.append({
            "id": j.id,
            "title": j.title,
            "department": j.department,
            "employment_type": j.employment_type,
            "experience": j.experience,
            "skills": j.skills,
            "salary_range": j.salary_range,
            "full_description": j.full_description,
            "status": j.status,
            "created_at": j.created_at,
            "distributions": _distributions_for(db, j.id),
            "hiring_manager_id": hm.id if hm else None,
            "hiring_manager_name": hm.full_name if hm else "",
            "recruiter_ids": [r.id for r in recruiters],
            "recruiter_names": [r.full_name for r in recruiters]
        })

    return {
        "total": len(results),
        "jobs": results
    }


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
    update_data = payload.model_dump(exclude_unset=True)
    hiring_manager_id = update_data.pop("hiring_manager_id", None)
    recruiter_ids = update_data.pop("recruiter_ids", None) or update_data.pop("interviewer_ids", None)

    for field, val in update_data.items():
        setattr(job, field, val)

    job.updated_by = current_user["user_id"]

    company_id = current_user.get("company_id")
    if hiring_manager_id is not None or recruiter_ids is not None:
        target_scopes: List[int] = []

        if hiring_manager_id:
            hm_user = db.query(User).filter_by(id=hiring_manager_id, company_id=company_id).first()
            if hm_user:
                target_scopes.append(hm_user.id)

        if recruiter_ids:
            recruiter_users = db.query(User).filter(
                User.id.in_(recruiter_ids),
                User.company_id == company_id
            ).all()
            for u in recruiter_users:
                if u.id not in target_scopes:
                    target_scopes.append(u.id)

        db.query(UserJobScope).filter(UserJobScope.job_id == job.id).delete(synchronize_session=False)
        for uid in target_scopes:
            new_scope = UserJobScope(user_id=uid, job_id=job.id, created_by=current_user["user_id"])
            db.add(new_scope)

    db.commit()

    refreshed_job = (
        db.query(Job)
        .options(
            joinedload(Job.creator),
            joinedload(Job.job_scopes).joinedload(UserJobScope.user)
        )
        .filter(Job.id == job.id)
        .first()
    )
    return refreshed_job or job


# ──── Scoped Job Delete ────
@router.delete(
    "/{job_id}",
    dependencies=[Depends(require_permissions(["create_requisition"]))]
)
def delete_job(
    job: Job = Depends(get_job_or_403),
    db: Session = Depends(get_db)
):
    applications = db.query(Application).filter(Application.job_id == job.id).all()
    app_ids = [a.id for a in applications]

    interviews = db.query(InterviewModel).filter(InterviewModel.application_id.in_(app_ids)).all() if app_ids else []
    interview_ids = [i.id for i in interviews]

    if interview_ids:
        db.query(InterviewFeedback).filter(InterviewFeedback.interview_id.in_(interview_ids)).delete(synchronize_session=False)
        db.query(InterviewModel).filter(InterviewModel.id.in_(interview_ids)).delete(synchronize_session=False)

    db.query(JobDistribution).filter(JobDistribution.job_id == job.id).delete(synchronize_session=False)
    db.query(Application).filter(Application.job_id == job.id).delete(synchronize_session=False)
    db.query(UserJobScope).filter(UserJobScope.job_id == job.id).delete(synchronize_session=False)
    db.delete(job)
    db.commit()

    return {"message": "Job and related data deleted successfully!"}


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
