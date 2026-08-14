import os
import base64
import html
import re
from email.utils import parseaddr
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.agents.job_classification import classify_application_emails
from app.models.company import Company
from app.models.gmail_account import GmailAccount
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.application import Application
from app.crud.application import (
    get_application_by_candidate_and_job_db,
    create_application_db
)
from app.schemas.extraction import ExtractedResumeText
from app.schemas.gmail import (
    ClassifiedGmailMessages,
    DedupedGmailMessages,
    FetchedGmailMessage,
    FetchedEmailApplication,
    GmailApplicationBatch,
    GmailApplicationPlan,
    GmailMessageHeader,
    GmailSyncContext,
    GmailSyncResult,
    JobApplicationSyncSummary,
    JobClassificationJob,
    JobClassificationMessage,
    JobClassificationRequest,
    ProcessedGmailMessages,
)
from app.utils.pdf import extract_text_from_pdf
from app.utils.gmail import get_gmail_service
from app.utils.logger import get_logger


logger = get_logger(__name__, "gmail_fetch.log")


def extract_pdf_text_and_bytes(
    service,
    message_id: str,
    attachment_id: str,
    source_name: str,
) -> Tuple[ExtractedResumeText, bytes]:
    """Fetches attachment binary data and extracts text via PyMuPDF."""
    attachment = service.users().messages().attachments().get(
        userId='me',
        messageId=message_id,
        id=attachment_id
    ).execute()

    file_data = base64.urlsafe_b64decode(attachment['data'].encode('UTF-8'))
    extracted_resume = extract_text_from_pdf(file_data, source_name=source_name)
    return extracted_resume, file_data


