from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime

from app.schemas.user import UserResponse, CompanyMinimalResponse
from app.schemas.job import JobResponse
from app.schemas.offer import OfferResponse
from app.schemas.interview import (
    InterviewResponse,
    InterviewSlotDetail,
    InterviewFeedbackResponse
)
from app.schemas.application import ApplicationResponse, CommentResponse


# ──── User Detail (combines UserResponse + CompanyMinimalResponse + JobResponse) ────
class UserDetail(UserResponse):
    company: Optional[CompanyMinimalResponse] = None
    permissions: List[str] = Field(default_factory=list)
    assigned_jobs: List[JobResponse] = Field(default_factory=list)


# ──── Job Detail (combines JobResponse + UserResponse) ────
class JobDetail(JobResponse):
    creator: Optional[UserResponse] = None
    assigned_users: List[UserResponse] = Field(default_factory=list)


# ──── Interviewer Detail (combines UserResponse + InterviewSlotDetail) ────
class InterviewerDetail(UserResponse):
    available_slots: List[InterviewSlotDetail] = Field(default_factory=list)


# ──── Interview Detail (combines InterviewResponse + UserResponse + InterviewFeedbackResponse) ────
class InterviewerAssignment(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    interviewer_id: int
    interviewer: UserResponse
    feedback: Optional[InterviewFeedbackResponse] = None


class InterviewDetail(InterviewResponse):
    interviewer_assignments: List[InterviewerAssignment] = Field(default_factory=list)


# ──── Application Detail (combines ApplicationResponse + InterviewDetail + CommentResponse + OfferResponse) ────
class ApplicationDetail(ApplicationResponse):
    interviews: List[InterviewDetail] = Field(default_factory=list)
    comments: List[CommentResponse] = Field(default_factory=list)
    offer: Optional[OfferResponse] = None


class ApplicationListItem(ApplicationResponse):
    interviews: List[InterviewResponse] = Field(default_factory=list)
