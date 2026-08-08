import asyncio
import json
from app.database import SessionLocal
from app.models.application import Application
from app.schemas.application import ScreeningTaskPayload
from app.services.screening_service import run_screening_for_application
from app.agents.resume_parser_agent import parse_resume


def screen_candidate_background(payload: ScreeningTaskPayload):
    """
    Background worker for candidate screening & resume profile parsing.
    Delegates screening execution to screening_service.
    """
    if not payload.cv_text:
        return

    db = SessionLocal()
    try:
        app = None
        if payload.application_id:
            app = db.query(Application).filter(Application.id == payload.application_id).first()
        if not app:
            app = db.query(Application).filter(
                Application.candidate_id == payload.candidate_id,
                Application.job_id == payload.job_id
            ).first()

        if app:
            run_screening_for_application(db, app.id)
            profile = parse_resume(payload.cv_text)
            app.parsed_profile = json.dumps(profile)
            db.commit()
    finally:
        db.close()
