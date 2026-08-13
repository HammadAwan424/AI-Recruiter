import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.job import Job
from app.models.candidate import Candidate
from app.crud.application import (
    get_application_by_candidate_and_job_db,
    create_application_db
)
from app.utils.pdf import extract_text_from_pdf

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


# ─────────────────────────────────────────────────────────────
# PUBLIC APPLICANT SELF-SUBMISSION (Unauthenticated Careers Portal)
# ─────────────────────────────────────────────────────────────
@public_router.post("/{job_id}/apply")
def public_apply_candidate(
    job_id: int,
    background_tasks: BackgroundTasks,
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(None),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Public Endpoint for candidate self-application via company careers page.
    1. Validates target Job exists
    2. Uploads and extracts text from resume PDF
    3. Creates/resolves Candidate & Application records
    4. Triggers background screening evaluation task
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job #{job_id} not found."
        )

    if not resume.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF resume files are supported."
        )

    pdf_bytes = resume.file.read()
    try:
        cv_text = extract_text_from_pdf(pdf_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from resume PDF: {str(e)}"
        )

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

    app = get_application_by_candidate_and_job_db(db, candidate_id=candidate.id, job_id=job_id)

    if app:
        app.current_status = "applied"
        app.disposition = "active"
        app.cv_text = cv_text
        app.cv_pdf_path = file_path
    else:
        app = create_application_db(
            db,
            candidate_id=candidate.id,
            job_id=job_id,
            current_status="applied",
            disposition="active",
            cv_text=cv_text,
            cv_pdf_path=file_path
        )

    db.commit()

    return {
        "message": "Application submitted successfully! Our AI is screening your resume.",
        "application_id": app.id,
        "candidate_id": candidate.id,
        "candidate_name": candidate.full_name,
        "cv_pdf_path": app.cv_pdf_path
    }


def _process_job_application(
    job_id: int,
    full_name: str,
    email: str,
    phone: str,
    cv_file: UploadFile,
    background_tasks: BackgroundTasks,
    db: Session,
):
    """Process the legacy query-parameter application endpoint."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    pdf_bytes = cv_file.file.read()
    if len(pdf_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size exceeds maximum limit of 10MB.")

    try:
        cv_text = extract_text_from_pdf(pdf_bytes)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid PDF file format.")
    if not cv_text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not extract text from uploaded CV PDF.")

    candidate = db.query(Candidate).filter(Candidate.email == email).first()
    if not candidate:
        candidate = Candidate(full_name=full_name, email=email, phone=phone)
        db.add(candidate)
        db.flush()
    else:
        candidate.full_name = full_name
        candidate.phone = phone

    uploads_dir = get_uploads_dir()
    file_path = os.path.join(uploads_dir, f"candidate_{candidate.id}_job_{job_id}.pdf")
    with open(file_path, "wb") as f:
        f.write(pdf_bytes)

    app = get_application_by_candidate_and_job_db(db, candidate_id=candidate.id, job_id=job_id)
    if app:
        app.current_status = "applied"
        app.disposition = "active"
        app.cv_text = cv_text
        app.cv_pdf_path = file_path
        db.commit()
        db.refresh(app)
    else:
        app = create_application_db(
            db,
            candidate_id=candidate.id,
            job_id=job_id,
            current_status="applied",
            disposition="active",
            cv_text=cv_text,
            cv_pdf_path=file_path,
        )

    return {
        "message": "Application submitted successfully! Our AI is screening your resume.",
        "application_id": app.id,
        "candidate_id": candidate.id,
        "candidate_name": candidate.full_name,
        "cv_pdf_path": app.cv_pdf_path,
    }


# TODO: handle this shitty unnecessary damned route
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
