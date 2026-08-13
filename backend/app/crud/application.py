from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.models.application import Application


def get_application_by_candidate_and_job_db(
    db: Session,
    candidate_id: int,
    job_id: int
) -> Optional[Application]:
    """Retrieves an application by candidate_id and job_id."""
    return db.query(Application).filter(
        Application.candidate_id == candidate_id,
        Application.job_id == job_id
    ).first()


def create_application_db(
    db: Session,
    candidate_id: int,
    job_id: int,
    current_status: str = "applied",
    disposition: str = "active",
    match_score: Optional[float] = None,
    cv_text: Optional[str] = None,
    cv_pdf_path: Optional[str] = None,
    gmail_message_id: Optional[str] = None,
    received_at: Optional[datetime] = None,
    created_by: Optional[int] = None,
) -> Application:
    """Creates a new Application entity in the database."""
    app = Application(
        candidate_id=candidate_id,
        job_id=job_id,
        current_status=current_status,
        disposition=disposition,
        match_score=match_score,
        cv_text=cv_text,
        cv_pdf_path=cv_pdf_path,
        gmail_message_id=gmail_message_id,
        received_at=received_at,
        created_by=created_by,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


def update_application_status(
    db: Session,
    candidate_id: int,
    job_id: int,
    current_status: Optional[str] = None,
    disposition: Optional[str] = None,
    updated_by: Optional[int] = None,
) -> Optional[Application]:
    """Updates status or disposition on an existing application."""
    app = get_application_by_candidate_and_job_db(db, candidate_id=candidate_id, job_id=job_id)

    if app:
        if current_status is not None:
            app.current_status = current_status
        if disposition is not None:
            app.disposition = disposition
        if updated_by is not None:
            app.updated_by = updated_by
        db.commit()
        db.refresh(app)

    return app
