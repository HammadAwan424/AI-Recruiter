import os
import fitz
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.job import Job
from app.models.candidate import Candidate
from app.crud.application import get_or_create_application
from app.schemas.application import ScreeningTaskPayload
from app.utils.background_workers import screen_candidate_background

router = APIRouter()
public_router = APIRouter()


import tempfile

def get_uploads_dir() -> str:
    default_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads", "cvs"))
    try:
        os.makedirs(default_dir, exist_ok=True)
        return default_dir
    except OSError:
        tmp_dir = os.path.join(tempfile.gettempdir(), "uploads", "cvs")
        os.makedirs(tmp_dir, exist_ok=True)
        return tmp_dir


def _process_job_application(
    job_id: int,
    full_name: str,
    email: str,
    phone: str,
    cv_file: UploadFile,
    background_tasks: BackgroundTasks,
    db: Session
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    pdf_bytes = cv_file.file.read()
    if len(pdf_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10MB.")

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        cv_text = ""
        for page in doc:
            cv_text += page.get_text()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid PDF file format.")

    if not cv_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from uploaded CV PDF.")

    candidate = db.query(Candidate).filter(Candidate.email == email).first()
    if not candidate:
        candidate = Candidate(
            full_name=full_name,
            email=email,
            phone=phone
        )
        db.add(candidate)
        db.flush()
    else:
        candidate.full_name = full_name
        candidate.phone = phone

    uploads_dir = get_uploads_dir()
    file_path = os.path.join(uploads_dir, f"candidate_{candidate.id}_job_{job_id}.pdf")
    with open(file_path, "wb") as f:
        f.write(pdf_bytes)

    app = get_or_create_application(
        db,
        candidate_id=candidate.id,
        job_id=job_id,
        current_status="applied",
        disposition="active",
        cv_text=cv_text,
        cv_pdf_path=file_path
    )

    db.commit()

    background_tasks.add_task(
        screen_candidate_background,
        payload=ScreeningTaskPayload(
            application_id=app.id,
            candidate_id=candidate.id,
            job_id=job_id,
            candidate_name=candidate.full_name,
            candidate_email=candidate.email,
            cv_text=cv_text,
            job_title=job.title,
            job_description=job.full_description or "",
            job_keywords=job.keywords or "",
            job_experience=job.experience or "",
            job_skills=job.skills or ""
        )
    )

    return {
        "message": "Application submitted successfully! Our AI is screening your resume.",
        "application_id": app.id,
        "candidate_id": candidate.id,
        "candidate_name": candidate.full_name,
        "cv_pdf_path": app.cv_pdf_path
    }


@public_router.post("/apply")
def apply_for_job_query(
    job_id: int,
    background_tasks: BackgroundTasks,
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(""),
    cv_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    return _process_job_application(job_id, full_name, email, phone, cv_file, background_tasks, db)


@router.post("/apply/{job_id}")
def apply_for_job_path(
    job_id: int,
    background_tasks: BackgroundTasks,
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(""),
    cv_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    return _process_job_application(job_id, full_name, email, phone, cv_file, background_tasks, db)

