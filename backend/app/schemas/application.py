from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


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
    weights_used: str
    model_used: str
    prompt_version: str
    evaluated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicationResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    cv_text: Optional[str] = None
    cv_pdf_path: Optional[str] = None
    gmail_message_id: Optional[str] = None
    current_status: str
    disposition: str
    match_score: Optional[float] = None
    final_score: Optional[float] = None
    screening: Optional[ApplicationScreeningResponse] = None
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