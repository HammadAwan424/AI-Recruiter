import os
import uuid
import sys
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.application import Application
from app.crud.application import get_or_create_application
from app.schemas.application import ScreeningTaskPayload
from app.utils.background_workers import screen_candidate_background
from app.utils.mcp_client import call_mcp_tools
from app.utils.security import get_current_user

router = APIRouter(prefix="/recruitment", tags=["Ingestion & Screening"])

UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "cvs"))
os.makedirs(UPLOADS_DIR, exist_ok=True)


def require_ceo(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ceo":
        raise HTTPException(status_code=403, detail="Sirf CEO yeh kaam kar sakta hai")
    return current_user


# ──── Gmail fetch + Auto Screen ────
@router.post("/fetch-and-screen/{job_id}")
async def fetch_and_screen(
    job_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_ceo)
):
    from app.agents.gmail_agent import fetch_job_application_emails

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    email_applications = fetch_job_application_emails(
        job_title=job.title,
        job_keywords=job.keywords or ""
    )

    if not email_applications:
        return {
            "message": "No new emails found for this job position.",
            "total_fetched": 0,
            "saved": 0,
            "screening_queued": 0
        }

    saved = 0
    queued = 0

    for app_data in email_applications:
        msg_id = app_data.get('gmail_message_id')

        # Check existing application by message ID
        existing_app = None
        if msg_id:
            existing_app = db.query(Application).filter(Application.gmail_message_id == msg_id).first()

        existing_candidate = db.query(Candidate).filter(Candidate.email == app_data['email']).first()

        if not existing_candidate:
            existing_candidate = Candidate(
                full_name=app_data['name'],
                email=app_data['email'],
                phone=""
            )
            db.add(existing_candidate)
            db.flush()
        else:
            existing_candidate.full_name = app_data['name']

        # Save PDF file to disk if present
        file_path = None
        if app_data.get('cv_pdf'):
            file_path = os.path.join(UPLOADS_DIR, f"candidate_{existing_candidate.id}_job_{job_id}.pdf")
            with open(file_path, "wb") as f:
                f.write(app_data['cv_pdf'])

        if existing_app:
            if existing_app.current_status in ["interview", "offer_approval", "offer_sent", "hired"]:
                continue
            existing_app.current_status = "applied"
            existing_app.disposition = "active"
            existing_app.cv_text = app_data['cv_text']
            if file_path:
                existing_app.cv_pdf_path = file_path
            app = existing_app
        else:
            app = get_or_create_application(
                db,
                candidate_id=existing_candidate.id,
                job_id=job_id,
                current_status="applied",
                disposition="active",
                cv_text=app_data['cv_text'],
                cv_pdf_path=file_path,
                gmail_message_id=msg_id,
                created_by=current_user["user_id"]
            )

        db.commit()

        task_payload = ScreeningTaskPayload(
            application_id=app.id,
            candidate_id=existing_candidate.id,
            job_id=job_id,
            candidate_name=existing_candidate.full_name,
            candidate_email=existing_candidate.email,
            cv_text=app.cv_text or "",
            job_title=job.title,
            job_description=job.full_description or "",
            job_keywords=job.keywords or "",
            job_experience=job.experience or "",
            job_skills=job.skills or ""
        )
        background_tasks.add_task(screen_candidate_background, payload=task_payload)
        queued += 1
        saved += 1

    return {
        "message": "Gmail application fetch complete. AI screening tasks enqueued in background!",
        "total_fetched": len(email_applications),
        "saved": saved,
        "screening_queued": queued
    }