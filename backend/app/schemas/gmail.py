from datetime import datetime
from typing import List, Literal, Optional

from pydantic import Field

from app.schemas.base import StrictSchema


class FetchedGmailMessage(StrictSchema):
    """Full Gmail message data collected before job classification."""

    gmail_message_id: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    subject: str = ""
    text_content: str = ""
    cv_text: Optional[str] = None
    cv_pdf_path: Optional[str] = None
    cv_filename: Optional[str] = None
    received_at: datetime


class FetchedEmailApplication(StrictSchema):
    full_name: str
    email: str
    cv_text: str
    cv_pdf_path: Optional[str] = None
    cv_filename: Optional[str] = None
    gmail_message_id: str
    received_at: datetime


class GmailMessageHeader(StrictSchema):
    id: str
    threadId: Optional[str] = None


class GmailSyncContext(StrictSchema):
    schema_version: Literal["gmail.sync_context.v2"]
    company_id: int
    anchor_job_id: int
    gmail_account_id: int
    gmail_account_email: str
    anchor_job_title: str
    mailbox_last_read: Optional[datetime] = None
    after_date_query: str
    jobs: List["JobClassificationJob"] = Field(default_factory=list)


class DedupedGmailMessages(StrictSchema):
    schema_version: Literal["gmail.deduped_messages.v2"]
    company_id: int
    anchor_job_id: int
    gmail_account_id: int
    after_date_query: str
    deduped_mails: List[GmailMessageHeader] = Field(default_factory=list)
    duplicated_mails: List[GmailMessageHeader] = Field(default_factory=list)


class ProcessedGmailMessages(StrictSchema):
    schema_version: Literal["gmail.processed_messages.v2"]
    company_id: int
    anchor_job_id: int
    gmail_account_id: int
    messages: List[FetchedGmailMessage] = Field(default_factory=list)


class JobClassificationMessage(StrictSchema):
    gmail_message_id: str
    subject: str = ""
    text_content: str = ""


class JobClassificationJob(StrictSchema):
    id: int
    title: str
    department: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    keywords: Optional[str] = None


class JobClassificationResult(StrictSchema):
    gmail_message_id: str
    job_id: Optional[int] = None
    confidence: int = Field(default=0, ge=0, le=100)
    rationale: str = ""


class JobClassificationBatchResult(StrictSchema):
    results: List[JobClassificationResult] = Field(default_factory=list)


class JobClassificationRequest(StrictSchema):
    schema_version: Literal["gmail.job_classification_request.v1"]
    company_id: int
    anchor_job_id: int
    messages: List[JobClassificationMessage] = Field(default_factory=list)
    jobs: List[JobClassificationJob] = Field(default_factory=list)


class ClassifiedGmailMessages(StrictSchema):
    schema_version: Literal["gmail.classified_messages.v1"]
    company_id: int
    anchor_job_id: int
    results: List[JobClassificationResult] = Field(default_factory=list)


class JobApplicationSyncSummary(StrictSchema):
    job_id: int
    total_saved: int = 0
    new_applications: int = 0
    renewed_applications: int = 0
    failed_upserts: int = 0


class GmailApplicationBatch(StrictSchema):
    schema_version: Literal["gmail.application_batch.v2"]
    job_id: int
    company_id: int
    gmail_account_id: int
    applications: List[FetchedEmailApplication] = Field(default_factory=list)


class GmailApplicationPlan(StrictSchema):
    schema_version: Literal["gmail.application_plan.v2"]
    company_id: int
    anchor_job_id: int
    gmail_account_id: int
    batches: List[GmailApplicationBatch] = Field(default_factory=list)


class GmailPersistenceResult(StrictSchema):
    schema_version: Literal["gmail.persistence_result.v2"]
    company_id: int
    anchor_job_id: int
    gmail_account_id: int
    total_fetched: int
    classified_count: int
    unmatched_count: int
    total_saved: int
    new_applications: int
    renewed_applications: int
    failed_upsert_count: int
    job_summaries: List[JobApplicationSyncSummary] = Field(default_factory=list)


class GmailSyncResult(GmailPersistenceResult):
    schema_version: Literal["gmail.sync_result.v2"]
    fetched_messages: List[FetchedGmailMessage] = Field(default_factory=list)


class OutboundEmailResult(StrictSchema):
    schema_version: Literal["gmail.outbound_email_result.v1"]
    message_id: Optional[str] = None
    thread_id: Optional[str] = None
    recipient: str
    subject: str
    status: str


GmailSyncContext.model_rebuild()
