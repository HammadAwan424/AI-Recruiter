from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.job import Job
from app.schemas.job import JobCreate, JobUpdate


def create_job(db: Session, job_in: JobCreate, company_id: int, created_by: Optional[int] = None) -> Job:
    job_data = job_in.model_dump()
    job = Job(**job_data, company_id=company_id, created_by=created_by)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def get_job_by_id(db: Session, job_id: int, company_id: Optional[int] = None) -> Optional[Job]:
    query = db.query(Job).filter(Job.id == job_id)
    if company_id:
        query = query.filter(Job.company_id == company_id)
    return query.first()


def list_jobs(db: Session, company_id: Optional[int] = None) -> List[Job]:
    query = db.query(Job)
    if company_id:
        query = query.filter(Job.company_id == company_id)
    return query.order_by(Job.created_at.desc()).all()
