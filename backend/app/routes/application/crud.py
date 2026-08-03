import os
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from app.database import get_db
from app.models.application import Application
from app.models.job import Job
from app.models.interview import InterviewModel, InterviewInterviewers
from app.schemas.application import (
    ApplicationListItem,
    ApplicationDetail,
    ApplicationUpdate,
)
from app.utils.security import get_current_user, get_job_or_403, get_application_or_403
from app.models.candidate import Candidate
from app.crud.application import get_or_create_application

router = APIRouter(tags=["Applications CRUD"])


# ─────────────────────────────────────────────────────────────
# 1. INGEST / FETCH NEW CVS
# ─────────────────────────────────────────────────────────────
@router.post("/new")
def fetch_new_cvs(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
    job: Job = Depends(get_job_or_403)
):
    from app.agents.gmail_agent import fetch_job_application_emails
    email_applications = fetch_job_application_emails(job.title, 20, job.keywords or "")
    saved = 0

    for app_data in email_applications:
        candidate_name = app_data.get("full_name") or app_data.get("name", "Candidate")
        candidate = db.query(Candidate).filter(Candidate.email == app_data["email"]).first()
        if not candidate:
            candidate = Candidate(
                full_name=candidate_name,
                email=app_data["email"],
                phone=app_data.get("phone")
            )
            db.add(candidate)
            db.commit()
            db.refresh(candidate)

        file_path = app_data.get("cv_pdf_path")
        msg_id = app_data.get("gmail_message_id")

        existing_app = (
            db.query(Application)
            .filter(Application.candidate_id == candidate.id, Application.job_id == job.id)
            .first()
        )

        if existing_app:
            if existing_app.current_status in ["interview", "offer_approval", "offer_sent", "hired"]:
                continue
            existing_app.current_status = "applied"
            existing_app.disposition = "active"
            existing_app.cv_text = app_data["cv_text"]
            if file_path:
                existing_app.cv_pdf_path = file_path
        else:
            get_or_create_application(
                db,
                candidate_id=candidate.id,
                job_id=job.id,
                current_status="applied",
                disposition="active",
                cv_text=app_data["cv_text"],
                cv_pdf_path=file_path,
                gmail_message_id=msg_id,
                created_by=current_user["user_id"]
            )

        saved += 1

    db.commit()

    return {
        "message": f"Successfully ingested {saved} new applications.",
        "job_id": job.id,
        "total_fetched": len(email_applications),
        "saved": saved
    }


# ─────────────────────────────────────────────────────────────
# 2. LIST ALL APPLICATIONS FOR A JOB
# ─────────────────────────────────────────────────────────────
@router.get("/", response_model=List[ApplicationListItem])
def list_job_applications(
    job_id: int,
    job: Job = Depends(get_job_or_403),
    db: Session = Depends(get_db)
):
    applications = (
        db.query(Application)
        .options(
            joinedload(Application.interviews)
        )
        .filter(Application.job_id == job.id)
        .all()
    )
    return applications


# ─────────────────────────────────────────────────────────────
# 3. GET SINGLE APPLICATION DETAIL
# ─────────────────────────────────────────────────────────────
@router.get("/{application_id}", response_model=ApplicationDetail)
def get_application_detail(
    job_id: int,
    application_id: int,
    app: Application = Depends(get_application_or_403),
    db: Session = Depends(get_db)
):
    app_detail = (
        db.query(Application)
        .options(
            joinedload(Application.candidate),
            joinedload(Application.interviews)
                .joinedload(InterviewModel.interviewer_assignments)
                .joinedload(InterviewInterviewers.interviewer),
            joinedload(Application.interviews)
                .joinedload(InterviewModel.interviewer_assignments)
                .joinedload(InterviewInterviewers.feedback),
            joinedload(Application.comments),
            joinedload(Application.offer)
        )
        .filter(Application.id == app.id, Application.job_id == job_id)
        .first()
    )
    if not app_detail:
        raise HTTPException(status_code=404, detail="Application record not found")

    return app_detail


# ─────────────────────────────────────────────────────────────
# 4. VIEW / DOWNLOAD CANDIDATE CV PDF
# ─────────────────────────────────────────────────────────────
@router.get("/{application_id}/cv")
def get_cv_pdf(
    job_id: int,
    application_id: int,
    app: Application = Depends(get_application_or_403),
    db: Session = Depends(get_db)
):
    if not app.cv_pdf_path or not os.path.exists(app.cv_pdf_path):
        raise HTTPException(status_code=404, detail="CV PDF file not found on server")

    from fastapi.responses import FileResponse
    return FileResponse(
        path=app.cv_pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(app.cv_pdf_path)
    )


# ─────────────────────────────────────────────────────────────
# 5. UPDATE APPLICATION STAGE / DISPOSITION
# ─────────────────────────────────────────────────────────────
@router.put("/{application_id}/stage")
def update_application_stage(
    job_id: int,
    application_id: int,
    payload: ApplicationUpdate,
    app: Application = Depends(get_application_or_403),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == application_id, Application.job_id == job_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found")

    if payload.current_status:
        app.current_status = payload.current_status
    if payload.disposition:
        app.disposition = payload.disposition

    app.updated_by = current_user["user_id"]
    db.commit()
    db.refresh(app)

    return {
        "message": f"Application #{application_id} stage updated to '{app.current_status}'.",
        "application_id": app.id,
        "current_status": app.current_status,
        "disposition": app.disposition
    }
