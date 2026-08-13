import asyncio
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.job import Job
from app.models.application import Application
from app.schemas.screening import ScreeningEvaluationDetail
from app.services.screening_service import run_screening_for_application
from app.utils.security import get_current_user, get_job_or_403, get_application_or_403

router = APIRouter()
SEMAPHORE_LIMIT = 10


async def _screen_app_task(app_id: int, semaphore: asyncio.Semaphore, db: Session) -> ScreeningEvaluationDetail:
    async with semaphore:
        return await asyncio.to_thread(run_screening_for_application, db, app_id)


# ─────────────────────────────────────────────────────────────
# 1. PARALLEL ASYNC AI SCREENING FOR ALL APPLIED & ACTIVE APPLICATIONS
# ─────────────────────────────────────────────────────────────
@router.post("", response_model=List[ScreeningEvaluationDetail])
async def screen_job_applications(
    job_id: int,
    job: Job = Depends(get_job_or_403),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Fetches all applications for the job with current_status='applied' and disposition='active',
    then runs parallel AI screening evaluations.
    """
    applications = (
        db.query(Application)
        .filter(
            Application.job_id == job.id,
            Application.current_status == "applied",
            Application.disposition == "active"
        )
        .all()
    )

    if not applications:
        return []

    semaphore = asyncio.Semaphore(SEMAPHORE_LIMIT)
    tasks = [_screen_app_task(app.id, semaphore, db) for app in applications]
    return await asyncio.gather(*tasks)


# ─────────────────────────────────────────────────────────────
# 2. ASYNC AI SCREENING FOR A SINGLE CANDIDATE APPLICATION
# ─────────────────────────────────────────────────────────────
@router.post("/{application_id}", response_model=ScreeningEvaluationDetail)
async def screen_single_application(
    job_id: int,
    application_id: int,
    app: Application = Depends(get_application_or_403),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await asyncio.to_thread(run_screening_for_application, db, app.id)
