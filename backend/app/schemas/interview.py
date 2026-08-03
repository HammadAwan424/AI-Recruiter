from pydantic import BaseModel, ConfigDict, Field
from datetime import date, time, datetime
from typing import Literal, Optional, List, Union
from app.schemas.user import UserResponse
from app.schemas.job import JobResponse

class InterviewResponse(BaseModel):
    id: int
    application_id: int
    round_number: int = 1
    round_label: Optional[str] = None
    schedule_start: Optional[datetime] = None
    schedule_end: Optional[datetime] = None
    meeting_type: str
    meeting_link: str
    self_schedule_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    status: str
    notes: Optional[str] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    job_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class InterviewSlotCreate(BaseModel):
    job_id: Optional[int] = None
    schedule_start: datetime
    schedule_end: datetime

class InterviewSlotResponse(BaseModel):
    id: int
    interviewer_id: int
    job_id: Optional[int] = None
    schedule_start: datetime
    schedule_end: datetime
    is_booked: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InterviewSlotDetail(InterviewSlotResponse):
    job: Optional[JobResponse] = None


class InterviewFeedbackResponse(BaseModel):
    id: int
    interview_interviewer_id: int
    interview_id: Optional[int] = None
    interviewer_id: Optional[int] = None
    technical_score: float
    communication_score: float
    notes: Optional[str] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InterviewerDetail(UserResponse):
    available_slots: Optional[List[InterviewSlotDetail]] = []


class InterviewDetail(InterviewResponse):
    class _InterviewerAssignment(BaseModel):
        model_config = ConfigDict(from_attributes=True)
        interviewer_id: int
        interviewer: UserResponse
        feedback: Optional[InterviewFeedbackResponse] = None
    interviewer_assignments: List[_InterviewerAssignment] = []


class InterviewPublicSlotResponse(BaseModel):
    candidate_name: str
    job_title: str
    company_name: str
    available_slots: List[InterviewSlotResponse]


# This handles the interview create request payloads:
# 1) FixedScheduleInterview when the recruiter manually selects the slot
# 2) SelfScheduleInterview, no slot is provided, the candidate selects it
class InterviewCreateBase(BaseModel):
    application_id: int
    round_number: int = 1
    round_label: str | None = None
    meeting_type: str
    notes: Optional[str] = None


# Type 1
class InterviewerSlotAssignment(BaseModel):
    interviewer_id: int
    slot_id: int


class FixedScheduleInterview(InterviewCreateBase):
    schedule_type: Literal["fixed"] = "fixed"
    assignments: List[InterviewerSlotAssignment] = []


# Type 2
class SelfScheduleInterview(InterviewCreateBase):
    schedule_type: Literal["self_schedule"] = "self_schedule"
    self_schedule_token_expires_at: datetime
    interviewer_ids: List[int]


InterviewCreate = Union[FixedScheduleInterview, SelfScheduleInterview]


# Request interfaces for fastapi
class InterviewCreateRequest(BaseModel):
    payload: InterviewCreate = Field(discriminator="schedule_type")


class InterviewRescheduleRequest(BaseModel):
    assignments: list[InterviewerSlotAssignment] 


class InterviewMetadataUpdate(BaseModel):
    meeting_type: Optional[str] = None
    notes: Optional[str] = None


class InterviewFeedbackCreate(BaseModel):
    interview_id: int
    interviewer_id: int
    technical_score: float
    communication_score: float
    notes: Optional[str] = None