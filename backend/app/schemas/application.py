from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import ApplicationDisposition, ApplicationStatus
from app.schemas.extraction import ParsedResumeProfile
from app.schemas.gmail import JobApplicationSyncSummary
from app.schemas.screening import EvidenceSet, FitFlag, ScreeningDimensionWeights


class ApplicationCreate(BaseModel):
    candidate_id: int
    job_id: int
    cv_text: Optional[str] = None
    cv_pdf_path: Optional[str] = None


class ApplicationUpdate(BaseModel):
    """Only workflow-owned stage/disposition fields are client-editable here."""

    current_status: Optional[ApplicationStatus] = None
    disposition: Optional[ApplicationDisposition] = None


class ApplicationScreeningResponse(BaseModel):
    id: int
    application_id: int
    skills_match: int = Field(ge=0, le=100)
    experience_match: int = Field(ge=0, le=100)
    education_match: int = Field(ge=0, le=100)
    keyword_coverage: int = Field(ge=0, le=100)
    match_score: float = Field(ge=0, le=100)
    confidence: int = Field(ge=0, le=100)
    data_quality_flag: Optional[str] = None
    evidence: EvidenceSet
    fit_flags: list[FitFlag] = Field(default_factory=list)
    weights_used: ScreeningDimensionWeights
    model_used: str
    prompt_version: str
    evaluated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidateMinimalResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class JobMinimalResponse(BaseModel):
    id: int
    title: str
    department: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ApplicationResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    cv_text: Optional[str] = None
    cv_pdf_path: Optional[str] = None
    gmail_account_id: Optional[int] = None
    gmail_message_id: Optional[str] = None
    received_at: Optional[datetime] = None
    parsed_profile: Optional[ParsedResumeProfile] = None
    current_status: ApplicationStatus
    disposition: ApplicationDisposition
    match_score: Optional[float] = Field(default=None, ge=0, le=100)
    final_score: Optional[float] = Field(default=None, ge=0, le=100)
    screening: Optional[ApplicationScreeningResponse] = None
    candidate: Optional[CandidateMinimalResponse] = None
    job: Optional[JobMinimalResponse] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommentCreate(BaseModel):
    content: str = Field(min_length=1)


class CommentResponse(BaseModel):
    id: int
    application_id: int
    author_id: int
    author_name: Optional[str] = None
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScreeningResultResponse(BaseModel):
    application_id: int
    candidate_id: int
    candidate_name: str
    match_score: float = Field(ge=0, le=100)
    status: ApplicationStatus
    disposition: ApplicationDisposition


class FetchApplicationsResponse(BaseModel):
    message: str
    job_id: int
    company_id: int
    total_fetched: int
    total_saved: int
    new_applications: int
    renewed_applications: int
    classified_count: int
    unmatched_count: int
    failed_upsert_count: int
    job_summaries: list[JobApplicationSyncSummary] = Field(default_factory=list)
