from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models.company import Company
from app.models.user import User
from app.models.job import Job
from app.models.job_distribution import JobDistribution
from app.models.interview import InterviewModel, InterviewFeedback
from app.models.application import Application
from app.schemas.recruitment import JobCreate
from app.utils.security import get_current_user
from app.agents.jd_generator import generate_job_description
from app.agents.job_distribution_agent import distribute_job

router = APIRouter(prefix="/recruitment", tags=["Jobs"])


def require_ceo(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ceo":
        raise HTTPException(status_code=403, detail="Sirf CEO yeh kaam kar sakta hai")
    return current_user


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


# ──── CEO Job Create ────
@router.post("/jobs/create")
def create_job(data: JobCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_ceo)):
    company_id = current_user.get("company_id")
    ceo = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not ceo:
        raise HTTPException(status_code=404, detail="CEO account not found")

    additional_info = getattr(data, "additional_info", "")
    jd_result = generate_job_description(
        title=data.title, department=data.department,
        employment_type=data.employment_type, experience=data.experience,
        skills=data.skills, salary_range=data.salary_range,
        company_name=(ceo.company.name if ceo.company else "Company"),
        additional_info=additional_info, ceo_email=ceo.email
    )

    full_description = to_string(jd_result.get("full_description", ""))
    keywords = to_string(jd_result.get("keywords", ""))

    new_job = Job(
        company_id=company_id or ceo.company_id,
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


# ──── Jobs list ────
@router.get("/jobs")
def get_jobs(db: Session = Depends(get_db), current_user: dict = Depends(require_ceo)):
    company_id = current_user.get("company_id")
    jobs = db.query(Job).filter(Job.company_id == company_id, Job.status == "published").all() if company_id else []
    return {
        "total": len(jobs),
        "jobs": [{
            "id": j.id,
            "title": j.title,
            "department": j.department,
            "employment_type": j.employment_type,
            "experience": j.experience,
            "skills": j.skills,
            "salary_range": j.salary_range,
            "full_description": j.full_description,
            "status": j.status,
            "created_at": j.created_at
        } for j in jobs]
    }


# ──── Single job ────
@router.get("/jobs/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
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
        "full_description": job.full_description,
        "company_name": job.company.name if job.company else "",
        "status": job.status,
        "created_at": job.created_at
    }


# ──── Job delete ────
@router.delete("/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_ceo)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    applications = db.query(Application).filter(Application.job_id == job_id).all()
    app_ids = [a.id for a in applications]

    interviews = db.query(InterviewModel).filter(InterviewModel.application_id.in_(app_ids)).all() if app_ids else []
    interview_ids = [i.id for i in interviews]

    if interview_ids:
        db.query(InterviewFeedback).filter(InterviewFeedback.interview_id.in_(interview_ids)).delete(synchronize_session=False)
        db.query(InterviewModel).filter(InterviewModel.id.in_(interview_ids)).delete(synchronize_session=False)

    db.query(JobDistribution).filter(JobDistribution.job_id == job_id).delete(synchronize_session=False)
    db.query(Application).filter(Application.job_id == job_id).delete(synchronize_session=False)
    db.delete(job)
    db.commit()

    return {"message": "Job and related data deleted successfully!"}


# ──── Public Jobs ────
@router.get("/public/jobs")
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


# ──── Single Public Job ────
@router.get("/public/jobs/{job_id}")
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
