from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class JobCreate(BaseModel):
    title: str
    department: Optional[str] = None
    employment_type: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    salary_range: Optional[str] = None
    full_description: Optional[str] = None
    keywords: Optional[str] = None
    status: Optional[str] = "published"
    boards: Optional[List[str]] = []


class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    employment_type: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    salary_range: Optional[str] = None
    full_description: Optional[str] = None
    keywords: Optional[str] = None
    status: Optional[str] = None
    updated_by: Optional[int] = None


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
    status: str
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
