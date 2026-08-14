from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime

from app.schemas.gmail import FetchedEmailApplication, JobApplicationSyncSummary


class ScreeningTaskPayload(BaseModel):
    application_id: Optional[int] = None
    candidate_id: int
    job_id: int
    candidate_name: str
    candidate_email: str
    cv_text: str
    job_title: str
    job_description: str
    job_keywords: str
    job_experience: str
    job_skills: str


class ApplicationCreate(BaseModel):
    candidate_id: int
    job_id: int
    cv_text: Optional[str] = None
    cv_pdf_path: Optional[str] = None


class ApplicationUpdate(BaseModel):
    current_status: Optional[str] = None
    disposition: Optional[str] = None
    match_score: Optional[float] = None
    final_score: Optional[float] = None
    updated_by: Optional[int] = None


class ApplicationScreeningResponse(BaseModel):
    id: int
    application_id: int
    skills_match: int
    experience_match: int
    education_match: int
    keyword_coverage: int
    match_score: float
    confidence: int
    data_quality_flag: Optional[str] = None
    evidence: str
    fit_flags: Optional[str] = None
    weights_used: str
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
    gmail_message_id: Optional[str] = None
    received_at: Optional[datetime] = None
    parsed_profile: Optional[str] = None
    current_status: str
    disposition: str
    match_score: Optional[float] = None
    final_score: Optional[float] = None
    screening: Optional[ApplicationScreeningResponse] = None
    candidate: Optional[CandidateMinimalResponse] = None
    job: Optional[JobMinimalResponse] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommentCreate(BaseModel):
    content: str


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
    match_score: float
    status: str
    disposition: str


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
