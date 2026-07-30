import asyncio
from app.database import SessionLocal
from app.models.application import Application
from app.schemas.application import ScreeningTaskPayload
from app.agents.cv_screening_agent import screen_cv
from app.utils.ws_manager import ws_manager


def screen_candidate_background(payload: ScreeningTaskPayload):
    """
    Pure AI screening background worker.
    Receives candidate & job context payload to eliminate pre-fetch DB read overhead.
    - Runs LLM screening directly.
    - Saves score and updates Application (screening/active if > 85, applied/rejected if <= 85).
    - Emits real-time WebSocket broadcast.
    """
    if not payload.cv_text:
        return

    result = screen_cv(
        candidate_id=payload.candidate_id,
        job_id=payload.job_id,
        candidate_name=payload.candidate_name,
        candidate_email=payload.candidate_email,
        cv_text=payload.cv_text,
        job_title=payload.job_title,
        job_description=payload.job_description or "",
        job_keywords=payload.job_keywords or "",
        job_experience=payload.job_experience or "",
        job_skills=payload.job_skills or ""
    )

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

        score = result["match_score"]

        if app:
            app.match_score = score
            app.skill_gap = result["skill_gap"]
            app.summary = result["summary"]

            if score > 85:
                app.current_status = "screening"
                app.disposition = "active"
            else:
                app.current_status = "applied"
                app.disposition = "rejected"

        db.commit()

        # Broadcast live WebSocket event
        ws_event = {
            "type": "CANDIDATE_SCREENED",
            "application_id": app.id if app else None,
            "candidate_id": payload.candidate_id,
            "job_id": payload.job_id,
            "current_status": app.current_status if app else "applied",
            "disposition": app.disposition if app else "active",
            "match_score": result["match_score"],
            "summary": result["summary"]
        }
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.run_coroutine_threadsafe(ws_manager.broadcast(ws_event), loop)
        except Exception:
            pass

    finally:
        db.close()
