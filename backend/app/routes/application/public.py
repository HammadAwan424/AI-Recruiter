import os
import tempfile
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

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB limit


def get_uploads_dir() -> str:
    """Resolves local upload directory with safe fallback to OS temp dir."""
    default_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads", "cvs"))
    try:
        os.makedirs(default_dir, exist_ok=True)
        return default_dir
    except OSError:
        tmp_dir = os.path.join(tempfile.gettempdir(), "uploads", "cvs")
        os.makedirs(tmp_dir, exist_ok=True)
        return tmp_dir


# ─────────────────────────────────────────────────────────────
# PUBLIC APPLICANT SELF-SUBMISSION (Careers Portal)
# ─────────────────────────────────────────────────────────────
@router.post("/apply")
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
    Path: POST /jobs/{job_id}/applications/apply
    
    1. Validates target Job exists
    2. Enforces PDF format & 10MB file size ceiling
    3. Extracts text from resume PDF & verifies content is readable
    4. Creates/resolves Candidate & Application records
    5. Saves resume PDF to disk and persists application in DB
    """
    # 1. Validate Job Exists
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job #{job_id} not found."
        )

    # 2. Validate PDF Extension & File Size
    filename = resume.filename or "uploaded_resume.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF resume files are supported."
        )

    pdf_bytes = resume.file.read()
    if len(pdf_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 10MB."
        )

    # 3. Extract Text & Validate Readable Content
    try:
        extracted_resume = extract_text_from_pdf(pdf_bytes, source_name=filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from resume PDF: {str(e)}"
        )

    if not extracted_resume.cv_text or not extracted_resume.cv_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from uploaded CV PDF. File may be image-only or unreadable."
        )

    # 4. Resolve / Create Candidate Record
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

    # 5. Save PDF File to Disk
    uploads_dir = get_uploads_dir()
    file_path = os.path.join(uploads_dir, f"candidate_{candidate.id}_job_{job_id}.pdf")
    with open(file_path, "wb") as f:
        f.write(pdf_bytes)

    # 6. Resolve / Create Application Entity
    app = get_application_by_candidate_and_job_db(db, candidate_id=candidate.id, job_id=job_id)
    if app:
        app.current_status = "applied"
        app.disposition = "active"
        app.cv_text = extracted_resume.cv_text
        app.cv_pdf_path = file_path
    else:
        app = create_application_db(
            db,
            candidate_id=candidate.id,
            job_id=job_id,
            current_status="applied",
            disposition="active",
            cv_text=extracted_resume.cv_text,
            cv_pdf_path=file_path
        )

    db.commit()
    db.refresh(app)

    return {
        "message": "Application submitted successfully! Our AI is screening your resume.",
        "application_id": app.id,
        "candidate_id": candidate.id,
        "candidate_name": candidate.full_name,
        "cv_pdf_path": app.cv_pdf_path
    }
