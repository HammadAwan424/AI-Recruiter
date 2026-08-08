from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.database import get_db
from app.utils.security import get_current_user, require_permissions
from app.services.job_service import generate_job_description_service

router = APIRouter(prefix="/job-descriptions", tags=["Job Descriptions"])


class GenerateJDRequest(BaseModel):
    title: str
    department: str = "Engineering"
    employment_type: str = "full_time"
    experience: str = "3-5 years"
    skills: Optional[str] = None
    salary_range: Optional[str] = None
    additional_info: Optional[str] = None


@router.post("", dependencies=[Depends(require_permissions(["job:create"]))])
def generate_job_description_endpoint(
    data: GenerateJDRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Generates structured job description and search keywords independently."""
    return generate_job_description_service(db, user_id=current_user["user_id"], data=data)
