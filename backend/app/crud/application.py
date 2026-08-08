from sqlalchemy.orm import Session
from typing import Optional
from app.models.application import Application


def get_or_create_application(
    db: Session,
    candidate_id: int,
    job_id: int,
    current_status: str = "applied",
    disposition: str = "active",
    match_score: Optional[float] = None,
    cv_text: Optional[str] = None,
    cv_pdf_path: Optional[str] = None,
    gmail_message_id: Optional[str] = None,
    created_by: Optional[int] = None,
) -> Application:
    app = db.query(Application).filter(
        Application.candidate_id == candidate_id,
        Application.job_id == job_id
    ).first()

    if not app:
        app = Application(
            candidate_id=candidate_id,
            job_id=job_id,
            current_status=current_status,
            disposition=disposition,
            match_score=match_score,
            cv_text=cv_text,
            cv_pdf_path=cv_pdf_path,
            gmail_message_id=gmail_message_id,
            created_by=created_by,
        )
        db.add(app)
        db.commit()
        db.refresh(app)
    else:
        changed = False
        if match_score is not None:
            app.match_score = match_score
            changed = True
        if cv_text is not None:
            app.cv_text = cv_text
            changed = True
        if cv_pdf_path is not None:
            app.cv_pdf_path = cv_pdf_path
            changed = True
        if changed:
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
    app = db.query(Application).filter(
        Application.candidate_id == candidate_id,
        Application.job_id == job_id
    ).first()

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
