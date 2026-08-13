import os
import base64
import fitz
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.job import Job
from app.models.candidate import Candidate
from app.models.application import Application
from app.crud.application import (
    get_application_by_candidate_and_job_db,
    create_application_db
)
from app.schemas.application import FetchedEmailApplication
from app.utils.pdf import extract_text_from_pdf
from app.utils.gmail import get_gmail_service


def extract_pdf_text_and_bytes(service, message_id: str, attachment_id: str):
    """Fetches attachment binary data and extracts text via PyMuPDF."""
    attachment = service.users().messages().attachments().get(
        userId='me',
        messageId=message_id,
        id=attachment_id
    ).execute()

    file_data = base64.urlsafe_b64decode(attachment['data'].encode('UTF-8'))
    extracted_text = extract_text_from_pdf(file_data)
    return extracted_text, file_data


# ─────────────────────────────────────────────────────────────
# 1. SUBCOMPONENT: GET AFTER DATE
# ─────────────────────────────────────────────────────────────
def get_after_date(db: Session, job_id: int) -> Tuple[str, Optional[datetime]]:
    """
    Derives the Gmail 'after' date query string by querying all jobs in the DB and sorting by latest last_read timestamp.
    - Queries all jobs with a non-null last_read and takes the latest one.
    - Truncates last_read to start of day (%Y/%m/%d).
    - Fallback: current_date minus 10 days if no job has been read yet.
    Returns: (after_date_query, last_read_timestamp)
    """
    latest_job = db.query(Job).filter(Job.last_read.isnot(None)).order_by(Job.last_read.desc()).first()
    last_read_ts = latest_job.last_read if latest_job else None

    if last_read_ts:
        after_dt = last_read_ts.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        after_dt = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=10)

    after_date_query = after_dt.strftime('%Y/%m/%d')
    return after_date_query, last_read_ts


