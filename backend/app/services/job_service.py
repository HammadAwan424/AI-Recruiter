from sqlalchemy.orm import Session, Query, joinedload
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, status

from app.models.job import Job
from app.models.user import User
from app.models.rbac import UserJobScope
from app.schemas.job import JobCreate, JobUpdate
from app.agents.jd_generator import generate_job_description
from app.agents.job_distribution_agent import distribute_job
from app.crud.job import (
    create_job_db,
    get_job_by_id_db,
    update_job_db,
    delete_job_cascading_db,
    assign_user_job_scope_db,
    replace_job_scopes_db,
    remove_hiring_manager_scopes_db,
    create_job_distribution_db,
    get_job_distributions_db
)


def generate_job_description_service(db: Session, user_id: int, data: Any) -> Dict[str, Any]:
    """Generates structured job description and search keywords using AI agent."""
    user_obj = db.query(User).filter(User.id == user_id).first()
    company_name = user_obj.company.name if (user_obj and user_obj.company) else "Company"

    jd_result = generate_job_description(
        title=data.title,
        department=data.department,
        employment_type=data.employment_type,
        experience=data.experience,
        skills=getattr(data, "skills", "") or "",
        salary_range=getattr(data, "salary_range", "") or "",
        company_name=company_name,
        additional_info=getattr(data, "additional_info", "") or "",
        ceo_email=user_obj.email if user_obj else ""
    )

    full_desc = jd_result.get("full_description", "")
    if isinstance(full_desc, dict):
        full_desc = " ".join([str(v) for v in full_desc.values() if v])
    elif isinstance(full_desc, list):
        full_desc = " ".join([str(v) for v in full_desc])

    keywords = jd_result.get("keywords", "")
    if isinstance(keywords, list):
        keywords = " ".join([str(k) for k in keywords])

    return {
        "full_description": str(full_desc),
        "keywords": str(keywords)
    }


def auto_assign_user_job_scopes(
    db: Session,
    job_id: int,
    creator_id: int,
    company_id: int,
    hiring_manager_id: Optional[int] = None,
    recruiter_ids: Optional[List[int]] = None
):
    """Resolves HM and recruiter IDs and creates UserJobScopes via CRUD."""
    target_scopes: List[int] = [creator_id]

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
        assign_user_job_scope_db(db, job_id=job_id, user_id=uid, creator_id=creator_id)


def trigger_job_distribution_service(db: Session, job: Job, boards: List[str], creator_id: int) -> List[Dict[str, Any]]:
    """Distributes a job across target boards using distribution agent and saves DB records."""
    if not boards:
        return []

    distribution_results = distribute_job(job.id, job.title, boards)
    distribution_records = []

    for result in distribution_results:
        create_job_distribution_db(
            db=db,
            job_id=job.id,
            board=result["board"],
            status=result["status"],
            external_ref=result.get("external_ref"),
            error=result.get("error"),
            creator_id=creator_id
        )
        distribution_records.append(result)

    db.commit()
    return distribution_records


def publish_job_service(db: Session, data: JobCreate, creator_id: int, company_id: int) -> Job:
    """Creates and immediately publishes a job (for users with job:approve permission)."""
    job = create_job_db(db=db, job_in=data, company_id=company_id, creator_id=creator_id, status="published")

    auto_assign_user_job_scopes(
        db,
        job_id=job.id,
        creator_id=creator_id,
        company_id=company_id,
        hiring_manager_id=getattr(data, "hiring_manager_id", None),
        recruiter_ids=getattr(data, "recruiter_ids", None) or getattr(data, "interviewer_ids", None)
    )

    boards = getattr(data, "boards", [])
    if boards:
        trigger_job_distribution_service(db=db, job=job, boards=boards, creator_id=creator_id)

    db.commit()
    db.refresh(job)
    return job


def submit_pending_job_service(db: Session, data: JobCreate, creator_id: int, company_id: int) -> Job:
    """Creates a job in pending_approval status (for users with job:create permission only)."""
    job = create_job_db(db=db, job_in=data, company_id=company_id, creator_id=creator_id, status="pending_approval")

    auto_assign_user_job_scopes(
        db,
        job_id=job.id,
        creator_id=creator_id,
        company_id=company_id,
        hiring_manager_id=getattr(data, "hiring_manager_id", None),
        recruiter_ids=getattr(data, "recruiter_ids", None) or getattr(data, "interviewer_ids", None)
    )

    db.commit()
    db.refresh(job)
    return job


def update_job_service(db: Session, job: Job, payload: JobUpdate, user_id: int, company_id: int) -> Job:
    """Updates job details and updates assigned scopes via CRUD."""
    update_data = payload.model_dump(exclude_unset=True)
    hiring_manager_id = update_data.pop("hiring_manager_id", None)
    recruiter_ids = update_data.pop("recruiter_ids", None) or update_data.pop("interviewer_ids", None)

    update_job_db(db=db, job=job, update_fields=update_data, updated_by=user_id)

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

        replace_job_scopes_db(db=db, job_id=job.id, user_ids=target_scopes, creator_id=user_id)

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


def assign_user_to_job_service(db: Session, job: Job, target_user_id: int, company_id: int, creator_id: int) -> Dict[str, Any]:
    """Assigns a user to a job scope while enforcing the 1-Hiring Manager constraint."""
    target_user = db.query(User).filter(
        User.id == target_user_id,
        User.company_id == company_id
    ).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found in your company."
        )

    # 1. Enforce 1 Hiring Manager per job rule
    if target_user.role == "hiring_manager":
        remove_hiring_manager_scopes_db(db, job_id=job.id)

    # 2. Check if already scoped
    existing_scope = db.query(UserJobScope).filter_by(
        user_id=target_user_id,
        job_id=job.id
    ).first()

    if existing_scope:
        return {
            "message": f"User '{target_user.full_name}' is already assigned to this job.",
            "job_id": job.id,
            "user_id": target_user_id
        }

    assign_user_job_scope_db(db=db, job_id=job.id, user_id=target_user_id, creator_id=creator_id)
    db.commit()

    return {
        "message": f"User '{target_user.full_name}' ({target_user.role}) assigned to job scope successfully!",
        "job_id": job.id,
        "user_id": target_user_id
    }


def list_jobs_service(db: Session, jobs_query: Query) -> Dict[str, Any]:
    """Formats jobs query results into complete dictionary objects with distribution records and scope user details."""
    jobs = jobs_query.order_by(Job.created_at.desc()).all()
    results = []

    for j in jobs:
        scopes = db.query(UserJobScope).filter(UserJobScope.job_id == j.id).all()
        user_ids = [s.user_id for s in scopes]
        scoped_users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []

        hm = next((u for u in scoped_users if u.role == "hiring_manager"), None)
        recruiters = [u for u in scoped_users if u.role == "recruiter"]

        distributions = get_job_distributions_db(db, j.id)

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
            "distributions": distributions,
            "hiring_manager_id": hm.id if hm else None,
            "hiring_manager_name": hm.full_name if hm else "",
            "recruiter_ids": [r.id for r in recruiters],
            "recruiter_names": [r.full_name for r in recruiters]
        })

    return {
        "total": len(results),
        "jobs": results
    }


def delete_job_service(db: Session, job: Job) -> Dict[str, str]:
    """Deletes job and performs cascading cleanup via CRUD."""
    delete_job_cascading_db(db, job)
    return {"message": "Job and related data deleted successfully!"}
