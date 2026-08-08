from sqlalchemy.orm import Session, joinedload
from typing import Optional, List, Dict, Any

from app.models.job import Job
from app.models.job_distribution import JobDistribution
from app.models.application import Application
from app.models.interview import InterviewModel, InterviewFeedback
from app.models.rbac import UserJobScope
from app.models.user import User
from app.schemas.job import JobCreate, JobUpdate


# ──── 1. JOB CRUD ────
def create_job_db(
    db: Session,
    job_in: JobCreate,
    company_id: int,
    creator_id: int,
    status: str = "published"
) -> Job:
    """Inserts a new Job record in the database."""
    job_data = job_in.model_dump(
        exclude={"hiring_manager_id", "recruiter_ids", "interviewer_ids", "boards", "additional_info", "status"},
        exclude_unset=True
    )
    job = Job(
        **job_data,
        company_id=company_id,
        status=status,
        created_by=creator_id
    )
    db.add(job)
    db.flush()
    return job


def get_job_by_id_db(db: Session, job_id: int, company_id: Optional[int] = None) -> Optional[Job]:
    """Queries a single Job record by ID."""
    query = db.query(Job).filter(Job.id == job_id)
    if company_id:
        query = query.filter(Job.company_id == company_id)
    return query.first()


def list_all_jobs_db(db: Session, company_id: Optional[int] = None) -> List[Job]:
    """Queries all Job records ordered by created_at desc."""
    query = db.query(Job)
    if company_id:
        query = query.filter(Job.company_id == company_id)
    return query.order_by(Job.created_at.desc()).all()


def update_job_db(db: Session, job: Job, update_fields: Dict[str, Any], updated_by: Optional[int] = None) -> Job:
    """Updates fields on an existing Job record."""
    for field, val in update_fields.items():
        setattr(job, field, val)
    if updated_by:
        job.updated_by = updated_by
    db.flush()
    return job


def delete_job_cascading_db(db: Session, job: Job) -> None:
    """Deletes job and performs cascading deletion of applications, interviews, feedback, distributions, and scopes."""
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


# ──── 2. USER JOB SCOPE CRUD ────
def assign_user_job_scope_db(db: Session, job_id: int, user_id: int, creator_id: int) -> UserJobScope:
    """Assigns a user to a job scope if not already assigned."""
    existing = db.query(UserJobScope).filter_by(user_id=user_id, job_id=job_id).first()
    if not existing:
        existing = UserJobScope(user_id=user_id, job_id=job_id, created_by=creator_id)
        db.add(existing)
        db.flush()
    return existing


def replace_job_scopes_db(db: Session, job_id: int, user_ids: List[int], creator_id: int) -> None:
    """Replaces existing UserJobScope entries for a job with new target user IDs."""
    db.query(UserJobScope).filter(UserJobScope.job_id == job_id).delete(synchronize_session=False)
    for uid in user_ids:
        db.add(UserJobScope(user_id=uid, job_id=job_id, created_by=creator_id))
    db.flush()


def remove_hiring_manager_scopes_db(db: Session, job_id: int) -> None:
    """Removes existing Hiring Manager scopes for a job to enforce the 1-Hiring Manager rule."""
    existing_hm_scopes = (
        db.query(UserJobScope)
        .join(User, UserJobScope.user_id == User.id)
        .filter(UserJobScope.job_id == job_id, User.role == "hiring_manager")
        .all()
    )
    for old_scope in existing_hm_scopes:
        db.delete(old_scope)
    db.flush()


# ──── 3. JOB DISTRIBUTION CRUD ────
def create_job_distribution_db(
    db: Session,
    job_id: int,
    board: str,
    status: str,
    external_ref: Optional[str] = None,
    error: Optional[str] = None,
    creator_id: Optional[int] = None
) -> JobDistribution:
    """Inserts a JobDistribution audit record into the database."""
    record = JobDistribution(
        job_id=job_id,
        board=board,
        status=status,
        external_ref=external_ref,
        error=error,
        created_by=creator_id
    )
    db.add(record)
    db.flush()
    return record


def get_job_distributions_db(db: Session, job_id: int) -> List[Dict[str, Any]]:
    """Queries all distribution records for a specific job."""
    records = db.query(JobDistribution).filter(JobDistribution.job_id == job_id).all()
    return [
        {
            "board": d.board,
            "status": d.status,
            "external_ref": d.external_ref,
            "error": d.error
        }
        for d in records
    ]
