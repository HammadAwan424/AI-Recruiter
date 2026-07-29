from pydantic import BaseModel
from datetime import date, time, datetime
from typing import Optional, List


# ──── INTERVIEW SLOT SCHEMAS ────
class InterviewSlotCreate(BaseModel):
    job_id: Optional[int] = None
    slot_date: date
    start_time: time
    end_time: time


class InterviewSlotResponse(BaseModel):
    id: int
    interviewer_id: int
    job_id: Optional[int] = None
    slot_date: date
    start_time: time
    end_time: time
    is_booked: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ──── INTERVIEW CREATION & UPDATE SCHEMAS ────
class InterviewCreate(BaseModel):
    application_id: int
    candidate_id: int
    job_id: int
    scheduled_date: date
    scheduled_time: time
    duration_minutes: Optional[int] = 45
    meeting_type: Optional[str] = "GOOGLE_MEET"
    interviewer_1: str
    interviewer_2: Optional[str] = None
    notes: Optional[str] = None


class InterviewUpdate(BaseModel):
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    duration_minutes: Optional[int] = None
    meeting_type: Optional[str] = None
    interviewer_1: Optional[str] = None
    interviewer_2: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class InterviewRescheduleRequest(BaseModel):
    scheduled_date: date
    scheduled_time: time
    reason: Optional[str] = None


# ──── INTERVIEW RESPONSE SCHEMAS ────
class InterviewResponse(BaseModel):
    id: int
    application_id: int
    candidate_id: int
    job_id: int
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    job_title: Optional[str] = None
    scheduled_date: date
    scheduled_time: time
    duration_minutes: int
    meeting_type: str
    meeting_link: str
    interviewer_1: str
    interviewer_2: Optional[str] = None
    self_schedule_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ──── PUBLIC CANDIDATE SELF-SCHEDULING SCHEMAS ────
class InterviewPublicSlotResponse(BaseModel):
    self_schedule_token: str
    candidate_name: str
    job_title: str
    company_name: str
    duration_minutes: int
    available_slots: List[InterviewSlotResponse]
    is_expired: bool
    status: str


class CandidateScheduleSelectRequest(BaseModel):
    slot_id: int
