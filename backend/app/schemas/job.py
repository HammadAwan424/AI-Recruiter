from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import JobStatus


class JobCreate(BaseModel):
    title: str = Field(min_length=1)
    department: Optional[str] = None
    employment_type: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    salary_range: Optional[str] = None
    full_description: Optional[str] = None
    keywords: Optional[str] = None
    # Assignment/distribution commands are intentionally carried with the
    # create request and consumed by job_service, never persisted on Job.
    hiring_manager_id: Optional[int] = None
    recruiter_ids: Optional[list[int]] = None
    interviewer_ids: Optional[list[int]] = None
    boards: list[str] = Field(default_factory=list)


class JobUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1)
    department: Optional[str] = None
    employment_type: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    salary_range: Optional[str] = None
    full_description: Optional[str] = None
    keywords: Optional[str] = None
    hiring_manager_id: Optional[int] = None
    recruiter_ids: Optional[list[int]] = None
    interviewer_ids: Optional[list[int]] = None


class JobResponse(BaseModel):
    id: int
    company_id: int
    title: str
    department: Optional[str] = None
    employment_type: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    salary_range: Optional[str] = None
    full_description: Optional[str] = None
    keywords: Optional[str] = None
    status: JobStatus
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
