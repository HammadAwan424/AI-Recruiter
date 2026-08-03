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
    skill_gap: Optional[str] = None
    summary: Optional[str] = None
    final_score: Optional[float] = None
    updated_by: Optional[int] = None


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
    skill_gap: Optional[str] = None
    summary: Optional[str] = None
    parsed_profile: Optional[str] = None
    final_score: Optional[float] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
