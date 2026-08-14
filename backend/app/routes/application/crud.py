import json
import asyncio
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from app.database import get_db
from app.models.application import Application
from app.models.job import Job
from app.models.interview import InterviewModel, InterviewInterviewers
from app.schemas.application import ApplicationUpdate, FetchApplicationsResponse
from app.schemas.composite import ApplicationDetail, ApplicationListItem
from app.schemas.parsing import ParsingLLMOutput
from app.schemas.extraction import ExtractedResumeText
from app.agents.parsing import parse_resume_structured
from app.utils.security import get_current_user, get_job_or_403, get_application_or_403
from app.models.candidate import Candidate
from app.crud.application import (
    get_application_by_candidate_and_job_db,
    create_application_db
)
from app.services.gmail import (
    fetch_job_application_emails_service,
    notify_candidate_rejection,
)

router = APIRouter(tags=["Applications CRUD"])


# ─────────────────────────────────────────────────────────────
# 1. INGEST / FETCH NEW CVS
# ─────────────────────────────────────────────────────────────
@router.post("/new", response_model=FetchApplicationsResponse)
def fetch_new_cvs(
    job_id: int,
    before: Optional[datetime] = None,
    limit: Optional[int] = 20,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
    job: Job = Depends(get_job_or_403)
):
    """
    Fetches and classifies new company-wide email applications using the Gmail
    service layer. The selected job provides authorization and the company
    scope; matching messages may be persisted into any job in that company.
    """
    sync_result = fetch_job_application_emails_service(
        db=db,
        job_id=job.id,
        before=before,
        limit=limit,
        created_by=current_user["user_id"]
    )

    return FetchApplicationsResponse(
        message=(
            f"Successfully processed {sync_result.total_saved} applications "
            f"({sync_result.new_applications} new, "
            f"{sync_result.renewed_applications} renewed, "
            f"{sync_result.unmatched_count} unmatched)."
        ),
        job_id=job.id,
        company_id=job.company_id,
        total_fetched=len(sync_result.fetched_messages),
        total_saved=sync_result.total_saved,
        new_applications=sync_result.new_applications,
        renewed_applications=sync_result.renewed_applications,
        classified_count=sync_result.classified_count,
        unmatched_count=sync_result.unmatched_count,
        failed_upsert_count=sync_result.failed_upsert_count,
        job_summaries=sync_result.job_summaries,
    )


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
            joinedload(Application.candidate),
            joinedload(Application.job),
            joinedload(Application.interviews),
            joinedload(Application.screening)
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
            joinedload(Application.job),
            joinedload(Application.screening),
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


# ──── Download Candidate CV PDF (alias used by frontend tabs) ────
@router.get("/download-cv/{application_id}")
def download_cv(application_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app or not app.cv_pdf_path or not os.path.exists(app.cv_pdf_path):
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
        ALLOWED_INITIAL_STAGES = {"applied", "screening", "interview"}
        if payload.current_status not in ALLOWED_INITIAL_STAGES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Direct stage change to '{payload.current_status}' is not permitted. Post-interview stages must be managed through the /offers or /decisions workflow."
            )
        app.current_status = payload.current_status
    if payload.disposition:
        app.disposition = payload.disposition
        if payload.disposition == "rejected":
            candidate_name = app.candidate.full_name if app.candidate else "Candidate"
            candidate_email = app.candidate.email if app.candidate else ""
            job_title = app.job.title if app.job else "Position"
            company_name = app.job.company.name if (app.job and app.job.company) else "AI Recruiter"
            if candidate_email:
                notify_candidate_rejection(
                    candidate_email=candidate_email,
                    candidate_name=candidate_name,
                    job_title=job_title,
                    company_name=company_name
                )

    app.updated_by = current_user["user_id"]
    db.commit()
    db.refresh(app)

    return {
        "message": f"Application #{application_id} stage updated to '{app.current_status}'.",
        "application_id": app.id,
        "current_status": app.current_status,
        "disposition": app.disposition
    }


# ─────────────────────────────────────────────────────────────
# 6. PARALLEL BATCH RESUME PARSING FOR APPLICATIONS
# ─────────────────────────────────────────────────────────────
class BatchParseApplicationsRequest(BaseModel):
    application_ids: List[int]


SEMAPHORE_LIMIT = 5


def _run_parse_for_application(db: Session, app_id: int) -> Optional[ParsingLLMOutput]:
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app or not app.cv_text or not app.cv_text.strip():
        return None

    parsed_result = parse_resume_structured(
        ExtractedResumeText(
            schema_version="extraction.extracted_resume_text.v1",
            source_name=app.cv_pdf_path or f"application-{app.id}.resume",
            cv_text=app.cv_text,
        )
    )
    app.parsed_profile = json.dumps(parsed_result.profile.model_dump())
    db.commit()
    db.refresh(app)
    return parsed_result.profile


async def _parse_app_task(app_id: int, semaphore: asyncio.Semaphore, db: Session) -> Optional[ParsingLLMOutput]:
    async with semaphore:
        return await asyncio.to_thread(_run_parse_for_application, db, app_id)


@router.post("/parse", response_model=List[ParsingLLMOutput])
async def parse_batch_applications(
    job_id: int,
    payload: BatchParseApplicationsRequest,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user),
    job: Job = Depends(get_job_or_403)
):
    """
    Runs parse_resume_structured in parallel across specified application_ids
    using an asyncio Semaphore limit, persists results into app.parsed_profile,
    and returns structured profile items.
    """
    if not payload.application_ids:
        return []

    valid_apps = (
        db.query(Application)
        .filter(
            Application.job_id == job.id,
            Application.id.in_(payload.application_ids),
            Application.cv_text.isnot(None)
        )
        .all()
    )

    if not valid_apps:
        return []

    semaphore = asyncio.Semaphore(SEMAPHORE_LIMIT)
    tasks = [_parse_app_task(app.id, semaphore, db) for app in valid_apps]
    results = await asyncio.gather(*tasks)

    return [r for r in results if r is not None]
