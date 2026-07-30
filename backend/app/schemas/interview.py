from pydantic import BaseModel, ConfigDict
from datetime import date, time, datetime
from typing import Optional, List


class InterviewSlotCreate(BaseModel):
    job_id: Optional[int] = 0
    slot_date: date
    start_time: time
    end_time: time


class InterviewSlotResponse(BaseModel):
    id: int
    interviewer_id: int
    job_id: int
    slot_date: date
    start_time: time
    end_time: time
    is_booked: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InterviewPublicSlotResponse(BaseModel):
    candidate_name: str
    job_title: str
    company_name: str
    available_slots: List[InterviewSlotResponse]


class CandidateScheduleSelectRequest(BaseModel):
    slot_id: int


class InterviewRescheduleRequest(BaseModel):
    scheduled_date: date
    scheduled_time: time
    notes: Optional[str] = None


class InterviewCreate(BaseModel):
    application_id: int
    interviewer_1_id: int
    interviewer_2_id: Optional[int] = None
    scheduled_date: date
    scheduled_time: time
    duration_minutes: Optional[int] = 45
    meeting_type: Optional[str] = "GOOGLE_MEET"
    notes: Optional[str] = None


class InterviewUpdate(BaseModel):
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    duration_minutes: Optional[int] = None
    meeting_type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    updated_by: Optional[int] = None


class InterviewResponse(BaseModel):
    id: int
    application_id: int
    interviewer_1_id: int
    interviewer_2_id: Optional[int] = None
    scheduled_date: date
    scheduled_time: time
    duration_minutes: int
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


class InterviewFeedbackCreate(BaseModel):
    interview_id: int
    interviewer_id: int
    technical_score: float
    communication_score: float
    notes: Optional[str] = None


class InterviewFeedbackResponse(BaseModel):
    id: int
    interview_id: int
    interviewer_id: int
    technical_score: float
    communication_score: float
    notes: Optional[str] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
