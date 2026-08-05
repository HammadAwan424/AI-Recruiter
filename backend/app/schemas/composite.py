from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

from app.schemas.user import UserResponse
from app.schemas.job import JobResponse
from app.schemas.offer import OfferResponse
from app.schemas.interview import (
    InterviewResponse,
    InterviewSlotDetail,
    InterviewFeedbackResponse
)
from app.schemas.application import ApplicationResponse, CommentResponse


# ──── User Detail (combines UserResponse + JobResponse) ────
class UserDetail(UserResponse):
    permissions: List[str] = []
    assigned_jobs: List[JobResponse] = []


# ──── Job Detail (combines JobResponse + UserResponse) ────
class JobDetail(JobResponse):
    creator: Optional[UserResponse] = None
    assigned_users: List[UserResponse] = []


# ──── Interviewer Detail (combines UserResponse + InterviewSlotDetail) ────
class InterviewerDetail(UserResponse):
    available_slots: Optional[List[InterviewSlotDetail]] = []


# ──── Interview Detail (combines InterviewResponse + UserResponse + InterviewFeedbackResponse) ────
class InterviewerAssignment(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    interviewer_id: int
    interviewer: UserResponse
    feedback: Optional[InterviewFeedbackResponse] = None


class InterviewDetail(InterviewResponse):
    interviewer_assignments: List[InterviewerAssignment] = []


# ──── Application Detail (combines ApplicationResponse + InterviewDetail + CommentResponse + OfferResponse) ────
class ApplicationDetail(ApplicationResponse):
    interviews: List[InterviewDetail] = []
    comments: List[CommentResponse] = []
    offer: Optional[OfferResponse] = None


class ApplicationListItem(ApplicationResponse):
    interviews: Optional[List[InterviewResponse]] = None