# ─────────────────────────────────────────────────────────────
# 2. SUBCOMPONENT: GET DEDUPED MAILS
# ─────────────────────────────────────────────────────────────
def get_deduped_mails(
    service: Any,
    db: Session,
    job_title: str,
    after_date_query: str,
    before: Optional[datetime] = None,
    limit: Optional[int] = None
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Queries Gmail API and splits raw message headers into deduped_mails vs duplicated_mails
    based on existing gmail_message_id records in DB.
    Returns: (deduped_mails, duplicated_mails)
    """
    query_parts = ['has:attachment', f'after:{after_date_query}']

    if before:
        before_str = before.strftime('%Y/%m/%d')
        query_parts.append(f'before:{before_str}')

    query = " ".join(query_parts)
    effective_limit = 20 if (limit is None or limit <= 0 or limit > 20) else limit
    list_kwargs: Dict[str, Any] = {'userId': 'me', 'q': query, 'maxResults': effective_limit}

    results = service.users().messages().list(**list_kwargs).execute()
    messages = results.get('messages', [])

    deduped_mails: List[Dict[str, Any]] = []
    duplicated_mails: List[Dict[str, Any]] = []

    for msg in messages:
        msg_id = msg['id']
        existing_app = db.query(Application).filter(
            Application.gmail_message_id == msg_id
        ).first()

        if existing_app:
            duplicated_mails.append(msg)
        else:
            deduped_mails.append(msg)

    return deduped_mails, duplicated_mails


# ─────────────────────────────────────────────────────────────
# 3. SUBCOMPONENT: PROCESS MAILS
# ─────────────────────────────────────────────────────────────
def process_mails(
    service: Any,
    db: Session,
    job_id: int,
    deduped_mails: List[Dict[str, Any]]
) -> List[FetchedEmailApplication]:
    """
    Processes deduped Gmail messages, extracting full email contents, received_at timestamp,
    sender information, and PDF CV text/attachment persistence.
    Returns: List[FetchedEmailApplication]
    """
    fetched_applications: List[FetchedEmailApplication] = []

    should_persist_cv = os.getenv("PERSIST_CV", "false").lower() == "true"
    storage_dir = Path("storage/cvs")
    if should_persist_cv:
        storage_dir.mkdir(parents=True, exist_ok=True)

    for msg in deduped_mails:
        msg_id = msg['id']
        message = service.users().messages().get(
            userId='me',
            id=msg_id,
            format='full'
        ).execute()

        # Extract received_at from Gmail internalDate (ms)
        internal_date_ms = int(message.get('internalDate', 0))
        received_at = (
            datetime.fromtimestamp(internal_date_ms / 1000.0, tz=timezone.utc)
            if internal_date_ms > 0
            else datetime.utcnow()
        )

        headers = message.get('payload', {}).get('headers', [])
        sender_email = ""
        sender_name = ""

        for header in headers:
            if header['name'] == 'From':
                from_val = header['value']
                if '<' in from_val:
                    sender_name = from_val.split('<')[0].strip().strip('"')
                    sender_email = from_val.split('<')[1].replace('>', '').strip()
                else:
                    sender_email = from_val.strip()

        # Determine full_name from From header
        full_name = sender_name or (sender_email.split('@')[0] if sender_email else "Candidate")

        cv_text = ""
        cv_filename = ""
        pdf_bytes = b""

        def extract_pdf_parts(payload):
            found = []
            if payload.get('filename', '').lower().endswith('.pdf'):
                found.append(payload)
            for part in payload.get('parts', []):
                found.extend(extract_pdf_parts(part))
            return found

        pdf_parts = extract_pdf_parts(message.get('payload', {}))
        for part in pdf_parts:
            attachment_id = part.get('body', {}).get('attachmentId', '')
            if attachment_id:
                cv_text, pdf_bytes = extract_pdf_text_and_bytes(
                    service, msg_id, attachment_id
                )
                cv_filename = part.get('filename', '')
                break

        if cv_text and sender_email:
            cv_pdf_path = None
            if should_persist_cv and pdf_bytes:
                pdf_file_path = storage_dir / f"{job_id}_{msg_id}.pdf"
                with open(pdf_file_path, "wb") as f:
                    f.write(pdf_bytes)
                cv_pdf_path = str(pdf_file_path)

            fetched_applications.append(
                FetchedEmailApplication(
                    full_name=full_name,
                    email=sender_email,
                    cv_text=cv_text,
                    cv_pdf_path=cv_pdf_path,
                    cv_filename=cv_filename or None,
                    gmail_message_id=msg_id,
                    received_at=received_at,
                )
            )

    return fetched_applications


# ─────────────────────────────────────────────────────────────
# 4. SUBCOMPONENT: PERSIST APPLICATION WITH CANDIDATE
# ─────────────────────────────────────────────────────────────
def persist_application_with_candidate(
    db: Session,
    job_id: int,
    fetched_applications: List[FetchedEmailApplication],
    created_by: Optional[int] = None
) -> Tuple[int, int, int]:
    """
    Persists candidates and application records into the database.
    - Resolves or creates Candidate entities.
    - Updates existing Applications to 'applied' / 'active' (renewed) if not in final stages.
    - Creates new Application entities for brand new candidates.
    Returns: (total_saved, new_applications, renewed_applications)
    """
    total_saved = 0
    new_applications = 0
    renewed_applications = 0

    for app_data in fetched_applications:
        candidate_name = app_data.full_name
        candidate_email = app_data.email
        received_at = app_data.received_at
        file_path = app_data.cv_pdf_path
        msg_id = app_data.gmail_message_id

        candidate = db.query(Candidate).filter(Candidate.email == candidate_email).first()
        if not candidate:
            candidate = Candidate(
                full_name=candidate_name,
                email=candidate_email,
            )
            db.add(candidate)
            db.commit()
            db.refresh(candidate)

        existing_app = get_application_by_candidate_and_job_db(
            db,
            candidate_id=candidate.id,
            job_id=job_id
        )

        if existing_app:
            if existing_app.current_status in ["interview", "offer_approval", "offer_sent", "hired"]:
                continue
            existing_app.current_status = "applied"
            existing_app.disposition = "active"
            existing_app.cv_text = app_data.cv_text
            existing_app.received_at = received_at
            if file_path:
                existing_app.cv_pdf_path = file_path
            renewed_applications += 1
        else:
            create_application_db(
                db,
                candidate_id=candidate.id,
                job_id=job_id,
                current_status="applied",
                disposition="active",
                cv_text=app_data.cv_text,
                cv_pdf_path=file_path,
                gmail_message_id=msg_id,
                received_at=received_at,
                created_by=created_by
            )
            new_applications += 1

        total_saved += 1

    db.commit()
    return total_saved, new_applications, renewed_applications


# ─────────────────────────────────────────────────────────────
# 5. MAIN ORCHESTRATOR SERVICE
# ─────────────────────────────────────────────────────────────
def fetch_job_application_emails_service(
    db: Session,
    job_id: int,
    before: Optional[datetime] = None,
    limit: Optional[int] = 20,
    created_by: Optional[int] = None
) -> Tuple[List[FetchedEmailApplication], int, int, int]:
    """
    Orchestrates fetching, deduplicating, processing, and persisting job application emails from Gmail API.
    Calls 4 subcomponents:
    1. get_after_date() -> (after_date_query, last_received_at_db)
    2. get_deduped_mails() -> (deduped_mails, duplicated_mails)
    3. process_mails() -> List[FetchedEmailApplication]
    4. persist_application_with_candidate() -> (total_saved, new_applications, renewed_applications)
    Returns: (fetched_applications, total_saved, new_applications, renewed_applications)
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise ValueError(f"Job #{job_id} not found")

    after_date_query, last_received_at_db = get_after_date(db, job_id)
    service = get_gmail_service()

    deduped_mails, duplicated_mails = get_deduped_mails(
        service=service,
        db=db,
        job_title=job.title,
        after_date_query=after_date_query,
        before=before,
        limit=limit
    )

    fetched_applications = process_mails(
        service=service,
        db=db,
        job_id=job.id,
        deduped_mails=deduped_mails
    )

    total_saved, new_applications, renewed_applications = persist_application_with_candidate(
        db=db,
        job_id=job.id,
        fetched_applications=fetched_applications,
        created_by=created_by
    )

    # Update job.last_read timestamp
    job.last_read = datetime.utcnow()
    db.commit()

    return fetched_applications, total_saved, new_applications, renewed_applications
