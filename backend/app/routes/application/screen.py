import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.database import get_db, SessionLocal
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.application import Application
from app.schemas.application import ScreeningResultResponse
from app.agents.cv_screening_agent import screen_cv
from app.utils.ws_manager import ws_manager
from app.utils.security import get_current_user, get_job_or_403, get_application_or_403

router = APIRouter()

SEMAPHORE_LIMIT = 10


def _screen_cv_sync(
    candidate_id: int,
    job_id: int,
    candidate_name: str,
    candidate_email: str,
    cv_text: str,
    job_title: str,
    job_description: str,
    job_keywords: str,
    job_experience: str,
    job_skills: str
) -> Dict[str, Any]:
    return screen_cv(
        candidate_id=candidate_id,
        job_id=job_id,
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        cv_text=cv_text,
        job_title=job_title,
        job_description=job_description,
        job_keywords=job_keywords,
        job_experience=job_experience,
        job_skills=job_skills
    )


async def _async_screen_application(
    app_id: int,
    candidate_id: int,
    candidate_name: str,
    candidate_email: str,
    cv_text: str,
    job_id: int,
    job_title: str,
    job_description: str,
    job_keywords: str,
    job_experience: str,
    job_skills: str,
    semaphore: asyncio.Semaphore
) -> Dict[str, Any]:
    async with semaphore:
        if not cv_text:
            return {
                "application_id": app_id,
                "candidate_id": candidate_id,
                "candidate_name": candidate_name,
                "match_score": 0.0,
                "skill_gap": "No CV text provided",
                "summary": "CV text empty",
                "status": "applied",
                "disposition": "active"
            }

        result = await asyncio.to_thread(
            _screen_cv_sync,
            candidate_id=candidate_id,
            job_id=job_id,
            candidate_name=candidate_name,
            candidate_email=candidate_email,
            cv_text=cv_text,
            job_title=job_title,
            job_description=job_description,
            job_keywords=job_keywords,
            job_experience=job_experience,
            job_skills=job_skills
        )

        match_score = float(result.get("match_score", 0.0))
        skill_gap = str(result.get("skill_gap", ""))
        summary = str(result.get("summary", ""))

        current_status = "screening" if match_score > 85 else "applied"
        disposition = "active" if match_score > 85 else "rejected"

        # Update Database Record
        db = SessionLocal()
        try:
            db_app = db.query(Application).filter(Application.id == app_id).first()
            if db_app:
                db_app.match_score = match_score
                db_app.skill_gap = skill_gap
                db_app.summary = summary
                db_app.current_status = current_status
                db_app.disposition = disposition
                db.commit()
        finally:
            db.close()

        # Broadcast live WebSocket notification
        ws_event = {
            "type": "CANDIDATE_SCREENED",
            "application_id": app_id,
            "candidate_id": candidate_id,
            "job_id": job_id,
            "current_status": current_status,
            "disposition": disposition,
            "match_score": match_score,
            "summary": summary
        }
        try:
            await ws_manager.broadcast(ws_event)
        except Exception:
            pass

        return {
            "application_id": app_id,
            "candidate_id": candidate_id,
            "candidate_name": candidate_name,
            "match_score": match_score,
            "skill_gap": skill_gap,
            "summary": summary,
            "status": current_status,
            "disposition": disposition
        }


# ─────────────────────────────────────────────────────────────
# 1. PARALLEL ASYNC AI SCREENING FOR ALL UNSCREENED APPLICATIONS
# ─────────────────────────────────────────────────────────────
@router.post("", response_model=List[ScreeningResultResponse])
async def screen_job_applications(
    job_id: int,
    only_unscreened: bool = True,
    job: Job = Depends(get_job_or_403),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(Application).filter(Application.job_id == job.id)
    if only_unscreened:
        query = query.filter(Application.match_score.is_(None))

    applications = query.all()
    if not applications:
        return []

    semaphore = asyncio.Semaphore(SEMAPHORE_LIMIT)
    tasks = []

    for app in applications:
        cand = app.candidate
        tasks.append(
            _async_screen_application(
                app_id=app.id,
                candidate_id=app.candidate_id,
                candidate_name=cand.full_name if cand else "Candidate",
                candidate_email=cand.email if cand else "",
                cv_text=app.cv_text or "",
                job_id=job.id,
                job_title=job.title,
                job_description=job.full_description or "",
                job_keywords=job.keywords or "",
                job_experience=job.experience or "",
                job_skills=job.skills or "",
                semaphore=semaphore
            )
        )

    results = await asyncio.gather(*tasks)
    return results


# ─────────────────────────────────────────────────────────────
# 2. ASYNC AI SCREENING FOR A SINGLE CANDIDATE APPLICATION
# ─────────────────────────────────────────────────────────────
@router.post("/{application_id}", response_model=ScreeningResultResponse)
async def screen_single_application(
    job_id: int,
    application_id: int,
    app: Application = Depends(get_application_or_403),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    job = app.job
    cand = app.candidate
    semaphore = asyncio.Semaphore(1)

    result = await _async_screen_application(
        app_id=app.id,
        candidate_id=app.candidate_id,
        candidate_name=cand.full_name if cand else "Candidate",
        candidate_email=cand.email if cand else "",
        cv_text=app.cv_text or "",
        job_id=job_id,
        job_title=job.title,
        job_description=job.full_description or "",
        job_keywords=job.keywords or "",
        job_experience=job.experience or "",
        job_skills=job.skills or "",
        semaphore=semaphore
    )

    return result