# ─────────────────────────────────────────────────────────────
# 1. SUBCOMPONENT: GET AFTER DATE
# ─────────────────────────────────────────────────────────────
def get_after_date(db: Session, job_id: int) -> GmailSyncContext:
    """
    Derives the Gmail 'after' query from the selected job's company mailbox cursor.
    The job_id selects the company scope; the cursor belongs to GmailAccount.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    company = db.query(Company).filter(Company.id == job.company_id).first() if job else None
    gmail_account = None
    if company:
        gmail_account = (
            db.query(GmailAccount)
            .filter(GmailAccount.company_id == company.id, GmailAccount.is_active.is_(True))
            .order_by(GmailAccount.id.asc())
            .first()
        )
        if not gmail_account:
            gmail_account = GmailAccount(
                company_id=company.id,
                email=os.getenv("GMAIL_ACCOUNT_EMAIL", f"company-{company.id}@gmail.local"),
                provider="gmail",
                is_active=True,
            )
            db.add(gmail_account)
            db.flush()

    last_read_ts = gmail_account.last_read if gmail_account else None

    if last_read_ts:
        after_dt = last_read_ts.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        after_dt = datetime.now(timezone.utc).replace(tzinfo=None, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=10)

    after_date_query = after_dt.strftime('%Y/%m/%d')
    company_jobs = (
        db.query(Job)
        .filter(Job.company_id == company.id)
        .order_by(Job.id.asc())
        .all()
        if company
        else []
    )
    return GmailSyncContext(
        schema_version="gmail.sync_context.v1",
        company_id=company.id if company else 0,
        gmail_account_id=gmail_account.id if gmail_account else 0,
        gmail_account_email=gmail_account.email if gmail_account else "",
        anchor_job_id=job_id,
        anchor_job_title=job.title if job else "",
        gmail_last_read=last_read_ts,
        after_date_query=after_date_query,
        jobs=[
            JobClassificationJob(
                id=company_job.id,
                title=company_job.title,
                department=company_job.department,
                experience=company_job.experience,
                skills=company_job.skills,
                keywords=company_job.keywords,
            )
            for company_job in company_jobs
        ],
    )


# ─────────────────────────────────────────────────────────────
# 2. SUBCOMPONENT: GET DEDUPED MAILS
# ─────────────────────────────────────────────────────────────
def get_deduped_mails(
    service: Any,
    db: Session,
    sync_context: GmailSyncContext,
    before: Optional[datetime] = None,
    limit: Optional[int] = None
) -> DedupedGmailMessages:
    """
    Queries Gmail API and splits raw message headers into deduped_mails vs duplicated_mails
    based on existing gmail_message_id records in DB.
    Returns a validated header batch for the message-processing consumer.
    """
    sync_context = GmailSyncContext.model_validate(sync_context)
    query_parts = ['has:attachment', f'after:{sync_context.after_date_query}']

    if before:
        before_str = before.strftime('%Y/%m/%d')
        query_parts.append(f'before:{before_str}')

    query = " ".join(query_parts)
    effective_limit = 20 if (limit is None or limit <= 0 or limit > 20) else limit
    list_kwargs: Dict[str, Any] = {'userId': 'me', 'q': query, 'maxResults': effective_limit}

    results = service.users().messages().list(**list_kwargs).execute()
    messages = results.get('messages', [])

    deduped_mails: List[GmailMessageHeader] = []
    duplicated_mails: List[GmailMessageHeader] = []

    for msg in messages:
        header = GmailMessageHeader.model_validate(msg)
        msg_id = header.id
        existing_app = db.query(Application).filter(
            Application.gmail_account_id == sync_context.gmail_account_id,
            Application.gmail_message_id == msg_id,
        ).first()

        if existing_app:
            duplicated_mails.append(header)
        else:
            deduped_mails.append(header)

    return DedupedGmailMessages(
        schema_version="gmail.deduped_messages.v1",
        company_id=sync_context.company_id,
        anchor_job_id=sync_context.anchor_job_id,
        gmail_account_id=sync_context.gmail_account_id,
        after_date_query=sync_context.after_date_query,
        deduped_mails=deduped_mails,
        duplicated_mails=duplicated_mails,
    )


# ─────────────────────────────────────────────────────────────
# 3. SUBCOMPONENT: PROCESS MAILS
# ─────────────────────────────────────────────────────────────
def _decode_gmail_body(data: str) -> str:
    if not data:
        return ""
    padded_data = data + "=" * (-len(data) % 4)
    try:
        return base64.urlsafe_b64decode(padded_data.encode("utf-8")).decode("utf-8", errors="replace")
    except (ValueError, UnicodeDecodeError):
        return ""


def _strip_html(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html.unescape(value or ""))
    return re.sub(r"\s+", " ", text).strip()


def _extract_message_text(payload: Dict[str, Any], snippet: str = "") -> str:
    plain_parts: List[str] = []
    html_parts: List[str] = []

    def visit(part: Dict[str, Any]):
        mime_type = (part.get("mimeType") or "").lower()
        body_data = _decode_gmail_body(part.get("body", {}).get("data", ""))
        if body_data:
            if mime_type == "text/plain":
                plain_parts.append(body_data)
            elif mime_type == "text/html":
                html_parts.append(body_data)
        for child in part.get("parts", []) or []:
            visit(child)

    visit(payload or {})
    if plain_parts:
        return "\n".join(plain_parts).strip()
    if html_parts:
        return _strip_html("\n".join(html_parts))
    return (snippet or "").strip()


def _extract_pdf_parts(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    found: List[Dict[str, Any]] = []
    if (payload.get("filename") or "").lower().endswith(".pdf"):
        found.append(payload)
    for part in payload.get("parts", []) or []:
        found.extend(_extract_pdf_parts(part))
    return found


def _header_value(headers: List[Dict[str, Any]], name: str) -> str:
    target = name.casefold()
    for header in headers:
        if (header.get("name") or "").casefold() == target:
            return header.get("value") or ""
    return ""


def process_mails(
    service: Any,
    db: Session,
    deduped_messages: DedupedGmailMessages,
) -> ProcessedGmailMessages:
    """
    Processes deduped Gmail messages, extracting full email contents, received_at timestamp,
    sender information, message subject/body, and optional PDF CV data.
    Every message whose full Gmail detail can be loaded is returned, even when
    sender, body, or PDF extraction is unavailable.
    """
    deduped_messages = DedupedGmailMessages.model_validate(deduped_messages)
    fetched_messages: List[FetchedGmailMessage] = []

    should_persist_cv = os.getenv("PERSIST_CV", "false").lower() == "true"
    storage_dir = Path("storage/cvs")
    if should_persist_cv:
        storage_dir.mkdir(parents=True, exist_ok=True)

    for msg in deduped_messages.deduped_mails:
        msg_id = msg.id
        try:
            message = service.users().messages().get(
                userId='me',
                id=msg_id,
                format='full'
            ).execute()
        except Exception:
            logger.exception("Could not load Gmail message %s", msg_id)
            continue

        # Extract received_at from Gmail internalDate (ms)
        internal_date_ms = int(message.get('internalDate', 0))
        received_at = (
            datetime.fromtimestamp(internal_date_ms / 1000.0, tz=timezone.utc).replace(tzinfo=None)
            if internal_date_ms > 0
            else datetime.now(timezone.utc).replace(tzinfo=None)
        )

        headers = message.get('payload', {}).get('headers', [])
        sender_name, sender_email = parseaddr(_header_value(headers, "From"))
        sender_email = sender_email.strip().lower() or None

        # Determine full_name from From header
        full_name = sender_name.strip() or (sender_email.split('@')[0] if sender_email else "Candidate")
        subject = _header_value(headers, "Subject").strip()
        text_content = _extract_message_text(
            message.get('payload', {}),
            snippet=message.get('snippet', ''),
        )

        cv_text: Optional[str] = None
        cv_filename: Optional[str] = None
        pdf_bytes = b""

        pdf_parts = _extract_pdf_parts(message.get('payload', {}))
        for part in pdf_parts:
            attachment_id = part.get('body', {}).get('attachmentId', '')
            if attachment_id:
                try:
                    extracted_resume, pdf_bytes = extract_pdf_text_and_bytes(
                        service,
                        msg_id,
                        attachment_id,
                        source_name=part.get('filename', '') or "gmail_resume.pdf",
                    )
                    cv_text = extracted_resume.cv_text
                    cv_filename = extracted_resume.source_name
                except Exception:
                    logger.exception("Could not extract PDF attachment from Gmail message %s", msg_id)
                break

        cv_pdf_path = None
        if should_persist_cv and cv_text and pdf_bytes:
            pdf_file_path = storage_dir / f"gmail_{msg_id}.pdf"
            with open(pdf_file_path, "wb") as f:
                f.write(pdf_bytes)
            cv_pdf_path = str(pdf_file_path)

        fetched_messages.append(
            FetchedGmailMessage(
                full_name=full_name,
                email=sender_email,
                subject=subject,
                text_content=text_content,
                cv_text=cv_text or None,
                cv_pdf_path=cv_pdf_path,
                cv_filename=cv_filename,
                gmail_message_id=msg_id,
                received_at=received_at,
            )
        )

    return ProcessedGmailMessages(
        schema_version="gmail.processed_messages.v1",
        company_id=deduped_messages.company_id,
        anchor_job_id=deduped_messages.anchor_job_id,
        gmail_account_id=deduped_messages.gmail_account_id,
        messages=fetched_messages,
    )


# ─────────────────────────────────────────────────────────────
# 4. SUBCOMPONENT: PERSIST APPLICATION WITH CANDIDATE
# ─────────────────────────────────────────────────────────────
def persist_application_with_candidate(
    db: Session,
    application_batch: GmailApplicationBatch,
    created_by: Optional[int] = None
) -> JobApplicationSyncSummary:
    """
    Persists candidates and application records into the database.
    - Resolves or creates Candidate entities.
    - Updates existing Applications to 'applied' / 'active' (renewed) if not in final stages.
    - Creates new Application entities for brand new candidates.
    Returns a validated summary consumed by the sync orchestrator.
    """
    total_saved = 0
    new_applications = 0
    renewed_applications = 0
    application_batch = GmailApplicationBatch.model_validate(application_batch)

    for app_data in application_batch.applications:
        candidate_name = app_data.full_name
        candidate_email = app_data.email.strip().lower()
        received_at = app_data.received_at
        file_path = app_data.cv_pdf_path
        msg_id = app_data.gmail_message_id

        job = db.query(Job).filter(Job.id == application_batch.job_id).first()
        if not job or (
            application_batch.company_id is not None
            and job.company_id != application_batch.company_id
        ):
            raise ValueError(f"Job #{application_batch.job_id} is outside the Gmail company scope")

        candidate = db.query(Candidate).filter(
            Candidate.company_id == job.company_id,
            Candidate.normalized_email == candidate_email,
        ).first()
        if not candidate:
            candidate = Candidate(
                company_id=job.company_id,
                full_name=candidate_name,
                email=candidate_email,
                normalized_email=candidate_email,
            )
            db.add(candidate)
            db.commit()
            db.refresh(candidate)

        existing_app = get_application_by_candidate_and_job_db(
            db,
            candidate_id=candidate.id,
            job_id=application_batch.job_id
        )

        if existing_app:
            if existing_app.current_status in ["interview", "offer_approval", "offer_sent", "hired"]:
                continue
            existing_app.current_status = "applied"
            existing_app.disposition = "active"
            existing_app.cv_text = app_data.cv_text
            existing_app.gmail_message_id = msg_id
            existing_app.gmail_account_id = application_batch.gmail_account_id
            existing_app.received_at = received_at
            if file_path:
                existing_app.cv_pdf_path = file_path
            renewed_applications += 1
        else:
            create_application_db(
                db,
                candidate_id=candidate.id,
                job_id=application_batch.job_id,
                current_status="applied",
                disposition="active",
                cv_text=app_data.cv_text,
                cv_pdf_path=file_path,
                gmail_message_id=msg_id,
                gmail_account_id=application_batch.gmail_account_id,
                received_at=received_at,
                created_by=created_by
            )
            new_applications += 1

        total_saved += 1

    db.commit()
    return JobApplicationSyncSummary(
        job_id=application_batch.job_id,
        total_saved=total_saved,
        new_applications=new_applications,
        renewed_applications=renewed_applications,
    )


# ─────────────────────────────────────────────────────────────
# 5. MAIN ORCHESTRATOR SERVICE
# ─────────────────────────────────────────────────────────────
def _to_fetched_application(message: FetchedGmailMessage) -> Optional[FetchedEmailApplication]:
    if not message.email or not message.cv_text:
        return None
    return FetchedEmailApplication(
        full_name=message.full_name or message.email.split("@")[0],
        email=message.email,
        cv_text=message.cv_text,
        cv_pdf_path=message.cv_pdf_path,
        cv_filename=message.cv_filename,
        gmail_message_id=message.gmail_message_id,
        received_at=message.received_at,
    )


def group_latest_applications(
    messages: ProcessedGmailMessages,
    classifications: ClassifiedGmailMessages,
    valid_job_ids: set[int],
) -> GmailApplicationPlan:
    """Keep the newest usable message for each candidate email and target job."""
    messages = ProcessedGmailMessages.model_validate(messages)
    classifications = ClassifiedGmailMessages.model_validate(classifications)
    classification_by_message_id = {
        result.gmail_message_id: result for result in classifications.results
    }
    grouped_applications: Dict[int, Dict[str, FetchedEmailApplication]] = {}

    for message in messages.messages:
        classification = classification_by_message_id.get(message.gmail_message_id)
        if not classification or classification.job_id not in valid_job_ids:
            continue

        app_data = _to_fetched_application(message)
        if not app_data:
            continue

        candidate_key = app_data.email.strip().lower()
        job_group = grouped_applications.setdefault(classification.job_id, {})
        previous = job_group.get(candidate_key)
        if not previous or app_data.received_at > previous.received_at:
            job_group[candidate_key] = app_data

    return GmailApplicationPlan(
        schema_version="gmail.application_plan.v1",
        company_id=messages.company_id,
        anchor_job_id=messages.anchor_job_id,
        gmail_account_id=messages.gmail_account_id,
        batches=[
            GmailApplicationBatch(
                schema_version="gmail.application_batch.v1",
                job_id=job_id,
                company_id=messages.company_id,
                gmail_account_id=messages.gmail_account_id,
                applications=list(candidate_applications.values()),
            )
            for job_id, candidate_applications in sorted(grouped_applications.items())
        ],
    )


def fetch_job_application_emails_service(
    db: Session,
    job_id: int,
    before: Optional[datetime] = None,
    limit: Optional[int] = 20,
    created_by: Optional[int] = None
) -> GmailSyncResult:
    """
    Orchestrates company-wide Gmail ingestion.

    Message-ID deduplication remains the first Gmail-specific filter. Full
    message data is then classified against every job in the selected job's
    company. Only the newest message per candidate email/job pair is passed to
    the existing application upsert function.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise ValueError(f"Job #{job_id} not found")
    company = db.query(Company).filter(Company.id == job.company_id).first()
    if not company:
        raise ValueError(f"Company #{job.company_id} not found for Job #{job_id}")

    sync_context = get_after_date(db, job_id)
    service = get_gmail_service()

    deduped_messages = get_deduped_mails(
        service=service,
        db=db,
        sync_context=sync_context,
        before=before,
        limit=limit
    )

    processed_messages = process_mails(
        service=service,
        db=db,
        deduped_messages=deduped_messages,
    )

    classification_request = JobClassificationRequest(
        schema_version="gmail.job_classification_request.v1",
        company_id=processed_messages.company_id,
        anchor_job_id=processed_messages.anchor_job_id,
        messages=[
            JobClassificationMessage(
                gmail_message_id=message.gmail_message_id,
                subject=message.subject,
                text_content=message.text_content,
            )
            for message in processed_messages.messages
        ],
        jobs=sync_context.jobs,
    )
    classification_batch = classify_application_emails(classification_request)
    classifications = ClassifiedGmailMessages(
        schema_version="gmail.classified_messages.v1",
        company_id=processed_messages.company_id,
        anchor_job_id=processed_messages.anchor_job_id,
        results=classification_batch.results,
    )

    valid_job_ids = {company_job.id for company_job in sync_context.jobs}
    classified_count = sum(
        1
        for result in classifications.results
        if result.job_id in valid_job_ids
    )
    unmatched_count = len(processed_messages.messages) - classified_count
    for result in classifications.results:
        if result.job_id not in valid_job_ids:
            logger.info(
                "Gmail message %s was not assigned to a company job: %s",
                result.gmail_message_id,
                result.rationale,
            )

    application_plan = group_latest_applications(
        messages=processed_messages,
        classifications=classifications,
        valid_job_ids=valid_job_ids,
    )

    total_saved = 0
    new_applications = 0
    renewed_applications = 0
    failed_upsert_count = 0
    job_summaries: List[JobApplicationSyncSummary] = []

    for application_batch in application_plan.batches:
        summary = JobApplicationSyncSummary(job_id=application_batch.job_id)
        try:
            summary = persist_application_with_candidate(
                db=db,
                application_batch=application_batch,
                created_by=created_by,
            )
            total_saved += summary.total_saved
            new_applications += summary.new_applications
            renewed_applications += summary.renewed_applications
        except Exception:
            db.rollback()
            summary.failed_upserts = len(application_batch.applications)
            failed_upsert_count += len(application_batch.applications)
            logger.exception(
                "Failed to persist %d Gmail application(s) for company %s / job %s",
                len(application_batch.applications),
                company.id,
                application_batch.job_id,
            )
        job_summaries.append(summary)

    # Advance the mailbox cursor only after every classified application batch
    # has been persisted successfully. A failed batch remains retryable on the
    # next sync; message-ID deduplication makes the retry idempotent.
    latest_fetched_at = max(
        (message.received_at for message in processed_messages.messages),
        default=None,
    )
    gmail_account = db.query(GmailAccount).filter(
        GmailAccount.id == sync_context.gmail_account_id,
        GmailAccount.company_id == company.id,
    ).first()
    if failed_upsert_count == 0 and latest_fetched_at and gmail_account and (
        not gmail_account.last_read or latest_fetched_at > gmail_account.last_read
    ):
        gmail_account.last_read = latest_fetched_at
        db.commit()

    return GmailSyncResult(
        schema_version="gmail.sync_result.v1",
        company_id=company.id,
        anchor_job_id=job.id,
        fetched_messages=processed_messages.messages,
        total_fetched=len(processed_messages.messages),
        total_saved=total_saved,
        new_applications=new_applications,
        renewed_applications=renewed_applications,
        classified_count=classified_count,
        unmatched_count=unmatched_count,
        failed_upsert_count=failed_upsert_count,
        job_summaries=job_summaries,
    )
